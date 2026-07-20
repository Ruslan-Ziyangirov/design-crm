/**
 * Сид-скрипт: создаёт владельца CRM, справочники (источники, услуги, статусы)
 * и демонстрационные данные (вымышленные клиенты и заказы за несколько месяцев).
 * Безопасно перезапускать — перед заполнением данные очищаются.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, client } from "../lib/db";
import {
  users,
  sources,
  serviceTypes,
  projectStatuses,
  paymentStatuses,
  clients,
  orders,
  timelineEvents,
} from "../lib/db/schema";

async function main() {
  console.log("Очищаю существующие данные...");
  await client`TRUNCATE TABLE
    timeline_events, orders, clients,
    payment_statuses, project_statuses, service_types, sources, users
    CASCADE`;

  const email = (process.env.OWNER_EMAIL || "owner@studio.local").toLowerCase().trim();
  const password = process.env.OWNER_PASSWORD || "change-me-please";
  const name = process.env.OWNER_NAME || "Дизайнер";
  const passwordHash = await bcrypt.hash(password, 10);

  console.log(`Создаю владельца CRM: ${email}`);
  const [owner] = await db
    .insert(users)
    .values({ email, passwordHash, name, crmName: "Студия " + name })
    .returning();

  const userId = owner.id;

  console.log("Создаю справочники...");
  const sourceNames = [
    "Рекомендация",
    "Повторное обращение",
    "Telegram",
    "Instagram",
    "Сайт",
    "Behance",
    "Pinterest",
    "Социальные сети",
    "Холодное обращение",
    "Партнёр",
    "Другое",
  ];
  const insertedSources = await db
    .insert(sources)
    .values(
      sourceNames.map((n, i) => ({
        userId,
        name: n,
        sortOrder: i,
        isSystem: n === "Другое",
      })),
    )
    .returning();
  const srcByName = Object.fromEntries(insertedSources.map((s) => [s.name, s]));

  const serviceNames = [
    "Лендинг",
    "Многостраничный сайт",
    "Интернет-магазин",
    "Дизайн сайта",
    "Разработка на Tilda",
    "Логотип",
    "Фирменный стиль",
    "Презентация",
    "3D-графика",
    "Анимация",
    "SMM-дизайн",
    "Другое",
  ];
  const insertedServices = await db
    .insert(serviceTypes)
    .values(
      serviceNames.map((n, i) => ({
        userId,
        name: n,
        sortOrder: i,
        isSystem: n === "Другое",
      })),
    )
    .returning();
  const svcByName = Object.fromEntries(insertedServices.map((s) => [s.name, s]));

  const statusDefs: { name: string; color: string; category: "active" | "done" | "cancelled" | "archived" }[] = [
    { name: "Новый запрос", color: "#64748b", category: "active" },
    { name: "Ожидание ответа", color: "#c8850f", category: "active" },
    { name: "Обсуждение", color: "#2563eb", category: "active" },
    { name: "Ожидание предоплаты", color: "#c8850f", category: "active" },
    { name: "Запланирован", color: "#2563eb", category: "active" },
    { name: "В работе", color: "#2563eb", category: "active" },
    { name: "Ожидание материалов", color: "#c8850f", category: "active" },
    { name: "На согласовании", color: "#7c5cbf", category: "active" },
    { name: "Правки", color: "#ea580c", category: "active" },
    { name: "Приостановлен", color: "#94a3b8", category: "active" },
    { name: "Готово", color: "#1c8a5a", category: "done" },
    { name: "Отменён", color: "#d33a2c", category: "cancelled" },
    { name: "Архив", color: "#6b7280", category: "archived" },
  ];
  const insertedStatuses = await db
    .insert(projectStatuses)
    .values(statusDefs.map((s, i) => ({ userId, name: s.name, color: s.color, category: s.category, sortOrder: i, isSystem: true })))
    .returning();
  const statusByName = Object.fromEntries(insertedStatuses.map((s) => [s.name, s]));

  const paymentStatusDefs = [
    { name: "Не оплачено", color: "#d33a2c" },
    { name: "Ожидается предоплата", color: "#c8850f" },
    { name: "Предоплата получена", color: "#2563eb" },
    { name: "Частично оплачено", color: "#c8850f" },
    { name: "Полностью оплачено", color: "#1c8a5a" },
    { name: "Просрочено", color: "#d33a2c" },
    { name: "Возврат", color: "#6b7280" },
  ];
  const insertedPayStatuses = await db
    .insert(paymentStatuses)
    .values(paymentStatusDefs.map((s, i) => ({ userId, name: s.name, color: s.color, sortOrder: i, isSystem: true })))
    .returning();
  const payStatusByName = Object.fromEntries(insertedPayStatuses.map((s) => [s.name, s]));

  console.log("Создаю демонстрационных клиентов и заказы...");

  const now = new Date("2026-07-19T12:00:00");
  const monthsAgo = (n: number, day = 10) => new Date(now.getFullYear(), now.getMonth() - n, day);

  type ClientSeed = {
    name: string;
    contactName: string;
    city: string;
    source: string;
    phone: string;
    email: string;
    telegram: string;
    status: "active" | "lead" | "lost" | "archived";
    notes?: string;
  };

  const clientSeeds: ClientSeed[] = [
    { name: "ООО «Северный ветер»", contactName: "Ирина Соколова", city: "Москва", source: "Рекомендация", phone: "+7 926 111-22-33", email: "sokolova@severniyveter.ru", telegram: "@i_sokolova", status: "active" },
    { name: "Кофейня «Зёрна»", contactName: "Павел Дронов", city: "Санкт-Петербург", source: "Instagram", phone: "+7 921 222-33-44", email: "pavel@zerna.coffee", telegram: "@pavel_zerna", status: "active" },
    { name: "Студия йоги «Прана»", contactName: "Марина Волкова", city: "Казань", source: "Сайт", phone: "+7 917 333-44-55", email: "marina@prana-yoga.ru", telegram: "@prana_marina", status: "active" },
    { name: "ИП Ковалёв (мебель на заказ)", contactName: "Дмитрий Ковалёв", city: "Екатеринбург", source: "Холодное обращение", phone: "+7 912 444-55-66", email: "kovalev.mebel@mail.ru", telegram: "@kovalev_mebel", status: "lead" },
    { name: "Барбершоп «Борода и Ус»", contactName: "Артём Лебедев", city: "Москва", source: "Telegram", phone: "+7 903 555-66-77", email: "artem@borodaus.ru", telegram: "@artem_barber", status: "active" },
    { name: "Кондитерская «Медовый дом»", contactName: "Ольга Смирнова", city: "Нижний Новгород", source: "Повторное обращение", phone: "+7 908 666-77-88", email: "olga@medoviydom.ru", telegram: "@olga_medoviy", status: "active" },
    { name: "Юридическая фирма «Право и Дело»", contactName: "Сергей Никитин", city: "Москва", source: "Партнёр", phone: "+7 495 777-88-99", email: "nikitin@pravodelo.ru", telegram: "@nikitin_law", status: "active" },
    { name: "Питомник растений «Флора Дом»", contactName: "Екатерина Белова", city: "Краснодар", source: "Pinterest", phone: "+7 918 888-99-00", email: "kate@floradom.ru", telegram: "@flora_kate", status: "lead" },
    { name: "Архитектурное бюро «Линия»", contactName: "Игорь Титов", city: "Санкт-Петербург", source: "Behance", phone: "+7 911 999-00-11", email: "titov@liniabureau.ru", telegram: "@titov_arch", status: "active" },
    { name: "Фитнес-клуб «Энергия+»", contactName: "Наталья Гусева", city: "Воронеж", source: "Социальные сети", phone: "+7 920 000-11-22", email: "guseva@energyplus.ru", telegram: "@energy_natalia", status: "lost", notes: "Отказались из-за бюджета, возможно вернутся осенью" },
    { name: "Частная школа «Азимут»", contactName: "Вера Орлова", city: "Москва", source: "Рекомендация", phone: "+7 926 123-45-67", email: "orlova@azimut-school.ru", telegram: "@azimut_vera", status: "active" },
    { name: "Ресторан «Дом у моря»", contactName: "Роман Захаров", city: "Сочи", source: "Instagram", phone: "+7 918 234-56-78", email: "roman@domumorya.ru", telegram: "@roman_domsea", status: "active" },
    { name: "ИП Медведева (украшения ручной работы)", contactName: "Анна Медведева", city: "Калининград", source: "Pinterest", phone: "+7 909 345-67-89", email: "anna@medvedeva-jewelry.ru", telegram: "@anna_jewelry", status: "active" },
    { name: "Автосервис «Мастер Гараж»", contactName: "Виктор Пронин", city: "Самара", source: "Холодное обращение", phone: "+7 927 456-78-90", email: "pronin@mastergarage.ru", telegram: "@pronin_garage", status: "archived", notes: "Проект завершён давно, в архиве" },
    { name: "Клиника эстетической медицины «Обри»", contactName: "Юлия Карпова", city: "Москва", source: "Сайт", phone: "+7 916 567-89-01", email: "karpova@aubrieclinic.ru", telegram: "@aubrie_yulia", status: "active" },
    { name: "Пекарня «Хлеб и Соль»", contactName: "Максим Фомин", city: "Тюмень", source: "Telegram", phone: "+7 904 678-90-12", email: "fomin@hlebsol.ru", telegram: "@fomin_bakery", status: "lead" },
  ];

  const createdClients: (typeof clients.$inferSelect)[] = [];
  for (const c of clientSeeds) {
    const [row] = await db
      .insert(clients)
      .values({
        userId,
        name: c.name,
        contactName: c.contactName,
        phone: c.phone,
        email: c.email,
        telegram: c.telegram,
        city: c.city,
        sourceId: srcByName[c.source]?.id ?? null,
        status: c.status,
        archived: c.status === "archived",
        notes: c.notes ?? "",
        tags: JSON.stringify(c.status === "active" ? ["постоянный"] : []),
      })
      .returning();
    createdClients.push(row);
  }

  // ---- Заказы: разброс по месяцам с 2026-01 по 2026-07 ----
  type OrderSeed = {
    clientIdx: number;
    title: string;
    service: string;
    source: string;
    paid: number;
    expenses: number;
    profitOverride?: number;
    status: string;
    payStatus: string;
    monthsAgo: number;
    review?: string;
    reviewUrl?: string;
    deadlineOffsetDays?: number; // относительно даты начала
  };

  const orderSeeds: OrderSeed[] = [
    { clientIdx: 0, title: "Сайт-визитка для консалтинга", service: "Многостраничный сайт", source: "Рекомендация", paid: 180000, expenses: 25000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 6, review: "Очень довольны результатом, всё быстро и по делу!", reviewUrl: "https://yandex.ru/maps/reviews/1" },
    { clientIdx: 1, title: "Фирменный стиль кофейни", service: "Фирменный стиль", source: "Instagram", paid: 95000, expenses: 12000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 6, review: "Крутой дизайн, клиенты сразу заметили новые стаканы", reviewUrl: "https://instagram.com/review1" },
    { clientIdx: 2, title: "Лендинг для набора на курс йоги", service: "Лендинг", source: "Сайт", paid: 65000, expenses: 5000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 5 },
    { clientIdx: 4, title: "Логотип и вывеска барбершопа", service: "Логотип", source: "Telegram", paid: 45000, expenses: 3000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 5, review: "Отличная работа, рекомендую!", reviewUrl: "https://t.me/review2" },
    { clientIdx: 5, title: "Упаковка и этикетки для мёда", service: "Другое", source: "Повторное обращение", paid: 55000, expenses: 8000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 5 },
    { clientIdx: 6, title: "Сайт для юридической фирмы", service: "Многостраничный сайт", source: "Партнёр", paid: 220000, expenses: 30000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 4 },
    { clientIdx: 8, title: "Презентация для архитектурного тендера", service: "Презентация", source: "Behance", paid: 78000, expenses: 4000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 4 },
    { clientIdx: 11, title: "Сайт-меню для ресторана", service: "Дизайн сайта", source: "Instagram", paid: 130000, expenses: 15000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 4, review: "Гостям очень нравится, бронирования выросли", reviewUrl: "https://yandex.ru/maps/reviews/2" },
    { clientIdx: 0, title: "Редизайн сайта под новую услугу", service: "Дизайн сайта", source: "Повторное обращение", paid: 85000, expenses: 10000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 3 },
    { clientIdx: 9, title: "Каталог растений (интернет-магазин)", service: "Интернет-магазин", source: "Pinterest", paid: 240000, expenses: 45000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 3, profitOverride: 190000 },
    { clientIdx: 12, title: "Карточки товаров для маркетплейса", service: "SMM-дизайн", source: "Pinterest", paid: 38000, expenses: 3000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 3 },
    { clientIdx: 10, title: "Сайт частной школы", service: "Многостраничный сайт", source: "Рекомендация", paid: 195000, expenses: 28000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 2, review: "Родители хвалят новый сайт, очень удобно", reviewUrl: "https://yandex.ru/maps/reviews/3" },
    { clientIdx: 1, title: "Анимация для соцсетей кофейни", service: "Анимация", source: "Instagram", paid: 32000, expenses: 4000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 2 },
    { clientIdx: 14, title: "Фирстиль клиники эстетической медицины", service: "Фирменный стиль", source: "Сайт", paid: 100000, expenses: 20000, status: "На согласовании", payStatus: "Частично оплачено", monthsAgo: 2 },
    { clientIdx: 6, title: "3D-визуализация переговорной", service: "3D-графика", source: "Партнёр", paid: 0, expenses: 0, status: "Отменён", payStatus: "Не оплачено", monthsAgo: 2 },
    { clientIdx: 2, title: "Продвижение: серия сторис-шаблонов", service: "SMM-дизайн", source: "Сайт", paid: 28000, expenses: 2000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 1 },
    { clientIdx: 8, title: "Сайт-портфолио архбюро", service: "Дизайн сайта", source: "Behance", paid: 70000, expenses: 18000, status: "В работе", payStatus: "Предоплата получена", monthsAgo: 1 },
    { clientIdx: 12, title: "Фирменный стиль для украшений", service: "Фирменный стиль", source: "Pinterest", paid: 40000, expenses: 6000, status: "Правки", payStatus: "Частично оплачено", monthsAgo: 1 },
    { clientIdx: 5, title: "Сайт для доставки кондитерской", service: "Интернет-магазин", source: "Повторное обращение", paid: 90000, expenses: 22000, status: "В работе", payStatus: "Предоплата получена", monthsAgo: 1 },
    { clientIdx: 11, title: "Новое летнее меню — дизайн печати", service: "Другое", source: "Instagram", paid: 26000, expenses: 3000, status: "Готово", payStatus: "Полностью оплачено", monthsAgo: 1 },
    { clientIdx: 4, title: "Разработка сайта на Tilda", service: "Разработка на Tilda", source: "Telegram", paid: 30000, expenses: 8000, status: "Ожидание материалов", payStatus: "Ожидается предоплата", monthsAgo: 0, deadlineOffsetDays: -5 },
    { clientIdx: 0, title: "Годовой ребрендинг — этап 2", service: "Фирменный стиль", source: "Повторное обращение", paid: 50000, expenses: 10000, status: "В работе", payStatus: "Предоплата получена", monthsAgo: 0, deadlineOffsetDays: 20 },
    { clientIdx: 3, title: "Логотип и каталог мебели", service: "Логотип", source: "Холодное обращение", paid: 0, expenses: 0, status: "Обсуждение", payStatus: "Не оплачено", monthsAgo: 0 },
    { clientIdx: 7, title: "Сайт питомника растений", service: "Лендинг", source: "Pinterest", paid: 0, expenses: 0, status: "Ожидание предоплаты", payStatus: "Не оплачено", monthsAgo: 0 },
    { clientIdx: 15, title: "Упаковка для пекарни", service: "Другое", source: "Telegram", paid: 0, expenses: 0, status: "Новый запрос", payStatus: "Не оплачено", monthsAgo: 0 },
    { clientIdx: 9, title: "SMM-пакет на лето", service: "SMM-дизайн", source: "Pinterest", paid: 15000, expenses: 2000, status: "Ожидание ответа", payStatus: "Ожидается предоплата", monthsAgo: 0 },
    { clientIdx: 14, title: "Анимация для запуска нового филиала", service: "Анимация", source: "Сайт", paid: 0, expenses: 0, status: "Запланирован", payStatus: "Не оплачено", monthsAgo: 0 },
    { clientIdx: 10, title: "Презентация для инвесторов школы", service: "Презентация", source: "Рекомендация", paid: 60000, expenses: 5000, status: "В работе", payStatus: "Полностью оплачено", monthsAgo: 0, deadlineOffsetDays: -2 },
  ];

  let created = 0;
  for (const seed of orderSeeds) {
    const client = createdClients[seed.clientIdx];
    const status = statusByName[seed.status];
    const payStatus = payStatusByName[seed.payStatus];
    const service = svcByName[seed.service];
    const source = srcByName[seed.source];

    const createdAt = monthsAgo(seed.monthsAgo, 5 + (created % 20));
    const startDate = monthsAgo(seed.monthsAgo, 8 + (created % 15));
    const deadline =
      seed.deadlineOffsetDays !== undefined
        ? new Date(now.getTime() + seed.deadlineOffsetDays * 86400000)
        : status.category === "active"
          ? new Date(startDate.getTime() + 20 * 86400000)
          : new Date(startDate.getTime() + 14 * 86400000);
    const completedDate = status.category === "done" ? new Date(startDate.getTime() + 12 * 86400000) : null;

    const [order] = await db
      .insert(orders)
      .values({
        userId,
        clientId: client.id,
        title: seed.title,
        serviceTypeId: service?.id ?? null,
        description: "",
        paymentReceived: seed.paid,
        expenses: seed.expenses,
        profitOverride: seed.profitOverride ?? null,
        statusId: status.id,
        paymentStatusId: payStatus.id,
        sourceId: source?.id ?? null,
        firstContactDate: createdAt,
        startDate: status.category === "active" || status.category === "done" ? startDate : null,
        deadline,
        completedDate,
        reviewReceived: !!seed.review,
        reviewText: seed.review ?? "",
        reviewUrl: seed.reviewUrl ?? "",
        createdAt,
        updatedAt: createdAt,
      })
      .returning();

    await db.insert(timelineEvents).values({
      userId,
      clientId: client.id,
      orderId: order.id,
      type: "note",
      note: `Заказ создан: «${seed.title}»`,
      eventDate: createdAt,
    });

    if (seed.review) {
      await db.insert(timelineEvents).values({
        userId,
        clientId: client.id,
        orderId: order.id,
        type: "review_received",
        note: `Получен отзыв по заказу «${seed.title}»`,
        eventDate: completedDate ?? createdAt,
      });
    }

    created += 1;
  }

  // Немного дополнительных заметок в таймлайне для "живости" карточки клиента
  await db.insert(timelineEvents).values([
    {
      userId,
      clientId: createdClients[0].id,
      type: "call",
      note: "Созвонились, обсудили новый этап ребрендинга",
      eventDate: monthsAgo(0, 3),
    },
    {
      userId,
      clientId: createdClients[8].id,
      type: "meeting",
      note: "Встреча в офисе, показали черновики сайта",
      eventDate: monthsAgo(0, 8),
    },
    {
      userId,
      clientId: createdClients[3].id,
      type: "message",
      note: "Написал в WhatsApp, ждём бриф по каталогу",
      eventDate: monthsAgo(0, 1),
    },
  ]);

  console.log(`Готово: ${createdClients.length} клиентов, ${created} заказов.`);
  console.log(`\nДанные для входа:\n  Email: ${email}\n  Пароль: ${password}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
