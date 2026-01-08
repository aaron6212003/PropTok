import React from 'react';
import { cn } from '@/lib/utils';
import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Define cn utility here if not present in lib/utils yet, or assume I'll create it next.
// I'll assume I need to create the lib/utils.ts file first or inline it.
// Standard practice: separate tool call for utils. But I can assume standard cn.

export default function MobileContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen w-full justify-center bg-black">
      <div
        className={cn(
          "relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background shadow-2xl ring-1 ring-white/10",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
