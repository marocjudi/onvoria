import { useState, useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CustomPaginationProps {
  count: number;
  page: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const CustomPagination = ({
  count,
  page,
  onPageChange,
  className = "",
}: CustomPaginationProps) => {
  const [pageNumbers, setPageNumbers] = useState<number[]>([]);

  useEffect(() => {
    // Generate an array of page numbers to display
    const totalPages = Math.max(1, count);
    const currentPage = Math.min(page, totalPages);
    
    let pages: number[] = [];
    
    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // Always include first page
      pages.push(1);
      
      if (currentPage > 3) {
        // Add ellipsis effect (represented by -1)
        pages.push(-1);
      }
      
      // Add pages around the current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        // Add ellipsis effect
        pages.push(-1);
      }
      
      // Always include last page
      pages.push(totalPages);
    }
    
    setPageNumbers(pages);
  }, [count, page]);

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < count) {
      onPageChange(page + 1);
    }
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={handlePrevious} 
            className="cursor-pointer"
            tabIndex={0}
            style={{ pointerEvents: page <= 1 ? "none" : "auto", opacity: page <= 1 ? 0.5 : 1 }}
          />
        </PaginationItem>
        
        {pageNumbers.map((pageNumber, index) => 
          pageNumber === -1 ? (
            // Ellipsis
            <PaginationItem key={`ellipsis-${index}`}>
              <span className="flex h-9 w-9 items-center justify-center">...</span>
            </PaginationItem>
          ) : (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                isActive={pageNumber === page}
                onClick={() => onPageChange(pageNumber)}
                className="cursor-pointer"
                tabIndex={0}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        
        <PaginationItem>
          <PaginationNext 
            onClick={handleNext} 
            className="cursor-pointer"
            tabIndex={0}
            style={{ pointerEvents: page >= count ? "none" : "auto", opacity: page >= count ? 0.5 : 1 }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};