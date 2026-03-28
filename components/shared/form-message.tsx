import { cn } from "@/lib/utils";

type FormMessageProps = {
  children?: React.ReactNode;
  tone?: "error" | "muted";
  className?: string;
};

export function FormMessage({
  children,
  tone = "error",
  className
}: FormMessageProps) {
  if (!children) {
    return null;
  }

  return (
    <p
      className={cn(
        "text-sm",
        tone === "error" ? "text-danger" : "text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  );
}
