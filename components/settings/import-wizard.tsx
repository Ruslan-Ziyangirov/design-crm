"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Upload, FileSpreadsheet } from "lucide-react";

const TARGET_FIELDS = [
  { key: "title", label: "Заказ", required: true },
  { key: "clientName", label: "Заказчик", required: true },
  { key: "revenue", label: "Выручка / Получено", required: false },
  { key: "expenses", label: "Расходы", required: false },
  { key: "reviewText", label: "Отзыв", required: false },
  { key: "statusName", label: "Статус", required: false },
  { key: "sourceName", label: "Откуда пришёл", required: false },
  { key: "contactDate", label: "Дата контакта", required: false },
  { key: "completedDate", label: "Дата исполнения", required: false },
] as const;

type FieldKey = (typeof TARGET_FIELDS)[number]["key"];

interface PreviewRow {
  title: string;
  clientName: string;
  revenue: number;
  expenses: number;
  reviewText: string;
  statusName: string;
  sourceName: string;
  contactDate: string;
  completedDate: string;
  clientExists?: boolean;
  duplicate?: { orderId: string } | null;
  action: "create" | "update" | "skip";
}

export function ImportWizard({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; onDone: () => void }) {
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, string>>>({});
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("upload");
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setPreviewRows([]);
  }

  function handleFile(file: File) {
    const isXlsx = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (json.length === 0) {
          toast.error("Файл пустой");
          return;
        }
        setHeaders(Object.keys(json[0]));
        setRawRows(json);
        autoMap(Object.keys(json[0]));
        setStep("map");
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            toast.error("Файл пустой");
            return;
          }
          setHeaders(results.meta.fields ?? []);
          setRawRows(results.data);
          autoMap(results.meta.fields ?? []);
          setStep("map");
        },
        error: () => toast.error("Не удалось прочитать файл"),
      });
    }
  }

  function autoMap(cols: string[]) {
    const guesses: Record<FieldKey, string[]> = {
      title: ["заказ", "название", "проект"],
      clientName: ["заказчик", "клиент"],
      revenue: ["выручка", "получено", "оплата"],
      expenses: ["расходы"],
      reviewText: ["отзыв"],
      statusName: ["статус"],
      sourceName: ["откуда", "источник"],
      contactDate: ["дата контакта", "контакт"],
      completedDate: ["дата исполнения", "исполнение", "завершение"],
    };
    const next: Partial<Record<FieldKey, string>> = {};
    for (const field of TARGET_FIELDS) {
      const match = cols.find((c) => guesses[field.key].some((g) => c.toLowerCase().includes(g)));
      if (match) next[field.key] = match;
    }
    setMapping(next);
  }

  async function goToPreview() {
    if (!mapping.title || !mapping.clientName) {
      toast.error("Сопоставьте обязательные поля: Заказ и Заказчик");
      return;
    }
    setLoading(true);
    const mappedRows = rawRows.map((r) => ({
      title: r[mapping.title!] ?? "",
      clientName: r[mapping.clientName!] ?? "",
      revenue: parseFloat(String(mapping.revenue ? r[mapping.revenue] : 0).replace(/[^\d.-]/g, "")) || 0,
      expenses: parseFloat(String(mapping.expenses ? r[mapping.expenses] : 0).replace(/[^\d.-]/g, "")) || 0,
      reviewText: mapping.reviewText ? r[mapping.reviewText] ?? "" : "",
      statusName: mapping.statusName ? r[mapping.statusName] ?? "" : "",
      sourceName: mapping.sourceName ? r[mapping.sourceName] ?? "" : "",
      contactDate: mapping.contactDate ? r[mapping.contactDate] ?? "" : "",
      completedDate: mapping.completedDate ? r[mapping.completedDate] ?? "" : "",
    })).filter((r) => r.title.trim() && r.clientName.trim());

    try {
      const res = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: mappedRows }),
      });
      const data = await res.json();
      setPreviewRows(
        data.rows.map((r: PreviewRow) => ({
          ...r,
          action: r.duplicate ? "update" : "create",
        })),
      );
      setStep("preview");
    } catch {
      toast.error("Не удалось подготовить предпросмотр");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    setLoading(true);
    try {
      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: previewRows.map((r) => ({ ...r, matchedOrderId: r.duplicate?.orderId ?? null })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Импорт завершён: создано ${data.created}, обновлено ${data.updated}, пропущено ${data.skipped}`);
      onOpenChange(false);
      reset();
      onDone();
    } catch {
      toast.error("Не удалось выполнить импорт");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Импорт заказов из файла</DialogTitle>
          <DialogDescription>Поддерживаются файлы CSV и Excel (.xlsx)</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-[var(--color-border-strong)] py-16 cursor-pointer hover:bg-black/[0.015]"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-[var(--color-ink-faint)]" />
            <p className="text-[13px] text-[var(--color-ink-muted)]">Нажмите, чтобы выбрать файл CSV или XLSX</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {step === "map" && (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-[var(--color-ink-muted)]">
              Сопоставьте колонки файла ({rawRows.length} строк) с полями CRM. Обязательные поля отмечены *.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {TARGET_FIELDS.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label className="text-[12px] text-[var(--color-ink-muted)]">
                    {field.label}
                    {field.required && "*"}
                  </label>
                  <Select
                    value={mapping[field.key] ?? "__none"}
                    onValueChange={(v) => setMapping({ ...mapping, [field.key]: v === "__none" ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Не импортировать" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Не импортировать</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setStep("upload")}>
                Назад
              </Button>
              <Button onClick={goToPreview} disabled={loading}>
                {loading ? "Готовим предпросмотр..." : "Далее"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-[var(--color-ink-muted)]">
              Найдено строк: {previewRows.length}. Для совпадающих заказов выберите действие.
            </p>
            <div className="max-h-[360px] overflow-y-auto rounded-[10px] border border-[var(--color-border)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Заказ</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead className="text-right">Выручка</TableHead>
                    <TableHead>Совпадение</TableHead>
                    <TableHead>Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="max-w-[160px] truncate">{r.title}</TableCell>
                      <TableCell className="max-w-[140px] truncate">
                        {r.clientName} {!r.clientExists && <span className="text-[10px] text-[var(--color-info)]">(новый)</span>}
                      </TableCell>
                      <TableCell className="text-right font-numeric">{r.revenue}</TableCell>
                      <TableCell className="text-[12px] text-[var(--color-ink-faint)]">
                        {r.duplicate ? "Найден похожий заказ" : "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.action}
                          onValueChange={(v) =>
                            setPreviewRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, action: v as PreviewRow["action"] } : row)))
                          }
                        >
                          <SelectTrigger className="h-7 w-[130px] text-[12px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="create">Создать новый</SelectItem>
                            {r.duplicate && <SelectItem value="update">Обновить</SelectItem>}
                            <SelectItem value="skip">Пропустить</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setStep("map")}>
                Назад
              </Button>
              <Button onClick={handleImport} disabled={loading} className="gap-1.5">
                <FileSpreadsheet className="h-4 w-4" />
                {loading ? "Импортируем..." : "Импортировать"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
