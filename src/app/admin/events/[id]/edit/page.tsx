import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import EditEventForm from './EditEventForm';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await prisma.event.findUnique({
        where: { id },
        include: { category: true },
    });

    if (!event) notFound();

    return <EditEventForm event={event} />;
}
