import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatItem = {
  label: string
  value: string | number
  hint?: string
  tone?: "blue" | "green" | "amber" | "slate"
}

type ConfigShellProps = {
  title: string
  subtitle: string
  icon?: React.ReactNode
  badges?: string[]
  stats?: StatItem[]
  children: React.ReactNode
}

const toneStyles: Record<NonNullable<StatItem["tone"]>, string> = {
  blue: "border-blue-100 bg-blue-50/80 text-blue-900",
  green: "border-emerald-100 bg-emerald-50/80 text-emerald-900",
  amber: "border-amber-100 bg-amber-50/80 text-amber-900",
  slate: "border-slate-200 bg-slate-50/80 text-slate-900",
}

export function ConfigShell({ title, subtitle, icon, badges = [], stats = [], children }: ConfigShellProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        actions={
          badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge
                  key={badge}
                  className="rounded-full border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          ) : undefined
        }
        actionsWrap
      />

      {stats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className={cn(
                "rounded-[2rem] border shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]",
                toneStyles[stat.tone ?? "slate"],
              )}
            >
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">{stat.label}</p>
                <p className="mt-4 font-heading text-3xl font-black italic tracking-tight">{stat.value}</p>
                {stat.hint ? (
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">{stat.hint}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6">{children}</div>
    </div>
  )
}

type ConfigSectionProps = {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function ConfigSection({ title, description, children, actions, className }: ConfigSectionProps) {
  return (
    <Card
      className={cn(
        "rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]",
        className,
      )}
    >
      <CardHeader className="flex flex-col gap-4 border-b border-slate-100 p-6 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="font-heading text-2xl font-black uppercase italic tracking-tight text-slate-950">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : status === "ALLOW"
        ? "bg-blue-50 text-blue-700 border-blue-100"
        : status === "DENY"
          ? "bg-red-50 text-red-700 border-red-100"
      : status === "BLOCKED"
        ? "bg-red-50 text-red-700 border-red-100"
        : status === "ARCHIVED"
          ? "bg-slate-200 text-slate-700 border-slate-300"
        : status === "PENDING_ACTIVATION"
          ? "bg-amber-50 text-amber-700 border-amber-100"
          : "bg-slate-100 text-slate-700 border-slate-200"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
        tone,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  )
}
