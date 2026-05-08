import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const company = await prisma.companyProfile.findFirst()
  return NextResponse.json(company)
}
