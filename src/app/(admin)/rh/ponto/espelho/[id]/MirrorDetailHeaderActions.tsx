"use client"

import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenerateEmployeePayrollButton } from "@/app/(admin)/rh/components/GenerateEmployeePayrollButton"

import { ApprovedMirrorPdfButton } from "../../components/ApprovedMirrorPdfButton"

type MirrorDetailHeaderActionsProps = {
  mirrorId: string
  employeeId: string
  period: string
  canGeneratePayroll?: boolean
  autoOpenPdf?: boolean
}

export function MirrorDetailHeaderActions({
  mirrorId,
  employeeId,
  period,
  canGeneratePayroll = true,
  autoOpenPdf = false,
}: MirrorDetailHeaderActionsProps) {
  return (
    <div id="mirror-actions" className="flex gap-3">
      <ApprovedMirrorPdfButton
        mirrorId={mirrorId}
        autoOpen={autoOpenPdf}
        label="Imprimir"
        icon={<Printer className="h-4 w-4" />}
        variant="secondary"
        className="rounded-full gap-2 bg-white border border-slate-100 hover:bg-slate-50 shadow-sm transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] text-slate-600"
      />

      <ApprovedMirrorPdfButton
        mirrorId={mirrorId}
        label="PDF Oficial"
        className="rounded-full gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] text-white"
      />


    </div>
  );
}
