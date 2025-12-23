/**
 * Pagination utility for API responses
 */

class PaginationHelper {
  /**
   * Calculate pagination metadata
   */
  static calculatePagination(totalItems, currentPage, itemsPerPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return {
      total: totalItems,
      page: parseInt(currentPage),
      limit: parseInt(itemsPerPage),
      totalPages,
      hasNext: parseInt(currentPage) < totalPages,
      hasPrev: parseInt(currentPage) > 1,
      nextPage: parseInt(currentPage) < totalPages ? parseInt(currentPage) + 1 : null,
      prevPage: parseInt(currentPage) > 1 ? parseInt(currentPage) - 1 : null,
    };
  }

  /**
   * Calculate offset for database queries
   */
  static calculateOffset(page, limit) {
    return (parseInt(page) - 1) * parseInt(limit);
  }

  /**
   * Standardize pagination response
   */
  static formatResponse(items, paginationMeta, additionalInfo = {}) {
    return {
      items,
      pagination: {
        ...paginationMeta
      },
      ...additionalInfo
    };
  }

  /**
   * Parse pagination parameters from request query
   */
  static parsePaginationParams(query, defaults = { page: 1, limit: 20, maxLimit: 100 }) {
    const page = Math.max(1, parseInt(query.page) || defaults.page);
    const limit = Math.min(
      Math.max(1, parseInt(query.limit) || defaults.limit), 
      defaults.maxLimit
    );

    return { page, limit };
  }

  /**
   * Parse cursor-based pagination parameters
   */
  static parseCursorPaginationParams(query, defaults = { limit: 20, maxLimit: 100 }) {
    const limit = Math.min(
      Math.max(1, parseInt(query.limit) || defaults.limit), 
      defaults.maxLimit
    );
    
    return {
      limit,
      cursor: query.cursor || null,
      direction: query.direction === 'prev' ? 'prev' : 'next' // 'next' or 'prev'
    };
  }

  /**
   * Format response for cursor-based pagination
   */
  static formatCursorResponse(items, nextCursor, prevCursor, additionalInfo = {}) {
    return {
      items,
      nextCursor,
      prevCursor,
      hasMore: !!nextCursor,
      ...additionalInfo
    };
  }
}

module.exports = PaginationHelper;