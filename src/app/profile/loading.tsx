export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-secondary-200 dark:bg-secondary-700 rounded-full"></div>
              
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-1/3"></div>
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/4"></div>
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-2/3"></div>
              </div>
              
              <div className="h-10 w-32 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
            </div>
          </div>

          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6">
            <div className="flex gap-4 mb-6">
              <div className="h-10 w-32 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
              <div className="h-10 w-32 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
              <div className="h-10 w-32 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
            </div>

            <div className="space-y-4">
              <div className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
              <div className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
              <div className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
              <div className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
