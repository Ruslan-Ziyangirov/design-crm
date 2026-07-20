"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Palette } from "lucide-react";
import type { z } from "zod";

type FormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Неверный email или пароль");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--color-accent)] text-white shadow-[var(--shadow-soft)]">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-[var(--color-ink)]">Личная CRM</h1>
            <p className="text-[13px] text-[var(--color-ink-muted)]">Клиенты, заказы и финансы студии</p>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="owner@studio.local" {...register("email")} />
              {errors.email && <p className="text-[12px] text-[var(--color-negative)]">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-[12px] text-[var(--color-negative)]">{errors.password.message}</p>}
            </div>
            {error && <p className="text-[13px] text-[var(--color-negative)]">{error}</p>}
            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? "Входим..." : "Войти"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-[12px] text-[var(--color-ink-faint)]">
          Данные для входа заданы в файле .env (OWNER_EMAIL / OWNER_PASSWORD)
        </p>
      </div>
    </div>
  );
}
