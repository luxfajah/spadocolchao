import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function FieldGroup({
  label,
  hint,
  description,
  error,
  children,
  className,
}: {
  label: string
  hint?: string
  description?: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">{label}</span>
      {description ? <span className="text-xs text-slate-500 leading-relaxed">{description}</span> : null}
      {children}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  )
}

export function FieldInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn("h-11 rounded-2xl border-slate-200 bg-white", props.className)} />
}

export function FieldTextarea(props: React.ComponentProps<typeof Textarea>) {
  return <Textarea {...props} className={cn("min-h-[110px] rounded-2xl border-slate-200 bg-white", props.className)} />
}

export function FieldSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30",
        props.className,
      )}
    />
  )
}

export function TwoColumnGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
}
