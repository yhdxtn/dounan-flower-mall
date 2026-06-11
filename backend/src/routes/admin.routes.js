import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { delCacheByPattern } from '../config/redis.js';
import { auth } from '../middleware/auth.js';
import { updateOrderStatus } from '../services/order.service.js';
import { ensureChatReady } from './chat.routes.js';

const router = Router();
router.use(auth('admin'));

async function ensureSettingsReady() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key VARCHAR(80) PRIMARY KEY,
      setting_value TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
}

router.get('/orders', async (req, res, next) => {
  try {
    const status = req.query.status || null;
    const keyword = req.query.keyword ? `%${req.query.keyword}%` : null;
    const [rows] = await pool.query(
      `SELECT o.id, o.order_no, o.status, o.total_amount, o.receiver_name, o.receiver_phone,
              o.receiver_address, o.created_at, u.username, u.nickname,
              COUNT(oi.id) AS item_count,
              GROUP_CONCAT(CONCAT(oi.product_name, 'x', oi.quantity) ORDER BY oi.id SEPARATOR '；') AS item_summary
         FROM orders o
         JOIN users u ON u.id = o.user_id
         JOIN order_items oi ON oi.order_id = o.id
        WHERE (:status IS NULL OR o.status = :status)
          AND (:keyword IS NULL OR o.order_no LIKE :keyword OR u.username LIKE :keyword OR oi.product_name LIKE :keyword)
        GROUP BY o.id
        ORDER BY o.created_at DESC`,
      { status, keyword }
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const status = z.object({ status: z.enum(['paid', 'shipped', 'completed', 'cancelled']) }).parse(req.body).status;
    res.json(await updateOrderStatus(req.params.id, status));
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const keyword = req.query.keyword ? `%${req.query.keyword}%` : null;
    const [rows] = await pool.query(
      `SELECT id, username, nickname, phone, role, created_at
         FROM users
        WHERE (:keyword IS NULL OR username LIKE :keyword OR nickname LIKE :keyword OR phone LIKE :keyword)
        ORDER BY created_at DESC`,
      { keyword }
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const data = z.object({
      nickname: z.string().min(1).max(30),
      phone: z.string().regex(/^1[3-9]\d{9}$/),
      role: z.enum(['buyer', 'admin'])
    }).parse(req.body);
    await pool.query('UPDATE users SET nickname = ?, phone = ?, role = ? WHERE id = ?', [data.nickname, data.phone, data.role, req.params.id]);
    res.json({ message: '用户已更新' });
  } catch (error) {
    next(error);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.category_id, c.name AS category_name, p.name, p.cover_url, p.origin,
              p.grade, p.unit, p.price, p.status, p.description, i.stock, i.warn_stock
         FROM products p
         JOIN categories c ON c.id = p.category_id
         JOIN inventory i ON i.product_id = p.id
        ORDER BY p.updated_at DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.patch('/products/:id', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const data = z.object({
      name: z.string().min(1).max(120),
      price: z.number().min(0),
      status: z.enum(['on_sale', 'off_sale']),
      grade: z.string().min(1).max(50),
      origin: z.string().min(1).max(120),
      description: z.string().optional(),
      stock: z.number().int().min(0),
      warn_stock: z.number().int().min(0)
    }).parse(req.body);

    await conn.beginTransaction();
    await conn.query(
      `UPDATE products SET name = ?, price = ?, status = ?, grade = ?, origin = ?, description = ?
        WHERE id = ?`,
      [data.name, data.price, data.status, data.grade, data.origin, data.description || '', req.params.id]
    );
    await conn.query('UPDATE inventory SET stock = ?, warn_stock = ? WHERE product_id = ?', [data.stock, data.warn_stock, req.params.id]);
    await conn.commit();
    await delCacheByPattern('products:list:*');
    res.json({ message: '商品已更新' });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
});

router.get('/inventory', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id AS product_id, p.name, p.grade, p.unit, p.price, c.name AS category_name,
              i.stock, i.locked_stock, i.warn_stock, i.updated_at,
              CASE WHEN i.stock <= i.warn_stock THEN 1 ELSE 0 END AS is_warning
         FROM inventory i
         JOIN products p ON p.id = i.product_id
         JOIN categories c ON c.id = p.category_id
        ORDER BY is_warning DESC, i.updated_at DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.patch('/inventory/:productId', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const data = z.object({ stock: z.number().int().min(0), remark: z.string().optional() }).parse(req.body);
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT stock FROM inventory WHERE product_id = ? FOR UPDATE', [req.params.productId]);
    const beforeStock = rows[0].stock;
    await conn.query('UPDATE inventory SET stock = ? WHERE product_id = ?', [data.stock, req.params.productId]);
    await conn.query(
      `INSERT INTO inventory_logs (product_id, change_type, quantity, before_stock, after_stock, remark)
       VALUES (?, 'manual_adjust', ?, ?, ?, ?)`,
      [req.params.productId, data.stock - beforeStock, beforeStock, data.stock, data.remark || '后台手动调整']
    );
    await conn.commit();
    await delCacheByPattern('products:list:*');
    res.json({ message: '库存已更新' });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
});

router.get('/settings/deepseek', async (req, res, next) => {
  try {
    await ensureSettingsReady();
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ("deepseek_api_key", "deepseek_model", "deepseek_base_url")');
    const map = Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]));
    res.json({
      apiKey: map.deepseek_api_key || '',
      model: map.deepseek_model || process.env.DEEPSEEK_MODEL || 'gpt-5.4-mini',
      baseUrl: map.deepseek_base_url || process.env.DEEPSEEK_BASE_URL || 'https://fumin.ai/v1',
      configured: Boolean(map.deepseek_api_key || process.env.DEEPSEEK_API_KEY)
    });
  } catch (error) {
    next(error);
  }
});

router.put('/settings/deepseek', async (req, res, next) => {
  try {
    await ensureSettingsReady();
    const data = z.object({
      apiKey: z.string().optional(),
      model: z.string().min(1).default('gpt-5.4-mini'),
      baseUrl: z.string().url().default('https://fumin.ai/v1')
    }).parse(req.body);
    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value) VALUES ('deepseek_api_key', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [data.apiKey || '']
    );
    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value) VALUES ('deepseek_model', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [data.model]
    );
    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value) VALUES ('deepseek_base_url', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [data.baseUrl]
    );
    if (data.apiKey) {
      await ensureChatReady();
      await pool.query('UPDATE chat_sessions SET status = "ai" WHERE status = "human"');
    }
    res.json({ message: 'DeepSeek 配置已保存' });
  } catch (error) {
    next(error);
  }
});

router.post('/settings/deepseek/test', async (req, res, next) => {
  try {
    await ensureSettingsReady();
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ("deepseek_api_key", "deepseek_model", "deepseek_base_url")');
    const map = Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]));
    const apiKey = map.deepseek_api_key || process.env.DEEPSEEK_API_KEY;
    const model = map.deepseek_model || process.env.DEEPSEEK_MODEL || 'gpt-5.4-mini';
    const baseUrl = map.deepseek_base_url || process.env.DEEPSEEK_BASE_URL || 'https://fumin.ai/v1';
    if (!apiKey) return res.status(400).json({ message: '请先填写 DeepSeek API Key' });

    const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/chat/completions`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: '你是接口连通性测试助手。' },
          { role: 'user', content: '请回复：DeepSeek 已连接' }
        ],
        temperature: 0
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(400).json({ message: data.error?.message || `DeepSeek 测试失败：${response.status}` });
    }
    res.json({ message: 'DeepSeek 测试成功', reply: data.choices?.[0]?.message?.content || '' });
  } catch (error) {
    next(error);
  }
});

router.get('/settings/deepseek/models', async (req, res, next) => {
  try {
    await ensureSettingsReady();
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ("deepseek_api_key", "deepseek_base_url")');
    const map = Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]));
    const apiKey = map.deepseek_api_key || process.env.DEEPSEEK_API_KEY;
    const baseUrl = map.deepseek_base_url || process.env.DEEPSEEK_BASE_URL || 'https://fumin.ai/v1';
    if (!apiKey) return res.status(400).json({ message: '请先填写并保存 API Key' });

    const endpoint = `${baseUrl.replace(/\/$/, '')}/models`;
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(400).json({ message: data.error?.message || `模型列表获取失败：${response.status}` });
    }
    const models = Array.isArray(data.data) ? data.data.map((item) => item.id).filter(Boolean) : [];
    res.json({ models });
  } catch (error) {
    next(error);
  }
});

router.get('/chat/sessions', async (req, res, next) => {
  try {
    await ensureChatReady();
    const [rows] = await pool.query(
      `SELECT cs.id, cs.status, cs.last_message, cs.updated_at, u.username, u.nickname, u.phone
         FROM chat_sessions cs
         JOIN users u ON u.id = cs.user_id
        WHERE cs.status <> 'closed'
        ORDER BY cs.updated_at DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/chat/sessions/:id/messages', async (req, res, next) => {
  try {
    await ensureChatReady();
    const [rows] = await pool.query('SELECT id, sender, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC', [req.params.id]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/chat/sessions/:id/reply', async (req, res, next) => {
  try {
    await ensureChatReady();
    const data = z.object({ content: z.string().min(1).max(1000) }).parse(req.body);
    await pool.query('INSERT INTO chat_messages (session_id, sender, content) VALUES (?, "staff", ?)', [req.params.id, data.content]);
    await pool.query('UPDATE chat_sessions SET status = "human", last_message = ? WHERE id = ?', [data.content, req.params.id]);
    res.json({ message: '客服回复已发送' });
  } catch (error) {
    next(error);
  }
});

export default router;
