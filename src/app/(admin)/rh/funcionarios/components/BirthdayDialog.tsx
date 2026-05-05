"use client"

import { useState, useTransition } from "react"
import { 
  Cake, 
  Calendar as CalendarIcon, 
  Check, 
  Gift, 
  Loader2, 
  User as UserIcon,
  X,
  AlertCircle
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { processBirthdayAction } from "../actions"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type EmployeeBirthday = {
  id: string
  fullName: string
  socialName: string | null
  birthDate: Date | null
  photoUrl: string | null
  initials: string
}

type BirthdayDialogProps = {
  employees: EmployeeBirthday[]
  trigger: React.ReactNode
}

export function BirthdayDialog({ employees, trigger }: BirthdayDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({})
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({})

  const handleAction = async (employeeId: string, actionType: "LEAVE" | "ACKNOWLEDGE") => {
    const date = selectedDates[employeeId]
    
    if (actionType === "LEAVE" && !date) {
      // Pequeno aviso visual se tentar dar folga sem data
      return
    }

    setLoadingIds(prev => ({ ...prev, [employeeId]: true }))
    
    startTransition(async () => {
      const result = await processBirthdayAction({
        employeeId,
        actionType,
        date
      })

      setLoadingIds(prev => ({ ...prev, [employeeId]: false }))

      if (result.success) {
        // Remove o funcionário da lista local após sucesso (ou deixa o server revalidar)
        // Como o page.tsx vai revalidar, o modal vai atualizar sozinho se fechado/aberto
        // Mas para feedback imediato:
      } else {
        alert(result.error || "Ocorreu um erro ao processar.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[2.5rem] p-8 border-slate-100 shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 shadow-inner">
               <Cake className="h-7 w-7" />
            </div>
            <div>
              <DialogTitle className="font-outfit font-black text-2xl uppercase tracking-tight text-slate-900">
                Aniversariantes do Mês
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                Homenageie sua equipe com ações rápidas de reconhecimento.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-8 space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {employees.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <Check className="h-10 w-10 text-emerald-500" />
               <p className="font-bold text-slate-600 uppercase tracking-widest text-[10px]">Todos os aniversariantes processados!</p>
            </div>
          ) : (
            employees.map((emp) => (
              <div key={emp.id} className="group relative flex flex-col gap-4 p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm transition-all hover:border-pink-200 hover:shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 rounded-2xl border-2 border-slate-50 shadow-sm">
                      <AvatarImage src={emp.photoUrl || ""} />
                      <AvatarFallback className="bg-slate-50 text-slate-400 font-black">{emp.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 uppercase tracking-tight font-outfit truncate max-w-[200px]">
                        {emp.socialName || emp.fullName}
                      </span>
                      <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Cake className="h-3 w-3" /> {emp.birthDate ? format(emp.birthDate, "dd 'de' MMMM", { locale: ptBR }) : "Data não definida"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                     <Button 
                      variant="ghost" 
                      size="sm"
                      disabled={loadingIds[emp.id]}
                      onClick={() => handleAction(emp.id, "ACKNOWLEDGE")}
                      className="h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 gap-2 border border-transparent hover:border-emerald-100"
                    >
                      {loadingIds[emp.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Marcar Visto
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-50">
                  <div className="relative flex-1 w-full">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input 
                      type="date" 
                      value={selectedDates[emp.id] || ""}
                      onChange={(e) => setSelectedDates(prev => ({ ...prev, [emp.id]: e.target.value }))}
                      className="h-10 pl-9 pr-4 rounded-xl border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest focus-visible:ring-pink-500"
                    />
                  </div>
                  <Button 
                    variant="default" 
                    size="sm"
                    disabled={!selectedDates[emp.id] || loadingIds[emp.id]}
                    onClick={() => handleAction(emp.id, "LEAVE")}
                    className="h-10 w-full sm:w-auto px-5 rounded-xl bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest hover:bg-black gap-2 shadow-lg shadow-slate-200 disabled:opacity-50"
                  >
                    {loadingIds[emp.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gift className="h-3.5 w-3.5" />}
                    Dar Folga Prêmio
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="mt-8 sm:justify-start">
           <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 w-full">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-[10px] font-bold text-amber-700 leading-tight uppercase tracking-wider">
                Ao selecionar "Folga Prêmio", o sistema criará automaticamente um abono de ponto para o colaborador na data selecionada.
              </p>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
