import { Router } from 'express';
import { pool } from '../config/db.js';
import { getCache, setCache } from '../config/redis.js';

const router = Router();

router.get('/categories', async (req, res, next) => {
  try {
    const cacheKey = 'categories:list';
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const [rows] = await pool.query('SELECT id, name, sort_order FROM categories ORDER BY sort_order, id');
    await setCache(cacheKey, rows, 300);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const keyword = req.query.keyword ? `%${req.query.keyword}%` : null;
    const cacheKey = `products:list:${categoryId || 'all'}:${keyword || ''}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const [rows] = await pool.query(
      `SELECT p.id, p.category_id, c.name AS category_name, p.name, p.cover_url, p.origin,
              p.grade, p.unit, p.price, p.status, p.description, i.stock, i.locked_stock, i.warn_stock
         FROM products p
         JOIN categories c ON c.id = p.category_id
         JOIN inventory i ON i.product_id = p.id
        WHERE p.status = 'on_sale'
          AND (:categoryId IS NULL OR p.category_id = :categoryId)
          AND (:keyword IS NULL OR p.name LIKE :keyword)
        ORDER BY p.updated_at DESC`,
      { categoryId, keyword }
    );
    await setCache(cacheKey, rows, 60);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.category_id, c.name AS category_name, p.name, p.cover_url, p.origin,
              p.grade, p.unit, p.price, p.status, p.description, i.stock, i.locked_stock, i.warn_stock
         FROM products p
         JOIN categories c ON c.id = p.category_id
         JOIN inventory i ON i.product_id = p.id
        WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: '商品不存在' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
