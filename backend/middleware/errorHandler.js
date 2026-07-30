// Global error handling middleware placeholder
export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
}
