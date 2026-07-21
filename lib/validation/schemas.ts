import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя клиента или компанию").max(200),
  contactName: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Некорректный email",
    })
    .optional()
    .or(z.literal("")),
  telegram: z.string().trim().max(100).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  sourceId: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  status: z.enum(["active", "lead", "lost", "archived"]).default("lead"),
  lastContactAt: z.coerce.date().optional().nullable(),
});
export type ClientInput = z.infer<typeof clientSchema>;

export const orderSchema = z.object({
  clientId: z.string().min(1, "Выберите клиента"),
  title: z.string().trim().min(1, "Укажите название заказа").max(300),
  serviceTypeId: z.string().optional().nullable(),
  description: z.string().max(5000).optional().or(z.literal("")),

  paymentReceived: z.coerce.number().min(0).default(0),
  expenses: z.coerce.number().min(0).default(0),
  profitOverride: z.coerce.number().nullable().optional(),

  statusId: z.string().min(1, "Выберите статус проекта"),
  paymentStatusId: z.string().min(1, "Выберите статус оплаты"),
  sourceId: z.string().optional().nullable(),

  firstContactDate: z.coerce.date().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  deadline: z.coerce.date().optional().nullable(),
  completedDate: z.coerce.date().optional().nullable(),

  projectUrl: z.string().max(500).optional().or(z.literal("")),
  materialsUrl: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),

  reviewReceived: z.boolean().default(false),
  reviewText: z.string().max(5000).optional().or(z.literal("")),
  reviewUrl: z.string().max(500).optional().or(z.literal("")),
});
export type OrderInput = z.infer<typeof orderSchema>;

export const timelineEventSchema = z.object({
  clientId: z.string().min(1),
  orderId: z.string().optional().nullable(),
  type: z.enum([
    "call",
    "message",
    "meeting",
    "proposal_sent",
    "prepayment_received",
    "materials_received",
    "result_sent",
    "review_received",
    "note",
  ]),
  note: z.string().max(2000).optional().or(z.literal("")),
  eventDate: z.coerce.date().default(() => new Date()),
});
export type TimelineEventInput = z.infer<typeof timelineEventSchema>;

export const referenceItemSchema = z.object({
  name: z.string().trim().min(1, "Укажите название").max(120),
  color: z.string().optional(),
  category: z.enum(["active", "done", "cancelled", "archived"]).optional(),
});
export type ReferenceItemInput = z.infer<typeof referenceItemSchema>;

export const profitPlanSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  targetProfit: z.coerce.number().min(0),
});
export type ProfitPlanInput = z.infer<typeof profitPlanSchema>;

export const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});
