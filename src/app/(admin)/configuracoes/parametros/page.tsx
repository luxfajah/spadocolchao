import { Settings2, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfigSection, ConfigShell } from "@/components/configuracoes/ConfigShell"
import { FieldGroup, FieldInput, FieldSelect } from "@/components/configuracoes/ConfigForm"
import { saveSettingsCollectionAction } from "../actions"
import { getParameterData } from "@/lib/configuration-queries"

export default async function ParametrosPage() {
  const groups = await getParameterData()

  return (
    <ConfigShell
      title="Parâmetros do Sistema"
      subtitle="AJUSTES GLOBAIS POR FRENTE OPERACIONAL PARA COMERCIAL, PRODUÇÃO, FINANCEIRO, RH, PDV E IMPRESSÃO."
      icon={<Settings2 className="h-8 w-8 text-primary" />}
      badges={["Motor global de settings", "Agrupado por área", "Parâmetros operacionais"]}
      stats={groups.map((group) => ({
        label: group.category,
        value: group.entries.length,
        hint: "ajustes configuráveis",
        tone: "blue" as const,
      }))}
    >
      {groups.map((group) => (
        <ConfigSection
          key={group.category}
          title={group.category}
          description={`PARÂMETROS DO GRUPO ${group.category.toUpperCase()}.`}
          actions={<SlidersHorizontal className="h-5 w-5 text-blue-600" />}
        >
          <form action={saveSettingsCollectionAction} className="grid gap-4">
            <input type="hidden" name="redirectPath" value="/configuracoes/parametros" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.entries.map((setting) => (
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
            <div className="flex justify-end">
              <Button className="rounded-2xl px-6">Salvar {group.category}</Button>
            </div>
          </form>
        </ConfigSection>
      ))}
    </ConfigShell>
  )
}
