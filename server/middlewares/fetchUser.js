const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'imovies_super_secret_jwt_key_2026';

const fetchUser = (req, res, next) => {
  // Get token from auth-token header or Authorization Bearer header
  let token = req.header('auth-token') || req.headers['auth-token'];
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.replace(/^Bearer\s+/i, '');
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Please authenticate using a valid token'
    });
  }

  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user !== undefined ? data.user : data;
    next();
  } catch (error) {
    // Also try alternate fallback secret
    try {
      const data = jwt.verify(token, 'imovies_super_secret_jwt_key_2024');
      req.user = data.user !== undefined ? data.user : data;
      return next();
    } catch (err2) {
      return res.status(401).json({
        success: false,
        error: 'Please authenticate using a valid token'
      });
    }
  }
};

module.exports = fetchUser;
