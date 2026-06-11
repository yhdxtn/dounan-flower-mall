import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { createOrder, updateOrderStatus } from '../services/order.service.js';

const router = Router();

const createOrderSchema = z.object({
  receiverName: z.string().min(1),
  receiverPhone: z.string().min(1),
  receiverAddress: z.string().min(1),
  remark: z.string().optional()
});

router.use(auth());

router.post('/', async (req, res, next) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const order = await createOrder(req.user.id, data);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ ...orders[0], items });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const result = await updateOrderStatus(req.params.id, 'cancelled');
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
