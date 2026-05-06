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

  return <ReceiptClient order={order} />;
}
