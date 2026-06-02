import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let customer = await prisma.customer.findFirst({
      where: { fullName: 'Cliente de Teste App Entregador' }
    });
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          fullName: 'Cliente de Teste App Entregador',
          personType: 'INDIVIDUAL',
          phone: '43999999999'
        }
      });
    }

    let sale = await prisma.sale.findFirst({
      where: { status: 'SOLD', customerId: customer.id }
    });
    
    if (!sale) {
      let seller = await prisma.seller.findFirst({ where: { isActive: true } });
      if (!seller) {
         seller = await prisma.seller.create({
           data: { name: 'Vendedor Teste', isActive: true, type: 'INTERNAL' }
         });
      }

      let session = await prisma.cashRegisterSession.findFirst({ where: { status: 'OPEN' } });
      if (!session) {
        const user = await prisma.user.findFirst();
        if (!user) throw new Error("No users found to create a session");
        
        session = await prisma.cashRegisterSession.create({
          data: {
            openedById: user.id,
            openingBalance: 0,
            status: 'OPEN'
          }
        });
      }
      
      let leadSource = await prisma.leadSource.findFirst();
      if (!leadSource) {
        leadSource = await prisma.leadSource.create({
          data: {
            code: 'TESTE',
            name: 'Origem Teste',
            category: 'OUTRO'
          }
        });
      }

      sale = await prisma.sale.create({
        data: {
          customerId: customer.id,
          sellerId: seller.id,
          cashRegisterSessionId: session.id,
          leadSourceId: leadSource.id,
          status: 'SOLD',
          subtotalAmount: 1000,
          totalAmount: 1000,
          financialStatus: 'PENDING'
        }
      });
    }

    // Get 4 unique real addresses from the database
    const realAddresses = await prisma.customerAddress.findMany({
      where: {
        street: { not: null, notIn: [''] }
      },
      select: { street: true, number: true, zipCode: true, neighborhood: true, city: true, state: true },
      take: 20
    });

    const uniqueAddresses: any[] = [];
    const seen = new Set();
    for (const addr of realAddresses) {
      if (!addr.street || !addr.number) continue;
      const key = `${addr.street}-${addr.number}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueAddresses.push(addr);
        if (uniqueAddresses.length === 4) break;
      }
    }

    // Fallback if no real addresses exist
    const addresses = uniqueAddresses.length >= 4 ? uniqueAddresses : [
      { street: 'Av colibri', number: '77', zipCode: '86705-000', neighborhood: 'Jardim dos Pássaros', city: 'Arapongas', state: 'PR' },
      { street: 'Av beija flor', number: '247', zipCode: '86706-000', neighborhood: 'Jardim dos Pássaros', city: 'Arapongas', state: 'PR' },
      { street: 'Rua bentevi', number: '12', zipCode: '86707-000', neighborhood: 'Jardim dos Pássaros', city: 'Arapongas', state: 'PR' },
      { street: 'Rua azulão', number: '48', zipCode: '86707-290', neighborhood: 'Jardim dos Pássaros', city: 'Arapongas', state: 'PR' },
    ];

    const createdOrders = [];

    for (let i = 0; i < addresses.length; i++) {
      const addr = addresses[i];
      let currentSale = sale;
      if (i > 0) {
        currentSale = await prisma.sale.create({
          data: {
            customerId: customer.id,
            sellerId: sale.sellerId,
            cashRegisterSessionId: sale.cashRegisterSessionId,
            leadSourceId: sale.leadSourceId,
            status: 'SOLD',
            subtotalAmount: 1000,
            totalAmount: 1000,
            financialStatus: 'PENDING'
          }
        });
      }

      const order = await prisma.order.create({
        data: {
          saleId: currentSale.id,
          customerId: customer.id,
          currentStatus: 'WAITING_DELIVERY',
          deliveryDate: new Date(),
          street: addr.street,
          number: addr.number,
          zipCode: addr.zipCode,
          neighborhood: addr.neighborhood || 'Bairro Padrão',
          city: addr.city || 'Cidade Padrão',
          state: addr.state || 'PR',
          recipientName: 'Recebedor ' + (i + 1),
          code: 'TEST-' + Math.floor(Math.random() * 10000)
        }
      });
      createdOrders.push(order);
    }

    return NextResponse.json({ success: true, message: "4 pedidos gerados com sucesso!", createdOrders });
  } catch (error: any) {
    console.error('Error generating seed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
