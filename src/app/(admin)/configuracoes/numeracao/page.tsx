import { Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfigSection, ConfigShell, StatusBadge } from "@/components/configuracoes/ConfigShell"
import { FieldGroup, FieldInput, FieldSelect, FieldTextarea, TwoColumnGrid } from "@/components/configuracoes/ConfigForm"
import { saveSequenceAction } from "../actions"
import { getNumberingData } from "@/lib/configuration-queries"

export default async function NumeracaoPage() {
  const sequences = await getNumberingData()

  return (
    <ConfigShell
      title="Numeração"
      subtitle="SEQUÊNCIAS AUTOMÁTICAS PARA DOCUMENTOS OPERACIONAIS, COM PREFIXO, DÍGITOS E POLÍTICA DE REINÍCIO."
      icon={<Hash className="h-8 w-8 text-primary" />}
      badges={["Sequências automáticas", "Prefixos por documento", "Controle de próximo número"]}
      stats={[
        { label: "Sequências", value: sequences.length, hint: "tipos ativos no ERP", tone: "blue" },
        { label: "Ativas", value: sequences.filter((sequence) => sequence.status === "ACTIVE").length, hint: "em uso", tone: "green" },
      ]}
    >
      <div className="grid gap-6">
        {sequences.map((sequence) => (
          <ConfigSection
            key={sequence.id}
            title={sequence.name}
            description={`TIPO ${sequence.type.toUpperCase()} COM CONTROLE DE STATUS E PRÓXIMO ÍNDICE.`}
          >
            <form action={saveSequenceAction} className="grid gap-4">
              <input type="hidden" name="sequenceId" value={sequence.id} />
              <TwoColumnGrid>
                <FieldGroup label="Prefixo">
                  <FieldInput name="prefix" defaultValue={sequence.prefix || ""} />
                </FieldGroup>
                <FieldGroup label="Próximo número">
                  <FieldInput name="nextNumber" type="number" defaultValue={String(sequence.nextNumber)} />
                </FieldGroup>
                <FieldGroup label="Dígitos">
                  <FieldInput name="digits" type="number" defaultValue={String(sequence.digits)} />
                </FieldGroup>
                <FieldGroup label="Modo de reinício">
                  <FieldSelect name="resetMode" defaultValue={sequence.resetMode}>
                    <option value="NEVER">NEVER</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="YEARLY">YEARLY</option>
                  </FieldSelect>
                </FieldGroup>
                <FieldGroup label="Status">
                  <FieldSelect name="status" defaultValue={sequence.status}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </FieldSelect>
                </FieldGroup>
                <div className="flex items-end">
                  <StatusBadge status={sequence.status} />
                </div>
              </TwoColumnGrid>
              <FieldGroup label="Observações">
                <FieldTextarea name="notes" defaultValue={sequence.notes || ""} />
              </FieldGroup>
              <div className="flex justify-end">
                <Button className="rounded-2xl px-6">Salvar sequência</Button>
              </div>
            </form>
          </ConfigSection>
        ))}
      </div>
    </ConfigShell>
  )
}
