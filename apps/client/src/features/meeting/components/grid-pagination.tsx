import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GridPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function GridPagination({
  currentPage,
  totalPages,
  onPageChange,
}: GridPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-3 bg-neutral-900/90 border border-white/10 px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-3 text-xs text-white/80">
      <button
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="font-semibold">
        Page {currentPage + 1} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        disabled={currentPage >= totalPages - 1}
        className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
