import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export class UnauthorizedError extends Error {}

/** Возвращает id владельца CRM или бросает ошибку — используется во всех API-роутах. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError("Не авторизован");
  return session.user.id;
}

export function errorResponse(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const message = err instanceof Error ? err.message : "Внутренняя ошибка сервера";
  console.error(err);
  return NextResponse.json({ error: message }, { status: 400 });
}
