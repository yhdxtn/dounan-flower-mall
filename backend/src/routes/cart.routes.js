import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { auth } from '../middleware/auth.js';

const router = Router();

const cartSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1)
});

router.use(auth());

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT ca.id, ca.product_id, ca.quantity, p.name, p.cover_url, p.price, p.unit, i.stock,
              ca.quantity * p.price AS subtotal
         FROM carts ca
         JOIN products p ON p.id = ca.product_id
         JOIN inventory i ON i.product_id = p.id
        WHERE ca.user_id = ?
        ORDER BY ca.updated_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = cartSchema.parse(req.body);
    await pool.query(
      `INSERT INTO carts (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, data.productId, data.quantity]
    );
    res.json({ message: '已加入购物车' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const quantity = z.object({ quantity: z.number().int().min(1) }).parse(req.body).quantity;
    await pool.query('UPDATE carts SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, req.params.id, req.user.id]);
    res.json({ message: '购物车已更新' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM carts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: '已移除' });
  } catch (error) {
    next(error);
  }
});

export default router;
