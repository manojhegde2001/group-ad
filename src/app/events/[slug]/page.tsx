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
            images: [
                {
                    url: event.coverImage || '/auth/thumbnail.png',
                    width: 1200,
                    height: 630,
                    alt: event.title,
                }
            ],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: event.title,
            description: event.description.slice(0, 160),
            images: [event.coverImage || '/auth/thumbnail.png'],
        }
    };
}

export default async function EventDetailPage({ params }: Props) {
    const { slug } = await params;
    return <EventDetailClient slug={slug} />;
}
