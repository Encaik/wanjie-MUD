import { cn } from "@/shared/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-gradient-to-r from-accent via-accent/80 to-accent/60 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
