import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user?.id) redirect('https://www.groupad.net/');

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { userType: true, name: true },
    });

    if (!dbUser || dbUser.userType !== 'ADMIN') redirect('https://www.groupad.net/');

    return (
        <div className="min-h-screen flex bg-secondary-50 dark:bg-secondary-950">
            <AdminSidebar userName={dbUser.name} />

            {/* Main */}
            <main className="flex-1 overflow-auto p-6">
                {children}
            </main>
        </div>
    );
}
