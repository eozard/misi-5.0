import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination Component
 * @param {number} currentPage - Current active page
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes
 * @param {number} totalItems - Total items across all pages
 * @param {number} itemsPerPage - Items shown per page
 */
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate visible page numbers (max 5 visible)
  const getVisiblePages = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  if (totalPages <= 1) return null;

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Info text */}
      <p className="text-xs text-gray-500 order-2 sm:order-1">
        Menampilkan{" "}
        <span className="font-medium text-gray-700">
          {startItem}-{endItem}
        </span>{" "}
        dari{" "}
        <span className="font-medium text-gray-700">{totalItems}</span>
      </p>

      {/* Pagination controls */}
      <div className="flex items-center justify-center sm:justify-end gap-1 order-1 sm:order-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* First page + ellipsis */}
        {visiblePages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="min-w-[28px] h-7 px-1.5 text-xs font-medium rounded transition-colors text-gray-600 hover:bg-gray-200"
            >
              1
            </button>
            {visiblePages[0] > 2 && (
              <span className="px-1 text-gray-400 text-xs">...</span>
            )}
          </>
        )}

        {/* Page numbers */}
        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[28px] h-7 px-1.5 text-xs font-medium rounded transition-colors ${
              currentPage === page
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            aria-label={`Halaman ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        {/* Last page + ellipsis */}
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="px-1 text-gray-400 text-xs">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="min-w-[28px] h-7 px-1.5 text-xs font-medium rounded transition-colors text-gray-600 hover:bg-gray-200"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
