import jwt from 'jsonwebtoken';
import { httpError } from '../utils/httpError.js';

export function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) return next(httpError(401, '请先登录'));

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET || 'dounan-flower-local-secret');
      if (requiredRole && user.role !== requiredRole) {
        return next(httpError(403, '无权限访问'));
      }
      req.user = user;
      return next();
    } catch {
      return next(httpError(401, '登录已过期'));
    }
  };
}
