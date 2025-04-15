import { Skeleton } from "@/components/ui/skeleton";

export default function PostDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Skeleton */}
        <Skeleton className="aspect-[3/4] rounded-lg" />
        {/* Details Skeleton */}
        <div className="space-y-4">
          {/* Author Skeleton */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          {/* Title Skeleton */}
          <Skeleton className="h-8 w-3/4" />
          {/* Description Skeleton */}
          <Skeleton className="h-24 w-full" />
          {/* Action Buttons Skeleton */}
          <div className="flex gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
          {/* Product List Skeleton (Simplified) */}
          <div className="space-y-3 pt-4">
             <Skeleton className="h-6 w-40 mb-3" /> {/* Title */}
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-16 w-full" />
          </div>
           {/* Comment Section Skeleton (Simplified) */}
           <div className="space-y-4 pt-6">
             <Skeleton className="h-6 w-32 mb-4" /> {/* Title */}
             <Skeleton className="h-10 w-full mb-4" /> {/* Input */}
             <Skeleton className="h-20 w-full" /> {/* Comment */}
             <Skeleton className="h-20 w-full" /> {/* Comment */}
           </div>
        </div>
      </div>
    </div>
  );
}