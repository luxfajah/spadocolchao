import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfigSection, ConfigShell, StatusBadge } from "@/components/configuracoes/ConfigShell"
import { FieldGroup, FieldInput, FieldSelect, FieldTextarea, TwoColumnGrid } from "@/components/configuracoes/ConfigForm"
import { savePrinterProfileAction, saveSettingsCollectionAction } from "../actions"
import { getPrintingData } from "@/lib/configuration-queries"

export default async function ImpressaoPage() {
  const data = await getPrintingData()
  const settingsByGroup = data.settings.reduce<Record<string, typeof data.settings>>((accumulator, setting) => {
    accumulator[setting.group] = [...(accumulator[setting.group] || []), setting]
    return accumulator
  }, {})

  return (
    <ConfigShell
      title="Impressão e Documentos"
      subtitle="DEFINA IMPRESSORAS PADRÃO, LARGURA DE PAPEL, CABEÇALHO, RODAPÉ, TEMPLATES E PERFIS DE SAÍDA."
      icon={<Printer className="h-8 w-8 text-primary" />}
      badges={["Perfil térmico", "Perfil A4", "Templates documentais"]}
      stats={[
        { label: "Perfis cadastrados", value: data.profiles.length, hint: "dispositivos e destinos", tone: "blue" },
        { label: "Perfis ativos", value: data.profiles.filter((profile) => profile.status === "ACTIVE").length, hint: "prontos para uso", tone: "green" },
      ]}
    >
      <ConfigSection title="Defaults e comportamento" description="SETTINGS GLOBAIS DE IMPRESSÃO E DOCUMENTOS.">
        <form action={saveSettingsCollectionAction} className="grid gap-6">
          <input type="hidden" name="redirectPath" value="/configuracoes/impressao" />
          {Object.entries(settingsByGroup).map(([groupName, settings]) => (
            <div key={groupName} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">{groupName}</p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {settings.map((setting) => (
                  <FieldGroup key={setting.id} label={setting.label}>
                    <input type="hidden" name="settingId" value={setting.id} />
                    {setting.valueType === "boolean" ? (
                      <FieldSelect name={`value:${setting.id}`} defaultValue={setting.value}>
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                      </FieldSelect>
                    ) : (
                      <FieldInput name={`value:${setting.id}`} defaultValue={setting.value} />
                    )}
                  </FieldGroup>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <Button className="rounded-2xl px-6">Salvar defaults de impressão</Button>
          </div>
        </form>
      </ConfigSection>

      <div className="grid gap-6">
        {data.profiles.map((profile) => (
          <ConfigSection
            key={profile.id}
            title={profile.name}
            description={`TIPO ${profile.type} COM STATUS, DRIVER, TEMPLATE E COMPORTAMENTO.`}
          >
            <form action={savePrinterProfileAction} className="grid gap-4">
              <input type="hidden" name="profileId" value={profile.id} />
              <TwoColumnGrid>
                <FieldGroup label="Nome">
                  <FieldInput name="name" defaultValue={profile.name} required />
                </FieldGroup>
                <FieldGroup label="Tipo">
                  <FieldSelect name="type" defaultValue={profile.type}>
                    <option value="THERMAL">THERMAL</option>
                    <option value="A4">A4</option>
                    <option value="LABEL">LABEL</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </FieldSelect>
                </FieldGroup>
                <FieldGroup label="Driver">
                  <FieldInput name="driverName" defaultValue={profile.driverName || ""} />
                </FieldGroup>
                <FieldGroup label="Largura do papel">
                  <FieldInput name="paperWidth" defaultValue={profile.paperWidth || ""} />
                </FieldGroup>
                <FieldGroup label="Padrão">
                  <FieldSelect name="isDefault" defaultValue={profile.isDefault ? "true" : "false"}>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </FieldSelect>
                </FieldGroup>
                <FieldGroup label="Impressão automática">
                  <FieldSelect name="autoPrint" defaultValue={profile.autoPrint ? "true" : "false"}>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </FieldSelect>
                </FieldGroup>
                <FieldGroup label="Status">
                  <FieldSelect name="status" defaultValue={profile.status}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </FieldSelect>
                </FieldGroup>
                <div className="flex items-end">
                  <StatusBadge status={profile.status} />
                </div>
              </TwoColumnGrid>
              <TwoColumnGrid>
                <FieldGroup label="Cabeçalho">
                  <FieldInput name="headerTemplate" defaultValue={profile.headerTemplate || ""} />
                </FieldGroup>
                <FieldGroup label="Rodapé">
                  <FieldInput name="footerTemplate" defaultValue={profile.footerTemplate || ""} />
                </FieldGroup>
                <FieldGroup label="Template do documento">
                  <FieldInput name="documentTemplate" defaultValue={profile.documentTemplate || ""} />
                </FieldGroup>
              </TwoColumnGrid>
              <FieldGroup label="Observações">
                <FieldTextarea name="notes" defaultValue={profile.notes || ""} />
              </FieldGroup>
              <div className="flex justify-end">
                <Button className="rounded-2xl px-6">Salvar perfil de impressora</Button>
              </div>
            </form>
          </ConfigSection>
        ))}
      </div>
    </ConfigShell>
  )
}
