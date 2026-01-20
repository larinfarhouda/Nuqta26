export default function EventCardSkeleton() {
    return (
        <div className="relative bg-white rounded-2xl md:rounded-3xl p-2 md:p-3 border border-gray-100 shadow-sm h-full flex flex-col animate-pulse">
            {/* Image Skeleton */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl md:rounded-2xl bg-gray-200 mb-3 md:mb-4 shrink-0" />

            {/* Content Skeleton */}
            <div className="px-1 flex-1 flex flex-col">
                {/* Title */}
                <div className="mb-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>

                {/* Location and date */}
                <div className="space-y-1 mb-auto">
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>

                {/* Price footer */}
                <div className="pt-3 md:pt-4 flex items-center justify-between border-t border-gray-100 mt-3 md:mt-4">
                    <div className="h-8 bg-gray-200 rounded-lg w-20" />
                    <div className="h-6 bg-gray-200 rounded-md w-12" />
                </div>
            </div>
        </div>
    );
}
