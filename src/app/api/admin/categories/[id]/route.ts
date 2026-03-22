import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  banner: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    const existing = await prisma.category.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // If name is being updated, generate new slug
    let dataToUpdate: any = { ...validatedData };
    
    if (validatedData.name && validatedData.name !== existing.name) {
      const slug = validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const existingSlug = await prisma.category.findUnique({ where: { slug } });
      
      if (existingSlug && existingSlug.id !== id) {
        return NextResponse.json({ error: 'A category with this name already exists' }, { status: 400 });
      }
      
      dataToUpdate.slug = slug;
    }

    const category = await prisma.category.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ category, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true, events: true, users: true }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Optional: Prevent deletion if there are associated entities
    if (existing._count.posts > 0 || existing._count.events > 0 || existing._count.users > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: It has associated posts(${existing._count.posts}), events(${existing._count.events}), or users(${existing._count.users}). Try deactivating instead.` }, 
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
