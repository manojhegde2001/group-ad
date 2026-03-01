import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { LayoutDashboard, CalendarDays, Users, Plus } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user?.id) redirect('/');

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { userType: true, name: true },
    });

    if (!dbUser || dbUser.userType !== 'ADMIN') redirect('/');

    return (
        <div className="min-h-screen flex bg-secondary-50 dark:bg-secondary-950">
            {/* Sidebar */}
            <aside className="w-60 shrink-0 bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 flex flex-col">
                <div className="px-5 py-4 border-b border-secondary-100 dark:border-secondary-800">
                    <span className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">Admin Panel</span>
                    <p className="text-sm font-semibold text-secondary-800 dark:text-white mt-0.5 truncate">{dbUser.name}</p>
                </div>
                <nav className="flex-1 p-3 space-y-1">
                    <Link href="/admin/events" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400 transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Events Dashboard
                    </Link>
                    <Link href="/admin/events/create" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400 transition-colors">
                        <Plus className="w-4 h-4" /> Create Event
                    </Link>
                    <Link href="/events" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
                        <CalendarDays className="w-4 h-4" /> View Public Events
                    </Link>
                </nav>
                <div className="p-3">
                    <Link href="/" className="flex items-center gap-2 px-3 py-2 text-xs text-secondary-400 hover:text-secondary-600 transition-colors">
                        ← Back to App
                    </Link>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-auto p-6">
                {children}
            </main>
        </div>
    );
}
