import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoadingSkeleton() {
  return (
    <div className="space-y-4 pt-6">
      <div className="flex justify-end">
        <Skeleton className="h-14 w-[48%] rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-24 w-[62%] rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-16 w-[40%] rounded-2xl" />
      </div>
    </div>
  );
}
