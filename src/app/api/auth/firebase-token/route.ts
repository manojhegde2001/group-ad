import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        
        // Generate a custom token for the user
        // We can add claims if needed (e.g. role)
        const customToken = await adminAuth.createCustomToken(userId);

        return NextResponse.json({ token: customToken });
    } catch (error) {
        console.error('Error generating Firebase custom token:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
