"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createSupplier } from "../actions"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"

export default function NewSupplierPage() {
  const [data, setData] = useState({
    personType: "JURIDICA",
    document: "",
    legalName: "",
    tradeName: "",
    stateRegistration: "",
    contactPerson: "",
    email: "",
    phone: "",
    whatsapp: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    notes: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(p => ({ ...p, [name]: value }));
  }

  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setData(p => ({ ...p, document: val }));
    const cleanDoc = val.replace(/\D/g, "");
    
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
    const val = e.target.value;
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
          document.getElementById('number')?.focus()
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err)
      }
    }
  }

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <div className="flex items-center gap-4">
        <Link href="/estoque-produtos/suprimentos?tab=fornecedores">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Novo Fornecedor</h2>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <form action={createSupplier} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b border-border pb-2">Dados da Empresa</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="personType">Tipo de Pessoa</Label>
                  <select id="personType" name="personType" value={data.personType} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground">
                    <option value="JURIDICA">Pessoa Jurídica (CNPJ)</option>
                    <option value="FISICA">Pessoa Física (CPF)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">CNPJ / CPF</Label>
                  <Input id="document" name="document" value={data.document} onChange={handleDocumentChange} placeholder="00.000.000/0000-00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Razão Social / Nome <span className="text-red-500">*</span></Label>
                <Input id="legalName" name="legalName" value={data.legalName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradeName">Nome Fantasia</Label>
                <Input id="tradeName" name="tradeName" value={data.tradeName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateRegistration">Inscrição Estadual (IE)</Label>
                <Input id="stateRegistration" name="stateRegistration" value={data.stateRegistration} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b border-border pb-2">Contato</h3>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Pessoa de Contato</Label>
                <Input id="contactPerson" name="contactPerson" value={data.contactPerson} onChange={handleChange} placeholder="Ex: João Silva" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" value={data.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" name="phone" value={data.phone} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" value={data.whatsapp} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="font-semibold text-lg border-b border-border pb-2">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="zipCode">CEP</Label>
                <Input id="zipCode" name="zipCode" value={data.zipCode} onChange={handleCepChange} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street">Rua / Logradouro</Label>
                <Input id="street" name="street" value={data.street} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input id="number" name="number" value={data.number} onChange={handleChange} />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" name="complement" value={data.complement} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" name="neighborhood" value={data.neighborhood} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" name="city" value={data.city} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado (UF)</Label>
                <Input id="state" name="state" value={data.state} onChange={handleChange} placeholder="SP" maxLength={2} className="uppercase" />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-border">
            <Label htmlFor="notes">Observações</Label>
            <textarea
              id="notes"
              name="notes"
              value={data.notes}
              onChange={handleChange}
              rows={3}
              className="flex w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground hover:bg-muted/10"
              placeholder="Informações adicionais sobre o fornecedor..."
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-6">
            <Link href="/estoque-produtos/suprimentos?tab=fornecedores">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="mr-2 h-4 w-4" /> Salvar Fornecedor
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
