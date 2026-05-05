import { BellRing, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfigSection, ConfigShell, StatusBadge } from "@/components/configuracoes/ConfigShell"
import { FieldGroup, FieldInput, FieldSelect, FieldTextarea, TwoColumnGrid } from "@/components/configuracoes/ConfigForm"
import { saveAutomationAction } from "../actions"
import { getAutomationsData } from "@/lib/configuration-queries"

export default async function AutomacoesPage() {
  const automations = await getAutomationsData()

  return (
    <ConfigShell
      title="Automações e Notificações"
      subtitle="ROTINAS AUTOMÁTICAS, ALERTAS E GERAÇÃO ASSISTIDA DE EVENTOS OPERACIONAIS E FINANCEIROS."
      icon={<Bot className="h-8 w-8 text-primary" />}
      badges={["Fechamento automático", "Alertas operacionais", "Disparo de notificações"]}
      stats={[
        { label: "Automações totais", value: automations.length, hint: "rotinas cadastradas", tone: "blue" },
        { label: "Habilitadas", value: automations.filter((automation) => automation.isEnabled).length, hint: "em execução", tone: "green" },
      ]}
    >
      <div className="grid gap-6">
        {automations.map((automation) => (
          <ConfigSection
            key={automation.id}
            title={automation.name}
            description={`CATEGORIA ${automation.category.toUpperCase()} COM FREQUÊNCIA, CANAL E PRÓXIMA JANELA.`}
            actions={<BellRing className="h-5 w-5 text-blue-600" />}
          >
            <form action={saveAutomationAction} className="grid gap-4">
              <input type="hidden" name="automationId" value={automation.id} />
              <TwoColumnGrid>
                <FieldGroup label="Nome">
                  <FieldInput name="name" defaultValue={automation.name} required />
                </FieldGroup>
                <FieldGroup label="Categoria">
                  <FieldInput name="category" defaultValue={automation.category} required />
                </FieldGroup>
                <FieldGroup label="Frequência">
                  <FieldInput name="frequency" defaultValue={automation.frequency || ""} />
                </FieldGroup>
                <FieldGroup label="Canais de notificação">
                  <FieldInput name="notificationChannels" defaultValue={automation.notificationChannels || ""} />
                </FieldGroup>
                <FieldGroup label="Habilitada">
                  <FieldSelect name="isEnabled" defaultValue={automation.isEnabled ? "true" : "false"}>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </FieldSelect>
                </FieldGroup>
                <div className="flex items-end">
                  <StatusBadge status={automation.isEnabled ? "ACTIVE" : "INACTIVE"} />
                </div>
              </TwoColumnGrid>

              <TwoColumnGrid>
                <FieldGroup label="Próxima execução">
                  <FieldInput
                    name="nextRunAt"
                    type="datetime-local"
                    defaultValue={
                      automation.nextRunAt ? new Date(automation.nextRunAt.getTime() - automation.nextRunAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""
                    }
                  />
                </FieldGroup>
                <FieldGroup label="Último resultado">
                  <FieldInput value={automation.lastResult || "Sem execução registrada"} readOnly />
                </FieldGroup>
              </TwoColumnGrid>

              <FieldGroup label="Descrição">
                <FieldTextarea name="description" defaultValue={automation.description || ""} />
              </FieldGroup>
              <FieldGroup label="Configuração técnica (JSON simplificado)">
                <FieldTextarea name="config" defaultValue={automation.config || "{}"} />
              </FieldGroup>

              <div className="flex justify-end">
                <Button className="rounded-2xl px-6">Salvar automação</Button>
              </div>
            </form>
          </ConfigSection>
        ))}
      </div>
    </ConfigShell>
  )
}
