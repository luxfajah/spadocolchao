import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const scales = await prisma.workSchedule.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(scales)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
