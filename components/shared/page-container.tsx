import { cn } from "@/lib/utils";

type PageContainerProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function PageContainer({
  children,
  className
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1280px] flex-col gap-6",
        className
      )}
    >
      {children}
    </div>
  );
}
