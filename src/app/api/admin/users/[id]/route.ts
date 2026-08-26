import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { adminUpdateUserSchema } from '@/lib/validations/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, userType, categoryId, website, websiteLabel } = adminUpdateUserSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        userType,
        website,
        websiteLabel,
        categoryId: categoryId === 'NONE' ? null : categoryId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        website: true,
        websiteLabel: true,
      }
    });

    return NextResponse.json({ user: updatedUser, message: 'User updated successfully' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    logger.error('Error updating user', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
