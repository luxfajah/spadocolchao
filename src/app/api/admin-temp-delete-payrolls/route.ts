import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const result = await prisma.employeeDocument.deleteMany({
      where: {
        type: "PAYROLL"
      }
    })

    return NextResponse.json({
      success: true,
      message: `${result.count} PDFs de holerites foram deletados com sucesso.`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
