import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const costCenters = await prisma.costCenter.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
      },
    })

    return NextResponse.json(costCenters)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
