import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[8px] bg-black/[0.06]", className)}
      {...props}
    />
  );
}

export { Skeleton };
