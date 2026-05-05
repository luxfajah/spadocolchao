import type { UserRoleName } from "@/lib/order-flow"

export type AppArea =
  | "dashboard"
  | "pdv"
  | "sales"
  | "customers"
  | "orders"
  | "kanban"
  | "commissions"
  | "financial"
  | "supplies"
  | "hr"
  | "settings"

export type DashboardVariant = "full" | "sales" | "financial" | "hr" | "kanban"
export type SellerScope = "all" | "self" | "none"
export type KanbanMode = "view" | "full" | "production_only"
export type PermissionModuleKey =
  | "comercial"
  | "pedidos"
  | "financeiro"
  | "suprimentos"
  | "rh"
  | "configuracoes"
  | "pdv"

export type AccessPresetKey =
  | "ADMINISTRADOR"
  | "CEO"
  | "CFO"
  | "FINANCEIRO"
  | "AUX_ADMINISTRATIVO"
  | "VENDEDOR"
  | "SUPERVISOR_COMERCIAL"
  | "RH"
  | "SUPERVISOR_PRODUCAO"
  | "ENTREGADOR"

export type AccessPresetDefinition = {
  key: AccessPresetKey
  label: string
  description: string
  priority: number
  areas: AppArea[]
  dashboardVariant: DashboardVariant
  defaultRoute: string
  orderFlowRole: UserRoleName | null
  sellerScope: SellerScope
  kanbanMode: KanbanMode
  permissionMatrix: Partial<Record<PermissionModuleKey, string[]>>
  defaultDepartment: string
  defaultJobTitle: string
}

export type SystemRoleDefinition = {
  roleName: string
  accessPresetKey: AccessPresetKey
  description: string
  aliases: string[]
  assignable: boolean
}

export const ALL_APP_AREAS: AppArea[] = [
  "dashboard",
  "pdv",
  "sales",
  "customers",
  "orders",
  "kanban",
  "commissions",
  "financial",
  "supplies",
  "hr",
  "settings",
]

export const accessPresetDefinitions: Record<AccessPresetKey, AccessPresetDefinition> = {
  ADMINISTRADOR: {
    key: "ADMINISTRADOR",
    label: "Administrador",
    description: "Acesso total ao ERP, com todos os módulos e configurações.",
    priority: 100,
    areas: ALL_APP_AREAS,
    dashboardVariant: "full",
    defaultRoute: "/dashboard",
    orderFlowRole: "ADMIN",
    sellerScope: "all",
    kanbanMode: "full",
    permissionMatrix: {
      comercial: ["*"],
      pedidos: ["*"],
      financeiro: ["*"],
      suprimentos: ["*"],
      rh: ["*"],
      configuracoes: ["*"],
      pdv: ["*"],
    },
    defaultDepartment: "Administrativo",
    defaultJobTitle: "Administrador do Sistema",
  },
  CEO: {
    key: "CEO",
    label: "CEO",
    description: "Visão executiva da operação, com leitura gerencial e acompanhamento global.",
    priority: 95,
    areas: ALL_APP_AREAS,
    dashboardVariant: "full",
    defaultRoute: "/dashboard",
    orderFlowRole: null,
    sellerScope: "all",
    kanbanMode: "view",
    permissionMatrix: {
      comercial: ["view", "approve", "print", "export", "change_price"],
      pedidos: ["view", "approve", "print", "export", "change_status"],
      financeiro: ["view", "approve", "print", "export", "receive_payment", "make_payment"],
      suprimentos: ["view", "approve", "print", "export"],
      rh: ["view", "approve", "print", "export", "apply_warning", "start_termination"],
      configuracoes: ["view", "edit", "manage_settings", "view_audit", "backup"],
      pdv: ["view", "print"],
    },
    defaultDepartment: "Diretoria",
    defaultJobTitle: "CEO",
  },
  CFO: {
    key: "CFO",
    label: "CFO",
    description: "Controle financeiro e visão executiva das receitas, despesas e recebimentos.",
    priority: 90,
    areas: ["dashboard", "financial", "orders"],
    dashboardVariant: "financial",
    defaultRoute: "/dashboard",
    orderFlowRole: null,
    sellerScope: "all",
    kanbanMode: "view",
    permissionMatrix: {
      financeiro: ["*"],
      pedidos: ["view", "print", "export"],
      comercial: ["view", "print", "export"],
    },
    defaultDepartment: "Financeiro",
    defaultJobTitle: "CFO",
  },
  FINANCEIRO: {
    key: "FINANCEIRO",
    label: "Financeiro",
    description: "Operação financeira, caixa, contas e conciliações.",
    priority: 82,
    areas: ["dashboard", "financial", "orders"],
    dashboardVariant: "financial",
    defaultRoute: "/dashboard",
    orderFlowRole: null,
    sellerScope: "all",
    kanbanMode: "view",
    permissionMatrix: {
      financeiro: ["*"],
      pedidos: ["view", "print", "export"],
      comercial: ["view", "print", "export"],
    },
    defaultDepartment: "Financeiro",
    defaultJobTitle: "Analista Financeiro",
  },
  AUX_ADMINISTRATIVO: {
    key: "AUX_ADMINISTRATIVO",
    label: "Aux. Administrativo",
    description: "Apoio operacional entre vendas, pedidos, PDV e rotinas administrativas.",
    priority: 72,
    areas: ["dashboard", "pdv", "customers", "orders", "kanban", "financial"],
    dashboardVariant: "sales",
    defaultRoute: "/dashboard",
    orderFlowRole: "VENDEDOR",
    sellerScope: "all",
    kanbanMode: "full",
    permissionMatrix: {
      pdv: ["view", "create", "edit", "print"],
      comercial: ["view", "create", "edit", "print"],
      pedidos: ["view", "create", "edit", "print", "change_status"],
      financeiro: ["view", "create", "edit", "print"],
    },
    defaultDepartment: "Administrativo",
    defaultJobTitle: "Auxiliar Administrativo",
  },
  VENDEDOR: {
    key: "VENDEDOR",
    label: "Vendedor",
    description: "Opera PDV, clientes e pedidos com dashboard comercial enxuto.",
    priority: 70,
    areas: ["dashboard", "pdv", "customers", "orders", "kanban"],
    dashboardVariant: "sales",
    defaultRoute: "/dashboard",
    orderFlowRole: "VENDEDOR",
    sellerScope: "self",
    kanbanMode: "full",
    permissionMatrix: {
      pdv: ["view", "create", "edit", "print", "change_price"],
      comercial: ["view", "create", "edit", "print", "change_price"],
      pedidos: ["view", "create", "edit", "print", "change_status"],
    },
    defaultDepartment: "Comercial",
    defaultJobTitle: "Vendedor",
  },
  SUPERVISOR_COMERCIAL: {
    key: "SUPERVISOR_COMERCIAL",
    label: "Supervisor Comercial",
    description: "Supervisão de vendas, carteira, pedidos e comissões do time comercial.",
    priority: 75,
    areas: ["dashboard", "pdv", "sales", "customers", "orders", "kanban", "commissions"],
    dashboardVariant: "sales",
    defaultRoute: "/dashboard",
    orderFlowRole: "VENDEDOR",
    sellerScope: "all",
    kanbanMode: "full",
    permissionMatrix: {
      pdv: ["view", "create", "edit", "print", "change_price"],
      comercial: ["view", "create", "edit", "approve", "print", "export", "change_price", "reprocess_commission"],
      pedidos: ["view", "create", "edit", "approve", "print", "change_status"],
    },
    defaultDepartment: "Comercial",
    defaultJobTitle: "Supervisor Comercial",
  },
  RH: {
    key: "RH",
    label: "RH",
    description: "Acesso exclusivo ao módulo de recursos humanos.",
    priority: 85,
    areas: ["dashboard", "hr"],
    dashboardVariant: "hr",
    defaultRoute: "/dashboard",
    orderFlowRole: null,
    sellerScope: "none",
    kanbanMode: "view",
    permissionMatrix: {
      rh: ["*"],
    },
    defaultDepartment: "RH",
    defaultJobTitle: "Analista de RH",
  },
  SUPERVISOR_PRODUCAO: {
    key: "SUPERVISOR_PRODUCAO",
    label: "Supervisor de Produção",
    description: "Acesso exclusivo ao kanban operacional de produção.",
    priority: 78,
    areas: ["dashboard", "kanban"],
    dashboardVariant: "kanban",
    defaultRoute: "/dashboard",
    orderFlowRole: "PRODUCAO",
    sellerScope: "none",
    kanbanMode: "production_only",
    permissionMatrix: {
      pedidos: ["change_status"],
    },
    defaultDepartment: "Produção",
    defaultJobTitle: "Supervisor de Produção",
  },
  ENTREGADOR: {
    key: "ENTREGADOR",
    label: "Entregador",
    description: "Acompanha entregas e conclui etapas finais da expedição.",
    priority: 68,
    areas: ["dashboard", "orders", "kanban"],
    dashboardVariant: "kanban",
    defaultRoute: "/dashboard",
    orderFlowRole: "ENTREGADOR",
    sellerScope: "none",
    kanbanMode: "full",
    permissionMatrix: {
      pedidos: ["view", "print", "change_status"],
    },
    defaultDepartment: "Logística",
    defaultJobTitle: "Entregador",
  },
}

export const systemRoleDefinitions: SystemRoleDefinition[] = [
  {
    roleName: "Admin",
    accessPresetKey: "ADMINISTRADOR",
    description: "Perfil legado com acesso total ao ERP.",
    aliases: ["admin"],
    assignable: false,
  },
  {
    roleName: "Administrador",
    accessPresetKey: "ADMINISTRADOR",
    description: accessPresetDefinitions.ADMINISTRADOR.description,
    aliases: ["administrador", "administracao"],
    assignable: true,
  },
  {
    roleName: "CEO",
    accessPresetKey: "CEO",
    description: accessPresetDefinitions.CEO.description,
    aliases: ["ceo"],
    assignable: true,
  },
  {
    roleName: "Diretoria",
    accessPresetKey: "CEO",
    description: "Perfil executivo legado com visão global do negócio.",
    aliases: ["diretoria", "diretoria executiva"],
    assignable: false,
  },
  {
    roleName: "CFO",
    accessPresetKey: "CFO",
    description: accessPresetDefinitions.CFO.description,
    aliases: ["cfo"],
    assignable: true,
  },
  {
    roleName: "Financeiro",
    accessPresetKey: "FINANCEIRO",
    description: accessPresetDefinitions.FINANCEIRO.description,
    aliases: ["financeiro"],
    assignable: false,
  },
  {
    roleName: "Auxiliar Administrativo",
    accessPresetKey: "AUX_ADMINISTRATIVO",
    description: accessPresetDefinitions.AUX_ADMINISTRATIVO.description,
    aliases: ["aux adm", "auxiliar administrativo", "aux administrativo", "administrativo auxiliar"],
    assignable: true,
  },
  {
    roleName: "Atendimento",
    accessPresetKey: "AUX_ADMINISTRATIVO",
    description: "Perfil legado de apoio comercial e administrativo.",
    aliases: ["atendimento", "atendente"],
    assignable: false,
  },
  {
    roleName: "Vendedor",
    accessPresetKey: "VENDEDOR",
    description: accessPresetDefinitions.VENDEDOR.description,
    aliases: ["vendedor", "consultor de vendas", "comercial"],
    assignable: true,
  },
  {
    roleName: "Supervisor Comercial",
    accessPresetKey: "SUPERVISOR_COMERCIAL",
    description: accessPresetDefinitions.SUPERVISOR_COMERCIAL.description,
    aliases: ["supervisor comercial", "sup comercial", "gerente comercial"],
    assignable: true,
  },
  {
    roleName: "Supervisor",
    accessPresetKey: "SUPERVISOR_COMERCIAL",
    description: "Perfil legado de supervisão comercial.",
    aliases: ["supervisor"],
    assignable: false,
  },
  {
    roleName: "RH",
    accessPresetKey: "RH",
    description: accessPresetDefinitions.RH.description,
    aliases: ["rh", "recursos humanos"],
    assignable: true,
  },
  {
    roleName: "Recrutamento",
    accessPresetKey: "RH",
    description: "Perfil legado para rotinas de recrutamento.",
    aliases: ["recrutamento"],
    assignable: false,
  },
  {
    roleName: "Supervisor de Produção",
    accessPresetKey: "SUPERVISOR_PRODUCAO",
    description: accessPresetDefinitions.SUPERVISOR_PRODUCAO.description,
    aliases: ["supervisor de produção", "sup produção", "sup de produção"],
    assignable: true,
  },
  {
    roleName: "Produção",
    accessPresetKey: "SUPERVISOR_PRODUCAO",
    description: "Perfil legado de operação e supervisão de produção.",
    aliases: ["produção"],
    assignable: false,
  },
  {
    roleName: "Entregador",
    accessPresetKey: "ENTREGADOR",
    description: accessPresetDefinitions.ENTREGADOR.description,
    aliases: ["entregador", "motorista"],
    assignable: false,
  },
]

export const assignableSystemRoleDefinitions = systemRoleDefinitions.filter((role) => role.assignable)

export function normalizeRoleLabel(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

export function findSystemRoleDefinition(roleName?: string | null) {
  const normalized = normalizeRoleLabel(roleName)
  if (!normalized) {
    return null
  }

  const exactMatch =
    systemRoleDefinitions.find((definition) => normalizeRoleLabel(definition.roleName) === normalized) ||
    systemRoleDefinitions.find((definition) =>
      definition.aliases.some((alias) => normalizeRoleLabel(alias) === normalized),
    )

  if (exactMatch) {
    return exactMatch
  }

  return (
    systemRoleDefinitions.find((definition) =>
      [definition.roleName, ...definition.aliases].some((alias) => normalized.includes(normalizeRoleLabel(alias))),
    ) || null
  )
}
