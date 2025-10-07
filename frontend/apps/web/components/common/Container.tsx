import React from "react";
import { cn } from "@/lib/utils";

const Container = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("mx-auto max-w-screen-2xl px-8 py-10 md:px-16 lg:px-24", className)}>
      {children}
    </div>
  );
};

export default Container;
