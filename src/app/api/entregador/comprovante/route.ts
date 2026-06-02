import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const orderId = formData.get('orderId') as string;
    const file = formData.get('file') as File;

    if (!orderId || !file) {
      return NextResponse.json({ success: false, error: 'orderId and file are required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Convert file to buffer and save to public/uploads (local storage for now)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'comprovantes');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    const fileName = `${orderId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, fileName);
    
    await fs.writeFile(filePath, buffer);
    const storedPath = `/uploads/comprovantes/${fileName}`;

    // Update order status and save attachment
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Save attachment record
      const attachment = await tx.fileAttachment.create({
        data: {
          originalName: file.name,
          storedName: fileName,
          mimeType: file.type || 'application/octet-stream',
          filePath: storedPath,
          fileSize: file.size,
          entityName: 'Order',
          entityId: orderId,
        }
      });

      // Add to status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.currentStatus,
          toStatus: 'DELIVERED',
          notes: 'Entrega finalizada via app do entregador. Comprovante anexado.',
          transitionSource: 'API'
        }
      });

      // Update the order itself
      return await tx.order.update({
        where: { id: orderId },
        data: {
          currentStatus: 'DELIVERED',
          deliveredAt: new Date(),
        }
      });
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Error uploading comprovante:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
