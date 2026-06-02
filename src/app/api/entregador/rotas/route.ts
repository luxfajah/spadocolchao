import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');

  try {
    // Busca pedidos "Aguardando Entrega" para a data informada (ou todos se não informada)
    const whereClause: any = {
      currentStatus: 'WAITING_DELIVERY',
    };

    if (dateStr) {
      const startOfDay = new Date(dateStr);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setUTCHours(23, 59, 59, 999);

      whereClause.deliveryDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { fullName: true }
        }
      },
      orderBy: {
        deliveryDate: 'asc' // Ordenação base por horário/data registrado na venda
      }
    });

    // O endereço de saída (SPA)
    const spaAddress = "SPA do Colchão - Endereço base"; 

    // TODO: Integração real com Google Maps Directions API para otimizar a rota
    // Usando uma heurística simples aqui (ordem cronológica).
    // Para otimização de rota real, faríamos uma chamada para:
    // https://maps.googleapis.com/maps/api/directions/json?origin=SPA&destination=ULTIMO&waypoints=optimize:true|...

    return NextResponse.json({ 
      success: true, 
      route: orders,
      origin: spaAddress 
    });
  } catch (error: any) {
    console.error('Error fetching route:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
