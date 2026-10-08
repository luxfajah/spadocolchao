import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { userId, latitude, longitude, speed, heading, accuracy, batteryLevel } = await req.json()

    if (!userId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: "Dados incompletos de localização" },
        { status: 400 }
      )
    }

    await prisma.userLocation.upsert({
      where: { userId },
      create: {
        userId,
        latitude: Number(latitude),
        longitude: Number(longitude),
        speed: speed ? Number(speed) : null,
        heading: heading ? Number(heading) : null,
        accuracy: accuracy ? Number(accuracy) : null,
        batteryLevel: batteryLevel ? Number(batteryLevel) : null,
      },
      update: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        speed: speed ? Number(speed) : null,
        heading: heading ? Number(heading) : null,
        accuracy: accuracy ? Number(accuracy) : null,
        batteryLevel: batteryLevel ? Number(batteryLevel) : null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao salvar localização:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno" },
      { status: 500 }
    )
  }
}
