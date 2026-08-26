import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Get current user's connected IDs (Accepted connections)
        const myConnections = await prisma.connection.findMany({
            where: {
                OR: [
                    { requesterId: userId, status: 'ACCEPTED' },
                    { receiverId: userId, status: 'ACCEPTED' }
                ]
            },
            select: {
                requesterId: true,
                receiverId: true
            }
        });

        const connectedIds = new Set(myConnections.flatMap(c => [c.requesterId, c.receiverId]));
        connectedIds.add(userId);

        // 2. Get current user's Power Team IDs
        const myTeams = await prisma.powerTeamMember.findMany({
            where: { userId, status: 'APPROVED' },
            select: { powerTeamId: true }
        });
        const teamIds = myTeams.map(t => t.powerTeamId);

        // 3. Find Suggestions
        
        // A. Power Team Members (Not yet connected)
        const teamMateSuggestions = await prisma.user.findMany({
            where: {
                id: { notIn: Array.from(connectedIds) },
                powerTeamMemberships: {
                    some: {
                        powerTeamId: { in: teamIds },
                        status: 'APPROVED'
                    }
                }
            },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                userType: true,
                companyName: true,
                _count: {
                    select: { followers: true }
                }
            },
            take: 10
        });

        // B. Mutual Connections (Friends of friends)
        // This is a bit heavy for MongoDB/Prisma in a single query if done naively.
        // We'll simplify: find users who are connected to people I'm connected to.
        const friendIds = Array.from(connectedIds).filter(id => id !== userId);
        
        const mutualSuggestions = await prisma.connection.findMany({
            where: {
                OR: [
                    { requesterId: { in: friendIds }, status: 'ACCEPTED' },
                    { receiverId: { in: friendIds }, status: 'ACCEPTED' }
                ],
                NOT: {
                    OR: [
                        { requesterId: userId },
                        { receiverId: userId }
                    ]
                }
            },
            select: {
                requesterId: true,
                receiverId: true
            },
            take: 20
        });

        const potentialMutualIds = new Set(mutualSuggestions.flatMap(c => [c.requesterId, c.receiverId]));
        potentialMutualIds.delete(userId);
        friendIds.forEach(id => potentialMutualIds.delete(id));

        const mutualUsers = await prisma.user.findMany({
            where: {
                id: { in: Array.from(potentialMutualIds) }
            },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                userType: true,
                companyName: true,
                _count: {
                    select: { followers: true }
                }
            },
            take: 10
        });

        // C. Combine and prioritize
        // Merge them, ensuring no duplicates
        const allSuggestionsMap = new Map();
        
        teamMateSuggestions.forEach(u => allSuggestionsMap.set(u.id, { ...u, suggestionReason: 'Power Team' }));
        mutualUsers.forEach(u => {
            if (!allSuggestionsMap.has(u.id)) {
                allSuggestionsMap.set(u.id, { ...u, suggestionReason: 'Mutual Connection' });
            }
        });

        // Fallback: If still low on suggestions, get users from same category
        if (allSuggestionsMap.size < 3) {
            const myProfile = await prisma.user.findUnique({ where: { id: userId }, select: { categoryId: true } });
            if (myProfile) {
                const categorySuggestions = await prisma.user.findMany({
                    where: {
                        categoryId: myProfile.categoryId,
                        id: { notIn: Array.from(connectedIds) },
                    },
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                        companyName: true,
                        _count: {
                            select: { followers: true }
                        }
                    },
                    take: 5
                });
                categorySuggestions.forEach(u => {
                    if (!allSuggestionsMap.has(u.id)) {
                        allSuggestionsMap.set(u.id, { ...u, suggestionReason: 'Similar Category' });
                    }
                });
            }
        }

        const finalSuggestions = Array.from(allSuggestionsMap.values())
            .sort(() => Math.random() - 0.5) // Randomize order
            .slice(0, 8);

        return NextResponse.json({ suggestions: finalSuggestions });
    } catch (error) {
        logger.error('Error fetching suggestions', error);
        return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
    }
}
