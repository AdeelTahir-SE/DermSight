import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

interface PatientListSkeletonProps {
  count?: number;
}

export function PatientListSkeleton({ count = 4 }: PatientListSkeletonProps) {
  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="flex-row items-center p-4 border-b border-gray-50 dark:border-slate-800"
        >
          {/* Avatar Circle */}
          <Skeleton variant="circle" width={48} height={48} className="mr-3" />

          {/* Info Lines */}
          <View className="flex-1 gap-1.5">
            <Skeleton variant="line" width="60%" height={16} />
            <Skeleton variant="line" width="40%" height={12} />
          </View>

          {/* Status Badge */}
          <Skeleton variant="rect" width={64} height={22} className="rounded-full" />
        </View>
      ))}
    </View>
  );
}
