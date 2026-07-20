import { formatDate } from "@/lib/format";
import type { OrderWithRelations } from "@/lib/db/queries";
import type { Client, Source } from "@/lib/db/schema";
import { calcProfit, calcRemainder } from "@/lib/calculations";

export function buildClientRows(clients: (Client & { source: Source | null })[]) {
  return clients.map((c) => ({
    Клиент: c.name,
    "Контактное лицо": c.contactName ?? "",
    Телефон: c.phone ?? "",
    Email: c.email ?? "",
    Telegram: c.telegram ?? "",
    Сайт: c.website ?? "",
    Город: c.city ?? "",
    Источник: c.source?.name ?? "",
    Статус: clientStatusLabel(c.status),
    Теги: JSON.parse(c.tags || "[]").join(", "),
    Заметки: c.notes ?? "",
    "Дата добавления": formatDate(c.createdAt),
    "Последний контакт": formatDate(c.lastContactAt),
  }));
}

export function buildOrderRows(orders: OrderWithRelations[]) {
  return orders.map((o) => ({
    Заказ: o.title,
    Клиент: o.client?.name ?? "",
    Услуга: o.serviceType?.name ?? "",
    Стоимость: o.price,
    Предоплата: o.prepaymentReceived,
    Получено: o.paymentReceived,
    Расходы: o.expenses,
    Прибыль: calcProfit(o),
    Остаток: calcRemainder(o),
    "Статус проекта": o.status?.name ?? "",
    "Статус оплаты": o.paymentStatus?.name ?? "",
    "Откуда пришёл": o.source?.name ?? "",
    "Дата контакта": formatDate(o.firstContactDate),
    "Дата начала": formatDate(o.startDate),
    Дедлайн: formatDate(o.deadline),
    "Дата завершения": formatDate(o.completedDate),
    "Отзыв получен": o.reviewReceived ? "Да" : "Нет",
    "Ссылка на отзыв": o.reviewUrl ?? "",
    Заметки: o.notes ?? "",
  }));
}

function clientStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Активный";
    case "lead":
      return "Лид";
    case "lost":
      return "Потерян";
    case "archived":
      return "Архив";
    default:
      return status;
  }
}
