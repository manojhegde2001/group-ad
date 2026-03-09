import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import EventDetailClient from './EventDetailClient';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    const event = await prisma.event.findFirst({
        where: {
            OR: [
                { slug: slug },
                ...(isObjectId ? [{ id: slug }] : [])
            ]
        }
    });

    if (!event) return { title: 'Event Not Found' };

    return {
        title: `${event.title} | Group Ad Events`,
        description: event.description.slice(0, 160),
        openGraph: {
            title: event.title,
            description: event.description.slice(0, 160),
            images: event.coverImage ? [event.coverImage] : [],
        }
    };
}

export default async function EventDetailPage({ params }: Props) {
    const { slug } = await params;
    return <EventDetailClient slug={slug} />;
}
