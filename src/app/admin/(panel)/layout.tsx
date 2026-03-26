import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopBar from '@/components/admin/AdminTopBar';

export const metadata = {
    title: 'Admin Panel — Group Ad',
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user?.id) redirect('/admin/login');

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { userType: true, name: true, avatar: true, email: true },
    });

    if (!dbUser || dbUser.userType !== 'ADMIN') redirect('/admin/login');

    return (
        <div className="min-h-screen flex bg-[#0a0a0f]">
            <AdminSidebar
                userName={dbUser.name ?? 'Admin'}
                userEmail={dbUser.email ?? ''}
                userAvatar={dbUser.avatar ?? undefined}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <AdminTopBar
                    userName={dbUser.name ?? 'Admin'}
                    userEmail={dbUser.email ?? ''}
                    userAvatar={dbUser.avatar ?? undefined}
                />
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
