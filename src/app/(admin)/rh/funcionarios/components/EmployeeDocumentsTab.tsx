"use client"

import { useState } from "react"
import { FileText, Download, Upload, FolderOpen, Archive } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddDocumentModal } from "./AddDocumentModal"
import JSZip from "jszip"
import { saveAs } from "file-saver"

interface Props {
  employeeId: string
  employeeName: string
  documents: any[]
}

const TYPE_LABELS: Record<string, string> = {
  RG: "RG / Identidade",
  CPF: "CPF",
  CNH: "CNH / Motorista",
  CONTRACT: "Contatos de Trabalho",
  ADDENDUM: "Aditivos",
  RESIDENCE: "Comp. Residência",
  EDUCATION: "Escolaridade",
  HEALTH: "Saúde",
  PAYROLL: "Holerites",
  ATTENDANCE_MIRROR: "Espelhos de Ponto Aprovados",
  OTHER: "Documentos Gerais",
}

export function EmployeeDocumentsTab({ employeeId, employeeName, documents }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [isZipping, setIsZipping] = useState<string | null>(null)

  // Group documents by type
  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = []
    acc[doc.type].push(doc)
    return acc
  }, {} as Record<string, any[]>)

  async function downloadAsZip(type: string, docs: any[]) {
    setIsZipping(type)
    try {
      const zip = new JSZip()
      const folder = zip.folder(TYPE_LABELS[type] || type)
      
      const downloadPromises = docs.map(async (doc) => {
        try {
          // Em um ambiente real, faríamos fetch da fileUrl
          // Como é demo, vamos simular criando um arquivo dummy com o nome correto
          // Se fosse produção real: const response = await fetch(doc.fileUrl); const blob = await response.blob();
          const dummyContent = `Conteúdo simulado do arquivo: ${doc.name}\nID: ${doc.id}`
          folder?.file(`${doc.name}.pdf`, dummyContent)
        } catch (e) {
          console.error(`Erro ao baixar ${doc.name}:`, e)
        }
      })

      await Promise.all(downloadPromises)
      
      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, `${employeeName}_${type}_Documentos.zip`)
    } catch (error) {
      console.error("Erro ao gerar ZIP:", error)
    } finally {
      setIsZipping(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-black text-slate-800 font-outfit uppercase">Central de Documentos</CardTitle>
              <CardDescription className="font-medium">Gestão organizada e download em lote por categoria.</CardDescription>
            </div>
            <Button 
              onClick={() => setModalOpen(true)}
              className="rounded-xl h-12 px-6 bg-white border border-slate-200 text-primary hover:bg-slate-50 shadow-sm gap-2 font-black text-xs uppercase tracking-widest"
            >
              <Upload className="h-4 w-4" /> Fazer Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <div className="text-center py-24 px-6 text-slate-400">
              <div className="h-20 w-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <FolderOpen className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-black uppercase tracking-widest text-xs">Nenhum documento arquivado.</p>
              <p className="text-[10px] mt-2 font-bold uppercase tracking-widest opacity-50">Clique em upload para começar a organizar a pasta.</p>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Object.entries(groupedDocs) as [string, any[]][]).map(([type, docs]) => (
                <div key={type} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 bg-slate-50/80 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                        <Archive className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                        {TYPE_LABELS[type] || type}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-white border-none text-[9px] px-2 py-0.5 rounded-full font-black text-slate-400">
                      {docs.length}
                    </Badge>
                  </div>
                  
                  <div className="p-4 flex-1 space-y-3">
                    {docs.slice(0, 3).map((doc: any) => (
                      <div key={doc.id} className="flex items-center gap-3">
                        <FileText className="h-3.5 w-3.5 text-slate-300" />
                        <span className="text-xs font-bold text-slate-600 truncate flex-1">{doc.name}</span>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                          Ver
                        </a>
                      </div>
                    ))}
                    {docs.length > 3 && (
                      <p className="text-[9px] text-slate-400 font-bold italic pl-6">+ {docs.length - 3} outros arquivos...</p>
                    )}
                  </div>

                  <div className="p-4 pt-0">
                    <Button 
                      onClick={() => downloadAsZip(type, docs)}
                      disabled={isZipping === type}
                      variant="outline"
                      className="w-full rounded-xl h-10 border-slate-100 hover:bg-primary hover:text-white hover:border-primary transition-all font-black text-[10px] uppercase tracking-widest gap-2"
                    >
                      {isZipping === type ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Baixar Todos (.ZIP)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddDocumentModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        employeeId={employeeId} 
      />
    </div>
  )
}

function Badge({ children, className, variant = "default" }: any) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
}

function Loader2({ className }: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-loader-2 ${className}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
}
