import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Лёгкая подложка под произвольный категориальный hex-цвет (типы событий
 * таймлайна, дедлайны на календаре, цвета статусов) — единая точка вместо
 * построчного `${color}хх`-конкатенирования альфа-суффикса по разным файлам.
 */
export function tintColor(hex: string, alpha = "1a"): string {
  return `${hex}${alpha}`;
}
