import { useState, useMemo, useEffect, useRef } from "react";

export interface PaginationConfig {
  itemsPerPage?: number;
  initialPage?: number;
}

export const usePagination = <T,>(items: T[], config: PaginationConfig = {}) => {
  const { itemsPerPage = 9, initialPage = 1 } = config;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const previousItemsPerPageRef = useRef(itemsPerPage);

  // Reset page to 1 when itemsPerPage changes to avoid out-of-bounds issues
  useEffect(() => {
    if (previousItemsPerPageRef.current !== itemsPerPage && currentPage > 1) {
      const newTotalPages = Math.ceil(items.length / itemsPerPage);
      if (currentPage > newTotalPages) {
        setCurrentPage(1);
      }
    }
    previousItemsPerPageRef.current = itemsPerPage;
  }, [itemsPerPage, currentPage, items.length]);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    resetPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    itemsPerPage,
    totalItems: items.length
  };
};