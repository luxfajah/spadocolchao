import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let user = await prisma.user.findFirst({
      where: {
        name: { contains: 'Douglas', mode: 'insensitive' }
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Usuário Douglas não encontrado" });
    }

    // Hash da senha "123456"
    const hash = hashPassword('123456');

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash }
    });

    return NextResponse.json({ 
      success: true, 
      username: user.username,
      name: user.name,
      newPassword: "A senha foi resetada para: 123456"
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
