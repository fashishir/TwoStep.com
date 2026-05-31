const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

const errorResponse = (res, message = 'Error', statusCode = 400, data = null) => {
  return res.status(statusCode).json({
    success: false,
    data,
    message,
  });
};

const paginatedResponse = (res, data, total, page, limit) => {
  return res.status(200).json({
    success: true,
    data: {
      items: data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    },
    message: 'Success',
  });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
