"use client";
import { useEffect, useState } from "react";

/** Хук для персистентного состояния в localStorage (используется для фильтров таблиц). */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {
      // игнорируем повреждённые данные
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // хранилище недоступно — молча игнорируем
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}
