import { Building2, FileText, Landmark, MapPinned, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfigSection, ConfigShell } from "@/components/configuracoes/ConfigShell"
import { getCompanyData } from "@/lib/configuration-queries"
import EmpresaForm from "./EmpresaForm"

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
      <EmpresaForm company={company} />
    </ConfigShell>
  )
}
