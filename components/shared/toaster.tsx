"use client";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--color-surface)",
          color: "var(--color-ink)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          fontSize: "13px",
        },
      }}
    />
  );
}
