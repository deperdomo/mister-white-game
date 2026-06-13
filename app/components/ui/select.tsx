import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface SelectContentProps {
  children: React.ReactNode
}

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

interface SelectValueProps {
  placeholder?: string
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

export function Select({ value, onValueChange, children }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  const { isOpen, setIsOpen } = React.useContext(SelectContext)

  return (
    <div
      className={cn(
        "flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-panel px-4 text-[15px] text-fg transition-colors focus:outline-none focus:border-accent/70 focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 text-faint" />
    </div>
  )
}

export function SelectContent({ children }: SelectContentProps) {
  const { isOpen } = React.useContext(SelectContext)

  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-auto rounded-xl border border-white/10 bg-elevated text-fg shadow-float">
      <div className="p-1.5">
        {children}
      </div>
    </div>
  )
}

export function SelectItem({ value, children, className, ...props }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setIsOpen } = React.useContext(SelectContext)

  const handleClick = () => {
    onValueChange?.(value)
    setIsOpen(false)
  }

  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-fg outline-none transition-colors hover:bg-white/5 focus:bg-white/5",
        selectedValue === value && "bg-white/10",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}
