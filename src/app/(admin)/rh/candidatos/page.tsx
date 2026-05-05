import { getCandidates } from "./actions"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Search, Eye, UserCircle, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClickableRow } from "@/components/ui/ClickableRow"
import { RHActionButton } from "../components/RHActionButton"

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const q = searchParams?.q || ""
  const candidates = await getCandidates(q)

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader 
        title="Banco de Talentos"
        subtitle="Gerencie currículos, tags de perfil e o relacionamento com potenciais colaboradores."
        icon={<UserCircle className="h-8 w-8 text-blue-500" />}
        actions={
          <div className="flex gap-4">
            <Link href="/rh/vagas">
              <Button variant="secondary" className="rounded-full shadow-sm bg-white border border-slate-100 hover:bg-slate-50 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] text-slate-600">
                Ver Vagas
              </Button>
            </Link>
            <RHActionButton type="candidato" />
          </div>
        }
      />

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] shadow-lahomes border border-slate-50">
        <form method="GET" className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors font-bold" />
            <Input 
              name="q"
              placeholder="Nome, cargo de interesse ou email..." 
              defaultValue={q}
              className="pl-12 rounded-full border-slate-100 focus-visible:ring-primary h-12 text-sm font-medium shadow-inner bg-slate-50/30"
            />
          </div>
          <Button type="submit" variant="secondary" className="rounded-full h-12 px-8 font-bold text-xs uppercase tracking-widest bg-slate-100/50 hover:bg-slate-100 transition-all">
            Pesquisar Banco
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-14 pl-8">Candidato / Interesse</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Contato</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Tags de Perfil</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Última Candidatura</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Status do Perfil</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => (
                <ClickableRow 
                  key={c.id} 
                  href={`/rh/candidatos/${c.id}`}
                  className="border-slate-50 h-20 group hover:bg-slate-50 transition-colors"
                >
                  <TableCell className="pl-8">
                    <div className="flex flex-col">
                      <span className="font-black text-primary tracking-tight text-sm font-outfit uppercase">
                        {c.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase truncate max-w-[200px]">
                        {c.positionOfInterest || "INTERESSE NÃO INFORMADO"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-slate-600 font-bold text-xs uppercase">{c.phone || c.whatsapp || "Sem Tel"}</span>
                      <span className="text-[10px] text-slate-400">{c.email || "Sem e-mail"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {c.tags.length === 0 ? (
                        <span className="text-[10px] text-slate-300 italic font-medium">Sem tags</span>
                      ) : (
                        c.tags.slice(0, 3).map(t => (
                          <Badge key={t.id} variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider px-2 py-0 border-none">
                            {t.name}
                          </Badge>
                        ))
                      )}
                      {c.tags.length > 3 && <span className="text-[10px] text-slate-400 font-bold block pt-1">+{c.tags.length - 3}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.applications.length > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-tight">
                          {c.applications[0].jobOpening.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {new Date(c.applications[0].applicationDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Apenas Banco</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${
                      c.status === 'NEW' ? 'bg-blue-50 text-blue-600' : 
                      c.status === 'TALENT_POOL' ? 'bg-indigo-50 text-indigo-600' :
                      c.status === 'HIRED' ? 'bg-emerald-50 text-emerald-600' :
                      c.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-500' :
                      'bg-slate-50 text-slate-600' // INTERVIEWING, REJECTED, etc
                    }`}>
                      {c.status === 'TALENT_POOL' ? 'Banco Salvo' : c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       {c.resumeUrl && (
                         <Button variant="ghost" size="icon" className="h-10 w-10 text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 shadow-sm rounded-xl" asChild>
                           <a href={c.resumeUrl} target="_blank" rel="noreferrer">
                             <Download className="h-4 w-4" />
                           </a>
                         </Button>
                       )}
                       <Link href={`/rh/candidatos/${c.id}`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-primary bg-slate-50 border border-slate-100 hover:bg-white shadow-sm">
                          <Eye className="h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </ClickableRow>
              ))}
              {candidates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-40 text-slate-400 font-bold uppercase tracking-widest text-xs border-none">
                    Nenhum talento encontrado no banco de dados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  )
}
