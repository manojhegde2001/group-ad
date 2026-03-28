import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
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

    const headersList = await headers();
    const host = headersList.get('host') || '';
    const isAdminSubdomain = host.startsWith('admin.');

    return (
        <div className="min-h-screen flex bg-background transition-colors duration-300 font-jakarta">
            <AdminSidebar
                userName={dbUser.name ?? 'Admin'}
                userEmail={dbUser.email ?? ''}
                userAvatar={dbUser.avatar ?? undefined}
                isAdminSubdomain={isAdminSubdomain}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <AdminTopBar
                    userName={dbUser.name ?? 'Admin'}
                    userEmail={dbUser.email ?? ''}
                    userAvatar={dbUser.avatar ?? undefined}
                />
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
