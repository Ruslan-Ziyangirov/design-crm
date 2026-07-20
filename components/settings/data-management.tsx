"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Upload, DatabaseBackup, AlertTriangle, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ImportWizard } from "@/components/settings/import-wizard";

export function DataManagement() {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  async function handleRestore(file: File) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка восстановления");
      }
      toast.success("Данные восстановлены из резервной копии");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось восстановить данные");
    }
  }

  async function handleWipe() {
    const res = await fetch("/api/danger/wipe", { method: "DELETE" });
    if (res.ok) {
      toast.success("Клиенты и заказы удалены");
      router.refresh();
    } else toast.error("Не удалось удалить данные");
    setWipeOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-display text-[14px] font-semibold text-[var(--color-ink)]">Импорт данных</p>
        <p className="mb-3 text-[12.5px] text-[var(--color-ink-muted)]">
          Загрузите существующую таблицу заказов в форматах CSV или Excel
        </p>
        <Button variant="secondary" onClick={() => setImportOpen(true)} className="gap-1.5">
          <FileUp className="h-4 w-4" />
          Импортировать заказы
        </Button>
      </div>

      <div>
        <p className="font-display text-[14px] font-semibold text-[var(--color-ink)]">Экспорт данных</p>
        <p className="mb-3 text-[12.5px] text-[var(--color-ink-muted)]">Выгрузите клиентов или заказы в удобном формате</p>
        <div className="flex flex-wrap gap-2">
          {(["clients", "orders"] as const).map((entity) =>
            (["csv", "xlsx", "json"] as const).map((format) => (
              <Button key={`${entity}-${format}`} variant="secondary" size="sm" asChild className="gap-1.5">
                <a href={`/api/export?entity=${entity}&format=${format}`}>
                  <Download className="h-3.5 w-3.5" />
                  {entity === "clients" ? "Клиенты" : "Заказы"}.{format}
                </a>
              </Button>
            )),
          )}
        </div>
      </div>

      <div>
        <p className="font-display text-[14px] font-semibold text-[var(--color-ink)]">Резервное копирование</p>
        <p className="mb-3 text-[12.5px] text-[var(--color-ink-muted)]">
          Полная копия всех данных CRM в одном файле — для переноса или страховки
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" asChild className="gap-1.5">
            <a href="/api/backup">
              <DatabaseBackup className="h-3.5 w-3.5" />
              Скачать резервную копию
            </a>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => restoreInputRef.current?.click()} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Восстановить из копии
          </Button>
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleRestore(e.target.files[0])}
          />
        </div>
      </div>

      <div className="rounded-[12px] border border-[var(--color-negative-soft)] bg-[var(--color-negative-soft)]/40 p-4">
        <p className="flex items-center gap-1.5 font-display text-[14px] font-semibold text-[var(--color-negative)]">
          <AlertTriangle className="h-4 w-4" />
          Опасная зона
        </p>
        <p className="mb-3 mt-1 text-[12.5px] text-[var(--color-ink-muted)]">
          Удаляет всех клиентов, все заказы и историю взаимодействия без возможности восстановления. Справочники
          (услуги, статусы, источники) и настройки сохранятся.
        </p>
        <Button variant="destructive" size="sm" onClick={() => setWipeOpen(true)}>
          Удалить все данные
        </Button>
      </div>

      <ImportWizard open={importOpen} onOpenChange={setImportOpen} onDone={() => router.refresh()} />

      <AlertDialog open={wipeOpen} onOpenChange={setWipeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить все данные?</AlertDialogTitle>
            <AlertDialogDescription>
              Будут безвозвратно удалены все клиенты, заказы и таймлайн. Рекомендуем сначала скачать резервную копию.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleWipe}>Удалить всё</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
