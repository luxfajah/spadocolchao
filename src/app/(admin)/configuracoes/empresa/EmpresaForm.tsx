"use client"

import { Button } from "@/components/ui/button"
import { ConfigSection } from "@/components/configuracoes/ConfigShell"
import { FieldGroup, FieldInput, FieldTextarea, TwoColumnGrid } from "@/components/configuracoes/ConfigForm"
import { saveCompanyProfileAction } from "../actions"
import { Landmark, MapPinned, FileText, PhoneCall } from "lucide-react"
import { useState } from "react"

export default function EmpresaForm({ company }: { company: any }) {
  const [data, setData] = useState({
    legalName: company?.legalName || "",
    tradeName: company?.tradeName || "",
    cnpj: company?.cnpj || "",
    stateRegistration: company?.stateRegistration || "",
    municipalRegistration: company?.municipalRegistration || "",
    legalRepresentative: company?.legalRepresentative || "",
    zipCode: company?.zipCode || "",
    street: company?.street || "",
    number: company?.number || "",
    complement: company?.complement || "",
    neighborhood: company?.neighborhood || "",
    city: company?.city || "",
    state: company?.state || "",
    phone: company?.phone || "",
    whatsapp: company?.whatsapp || "",
    email: company?.email || "",
    website: company?.website || "",
    logoUrl: company?.logoUrl || "",
    printName: company?.printName || "",
    printDocument: company?.printDocument || "",
    printPhone: company?.printPhone || "",
    printAddress: company?.printAddress || "",
    printFooter: company?.printFooter || "",
    operationalEmail: company?.operationalEmail || "",
    operationalHours: company?.operationalHours || "",
    operationalNotes: company?.operationalNotes || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setData(p => ({ ...p, [name]: value }))
  }

  const handleCnpjChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setData(p => ({ ...p, cnpj: val }))
    const cleanDoc = val.replace(/\D/g, "")
    
    if (cleanDoc.length === 14) {
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDoc}`)
        if (res.ok) {
          const resData = await res.json()
          setData(p => ({
            ...p,
            legalName: resData.razao_social || p.legalName,
            tradeName: resData.nome_fantasia || p.tradeName,
            email: resData.email || p.email,
            phone: resData.ddd_telefone_1 ? `(${resData.ddd_telefone_1.substring(0,2)}) ${resData.ddd_telefone_1.substring(2)}` : p.phone,
            zipCode: resData.cep ? resData.cep.toString() : p.zipCode,
            street: resData.logradouro || p.street,
            number: resData.numero || p.number,
            complement: resData.complemento || p.complement,
            neighborhood: resData.bairro || p.neighborhood,
            city: resData.municipio || p.city,
            state: resData.uf || p.state
          }))
        }
      } catch (err) {
        console.error("Erro ao buscar CNPJ", err)
      }
    }
  }

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setData(p => ({ ...p, zipCode: val }))
    const cleanCep = val.replace(/\D/g, "")
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const viacepData = await res.json()
        if (!viacepData.erro) {
          setData(p => ({
            ...p,
            street: viacepData.logradouro || p.street,
            neighborhood: viacepData.bairro || p.neighborhood,
            city: viacepData.localidade || p.city,
            state: viacepData.uf || p.state,
          }))
          document.getElementById('empresaNumber')?.focus()
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err)
      }
    }
  }

  return (
    <form action={saveCompanyProfileAction} className="grid gap-6">
      <ConfigSection
        title="Identificação"
        description="DADOS JURÍDICOS, FISCAIS E DE RESPONSABILIDADE LEGAL."
        actions={<Landmark className="h-5 w-5 text-blue-600" />}
      >
        <TwoColumnGrid>
          <FieldGroup label="CNPJ">
            <FieldInput name="cnpj" value={data.cnpj} onChange={handleCnpjChange} />
          </FieldGroup>
          <FieldGroup label="Razão social">
            <FieldInput name="legalName" value={data.legalName} onChange={handleChange} required />
          </FieldGroup>
          <FieldGroup label="Nome fantasia">
            <FieldInput name="tradeName" value={data.tradeName} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Inscrição estadual">
            <FieldInput name="stateRegistration" value={data.stateRegistration} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Inscrição municipal">
            <FieldInput name="municipalRegistration" value={data.municipalRegistration} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Responsável legal">
            <FieldInput name="legalRepresentative" value={data.legalRepresentative} onChange={handleChange} />
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
            <FieldInput name="zipCode" value={data.zipCode} onChange={handleCepChange} />
          </FieldGroup>
          <FieldGroup label="Rua">
            <FieldInput name="street" value={data.street} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Número">
            <FieldInput id="empresaNumber" name="number" value={data.number} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Complemento">
            <FieldInput name="complement" value={data.complement} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Bairro">
            <FieldInput name="neighborhood" value={data.neighborhood} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Cidade">
            <FieldInput name="city" value={data.city} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Estado">
            <FieldInput name="state" value={data.state} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Telefone">
            <FieldInput name="phone" value={data.phone} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="WhatsApp">
            <FieldInput name="whatsapp" value={data.whatsapp} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="E-mail">
            <FieldInput name="email" type="email" value={data.email} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Site">
            <FieldInput name="website" value={data.website} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Logo (URL)">
            <FieldInput name="logoUrl" value={data.logoUrl} onChange={handleChange} />
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
            <FieldInput name="printName" value={data.printName} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Documento para impressão">
            <FieldInput name="printDocument" value={data.printDocument} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Telefone impresso">
            <FieldInput name="printPhone" value={data.printPhone} onChange={handleChange} />
          </FieldGroup>
        </TwoColumnGrid>
        <div className="mt-4 grid gap-4">
          <FieldGroup label="Endereço para impressão">
            <FieldTextarea name="printAddress" value={data.printAddress} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Rodapé padrão">
            <FieldTextarea name="printFooter" value={data.printFooter} onChange={handleChange} />
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
            <FieldInput name="operationalEmail" value={data.operationalEmail} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Horário de funcionamento">
            <FieldInput name="operationalHours" value={data.operationalHours} onChange={handleChange} />
          </FieldGroup>
        </TwoColumnGrid>
        <div className="mt-4">
          <FieldGroup label="Observações operacionais">
            <FieldTextarea name="operationalNotes" value={data.operationalNotes} onChange={handleChange} />
          </FieldGroup>
        </div>
      </ConfigSection>

      <div className="flex justify-end">
        <Button className="rounded-2xl px-6">Salvar dados da empresa</Button>
      </div>
    </form>
  )
}
