/**
 * Middleware to require and validate x-device-key header on device ingestion requests
 */
function requireDeviceApiKey(req, res, next) {
  const providedKey = req.headers['x-device-key'];
  const expectedKey = process.env.DEVICE_API_KEY;

  // If DEVICE_API_KEY is configured in environment, validate it
  if (expectedKey) {
    if (!providedKey || providedKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing or invalid x-device-key header'
      });
    }
  }

  next();
}

module.exports = {
  requireDeviceApiKey
};
