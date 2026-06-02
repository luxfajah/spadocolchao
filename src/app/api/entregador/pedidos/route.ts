import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming this is the correct path for prisma

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        currentStatus: 'WAITING_DELIVERY',
      },
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
            whatsapp: true,
          }
        },
      },
      orderBy: {
        deliveryDate: 'asc'
      }
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Error fetching delivery orders:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
