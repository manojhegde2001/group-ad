/**
 * Static skeleton of the *authenticated* app shell, shown on a hard refresh
 * while next-auth re-confirms the session (see LayoutContent). No hooks, no
 * interactivity — it is swapped out for the real Sidebar/Navbar the moment
 * the session resolves. Never rendered for logged-out visitors.
 */
export function AppChromeSkeleton() {
    return (
        <div aria-hidden="true">
            {/* Desktop: left rail */}
            <aside className="hidden md:flex fixed left-0 top-0 w-20 h-screen bg-white dark:bg-secondary-900 border-r border-secondary-100 dark:border-secondary-800 flex-col items-center py-4 z-[60]">
                <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-800 animate-pulse mb-6" />
                <div className="flex flex-col items-center gap-2 w-full px-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="w-12 h-12 rounded-2xl bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
                    ))}
                </div>
                <div className="mt-auto flex flex-col gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
                    <div className="w-12 h-12 rounded-2xl bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
                </div>
            </aside>

            {/* Desktop: top bar */}
            <div className="hidden md:flex fixed top-0 left-0 right-0 h-20 md:pl-20 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md items-center">
                <div className="flex-1 flex items-center px-4 md:px-6 gap-3 h-full">
                    <div className="flex-1 max-w-xl h-10 rounded-full bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
                    <div className="ml-auto flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
                        <div className="w-9 h-9 rounded-full bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
                        <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Mobile: bottom bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 dark:bg-secondary-900/90 backdrop-blur-lg border-t border-secondary-100 dark:border-secondary-800 px-2 sm:px-6 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 p-2 min-w-[4rem]">
                            <div className="w-[1.375rem] h-[1.375rem] rounded-lg bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
                            <div className="w-8 h-2 rounded-full bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
