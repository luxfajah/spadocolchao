import { ShieldCheck } from "lucide-react"
import { ConfigShell } from "@/components/configuracoes/ConfigShell"
import SecurityTabs from "@/components/configuracoes/SecurityTabs"
import { getAuthenticatedUser } from "@/lib/auth"
import { getSecurityData } from "@/lib/configuration-queries"
import { securitySettingDefinitions } from "@/lib/system-config"

export default async function SegurancaPage() {
  const actor = await getAuthenticatedUser()
  const data = await getSecurityData()
  const settingsByCategory = data.settings.reduce<Record<string, typeof data.settings>>((accumulator, setting) => {
    accumulator[setting.category || "Geral"] = [...(accumulator[setting.category || "Geral"] || []), setting]
    return accumulator
  }, {})
  const uniqueIps = new Set(data.activeSessions.map((session) => session.ipAddress).filter(Boolean)).size

  return (
    <ConfigShell
      title="Segurança"
      subtitle="Políticas de acesso, vida da sessão, registro de dispositivo e controle de bloqueio."
      icon={<ShieldCheck className="h-8 w-8 text-primary" />}
      badges={["Política de senha", "Sessão backend", "Rastreamento de dispositivo"]}
      stats={[
        { label: "Sessões ativas", value: data.activeSessions.length, hint: "instâncias conectadas", tone: "blue" },
        { label: "Usuários bloqueados", value: data.blockedUsers, hint: "requerem liberação", tone: "amber" },
        { label: "Pendentes de ativação", value: data.pendingUsers, hint: "novos acessos aguardando", tone: "slate" },
        { label: "IPs distintos", value: uniqueIps, hint: "origens em uso", tone: "green" },
      ]}
    >
      <SecurityTabs
        actorId={actor?.id ?? ""}
        settingsByCategory={settingsByCategory}
        securityDefinitions={securitySettingDefinitions}
        data={data}
      />
    </ConfigShell>
  )
}
