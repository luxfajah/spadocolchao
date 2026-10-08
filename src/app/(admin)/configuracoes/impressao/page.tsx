import { Printer, ExternalLink, Play } from "lucide-react"
import Link from "next/link"
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
      {/* BANNER CENTRAL DE IMPRESSÃO AUTOMÁTICA PDV */}
      <div className="rounded-[2rem] border border-blue-200 bg-gradient-to-r from-[#02213f] to-[#0b3156] p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/30">
            <Printer className="h-7 w-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight text-white uppercase">
                Monitor de Impressão Automática (Windows / PDV)
              </h3>
              <span className="rounded-full bg-emerald-400 text-slate-950 px-2 py-0.5 text-[9px] font-black uppercase">
                Em Tempo Real
              </span>
            </div>
            <p className="mt-1 text-xs text-sky-200/80 max-w-xl">
              Fila em tempo real que detecta pedidos feitos no PDV e dispara a impressão automaticamente no computador Windows (Bobina 80mm ou Folha A4) com alarme sonoro e suporte a Kiosk Printing.
            </p>
          </div>
        </div>

        <Link href="/pdv/impressao" target="_blank">
          <Button className="h-12 gap-2 rounded-2xl bg-sky-500 text-slate-950 hover:bg-sky-400 px-6 font-black uppercase text-xs tracking-wider shadow-lg shadow-sky-500/20">
            <Play className="h-4 w-4 fill-slate-950" />
            Abrir Central de Impressão
            <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </div>

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
