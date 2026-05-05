"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createCliente, updateCliente } from "../actions"
import { Input } from "@/components/ui/input"
import { MaskedInput } from "@/components/ui/MaskedInput"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { User, Phone, MapPin, Briefcase, FileText, Send, Zap, ShieldCheck } from "lucide-react"
import { cleanNumericValues } from "@/lib/utils"

interface ClientFormProps {
  sellers: any[]
  leadSources: any[]
  initialData?: any // For editing
}

export function ClientForm({ sellers, leadSources, initialData }: ClientFormProps) {
  const isEditing = !!initialData
  const [isFullMode, setIsFullMode] = useState(isEditing || false)
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Derived address data if editing
  const mainAddress = initialData?.addresses?.find((a: any) => a.isMain) || initialData?.addresses?.[0]

  const sanitizeFormData = (incoming: FormData) => {
    const sanitized = new FormData()

    incoming.forEach((value, key) => {
      sanitized.append(key, value as string)
    })

    const setNumeric = (key: string) => {
      const current = sanitized.get(key) as string | null
      if (current !== null) sanitized.set(key, cleanNumericValues(current))
    }

    setNumeric("document")
    setNumeric("phone")
    setNumeric("whatsapp")
    setNumeric("zipCode")

    const rg = sanitized.get("rg") as string | null
    if (rg !== null) {
      sanitized.set("rg", rg.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
    }

    return sanitized
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const cleaned = sanitizeFormData(formData)
      if (isEditing) {
        await updateCliente(initialData.id, cleaned)
      } else {
        await createCliente(cleaned)
      }
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8 pb-32">
      {/* Toggle Header (Only show if not editing or if you want to allow switching in edit too) */}
      {!isEditing && (
        <div className="flex items-center justify-between bg-[#002242] text-white p-6 rounded-2xl shadow-lg mb-8 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              {isFullMode ? <FileText className="h-6 w-6" /> : <Zap className="h-6 w-6 text-yellow-400" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">{isFullMode ? "Cadastro Completo (CRM)" : "Cadastro Rápido (PDV)"}</h2>
              <p className="text-white/70 text-sm">
                {isFullMode ? "Todos os campos disponíveis para gestão profunda" : "Campos essenciais para venda imediata"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-full px-4 border border-white/10">
            <Label htmlFor="mode-switch" className="cursor-pointer font-medium">Modo Completo</Label>
            <Switch 
              id="mode-switch" 
              checked={isFullMode} 
              onCheckedChange={setIsFullMode} 
            />
          </div>
        </div>
      )}

      {/* Grid Layout for Full Mode or Single Column for Quick */}
      <div className={isFullMode ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "max-w-3xl mx-auto space-y-6"}>
        
        {/* Bloco 1: Identificação */}
        <Card className="border-border/50 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Identificação</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Pessoa</Label>
                <Select name="personType" defaultValue={initialData?.personType || "INDIVIDUAL"}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Pessoa Física</SelectItem>
                    <SelectItem value="COMPANY">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CPF / CNPJ</Label>
                <MaskedInput 
                  name="document" 
                  defaultValue={initialData?.document || ""} 
                  placeholder="000.000.000-00" 
                  maskType="cpf-cnpj"
                  className="bg-white" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome Completo / Razão Social</Label>
              <Input name="fullName" defaultValue={initialData?.fullName || ""} required placeholder="Nome do cliente" className="bg-white border-primary/20 font-bold" />
            </div>

            {isFullMode && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Fantasia</Label>
                    <Input name="tradeName" defaultValue={initialData?.tradeName || ""} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>RG</Label>
                    <MaskedInput 
                      name="rg" 
                      defaultValue={initialData?.rg || ""} 
                      maskType="rg"
                      className="bg-white" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <Input name="birthDate" type="date" defaultValue={initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : ""} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Gênero</Label>
                    <Select name="gender" defaultValue={initialData?.gender || ""}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MASC">Masculino</SelectItem>
                        <SelectItem value="FEM">Feminino</SelectItem>
                        <SelectItem value="OTHER">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bloco 2: Contato */}
        <Card className="border-border/50 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Contato</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone Principal</Label>
                <MaskedInput 
                  name="phone" 
                  defaultValue={initialData?.phone || ""} 
                  placeholder="(00) 0000-0000" 
                  maskType="phone"
                  className="bg-white" 
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <MaskedInput 
                  name="whatsapp" 
                  defaultValue={initialData?.whatsapp || ""} 
                  placeholder="(00) 90000-0000" 
                  maskType="phone"
                  className="bg-white" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail Principal</Label>
              <Input name="email" type="email" defaultValue={initialData?.email || ""} placeholder="email@exemplo.com" className="bg-white" />
            </div>
            {isFullMode && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input name="instagram" defaultValue={initialData?.instagram || ""} placeholder="@usuario" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Contato Responsável</Label>
                  <Input name="contactPerson" defaultValue={initialData?.contactPerson || ""} className="bg-white" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bloco 3: Endereço */}
        <Card className={isFullMode ? "lg:col-span-2 border-border/50 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm" : "border-border/50 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm"}>
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Endereço Principal</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>CEP</Label>
                <MaskedInput 
                  name="zipCode" 
                  defaultValue={mainAddress?.zipCode || ""} 
                  placeholder="00000-000" 
                  maskType="cep"
                  className="bg-white" 
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Rua / Logradouro</Label>
                <Input name="street" defaultValue={mainAddress?.street || ""} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input name="number" defaultValue={mainAddress?.number || ""} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input name="neighborhood" defaultValue={mainAddress?.neighborhood || ""} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input name="city" defaultValue={mainAddress?.city || ""} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input name="state" defaultValue={mainAddress?.state || ""} placeholder="UF" className="bg-white" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Complemento</Label>
                <Input name="complement" defaultValue={mainAddress?.complement || ""} className="bg-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isFullMode && (
          <>
            {/* Bloco 5: Dados de Vendas */}
            <Card className="border-border/50 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Dados de Vendas</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vendedor Responsável</Label>
                    <Select name="sellerId" defaultValue={initialData?.sellerId || ""}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {sellers.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.jobTitleName ? `${s.name} • ${s.jobTitleName}` : s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Origem Principal</Label>
                    <Select name="leadSourceId" defaultValue={initialData?.leadSourceId || ""}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {leadSources.map(ls => <SelectItem key={ls.id} value={ls.id}>{ls.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Limite de Crédito</Label>
                    <Input name="creditLimit" type="number" defaultValue={initialData?.creditLimit || 0} step="0.01" className="bg-white font-bold text-green-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select name="priority" defaultValue={initialData?.priority || "NORMAL"}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Baixa</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">Alta</SelectItem>
                        <SelectItem value="CRITICAL">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloco 6: Dados Complementares */}
            <Card className="border-border/50 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Dados Complementares</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Mãe</Label>
                    <Input name="motherName" defaultValue={initialData?.motherName || ""} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do Pai</Label>
                    <Input name="fatherName" defaultValue={initialData?.fatherName || ""} className="bg-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-mail para Nota Fiscal</Label>
                  <Input name="invoiceEmail" defaultValue={initialData?.invoiceEmail || ""} className="bg-white" />
                </div>
              </CardContent>
            </Card>

            {/* Bloco 7: Observações */}
            <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Observações e Outros</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea name="notes" placeholder="Informações adicionais relevantes sobre o cliente..." defaultValue={initialData?.notes || ""} className="min-h-[120px] bg-white" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="flex justify-end items-center gap-4 fixed bottom-0 right-0 p-6 bg-background/80 backdrop-blur-lg border-t border-border z-10 w-full lg:w-[calc(100%-16rem)] shadow-2xl">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={() => router.back()}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground"
        >
          {isEditing ? "Cancelar Edição" : "Descartar Alterações"}
        </Button>
        <Button 
          type="submit" 
          size="lg" 
          className="bg-[#002242] hover:bg-[#003366] px-10 py-6 text-lg rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          disabled={loading}
        >
          {loading ? "Gravando Dados..." : (
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {isEditing ? "Salvar Alterações" : "Finalizar Cadastro"}
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}
