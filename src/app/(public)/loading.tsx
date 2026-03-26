export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-secondary-600 dark:text-secondary-400">Loading...</p>
      </div>
    </div>
  );
}
