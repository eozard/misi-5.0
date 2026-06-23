/**
 * Utility functions for pagination
 */

/**
 * Calculate paginated data
 * @param {Array} data - Array of data
 * @param {number} page - Current page number
 * @param {number} perPage - Items per page
 * @returns {Array} Paginated data
 */
export const getPaginatedData = (data, page, perPage) => {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  return data.slice(startIndex, endIndex);
};

/**
 * Calculate total pages
 * @param {number} totalItems - Total items
 * @param {number} perPage - Items per page
 * @returns {number} Total pages
 */
export const getTotalPages = (totalItems, perPage) => {
  return Math.max(1, Math.ceil(totalItems / perPage));
};

/**
 * Get page range for pagination display
 * @param {number} currentPage - Current page
 * @param {number} totalPages - Total pages
 * @param {number} maxVisible - Max visible page numbers
 * @returns {Array} Array of page numbers
 */
export const getVisiblePages = (currentPage, totalPages, maxVisible = 5) => {
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};
