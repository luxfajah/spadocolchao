import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Apaga os pedidos de teste antigos
    await prisma.order.deleteMany({
      where: { code: { startsWith: 'TEST' } }
    });

    // Busca 4 clientes reais que tenham um endereço cadastrado completo (rua, numero, bairro)
    const customersWithAddress = await prisma.customer.findMany({
      where: {
        addresses: {
          some: {
            street: { not: null, notIn: [''] },
            number: { not: null, notIn: [''] },
            neighborhood: { not: null, notIn: [''] }
          }
        }
      },
      include: {
        addresses: true
      },
      take: 4
    });

    if (customersWithAddress.length === 0) {
      return NextResponse.json({ success: false, message: "Não encontrei clientes reais com endereço completo no banco de dados." });
    }

    // Configurações base para gerar a venda
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

    const createdOrders = [];

    // Para cada cliente real, vamos gerar um pedido de teste usando seu próprio endereço
    for (const customer of customersWithAddress) {
      const mainAddress = customer.addresses.find(a => a.isMain) || customer.addresses[0];
      
      const sale = await prisma.sale.create({
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

      const order = await prisma.order.create({
        data: {
          saleId: sale.id,
          customerId: customer.id,
          currentStatus: 'WAITING_DELIVERY',
          deliveryDate: new Date(),
          street: mainAddress.street,
          number: mainAddress.number,
          zipCode: mainAddress.zipCode || '00000-000',
          neighborhood: mainAddress.neighborhood || 'Bairro Padrão',
          city: mainAddress.city || 'Cidade',
          state: mainAddress.state || 'PR',
          recipientName: customer.fullName,
          code: 'TEST-' + Math.floor(Math.random() * 10000)
        }
      });
      createdOrders.push(order);
    }

    return NextResponse.json({ 
      success: true, 
      message: `${createdOrders.length} pedidos de teste gerados com clientes reais!`, 
      createdOrders 
    });
  } catch (error: any) {
    console.error('Error generating seed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
