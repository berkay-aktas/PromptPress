export function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md animate-pulse">
      <div className="p-6 pb-8">
        <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 mt-4">
          <div className="flex flex-wrap gap-2">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-14"></div>
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="h-4 bg-gray-200 rounded w-24 mb-6 animate-pulse"></div>
      <article className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <header className="px-6 sm:px-8 py-6 sm:py-8 border-b border-gray-200">
          <div className="h-8 bg-gray-200 rounded mb-4 w-3/4 animate-pulse"></div>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </header>
        <div className="px-6 sm:px-8 py-6 sm:py-8">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
          </div>
        </div>
      </article>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {Array.from({ length: 6 }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

