"use client"

import { useFormState, useFormStatus } from "react-dom"
import { login } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { MessageCircle, Lock, User, ChevronRight } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button 
      className="w-full h-12 text-base font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg active:scale-[0.98] bg-[#002242] hover:bg-[#003366] text-white group" 
      type="submit" 
      disabled={pending}
    >
      {pending ? "Entrando..." : "ENTRAR NO PORTAL"}
      {!pending && <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />}
    </Button>
  )
}

export function LoginForm() {
  // @ts-ignore
  const [state, formAction] = useFormState(login, null)

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#002242] via-[#001a33] to-[#001122] p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Lado Esquerdo - Formulário */}
        <div className="w-full md:w-[45%] p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-10 text-center">
            <div className="relative w-48 h-24 mx-auto mb-6">
              <Image 
                src="/logo.png" 
                alt="Spa do Colchão" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-sm font-bold tracking-widest text-[#002242] uppercase mb-1">Acesse o</h2>
            <h1 className="text-3xl font-black text-[#002242] tracking-tight">PORTAL DE GESTÃO</h1>
          </div>

          <form action={formAction} className="space-y-6">
            {state?.error && (
              <div className="p-4 text-sm rounded-xl bg-red-50 text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
                {state.error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 ml-1">
                  USUÁRIO
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-[#002242]" />
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    placeholder="Digite o seu usuário"
                    required
                    className="h-12 pl-12 bg-slate-50 border-transparent transition-all focus:bg-white focus:ring-2 focus:ring-[#002242]/20 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 ml-1">
                  SENHA
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-[#002242]" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Digite sua senha"
                    required
                    className="h-12 pl-12 bg-slate-50 border-transparent transition-all focus:bg-white focus:ring-2 focus:ring-[#002242]/20 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-1">
               <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#002242] focus:ring-[#002242]" />
                  <span className="text-slate-500 group-hover:text-slate-700 transition-colors">Manter Conectado</span>
               </label>
               <button type="button" className="text-[#002242] font-bold hover:underline">
                  Recuperar Senha
               </button>
            </div>

            <div className="pt-4">
              <SubmitButton />
            </div>
          </form>
        </div>

        {/* Lado Direito - Visual */}
        <div className="hidden md:flex relative w-full md:w-[55%] min-h-[500px] overflow-hidden">
          <Image 
            src="/login-visual.png" 
            alt="Spa do Colchão Visual" 
            fill 
            className="object-cover transition-transform duration-10000 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Suporte flutuante similar à referência */}
          <div className="absolute bottom-6 right-6">
            <button 
              className="flex items-center space-x-3 bg-[#25D366] hover:bg-[#20bd5b] text-white px-6 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95 group"
              onClick={() => {}} // Link do Whatsapp será adicionado depois
            >
              <div className="relative">
                <MessageCircle className="h-6 w-6 stroke-[2.5px]" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-[#25D366]"></span>
                </span>
              </div>
              <span className="font-bold tracking-tight text-sm">Central de Atendimento</span>
            </button>
          </div>
          
          {/* Círculo decorativo similar à referência */}
          <div className="absolute -top-20 -right-20 w-80 h-80 border-[32px] border-white/10 rounded-full" />
        </div>
      </div>
    </div>
  )
}
