import { prisma } from "@/lib/prisma"
import { accessPresetDefinitions, systemRoleDefinitions } from "@/lib/role-presets"

let ensureSystemConfigurationPromise: Promise<void> | null = null
let ensureSystemConfigurationDone = false

export const configModules = [
  { key: "comercial", label: "Comercial" },
  { key: "pdv", label: "PDV" },
  { key: "pedidos", label: "Pedidos" },
  { key: "financeiro", label: "Financeiro" },
  { key: "suprimentos", label: "Suprimentos" },
  { key: "rh", label: "RH" },
  { key: "configuracoes", label: "Configurações" },
] as const

export const permissionActionsByModule = {
  comercial: [
    "view",
    "create",
    "edit",
    "delete",
    "approve",
    "cancel",
    "print",
    "export",
    "change_price",
    "change_status",
    "reprocess_commission",
  ],
  pdv: ["view", "create", "edit", "cancel", "print", "change_price"],
  pedidos: ["view", "create", "edit", "delete", "approve", "cancel", "print", "export", "change_status"],
  financeiro: ["view", "create", "edit", "delete", "approve", "cancel", "print", "export", "receive_payment", "make_payment"],
  suprimentos: ["view", "create", "edit", "delete", "approve", "cancel", "print", "export", "change_status"],
  rh: ["view", "create", "edit", "delete", "approve", "cancel", "print", "export", "apply_warning", "start_termination"],
  configuracoes: ["view", "edit", "manage_settings", "view_audit", "backup"],
} as const

export const permissionActionLabels: Record<string, string> = {
  view: "Visualizar",
  create: "Criar",
  edit: "Editar",
  delete: "Excluir",
  approve: "Aprovar",
  cancel: "Cancelar",
  print: "Imprimir",
  export: "Exportar",
  receive_payment: "Receber Pagamento",
  make_payment: "Efetuar Pagamento",
  change_price: "Alterar Preço",
  change_status: "Alterar Status",
  apply_warning: "Aplicar Advertência",
  start_termination: "Iniciar Desligamento",
  reprocess_commission: "Reprocessar Comissão",
  manage_settings: "Gerenciar Configurações",
  view_audit: "Visualizar Auditoria",
  backup: "Gerar Backup",
}

export function buildPermissionCode(moduleKey: string, action: string) {
  return `${moduleKey}.${action}`
}

export const defaultRoles = [
  ...systemRoleDefinitions.map((roleDefinition) => ({
    name: roleDefinition.roleName,
    description: roleDefinition.description,
    isSystem: true,
    status: "ACTIVE",
  })),
] as const

export const parameterSettingDefinitions = [
  {
    group: "PARAMETERS",
    category: "Comercial",
    entries: [
      { key: "commercial.require_customer", label: "Cliente obrigatório no pedido", value: "true", valueType: "boolean" },
      { key: "commercial.allow_manual_discount", label: "Permitir desconto manual", value: "true", valueType: "boolean" },
      { key: "commercial.default_sale_channel", label: "Canal padrão de venda", value: "Loja", valueType: "string" },
    ],
  },
  {
    group: "PARAMETERS",
    category: "Produção",
    entries: [
      { key: "production.default_lead_time_days", label: "Prazo padrão de produção (dias)", value: "7", valueType: "number" },
      { key: "production.priority_lane_enabled", label: "Fila prioritária habilitada", value: "true", valueType: "boolean" },
      { key: "production.require_release_checklist", label: "Exigir checklist de liberação", value: "true", valueType: "boolean" },
    ],
  },
  {
    group: "PARAMETERS",
    category: "Suprimentos",
    entries: [
      { key: "supplies.auto_purchase_suggestion", label: "Sugerir compra automática", value: "true", valueType: "boolean" },
      { key: "supplies.low_stock_days", label: "Dias de cobertura mínima", value: "10", valueType: "number" },
      { key: "supplies.receiving_requires_invoice", label: "Recebimento exige nota fiscal", value: "false", valueType: "boolean" },
    ],
  },
  {
    group: "PARAMETERS",
    category: "Financeiro",
    entries: [
      { key: "financial.default_interest_rate", label: "Juros padrão de atraso (%)", value: "2.00", valueType: "number" },
      { key: "financial.auto_reconcile_cash", label: "Conciliar caixa automaticamente", value: "false", valueType: "boolean" },
      { key: "financial.title_due_alert_days", label: "Dias para alerta de vencimento", value: "3", valueType: "number" },
    ],
  },
  {
    group: "PARAMETERS",
    category: "Comissões",
    entries: [
      { key: "commissions.auto_group", label: "Agrupar comissões automaticamente", value: "true", valueType: "boolean" },
      { key: "commissions.default_close_day", label: "Dia padrão de fechamento", value: "30", valueType: "number" },
      { key: "commissions.allow_manual_override", label: "Permitir ajuste manual", value: "true", valueType: "boolean" },
    ],
  },
  {
    group: "PARAMETERS",
    category: "RH",
    entries: [
      { key: "hr.require_documents_on_admission", label: "Exigir documentos na admissão", value: "true", valueType: "boolean" },
      { key: "hr.auto_generate_warning_number", label: "Numerar advertências automaticamente", value: "true", valueType: "boolean" },
      { key: "hr.default_probation_days", label: "Período padrão de experiência", value: "90", valueType: "number" },
    ],
  },
  {
    group: "PARAMETERS",
    category: "PDV",
    entries: [
      { key: "pdv.allow_open_price", label: "Permitir preço livre", value: "false", valueType: "boolean" },
      { key: "pdv.auto_open_cash_register", label: "Abrir caixa automaticamente", value: "true", valueType: "boolean" },
      { key: "pdv.default_receipt_copies", label: "Vias padrão do recibo", value: "1", valueType: "number" },
    ],
  },
  {
    group: "PARAMETERS",
    category: "Kanban",
    entries: [
      { key: "kanban.default_wip_limit", label: "Limite padrão de WIP", value: "12", valueType: "number" },
      { key: "kanban.auto_archive_done_days", label: "Arquivar concluídos após (dias)", value: "15", valueType: "number" },
      { key: "kanban.highlight_overdue_cards", label: "Destacar cards atrasados", value: "true", valueType: "boolean" },
    ],
  },
  {
    group: "PARAMETERS",
    category: "Impressão",
    entries: [
      { key: "printing.order_template", label: "Template padrão de pedido", value: "pedido-classico", valueType: "string" },
      { key: "printing.auto_print_sales", label: "Imprimir vendas automaticamente", value: "false", valueType: "boolean" },
      { key: "printing.include_qr_code", label: "Incluir QR code nos documentos", value: "true", valueType: "boolean" },
    ],
  },
] as const

export const securitySettingDefinitions = [
  {
    group: "SECURITY",
    category: "Política de Senha",
    key: "security.password_min_length",
    label: "Tamanho mínimo da senha",
    value: "8",
    valueType: "number",
    description: "Quantidade mínima de caracteres aceitos em novas senhas.",
  },
  {
    group: "SECURITY",
    category: "Política de Senha",
    key: "security.require_number",
    label: "Exigir número",
    value: "true",
    valueType: "boolean",
    description: "Obriga pelo menos um dígito na senha.",
  },
  {
    group: "SECURITY",
    category: "Política de Senha",
    key: "security.require_special_char",
    label: "Exigir caractere especial",
    value: "true",
    valueType: "boolean",
    description: "Exige símbolos como ! @ # para aumentar a entropia.",
  },
  {
    group: "SECURITY",
    category: "Política de Senha",
    key: "security.password_expiration_days",
    label: "Expiração da senha (dias)",
    value: "90",
    valueType: "number",
    description: "Força troca de senha após o período definido.",
  },
  {
    group: "SECURITY",
    category: "Acesso",
    key: "security.max_login_attempts",
    label: "Tentativas máximas",
    value: "5",
    valueType: "number",
    description: "Bloqueia o usuário após exceder esse limite de falhas.",
  },
  {
    group: "SECURITY",
    category: "Acesso",
    key: "security.auto_block_enabled",
    label: "Bloqueio automático",
    value: "true",
    valueType: "boolean",
    description: "Ativa bloqueio automático quando há muitas tentativas falhas.",
  },
  {
    group: "SECURITY",
    category: "Sessão",
    key: "security.session_timeout_minutes",
    label: "Tempo máximo de sessão (min)",
    value: "720",
    valueType: "number",
    description: "Duração máxima antes de forçar relogin.",
  },
  {
    group: "SECURITY",
    category: "Sessão",
    key: "security.inactivity_logout_minutes",
    label: "Logout por inatividade (min)",
    value: "60",
    valueType: "number",
    description: "Sai automaticamente depois de ficar sem uso.",
  },
  {
    group: "SECURITY",
    category: "Sessão",
    key: "security.allow_multiple_sessions",
    label: "Permitir múltiplas sessões",
    value: "false",
    valueType: "boolean",
    description: "Se desativado, o usuário fica com apenas uma sessão ativa.",
  },
  {
    group: "SECURITY",
    category: "Sessão",
    key: "security.enable_two_factor_future",
    label: "Preparado para 2FA",
    value: "true",
    valueType: "boolean",
    description: "Deixa o ambiente pronto para habilitar 2FA futuramente.",
  },
  {
    group: "SECURITY",
    category: "Auditoria",
    key: "security.log_ip_device",
    label: "Registrar IP e dispositivo",
    value: "true",
    valueType: "boolean",
    description: "Registra IP e user agent nos logs de auditoria.",
  },
] as const

export const backupSettingDefinitions = [
  { group: "BACKUP", category: "Execução", key: "backup.folder", label: "Pasta de backup", value: "backups", valueType: "string" },
  { group: "BACKUP", category: "Execução", key: "backup.frequency", label: "Frequência", value: "DAILY", valueType: "string" },
  { group: "BACKUP", category: "Execução", key: "backup.max_versions", label: "Quantidade de versões", value: "15", valueType: "number" },
] as const

export const printSettingDefinitions = [
  { group: "PRINTING", category: "Padrão", key: "printing.default_thermal_printer", label: "Impressora térmica padrão", value: "Térmica Loja", valueType: "string" },
  { group: "PRINTING", category: "Padrão", key: "printing.default_a4_printer", label: "Impressora A4 padrão", value: "A4 Administrativo", valueType: "string" },
  { group: "PRINTING", category: "Padrão", key: "printing.paper_width_mm", label: "Largura do papel (mm)", value: "80", valueType: "number" },
  { group: "PRINTING", category: "Padrão", key: "printing.auto_print_enabled", label: "Impressão automática", value: "false", valueType: "boolean" },
  { group: "PRINTING", category: "Layout", key: "printing.header", label: "Cabeçalho padrão", value: "Spa do Colchão ERP", valueType: "string" },
  { group: "PRINTING", category: "Layout", key: "printing.footer", label: "Rodapé padrão", value: "Obrigado pela preferência.", valueType: "string" },
] as const

export const documentSequenceDefinitions = [
  { type: "venda", name: "Venda", prefix: "VEN", nextNumber: 1001, digits: 6, resetMode: "YEARLY", status: "ACTIVE" },
  { type: "pedido", name: "Pedido", prefix: "PED", nextNumber: 2001, digits: 6, resetMode: "YEARLY", status: "ACTIVE" },
  { type: "compra", name: "Compra", prefix: "COM", nextNumber: 3001, digits: 6, resetMode: "YEARLY", status: "ACTIVE" },
  { type: "recebimento", name: "Recebimento", prefix: "REC", nextNumber: 4001, digits: 6, resetMode: "YEARLY", status: "ACTIVE" },
  { type: "ficha_tecnica", name: "Ficha Técnica", prefix: "FTC", nextNumber: 501, digits: 5, resetMode: "NEVER", status: "ACTIVE" },
  { type: "entrevista", name: "Entrevista", prefix: "ENT", nextNumber: 101, digits: 5, resetMode: "YEARLY", status: "ACTIVE" },
  { type: "advertencia", name: "Advertência", prefix: "ADV", nextNumber: 101, digits: 5, resetMode: "YEARLY", status: "ACTIVE" },
  { type: "desligamento", name: "Desligamento", prefix: "DSL", nextNumber: 101, digits: 5, resetMode: "YEARLY", status: "ACTIVE" },
  { type: "documento_interno", name: "Documento Interno", prefix: "DOC", nextNumber: 1001, digits: 6, resetMode: "YEARLY", status: "ACTIVE" },
] as const

export const printerProfileDefinitions = [
  {
    name: "Térmica Loja",
    type: "THERMAL",
    driverName: "Generic Thermal 80mm",
    paperWidth: "80",
    isDefault: true,
    autoPrint: false,
    headerTemplate: "Spa do Colchão",
    footerTemplate: "Volte sempre.",
    documentTemplate: "cupom-venda",
    status: "ACTIVE",
  },
  {
    name: "A4 Administrative",
    type: "A4",
    driverName: "PDF A4",
    paperWidth: "210",
    isDefault: true,
    autoPrint: false,
    headerTemplate: "Cabeçalho corporativo",
    footerTemplate: "Documento emitido pelo ERP",
    documentTemplate: "a4-institucional",
    status: "ACTIVE",
  },
] as const

export const automationDefinitions = [
  { code: "fechamento_caixa", name: "Fechamento automático de caixa", category: "Financeiro", description: "Fecha o caixa no horário definido.", frequency: "DAILY 18:00", notificationChannels: "painel,email" },
  { code: "baixo_estoque", name: "Alerta de baixo estoque", category: "Suprimentos", description: "Notifica quando o estoque fica abaixo do mínimo.", frequency: "EVERY_2_HOURS", notificationChannels: "painel,whatsapp" },
  { code: "pedido_atrasado", name: "Alerta de pedido atrasado", category: "Pedidos", description: "Aponta pedidos fora do SLA.", frequency: "HOURLY", notificationChannels: "painel,email" },
  { code: "entrevista_alerta", name: "Alerta de entrevista", category: "RH", description: "Lembra entrevistas agendadas.", frequency: "DAILY 08:00", notificationChannels: "painel,email" },
  { code: "titulo_vencido", name: "Alerta de título vencido", category: "Financeiro", description: "Lista títulos vencidos para cobrança.", frequency: "DAILY 07:30", notificationChannels: "painel,email" },
  { code: "folha_pendente", name: "Alerta de folha pendente", category: "RH", description: "Dispara quando há folha sem fechamento.", frequency: "DAILY 09:00", notificationChannels: "painel,email" },
  { code: "pedido_automatico", name: "Geração automática de pedido", category: "Comercial", description: "Cria pedidos a partir de regras automáticas.", frequency: "ON_TRIGGER", notificationChannels: "painel" },
  { code: "contas_receber_automatico", name: "Geração automática de contas a receber", category: "Financeiro", description: "Gera recebíveis a partir de vendas confirmadas.", frequency: "ON_TRIGGER", notificationChannels: "painel" },
  { code: "contas_pagar_automatico", name: "Geração automática de contas a pagar", category: "Financeiro", description: "Gera pagamentos a partir de compras aprovadas.", frequency: "ON_TRIGGER", notificationChannels: "painel" },
  { code: "agrupamento_comissao", name: "Agrupamento automático de comissão", category: "Comissões", description: "Agrupa comissões por período e regra ativa.", frequency: "WEEKLY", notificationChannels: "painel,email" },
] as const

function moduleLabel(moduleKey: string) {
  return configModules.find((moduleItem) => moduleItem.key === moduleKey)?.label ?? moduleKey
}

export function buildPermissionCatalog() {
  return configModules.flatMap((moduleItem) =>
    permissionActionsByModule[moduleItem.key].map((action) => ({
      code: buildPermissionCode(moduleItem.key, action),
      name: `${moduleItem.label} - ${permissionActionLabels[action] ?? action}`,
      module: moduleItem.label,
      action,
      description: `${permissionActionLabels[action] ?? action} no módulo ${moduleItem.label}.`,
      status: "ACTIVE",
      isCustom: false,
    })),
  )
}

type MinimalSystemState = {
  companyExists: boolean
  permissionCodes: Set<string>
  roleMap: Map<string, { id: string }>
  settingKeys: Set<string>
  sequenceTypes: Set<string>
  printerNames: Set<string>
  automationCodes: Set<string>
}

async function readMinimalSystemState(): Promise<MinimalSystemState> {
  const [company, permissions, roles, settings, sequences, printers, automations] = await Promise.all([
    prisma.companyProfile.findFirst({
      select: { id: true },
    }),
    prisma.permission.findMany({
      select: { id: true, code: true },
    }),
    prisma.role.findMany({
      select: { id: true, name: true },
    }),
    prisma.systemSetting.findMany({
      select: { key: true },
    }),
    prisma.documentSequence.findMany({
      select: { type: true },
    }),
    prisma.printerProfile.findMany({
      select: { name: true },
    }),
    prisma.systemAutomation.findMany({
      select: { code: true },
    }),
  ])

  return {
    companyExists: Boolean(company),
    permissionCodes: new Set(permissions.map((permission) => permission.code)),
    roleMap: new Map(roles.map((role) => [role.name, { id: role.id }])),
    settingKeys: new Set(settings.map((setting) => setting.key)),
    sequenceTypes: new Set(sequences.map((sequence) => sequence.type)),
    printerNames: new Set(printers.map((printer) => printer.name)),
    automationCodes: new Set(automations.map((automation) => automation.code)),
  }
}

function getDefaultRolePermissionCodes(roleName: string) {
  const allPermissionCodes = buildPermissionCatalog().map((permission) => permission.code)
  const roleDefinition = systemRoleDefinitions.find((definition) => definition.roleName === roleName)

  if (!roleDefinition) {
    return []
  }

  const accessPreset = accessPresetDefinitions[roleDefinition.accessPresetKey]
  const permissionCodes: string[] = []

  for (const [moduleKey, allowedActions] of Object.entries(accessPreset.permissionMatrix)) {
    const moduleActions = permissionActionsByModule[moduleKey as keyof typeof permissionActionsByModule] as readonly string[]
    const resolvedActions = allowedActions.includes("*") ? [...moduleActions] : allowedActions

    resolvedActions.forEach((action) => {
      permissionCodes.push(buildPermissionCode(moduleKey, action))
    })
  }

  if (permissionCodes.length === 0 && roleDefinition.accessPresetKey === "ADMINISTRADOR") {
    return allPermissionCodes
  }

  return Array.from(new Set(permissionCodes))
}

async function ensureSystemConfigurationDataInternal() {
  const existingState = await readMinimalSystemState()

  if (!existingState.companyExists) {
    await prisma.companyProfile.create({
      data: {
        legalName: "Spa do Colchão LTDA",
        tradeName: "Spa do Colchão",
        cnpj: "00.000.000/0001-00",
        phone: "(11) 4000-0000",
        whatsapp: "(11) 99999-0000",
        email: "contato@spadocolchao.com",
        website: "www.spadocolchao.com",
        legalRepresentative: "Diretoria Spa do Colchão",
        printName: "Spa do Colchão",
        printPhone: "(11) 4000-0000",
        printFooter: "Documento emitido pelo ERP Spa do Colchão.",
        operationalHours: "Seg a Sab - 08h às 18h",
        operationalNotes: "Operação local em rede interna.",
      },
    })
  }

  const permissionCatalog = buildPermissionCatalog()
  const missingPermissions = permissionCatalog.filter((permissionDefinition) => !existingState.permissionCodes.has(permissionDefinition.code))
  for (const permissionDefinition of missingPermissions) {
    await prisma.permission.create({
      data: permissionDefinition,
    })
  }

  const permissions = await prisma.permission.findMany({
    select: {
      id: true,
      code: true,
    },
  })
  const permissionIdByCode = new Map(permissions.map((permission) => [permission.code, permission.id]))

  const roleIdByName = new Map(existingState.roleMap)
  for (const roleDefinition of defaultRoles) {
    let roleId = roleIdByName.get(roleDefinition.name)?.id

    if (!roleId) {
      const role = await prisma.role.create({
        data: {
          ...roleDefinition,
        },
      })
      roleId = role.id
      roleIdByName.set(roleDefinition.name, { id: role.id })
    }

    const currentRolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      select: {
        permissionId: true,
      },
    })
    const assignedPermissionIds = new Set(currentRolePermissions.map((rolePermission) => rolePermission.permissionId))
    const desiredPermissionIds = new Set(
      getDefaultRolePermissionCodes(roleDefinition.name)
        .map((permissionCode) => permissionIdByCode.get(permissionCode))
        .filter(Boolean) as string[],
    )

    for (const permissionId of Array.from(desiredPermissionIds)) {
      if (assignedPermissionIds.has(permissionId)) {
        continue
      }

      await prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
        },
      })
    }

    const permissionIdsToRemove = currentRolePermissions
      .map((rolePermission) => rolePermission.permissionId)
      .filter((permissionId) => !desiredPermissionIds.has(permissionId))

    if (permissionIdsToRemove.length > 0) {
      await prisma.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId: {
            in: permissionIdsToRemove,
          },
        },
      })
    }
  }

  const settingGroups: Array<{
    group: string
    category: string
    key: string
    label: string
    value: string
    valueType: string
  }> = [
    ...parameterSettingDefinitions.flatMap((group) =>
      group.entries.map((entry) => ({ ...entry, group: group.group, category: group.category })),
    ),
    ...securitySettingDefinitions,
    ...backupSettingDefinitions,
    ...printSettingDefinitions,
  ]

  const missingSettings = settingGroups.filter((settingDefinition) => !existingState.settingKeys.has(settingDefinition.key))
  for (const settingDefinition of missingSettings) {
    await prisma.systemSetting.create({
      data: {
        group: settingDefinition.group,
        category: settingDefinition.category,
        key: settingDefinition.key,
        label: settingDefinition.label,
        value: settingDefinition.value,
        valueType: settingDefinition.valueType,
        description: `${settingDefinition.label} (${moduleLabel(settingDefinition.category ?? settingDefinition.group)})`,
      },
    })
  }

  const missingSequences = documentSequenceDefinitions.filter(
    (sequenceDefinition) => !existingState.sequenceTypes.has(sequenceDefinition.type),
  )
  for (const sequenceDefinition of missingSequences) {
    await prisma.documentSequence.create({
      data: sequenceDefinition,
    })
  }

  const missingPrinters = printerProfileDefinitions.filter(
    (printerDefinition) => !existingState.printerNames.has(printerDefinition.name),
  )
  for (const printerDefinition of missingPrinters) {
    await prisma.printerProfile.create({
      data: printerDefinition,
    })
  }

  const missingAutomations = automationDefinitions.filter(
    (automationDefinition) => !existingState.automationCodes.has(automationDefinition.code),
  )
  for (const automationDefinition of missingAutomations) {
    await prisma.systemAutomation.create({
      data: {
        ...automationDefinition,
        config: "{}",
        isEnabled: true,
      },
    })
  }
}

export async function ensureSystemConfigurationData() {
  if (ensureSystemConfigurationDone) {
    return
  }

  if (!ensureSystemConfigurationPromise) {
    ensureSystemConfigurationPromise = ensureSystemConfigurationDataInternal()
      .then(() => {
        ensureSystemConfigurationDone = true
      })
      .finally(() => {
        ensureSystemConfigurationPromise = null
      })
  }

  await ensureSystemConfigurationPromise
}

export function parseSettingValue(valueType: string, rawValue: string) {
  if (valueType === "boolean") {
    return rawValue === "true"
  }

  if (valueType === "number") {
    return Number(rawValue || 0)
  }

  return rawValue
}
