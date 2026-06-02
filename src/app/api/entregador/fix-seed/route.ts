import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const realAddresses = await prisma.customerAddress.findMany({
      where: {
        street: { not: null, notIn: [''] },
        zipCode: { not: null, notIn: [''] }
      },
      select: {
        street: true,
        number: true,
        zipCode: true,
        neighborhood: true,
        city: true,
        state: true,
      },
      take: 20
    });

    const uniqueAddresses: any[] = [];
    const seen = new Set();
    
    for (const addr of realAddresses) {
      if (!addr.street || !addr.number || !addr.zipCode) continue;
      
      const key = `${addr.street}-${addr.number}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueAddresses.push(addr);
        if (uniqueAddresses.length === 4) break;
      }
    }

    if (uniqueAddresses.length === 0) {
       return NextResponse.json({ success: false, message: "Não encontrei endereços reais no banco de dados." });
    }

    const testOrders = await prisma.order.findMany({
      where: { code: { startsWith: 'TEST-' } }
    });

    for (let i = 0; i < Math.min(testOrders.length, uniqueAddresses.length); i++) {
      const order = testOrders[i];
      const addr = uniqueAddresses[i];
      await prisma.order.update({
        where: { id: order.id },
        data: {
          street: addr.street,
          number: addr.number,
          zipCode: addr.zipCode,
          neighborhood: addr.neighborhood,
          city: addr.city,
          state: addr.state
        }
      });
    }

    return NextResponse.json({ success: true, message: "Pedidos de teste atualizados com endereços reais!", addresses: uniqueAddresses });
  } catch (error: any) {
    console.error('Error fixing seed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
