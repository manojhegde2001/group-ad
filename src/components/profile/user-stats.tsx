'use client';

interface UserStatsProps {
    postCount: number;
    connectionCount: number;
    onConnectionsClick?: () => void;
}

export function UserStats({
    postCount,
    connectionCount,
    onConnectionsClick,
}: UserStatsProps) {
    const fmt = (n: number) =>
        n >= 1_000_000
            ? `${(n / 1_000_000).toFixed(1)}M`
            : n >= 1_000
                ? `${(n / 1_000).toFixed(1)}K`
                : String(n);

    return (
        <div className="flex items-center gap-12">
            <div className="text-center">
                <p className="text-xl font-bold text-secondary-900 dark:text-white">{fmt(postCount)}</p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">Posts</p>
            </div>

            <button
                onClick={onConnectionsClick}
                className="text-center hover:opacity-80 transition-opacity cursor-pointer"
            >
                <p className="text-xl font-bold text-secondary-900 dark:text-white">{fmt(connectionCount)}</p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">Connections</p>
            </button>
        </div>
    );
}
