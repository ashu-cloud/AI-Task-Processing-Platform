function notFound(_request, response) {
  return response.status(404).json({ message: "Route not found." });
}

function errorHandler(error, _request, response) {
  console.error(error);

  const statusCode = error.statusCode || 500;
  return response.status(statusCode).json({
    message: error.message || "Internal server error.",
  });
}

module.exports = { notFound, errorHandler };
