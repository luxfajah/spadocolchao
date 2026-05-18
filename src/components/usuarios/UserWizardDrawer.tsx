"use client"

import { useState, useEffect } from "react"
import { 
  User, 
  Mail, 
  Phone, 
  AtSign, 
  Briefcase, 
  Building2, 
  Shield, 
  Key, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  PlusCircle,
  HelpCircle,
  MessageSquare,
  Lock,
  Info,
  Camera,
  Upload
} from "lucide-react"
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Role {
  id: string
  name: string
  description: string | null
}

interface Employee {
  id: string
  fullName: string
}

interface UserWizardDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  roles: Role[]
  employees: Employee[]
  initialData?: any
  onAddPermissions?: () => void
}

const STEPS = [
  { id: "identity", label: "Identidade", icon: <User className="h-4 w-4" /> },
  { id: "career", label: "Atuação", icon: <Briefcase className="h-4 w-4" /> },
  { id: "access", label: "Acesso e Segurança", icon: <Lock className="h-4 w-4" /> },
  { id: "review", label: "Revisão", icon: <CheckCircle2 className="h-4 w-4" /> },
]

export function UserWizardDrawer({ 
  isOpen, 
  onClose, 
  onSave, 
  roles, 
  employees,
  initialData,
  onAddPermissions
}: UserWizardDrawerProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState(initialData || {
    name: "",
    socialName: "",
    email: "",
    phone: "",
    username: "",
    jobTitle: "",
    department: "",
    employeeId: "",
    primaryRoleId: "",
    initialPassword: "",
    status: "PENDING_ACTIVATION",
    avatarPreview: initialData?.avatarUrl || null,
  })

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData(initialData || {
        name: "",
        socialName: "",
        email: "",
        phone: "",
        username: "",
        jobTitle: "",
        department: "",
        employeeId: "",
        primaryRoleId: "",
        initialPassword: "",
        status: "PENDING_ACTIVATION",
        avatarPreview: null,
      });
    }
  }, [isOpen, initialData]);

  const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length))
  const handleBack = () => setStep(s => Math.max(s - 1, 1))

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const isStepValid = () => {
    if (step === 1) return formData.name && (formData.email || formData.username)
    if (step === 2) return true // Fields are optional
    if (step === 3) return formData.primaryRoleId && (initialData || formData.initialPassword)
    return true
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent className="h-full w-full max-w-xl ml-auto rounded-l-[3rem] border-l border-slate-200 bg-white p-0 flex flex-col overflow-hidden shadow-2xl">
        <DrawerHeader className="p-10 pb-6 bg-slate-50/50 border-b border-slate-100 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                <User className="h-7 w-7" />
              </div>
              <div>
                <DrawerTitle className="text-3xl font-black font-heading italic uppercase tracking-tighter text-slate-900 leading-none mb-1">
                  {initialData ? "Editar Usuário" : "Novo Usuário"}
                </DrawerTitle>
                <DrawerDescription className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 opacity-70 leading-none">
                  Fluxo guiado de configuração de acesso.
                </DrawerDescription>
              </div>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-white shadow-sm border border-transparent hover:border-slate-100 transition-all">
                <X className="h-6 w-6 text-slate-400" />
              </Button>
            </DrawerClose>
          </div>

          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex flex-1 items-center gap-2">
                <div className={cn(
                  "flex-1 h-1.5 rounded-full transition-all duration-500",
                  step > idx + 1 ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]" : 
                  step === idx + 1 ? "bg-slate-900" : "bg-slate-200"
                )} />
              </div>
            ))}
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-6 pb-2">
                <div className="relative flex-shrink-0">
                  <div className="h-24 w-24 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center">
                    {formData.avatarPreview ? (
                      <img src={formData.avatarPreview} alt="Foto" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <button type="button" onClick={() => document.getElementById("user-avatar-upload")?.click()}
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90">
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                  <input id="user-avatar-upload" type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updateField("avatar", file);
                        updateField("avatarPreview", URL.createObjectURL(file));
                      }
                    }} />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 uppercase tracking-tight text-lg font-outfit">Foto de Perfil</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Adicione uma foto para o usuário</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Identidade do Colaborador</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Nome Completo" 
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="pl-12 py-7 rounded-2xl border-slate-200 bg-slate-50/50 shadow-none focus:bg-white ring-offset-0 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Nome Social / Apelido</Label>
                  <Input 
                    placeholder="Ex: Joãozinho" 
                    value={formData.socialName}
                    onChange={(e) => updateField("socialName", e.target.value)}
                    className="py-7 rounded-2xl border-slate-200 bg-slate-50/50 shadow-none focus:bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Username (Login)</Label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input 
                      placeholder="usuario.login" 
                      value={formData.username}
                      onChange={(e) => updateField("username", e.target.value)}
                      className="pl-10 py-7 rounded-2xl border-slate-200 bg-slate-50/50 shadow-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">E-mail Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="email"
                    placeholder="email@spadocolchao.com.br" 
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="pl-12 py-7 rounded-2xl border-slate-200 bg-slate-50/50 shadow-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Celular / WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="(00) 00000-0000" 
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="pl-12 py-7 rounded-2xl border-slate-200 bg-slate-50/50 shadow-none focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-6 rounded-[2rem] border border-blue-100 bg-blue-50/50 flex items-start gap-4">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <p className="text-xs font-semibold text-blue-700 leading-relaxed">
                  Vincular o usuário a um funcionário do RH permite automatizar o registro de ponto e auditorias de produção.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 font-heading">Funcionário Vinculado (RH)</Label>
                <Select value={formData.employeeId} onValueChange={(v) => updateField("employeeId", v)}>
                  <SelectTrigger className="h-[72px] rounded-2xl border-slate-200 bg-white shadow-sm ring-offset-0 focus:ring-2 focus:ring-primary/10">
                    <SelectValue placeholder="Selecione um colaborador da lista do RH" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                    <SelectItem value="none" className="rounded-xl p-3">Não vincular agora</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id} className="rounded-xl p-3">{emp.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Setor / Departamento</Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Ex: Comercial" 
                      value={formData.department}
                      onChange={(e) => updateField("department", e.target.value)}
                      className="pl-12 py-7 rounded-2xl border-slate-200 bg-slate-50/50 shadow-none focus:bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Cargo Nominal</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Ex: Supervisor" 
                      value={formData.jobTitle}
                      onChange={(e) => updateField("jobTitle", e.target.value)}
                      className="pl-12 py-7 rounded-2xl border-slate-200 bg-slate-50/50 shadow-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Perfil de Acesso Principal</Label>
                <Select value={formData.primaryRoleId} onValueChange={(v) => updateField("primaryRoleId", v)}>
                  <SelectTrigger className="h-[100px] rounded-[2.5rem] border-primary/20 bg-primary/5 shadow-sm text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <SelectValue placeholder="Escolha um molde de permissões" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mt-1 leading-none">Clique para ver as opções</p>
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-[2.5rem] border-slate-100 shadow-2xl p-4 w-[400px]">
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id} className="rounded-2xl p-4 mb-2 border border-transparent focus:border-primary/20 focus:bg-primary/5 transition-all">
                        <div className="space-y-1">
                          <p className="font-black uppercase tracking-tight text-slate-900">{role.name}</p>
                          <p className="text-xs text-slate-500 leading-snug line-clamp-1">{role.description || "Sem descrição disponível."}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Senha Temporária</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="password"
                    placeholder={initialData ? "•••••••• (Vazio para manter)" : "Digite a senha de primeiro acesso"} 
                    value={formData.initialPassword}
                    onChange={(e) => updateField("initialPassword", e.target.value)}
                    className="pl-12 py-7 rounded-2xl border-slate-200 bg-slate-50/50 shadow-none focus:bg-white"
                  />
                </div>
                {!initialData && (
                  <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 mt-2 italic">
                    O colaborador será obrigado a trocar esta senha no primeiro login por motivos de segurança.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Status Inicial da Conta</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: "ACTIVE", label: "Liberado", desc: "Acesso Imediato", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                    { val: "PENDING_ACTIVATION", label: "Pendente", desc: "Aguardando", color: "border-amber-200 bg-amber-50 text-amber-700" },
                  ].map((status) => (
                    <button
                      key={status.val}
                      onClick={() => updateField("status", status.val)}
                      className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all",
                        formData.status === status.val ? status.color : "border-slate-100 bg-slate-50 text-slate-400 opacity-60"
                      )}
                    >
                      <p className="font-black uppercase tracking-widest text-[11px] mb-1">{status.label}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest leading-none opacity-70">{status.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex flex-col items-center justify-center p-10 bg-slate-900 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                
                <div className="w-20 h-20 rounded-[1.75rem] bg-white text-slate-900 flex items-center justify-center text-3xl font-black mb-6 shadow-2xl">
                  {formData.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-2xl font-black font-heading italic uppercase tracking-tighter text-center leading-none mb-2">
                  {formData.name}
                </h3>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 mb-8 italic">
                  Pronto para ativar no sistema
                </p>

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Username</span>
                    <span className="text-xs font-bold font-mono">{formData.username || "@" + formData.name.toLowerCase().split(" ")[0]}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Perfil de Acesso</span>
                    <span className="text-xs font-bold uppercase tracking-widest italic text-primary">
                      {roles.find(r => r.id === formData.primaryRoleId)?.name || "Não definido"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <Button 
                  onClick={onAddPermissions}
                  className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 gap-3 group"
                >
                  <PlusCircle className="h-5 w-5 text-primary" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Adicionar Funções Extras</span>
                  <HelpCircle className="ml-auto h-4 w-4 text-slate-300" />
                </Button>
                <Button className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 gap-3">
                  <MessageSquare className="h-5 w-5 text-emerald-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Notificar via WhatsApp</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="p-10 bg-slate-50/50 border-t border-slate-100 flex-row gap-4 sm:justify-between items-center">
          {step > 1 ? (
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="rounded-2xl border-slate-200 h-14 px-8 text-[11px] font-black uppercase tracking-widest gap-2 shadow-sm transition-all hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
          ) : (
            <DrawerClose asChild>
              <Button 
                variant="outline" 
                className="rounded-2xl border-slate-200 h-14 px-8 text-[11px] font-black uppercase tracking-widest shadow-sm transition-all hover:bg-white"
              >
                Cancelar
              </Button>
            </DrawerClose>
          )}

          {step < STEPS.length ? (
            <Button 
              onClick={handleNext}
              disabled={!isStepValid()}
              className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white h-14 px-10 text-[11px] font-black uppercase tracking-widest italic gap-3 shadow-lg transition-all disabled:opacity-30 flex-1 sm:flex-none"
            >
              Próximo Passo
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={() => onSave(formData)}
              className="rounded-2xl bg-primary hover:bg-primary/90 text-white h-14 px-12 text-[11px] font-black uppercase tracking-widest italic gap-3 shadow-lg shadow-primary/20 transition-all flex-1 sm:flex-none"
            >
              Finalizar e Salvar
              <CheckCircle2 className="h-5 w-5" />
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
