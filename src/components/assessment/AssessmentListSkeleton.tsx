import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

interface AssessmentListSkeletonProps {
  count?: number;
}

export function AssessmentListSkeleton({ count = 3 }: AssessmentListSkeletonProps) {
  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="flex-row items-center p-4 border-b border-gray-50 dark:border-slate-800"
        >
          {/* Left block info */}
          <View className="flex-1 gap-1.5">
            <Skeleton variant="line" width="50%" height={14} />
            <Skeleton variant="line" width="30%" height={10} />
          </View>

          {/* Right block status */}
          <View className="items-end gap-1">
            <Skeleton variant="rect" width={55} height={18} className="rounded-full" />
            <Skeleton variant="line" width={32} height={10} className="mt-1" />
          </View>
        </View>
      ))}
    </View>
  );
}
