import { Building2, FileText, Landmark, MapPinned, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfigSection, ConfigShell } from "@/components/configuracoes/ConfigShell"
import { FieldGroup, FieldInput, FieldTextarea, TwoColumnGrid } from "@/components/configuracoes/ConfigForm"
import { getCompanyData } from "@/lib/configuration-queries"
import { saveCompanyProfileAction } from "../actions"

export default async function EmpresaPage() {
  const company = await getCompanyData()

  return (
    <ConfigShell
      title="Empresa"
      subtitle="CADASTRO MATRIZ DA EMPRESA PARA IMPRESSÃO, OPERAÇÃO, CONTATO E IDENTIDADE INSTITUCIONAL."
      icon={<Building2 className="h-8 w-8 text-primary" />}
      badges={["Cadastro institucional", "Dados fiscais", "Base para documentos"]}
      stats={[
        { label: "Razão social", value: company?.legalName || "-", hint: "cadastro principal", tone: "blue" },
        { label: "Nome fantasia", value: company?.tradeName || "-", hint: "uso comercial", tone: "green" },
        { label: "CNPJ", value: company?.cnpj || "-", hint: "identificador fiscal", tone: "slate" },
      ]}
    >
      <form action={saveCompanyProfileAction} className="grid gap-6">
        <ConfigSection
          title="Identificação"
          description="DADOS JURÍDICOS, FISCAIS E DE RESPONSABILIDADE LEGAL."
          actions={<Landmark className="h-5 w-5 text-blue-600" />}
        >
          <TwoColumnGrid>
            <FieldGroup label="Razão social">
              <FieldInput name="legalName" defaultValue={company?.legalName || ""} required />
            </FieldGroup>
            <FieldGroup label="Nome fantasia">
              <FieldInput name="tradeName" defaultValue={company?.tradeName || ""} />
            </FieldGroup>
            <FieldGroup label="CNPJ">
              <FieldInput name="cnpj" defaultValue={company?.cnpj || ""} />
            </FieldGroup>
            <FieldGroup label="Inscrição estadual">
              <FieldInput name="stateRegistration" defaultValue={company?.stateRegistration || ""} />
            </FieldGroup>
            <FieldGroup label="Inscrição municipal">
              <FieldInput name="municipalRegistration" defaultValue={company?.municipalRegistration || ""} />
            </FieldGroup>
            <FieldGroup label="Responsável legal">
              <FieldInput name="legalRepresentative" defaultValue={company?.legalRepresentative || ""} />
            </FieldGroup>
          </TwoColumnGrid>
        </ConfigSection>

        <ConfigSection
          title="Endereço e Contato"
          description="ENDEREÇO COMPLETO, CANAIS DE ATENDIMENTO E IDENTIDADE DIGITAL."
          actions={<MapPinned className="h-5 w-5 text-blue-600" />}
        >
          <TwoColumnGrid>
            <FieldGroup label="CEP">
              <FieldInput name="zipCode" defaultValue={company?.zipCode || ""} />
            </FieldGroup>
            <FieldGroup label="Rua">
              <FieldInput name="street" defaultValue={company?.street || ""} />
            </FieldGroup>
            <FieldGroup label="Número">
              <FieldInput name="number" defaultValue={company?.number || ""} />
            </FieldGroup>
            <FieldGroup label="Complemento">
              <FieldInput name="complement" defaultValue={company?.complement || ""} />
            </FieldGroup>
            <FieldGroup label="Bairro">
              <FieldInput name="neighborhood" defaultValue={company?.neighborhood || ""} />
            </FieldGroup>
            <FieldGroup label="Cidade">
              <FieldInput name="city" defaultValue={company?.city || ""} />
            </FieldGroup>
            <FieldGroup label="Estado">
              <FieldInput name="state" defaultValue={company?.state || ""} />
            </FieldGroup>
            <FieldGroup label="Telefone">
              <FieldInput name="phone" defaultValue={company?.phone || ""} />
            </FieldGroup>
            <FieldGroup label="WhatsApp">
              <FieldInput name="whatsapp" defaultValue={company?.whatsapp || ""} />
            </FieldGroup>
            <FieldGroup label="E-mail">
              <FieldInput name="email" type="email" defaultValue={company?.email || ""} />
            </FieldGroup>
            <FieldGroup label="Site">
              <FieldInput name="website" defaultValue={company?.website || ""} />
            </FieldGroup>
            <FieldGroup label="Logo (URL)">
              <FieldInput name="logoUrl" defaultValue={company?.logoUrl || ""} />
            </FieldGroup>
          </TwoColumnGrid>
        </ConfigSection>

        <ConfigSection
          title="Impressão"
          description="IDENTIDADE QUE SAI EM DOCUMENTOS, CABEÇALHOS E RODAPÉS."
          actions={<FileText className="h-5 w-5 text-blue-600" />}
        >
          <TwoColumnGrid>
            <FieldGroup label="Nome para impressão">
              <FieldInput name="printName" defaultValue={company?.printName || ""} />
            </FieldGroup>
            <FieldGroup label="Documento para impressão">
              <FieldInput name="printDocument" defaultValue={company?.printDocument || ""} />
            </FieldGroup>
            <FieldGroup label="Telefone impresso">
              <FieldInput name="printPhone" defaultValue={company?.printPhone || ""} />
            </FieldGroup>
          </TwoColumnGrid>
          <div className="mt-4 grid gap-4">
            <FieldGroup label="Endereço para impressão">
              <FieldTextarea name="printAddress" defaultValue={company?.printAddress || ""} />
            </FieldGroup>
            <FieldGroup label="Rodapé padrão">
              <FieldTextarea name="printFooter" defaultValue={company?.printFooter || ""} />
            </FieldGroup>
          </div>
        </ConfigSection>

        <ConfigSection
          title="Dados Operacionais"
          description="APOIO A ROTINAS DO DIA A DIA, COMUNICAÇÃO INTERNA E ORGANIZAÇÃO."
          actions={<PhoneCall className="h-5 w-5 text-blue-600" />}
        >
          <TwoColumnGrid>
            <FieldGroup label="E-mail operacional">
              <FieldInput name="operationalEmail" defaultValue={company?.operationalEmail || ""} />
            </FieldGroup>
            <FieldGroup label="Horário de funcionamento">
              <FieldInput name="operationalHours" defaultValue={company?.operationalHours || ""} />
            </FieldGroup>
          </TwoColumnGrid>
          <div className="mt-4">
            <FieldGroup label="Observações operacionais">
              <FieldTextarea name="operationalNotes" defaultValue={company?.operationalNotes || ""} />
            </FieldGroup>
          </div>
        </ConfigSection>

        <div className="flex justify-end">
          <Button className="rounded-2xl px-6">Salvar dados da empresa</Button>
        </div>
      </form>
    </ConfigShell>
  )
}
