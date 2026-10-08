const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
}

// Customer portal auth: same JWT mechanism as requireAdmin, but for the
// role: 'customer' tokens issued by customerAuthController.
function requireCustomer(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Please login to your account to continue' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'customer') {
      return res.status(403).json({ message: 'Customer access required' });
    }
    req.customer = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Your session has expired. Please login again.' });
  }
}

// Does NOT block the request if there's no/invalid token - used on the
// public "place order" endpoint so a logged-in customer's order gets linked
// to their account, while guest checkout keeps working exactly as before.
function attachCustomerIfPresent(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'customer') req.customer = decoded;
    } catch (error) {
      // Ignore invalid/expired tokens here; order still goes through as a guest order.
    }
  }
  next();
}

module.exports = { requireAdmin, requireCustomer, attachCustomerIfPresent };
