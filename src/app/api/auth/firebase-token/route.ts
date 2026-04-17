import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Generate a custom token for the user ID
        const customToken = await getAdminAuth().createCustomToken(session.user.id, {
            email: session.user.email,
            name: session.user.name,
        });

        return NextResponse.json({ token: customToken });
    } catch (error) {
        console.error('Error generating Firebase token:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
