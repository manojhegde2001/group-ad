import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // Allow the login page to render without auth — middleware sets this header
    const headersList = await headers();
    const isLoginPage = headersList.get('x-is-admin-login') === '1';

    if (isLoginPage) {
        // Render login page with no chrome/sidebar
        return <>{children}</>;
    }

    const session = await auth();
    if (!session?.user?.id) redirect('/admin/login');

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { userType: true, name: true },
    });

    if (!dbUser || dbUser.userType !== 'ADMIN') redirect('/admin/login');

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
