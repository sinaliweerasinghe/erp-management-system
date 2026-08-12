import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized ❌" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // IMPORTANT: Make sure companyId is included
    req.user = {
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
      companyId: decoded.companyId, // This is critical!
      role: decoded.role
    };
    
    console.log('🔑 Auth - User:', req.user);
    
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(401).json({ message: "Invalid token ❌" });
  }
};