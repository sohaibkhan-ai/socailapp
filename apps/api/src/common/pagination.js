const { PAGINATION_DEFAULT, MAX_LIMIT } = require('@socialhub/shared');

function parsePagination(query = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = PAGINATION_DEFAULT.page;
  if (!Number.isFinite(limit) || limit < 1) limit = PAGINATION_DEFAULT.limit;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

module.exports = { parsePagination };
