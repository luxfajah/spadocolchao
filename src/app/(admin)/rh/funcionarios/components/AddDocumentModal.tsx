"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileText, Upload, Loader2 } from "lucide-react"
import { addEmployeeDocument } from "../[id]/actions"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  type: z.string().min(1, "Selecione o tipo de documento"),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  file: z.any().refine((files) => files?.length > 0, "Selecione um arquivo"),
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
}

const DOCUMENT_TYPES = [
  { value: "RG", label: "RG / Identidade" },
  { value: "CPF", label: "CPF" },
  { value: "CNH", label: "CNH / Motorista" },
  { value: "CONTRACT", label: "Contrato de Trabalho" },
  { value: "ADDENDUM", label: "Aditivo Contratual" },
  { value: "RESIDENCE", label: "Comprovante de Residência" },
  { value: "EDUCATION", label: "Certificado Escolar / Diploma" },
  { value: "HEALTH", label: "Atestado / Exame Médico" },
  { value: "PAYROLL", label: "Holerite / Contracheque" },
  { value: "ATTENDANCE_MIRROR", label: "Espelho de Ponto Aprovado" },
  { value: "OTHER", label: "Outros Documentos" },
]

export function AddDocumentModal({ open, onOpenChange, employeeId }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      name: "",
      description: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsUploading(true)
    try {
      // Simulação de upload (em produção integraria com S3/Uploadthing)
      const file = values.file[0]
      const fileUrl = `/uploads/${employeeId}/${Date.now()}_${file.name}`

      await addEmployeeDocument(employeeId, {
        type: values.type,
        name: values.name,
        description: values.description,
        fileUrl: fileUrl,
      })

      toast({
        title: "Documento adicionado!",
        description: "O arquivo foi vinculado ao colaborador com sucesso.",
      })
      
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível salvar o documento.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
        <DialogHeader>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Upload className="h-6 w-6 text-blue-500" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-800 font-outfit uppercase">Subir Documento</DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Selecione o arquivo e categorize-o para organizar a pasta do colaborador.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Documento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl h-12 border-slate-100 bg-slate-50/50">
                        <SelectValue placeholder="Selecione uma categoria..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      {DOCUMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value} className="rounded-lg">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título / Nome do Arquivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: RG Frente e Verso" className="rounded-xl h-12 border-slate-100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Arquivo</FormLabel>
              <FormControl>
                <div className="relative group">
                  <Input 
                    type="file" 
                    className="cursor-pointer opacity-0 absolute inset-0 z-10" 
                    {...form.register("file")}
                  />
                  <div className="h-32 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center gap-2 group-hover:border-blue-400 group-hover:bg-blue-50/30 transition-all">
                    <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                       <Upload className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600">
                      {form.watch("file")?.[0]?.name || "Clique ou arraste um arquivo"}
                    </span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>

            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={isUploading}
                className="w-full rounded-2xl h-12 font-black text-xs uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Salvar Documento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
