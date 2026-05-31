const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'File size too large. Maximum size is 5MB.',
      });
    }
    return res.status(400).json({
      success: false,
      data: null,
      message: err.message,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Invalid token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Token expired.',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    data: null,
    message: message,
  });
};

module.exports = errorHandler;
