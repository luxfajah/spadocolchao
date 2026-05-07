"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, FileClock, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApprovedMirrorPdfButton } from "../../ponto/components/ApprovedMirrorPdfButton"
import {
  dedupeAttendanceMirrorsByPeriod,
  formatAttendancePeriodLabel,
} from "@/lib/attendance/period"

interface Mirror {
  id: string
  period: string
  startDate: Date | string
  endDate: Date | string
  expectedMinutes: number
  workedMinutes: number
  overtimeMinutes: number
  deficitMinutes: number
  status: string
  createdAt: Date | string
}

export function EmployeeAttendanceMirrors({ mirrors }: { mirrors: Mirror[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const uniqueMirrors = dedupeAttendanceMirrorsByPeriod(mirrors)

  const filteredMirrors = uniqueMirrors.filter((mirror) => {
    const query = searchTerm.toLowerCase()

    return (
      mirror.period.toLowerCase().includes(query) ||
      formatAttendancePeriodLabel(mirror.period, mirror.startDate).toLowerCase().includes(query)
    )
  })

  const formatHours = (minutes: number) => {
    const hours = Math.floor(Math.abs(minutes) / 60)
    const remainingMinutes = Math.abs(minutes) % 60
    return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-black text-slate-800 font-outfit uppercase tracking-tight">
            Filtrar Competência
          </h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Busque por mês ou ano específico
          </p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors font-bold" />
          <Input
            placeholder="Ex: 03/2026..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 rounded-2xl border-slate-100 focus-visible:ring-primary h-12 text-sm font-bold shadow-inner bg-slate-50/50"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100">
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-12 pl-6">
                Competência / Período
              </TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">
                Esperado
              </TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">
                Trabalhado
              </TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center text-emerald-600">
                Extras
              </TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center text-rose-500">
                Débito
              </TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">
                Status
              </TableHead>
              <TableHead className="text-right pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMirrors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FileClock className="w-12 h-12 opacity-20 mb-3" />
                    <p className="font-bold uppercase tracking-widest text-xs">
                      Nenhum espelho encontrado.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMirrors.map((mirror) => (
                <TableRow
                  key={mirror.id}
                  className="border-slate-50 hover:bg-slate-50/50 transition-colors h-16"
                >
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                        <span className="font-black text-primary uppercase text-sm">
                        {formatAttendancePeriodLabel(mirror.period, mirror.startDate)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold tracking-tighter">
                        {new Date(mirror.startDate).toLocaleDateString("pt-BR")} -{" "}
                        {new Date(mirror.endDate).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-slate-600 text-xs">
                    {formatHours(mirror.expectedMinutes)}
                  </TableCell>
                  <TableCell className="text-center font-bold text-slate-700 text-xs">
                    {formatHours(mirror.workedMinutes)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`text-xs font-black ${
                        mirror.overtimeMinutes > 0 ? "text-emerald-600" : "text-slate-300"
                      }`}
                    >
                      {mirror.overtimeMinutes > 0 ? `+${formatHours(mirror.overtimeMinutes)}` : "---"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`text-xs font-black ${
                        mirror.deficitMinutes > 0 ? "text-rose-500" : "text-slate-300"
                      }`}
                    >
                      {mirror.deficitMinutes > 0 ? `-${formatHours(mirror.deficitMinutes)}` : "---"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={`border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        mirror.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-600"
                          : mirror.status === "ADJUSTED"
                            ? "bg-indigo-50 text-indigo-600"
                            : mirror.status === "EDITING"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {mirror.status === "APPROVED"
                        ? "Fechado"
                        : mirror.status === "ADJUSTED"
                          ? "Tratado"
                          : mirror.status === "EDITING"
                            ? "Em Edição"
                            : "Gerado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <ApprovedMirrorPdfButton
                        mirrorId={mirror.id}
                        label="PDF"
                        className="h-9 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 text-white shadow-sm font-black text-[9px] uppercase tracking-widest gap-2"
                      />
                      <Link href={`/rh/ponto/espelho/${mirror.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-primary bg-slate-50 border border-slate-100 hover:bg-white shadow-sm transition-all hover:scale-105 active:scale-95"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
