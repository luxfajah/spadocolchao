import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  icon?: React.ReactNode
  className?: string
  actionsClassName?: string
  actionsWrap?: boolean
}

export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
  className,
  actionsClassName,
  actionsWrap = false,
}: PageHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 md:p-10 rounded-[2.5rem] shadow-lahomes animate-in fade-in slide-in-from-top-4 duration-700",
      className
    )}>
      <div className="flex min-w-0 flex-1 items-center gap-6">
        {icon && (
          <div className="hidden sm:flex w-16 h-16 rounded-[1.5rem] bg-slate-50 items-center justify-center text-primary shadow-inner">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-primary font-outfit uppercase italic leading-none mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-4xl text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] font-sans opacity-70">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div
          className={cn(
            "flex w-full md:w-auto md:max-w-[48rem] md:justify-end gap-3 pb-1 md:pb-0",
            actionsWrap ? "flex-wrap overflow-visible" : "items-center overflow-x-auto no-scrollbar",
            actionsClassName
          )}
        >
          {actions}
        </div>
      )}
    </div>
  )
}
