/**
 * Схема базы данных (Drizzle ORM, диалект PostgreSQL / Supabase).
 */
import {
  pgTable,
  text,
  boolean,
  timestamp,
  doublePrecision,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

function id() {
  return text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
}

function timestamps() {
  return {
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  };
}

/** Владелец CRM. Архитектура готова к добавлению сотрудников (см. поле role). */
export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default("Владелец"),
  role: text("role", { enum: ["owner", "member"] })
    .notNull()
    .default("owner"),
  crmName: text("crm_name").notNull().default("Моя CRM"),
  currency: text("currency").notNull().default("RUB"),
  timezone: text("timezone").notNull().default("Europe/Moscow"),
  dateFormat: text("date_format").notNull().default("dd.MM.yyyy"),
  theme: text("theme", { enum: ["light", "dark", "system"] })
    .notNull()
    .default("light"),
  ...timestamps(),
});

/** Справочник источников клиентов — редактируемый пользователем. */
export const sources = pgTable("sources", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isSystem: boolean("is_system").notNull().default(false),
  ...timestamps(),
});

/** Справочник типов услуг — редактируемый пользователем. */
export const serviceTypes = pgTable("service_types", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isSystem: boolean("is_system").notNull().default(false),
  ...timestamps(),
});

/** Справочник статусов проекта: цвет, порядок, признак "финальности". */
export const projectStatuses = pgTable("project_statuses", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#64748b"),
  sortOrder: integer("sort_order").notNull().default(0),
  /** Категория нужна для расчётов (воронка, "готово", "отменён", "архив") */
  category: text("category", {
    enum: ["active", "done", "cancelled", "archived"],
  })
    .notNull()
    .default("active"),
  isSystem: boolean("is_system").notNull().default(false),
  ...timestamps(),
});

/** Справочник статусов оплаты. */
export const paymentStatuses = pgTable("payment_statuses", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#64748b"),
  sortOrder: integer("sort_order").notNull().default(0),
  isSystem: boolean("is_system").notNull().default(false),
  ...timestamps(),
});

/** Клиент. */
export const clients = pgTable(
  "clients",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    contactName: text("contact_name"),
    phone: text("phone"),
    email: text("email"),
    telegram: text("telegram"),
    website: text("website"),
    city: text("city"),
    sourceId: text("source_id").references(() => sources.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    tags: text("tags").notNull().default("[]"), // JSON string[]
    status: text("status", { enum: ["active", "lead", "lost", "archived"] })
      .notNull()
      .default("lead"),
    archived: boolean("archived").notNull().default(false),
    lastContactAt: timestamp("last_contact_at", { mode: "date", withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index("clients_user_idx").on(table.userId),
    index("clients_source_idx").on(table.sourceId),
    index("clients_status_idx").on(table.status),
  ],
);

/** Заказ / проект. Прибыль и остаток считаются в приложении, не хранятся "сырыми". */
export const orders = pgTable(
  "orders",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    serviceTypeId: text("service_type_id").references(() => serviceTypes.id, {
      onDelete: "set null",
    }),
    description: text("description"),

    paymentReceived: doublePrecision("payment_received").notNull().default(0),
    expenses: doublePrecision("expenses").notNull().default(0),
    /** Ручной override прибыли. null = считать автоматически (paymentReceived - expenses). */
    profitOverride: doublePrecision("profit_override"),

    statusId: text("status_id")
      .notNull()
      .references(() => projectStatuses.id),
    paymentStatusId: text("payment_status_id")
      .notNull()
      .references(() => paymentStatuses.id),

    sourceId: text("source_id").references(() => sources.id, {
      onDelete: "set null",
    }),

    firstContactDate: timestamp("first_contact_date", { mode: "date", withTimezone: true }),
    startDate: timestamp("start_date", { mode: "date", withTimezone: true }),
    deadline: timestamp("deadline", { mode: "date", withTimezone: true }),
    completedDate: timestamp("completed_date", { mode: "date", withTimezone: true }),

    projectUrl: text("project_url"),
    materialsUrl: text("materials_url"),
    notes: text("notes"),
    tags: text("tags").notNull().default("[]"),

    reviewReceived: boolean("review_received").notNull().default(false),
    reviewText: text("review_text"),
    reviewUrl: text("review_url"),

    archived: boolean("archived").notNull().default(false),

    ...timestamps(),
  },
  (table) => [
    index("orders_user_idx").on(table.userId),
    index("orders_client_idx").on(table.clientId),
    index("orders_status_idx").on(table.statusId),
    index("orders_payment_status_idx").on(table.paymentStatusId),
    index("orders_deadline_idx").on(table.deadline),
    index("orders_start_date_idx").on(table.startDate),
    index("orders_completed_date_idx").on(table.completedDate),
  ],
);

/** Событие таймлайна взаимодействия с клиентом. */
export const timelineEvents = pgTable(
  "timeline_events",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    type: text("type", {
      enum: [
        "call",
        "message",
        "meeting",
        "proposal_sent",
        "prepayment_received",
        "materials_received",
        "result_sent",
        "review_received",
        "note",
      ],
    }).notNull(),
    note: text("note"),
    eventDate: timestamp("event_date", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("timeline_client_idx").on(table.clientId),
    index("timeline_date_idx").on(table.eventDate),
  ],
);

// ---------- relations ----------

export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  orders: many(orders),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  source: one(sources, { fields: [clients.sourceId], references: [sources.id] }),
  orders: many(orders),
  timeline: many(timelineEvents),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  client: one(clients, { fields: [orders.clientId], references: [clients.id] }),
  serviceType: one(serviceTypes, {
    fields: [orders.serviceTypeId],
    references: [serviceTypes.id],
  }),
  status: one(projectStatuses, {
    fields: [orders.statusId],
    references: [projectStatuses.id],
  }),
  paymentStatus: one(paymentStatuses, {
    fields: [orders.paymentStatusId],
    references: [paymentStatuses.id],
  }),
  source: one(sources, { fields: [orders.sourceId], references: [sources.id] }),
  timeline: many(timelineEvents),
}));

export const sourcesRelations = relations(sources, ({ many }) => ({
  clients: many(clients),
  orders: many(orders),
}));

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  client: one(clients, {
    fields: [timelineEvents.clientId],
    references: [clients.id],
  }),
  order: one(orders, { fields: [timelineEvents.orderId], references: [orders.id] }),
}));

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type ServiceType = typeof serviceTypes.$inferSelect;
export type ProjectStatus = typeof projectStatuses.$inferSelect;
export type PaymentStatus = typeof paymentStatuses.$inferSelect;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
