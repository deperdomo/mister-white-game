import * as React from "react"
import { cn } from "../../lib/utils"

interface SwitchProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({ id, checked = false, onCheckedChange, disabled = false, className, ...props }: SwitchProps) {
  const handleClick = () => {
    if (!disabled) {
      onCheckedChange?.(!checked)
    }
  }

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-slate-950",
        checked ? "bg-slate-900 dark:bg-slate-50" : "bg-slate-200 dark:bg-slate-800",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform dark:bg-slate-950",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}
