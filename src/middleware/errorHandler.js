// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;
  const response = { error: err.message || 'Internal server error' };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};

module.exports = errorHandler;
