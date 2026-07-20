# Инструкция по развёртыванию

Приложение работает на PostgreSQL (Supabase) — база одна и та же для
локальной разработки и продакшена. Ниже — практические варианты
развёртывания. Все они предполагают, что локально вы уже проверили
`npm run build` без ошибок.

## Вариант 1: Vercel + Supabase (рекомендуется)

1. Создайте проект в [Supabase](https://supabase.com) (или другом managed
   PostgreSQL — тогда шаги с pooler-строками ниже неприменимы, используйте
   один `DATABASE_URL` от вашего провайдера).
2. В Project Settings → Database → Connection string скопируйте:
   - **Transaction pooler** (порт `6543`) → `DATABASE_URL`
   - **Session pooler** (порт `5432`) → `DIRECT_URL`
3. Локально: заполните `.env` этими строками, выполните
   `npm run db:migrate` (и `npm run db:seed`, если нужны демо-данные) —
   миграции применяются один раз, до первого деплоя.
4. Импортируйте репозиторий в Vercel (dashboard → Add New → Project, или
   `npx vercel link` из корня проекта).
5. В Vercel → Project Settings → Environment Variables задайте (Production
   и Preview):
   - `DATABASE_URL`, `DIRECT_URL` — из Supabase
   - `OWNER_EMAIL`, `OWNER_PASSWORD`, `OWNER_NAME` — только если планируете
     запускать `db:seed` вручную против прод-базы; в самом рантайме
     приложения они не используются
   - `AUTH_SECRET` — сгенерируйте отдельный: `openssl rand -base64 32`
   - `NEXTAUTH_URL` — домен деплоя на Vercel (например
     `https://crm.vercel.app`)
6. Задеплойте (push в главную ветку — если подключена Git-интеграция,
   деплой запустится автоматически; либо `npx vercel --prod`).

**Не запускайте `db:seed`/`db:reset` как часть Vercel build step** — они
очищают таблицы (`TRUNCATE ... CASCADE`), это должно быть осознанным
ручным действием.

## Вариант 2: VPS / сервер

Подходит, если не хотите обращаться к serverless-инфраструктуре Vercel —
но база всё равно внешняя (Postgres), не файл на диске.

1. Скопируйте проект на сервер, установите Node.js 20+.
2. `npm install`
3. Заполните `.env` (см. `.env.example`):
   - `DATABASE_URL`/`DIRECT_URL` — от Supabase или любого managed Postgres
   - смените `OWNER_EMAIL` / `OWNER_PASSWORD`
   - сгенерируйте новый `AUTH_SECRET`: `openssl rand -base64 32`
   - укажите `NEXTAUTH_URL` — реальный домен (например `https://crm.example.com`)
4. `npm run db:migrate && npm run db:seed` (seed — по желанию).
5. `npm run build`
6. Запускайте `npm run start` через process-менеджер (pm2, systemd), например:
   ```bash
   pm2 start npm --name crm -- start
   ```
7. Настройте reverse proxy (nginx/caddy) с HTTPS перед приложением.

## Резервное копирование в проде

- Регулярно скачивайте JSON-бэкап через **Настройки → Данные → Скачать
  резервную копию** — это полная копия клиентов, заказов, справочников и
  таймлайна текущего владельца.
- Для Supabase используйте штатные средства провайдера (Point-in-Time
  Recovery, ежедневные снапшоты в платных планах).

## Проверка после деплоя

Пройдите короткий чек-лист:

1. Открывается страница `/login`, вход по заданным email/паролю работает.
2. На дашборде отображаются реальные (или демо) данные, графики строятся.
3. Создание клиента и заказа проходит без ошибок, суммы считаются верно.
4. Экспорт (Настройки → Данные) отдаёт файл с корректной кодировкой кириллицы.
5. Смена темы (тёмная/светлая) работает и сохраняется между перезагрузками.
