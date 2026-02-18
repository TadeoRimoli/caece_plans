import { cn } from "../../../../lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white",
    ghost: "bg-transparent hover:bg-white/5 text-slate-300",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }

  return (
    <button
      className={cn(
        "rounded-lg font-medium transition-colors duration-150 active:scale-95",
        variants[variant],
        sizes[size],
        variant === "danger" && "border",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
