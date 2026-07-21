-- Включаем RLS без политик доступа. Приложение подключается к БД ролью
-- владельца таблиц (postgres, через DATABASE_URL/DIRECT_URL) — она по
-- умолчанию не подчиняется RLS, так что для самого приложения ничего не
-- меняется. Цель — закрыть доступ анонимным/authenticated ролям Supabase
-- PostgREST API, для которых RLS без политик означает полный запрет.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_statuses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_statuses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "timeline_events" ENABLE ROW LEVEL SECURITY;