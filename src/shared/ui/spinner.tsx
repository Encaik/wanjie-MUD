import { Loader2Icon } from "lucide-react"

import { cn } from "@/shared/utils"

/** Spinner variant options */
type SpinnerVariant = 'default' | 'cultivation';

interface SpinnerProps extends Omit<React.ComponentProps<"svg">, 'ref'> {
  variant?: SpinnerVariant;
}

/**
 * 通用加载旋转器
 *
 * - default: 标准 Lucide Loader2 旋转图标（向后兼容）
 * - cultivation: 修仙主题气旋动画（双环灵气旋转）
 */
function Spinner({ className, variant = 'default', ...props }: SpinnerProps) {
  if (variant === 'cultivation') {
    return (
      <div
        role="status"
        aria-label="Loading"
        data-slot="spinner"
        className={cn('relative size-4', className)}
        {...(props as React.ComponentProps<"div">)}
      >
        {/* 外环：灵气底色 */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
        {/* 内环：旋转灵气流 */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      data-slot="spinner"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
export type { SpinnerVariant };
