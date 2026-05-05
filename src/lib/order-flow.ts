export type OrderStatus =
  | "SOLD"
  | "WAITING_PREPARATION"
  | "IN_PRODUCTION"
  | "WAITING_DELIVERY"
  | "DELIVERED"
  | "FINALIZED"
  | "CANCELLED"

export type UserRoleName = "VENDEDOR" | "PRODUCAO" | "ENTREGADOR" | "FINANCEIRO" | "ADMIN"

export interface TransitionRule {
  from: OrderStatus
  to: OrderStatus[]
  allowedRoles: UserRoleName[]
  requiresData?: "DELIVERY" | "PAYMENT" | "NONE"
}

export const ORDER_TRANSITION_RULES: TransitionRule[] = [
  {
    from: "SOLD",
    to: ["WAITING_PREPARATION", "CANCELLED"],
    allowedRoles: ["VENDEDOR", "ADMIN"],
  },
  {
    from: "WAITING_PREPARATION",
    to: ["IN_PRODUCTION", "CANCELLED"],
    allowedRoles: ["VENDEDOR", "PRODUCAO", "ADMIN"],
  },
  {
    from: "IN_PRODUCTION",
    to: ["WAITING_DELIVERY", "CANCELLED"],
    allowedRoles: ["VENDEDOR", "PRODUCAO", "ADMIN"],
  },
  {
    from: "WAITING_DELIVERY",
    to: ["DELIVERED", "CANCELLED"],
    allowedRoles: ["ENTREGADOR", "ADMIN"],
    requiresData: "DELIVERY",
  },
  {
    from: "DELIVERED",
    to: ["FINALIZED", "CANCELLED"],
    allowedRoles: ["ENTREGADOR", "ADMIN"],
  },
  {
    from: "FINALIZED",
    to: [],
    allowedRoles: ["ADMIN"],
  },
  {
    from: "CANCELLED",
    to: ["SOLD"],
    allowedRoles: ["ADMIN"],
  },
]

export function canUserPerformTransition(
  role: UserRoleName,
  from: OrderStatus,
  to: OrderStatus,
): { allowed: boolean; reason?: string; requiresData?: "DELIVERY" | "PAYMENT" | "NONE" } {
  if (role === "ADMIN") {
    const rule = ORDER_TRANSITION_RULES.find((transitionRule) => transitionRule.from === from)
    return {
      allowed: true,
      requiresData: rule?.to.includes(to) ? rule.requiresData : "NONE",
    }
  }

  const rule = ORDER_TRANSITION_RULES.find((transitionRule) => transitionRule.from === from)

  if (!rule) {
    return { allowed: false, reason: "Transição de status original não mapeada." }
  }

  if (!rule.to.includes(to)) {
    return { allowed: false, reason: `Não é possível mover de ${from} diretamente para ${to}.` }
  }

  if (
    role === "PRODUCAO" &&
    !(
      (from === "WAITING_PREPARATION" && to === "IN_PRODUCTION") ||
      (from === "IN_PRODUCTION" && to === "WAITING_DELIVERY")
    )
  ) {
    return {
      allowed: false,
      reason:
        "O supervisor de produção só pode mover de aguardando preparo para produção e de produção para aguardando entrega.",
    }
  }

  if (!rule.allowedRoles.includes(role)) {
    return { allowed: false, reason: `Seu perfil (${role}) não tem autoridade para esta transição.` }
  }

  return { allowed: true, requiresData: rule.requiresData || "NONE" }
}

export const KANBAN_COLUMNS = [
  { id: "SOLD", title: "Vendido", color: "bg-blue-500" },
  { id: "WAITING_PREPARATION", title: "Aguardando Preparação", color: "bg-amber-500" },
  { id: "IN_PRODUCTION", title: "Em Produção", color: "bg-indigo-500" },
  { id: "WAITING_DELIVERY", title: "Aguardando Entrega", color: "bg-sky-500" },
  { id: "DELIVERED", title: "Entregue", color: "bg-emerald-500" },
  { id: "FINALIZED", title: "Finalizado", color: "bg-green-600" },
] as const
