import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ReceiptClient } from "./ReceiptClient";

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      sale: {
        include: {
          customer: {
            include: {
              addresses: true
            }
          },
          seller: true,
          items: true,
          installments: {
            include: { paymentMethod: true }
          }
        }
      }
    }
  });

  if (!order || !order.sale) return notFound();

  const formatBRL = (v: number) => {
    if (typeof v !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  };

  const formatDate = (date: any) => {
    try {
      if (!date) return '---';
      return new Date(date).toLocaleString('pt-BR');
    } catch (e) {
      return '---';
    }
  };

  return <ReceiptClient order={order} formatBRL={formatBRL} formatDate={formatDate} />;
}
