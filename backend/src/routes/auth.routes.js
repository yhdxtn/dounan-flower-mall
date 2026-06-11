import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const registerSchema = z.object({
  username: z.string().min(3, '账号至少 3 位').max(30, '账号不能超过 30 位'),
  password: z.string().min(6, '密码至少 6 位').max(30, '密码不能超过 30 位'),
  nickname: z.string().min(1, '请填写昵称').max(30, '昵称不能超过 30 位'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号')
});

function signUser(user) {
  const payload = { id: user.id, username: user.username, nickname: user.nickname, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'dounan-flower-local-secret', { expiresIn: '8h' });
  return { token, user: payload };
}

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const [exists] = await pool.query('SELECT id FROM users WHERE username = ?', [data.username]);
    if (exists.length) throw httpError(409, '账号已存在');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (username, password_hash, nickname, phone, role)
       VALUES (?, ?, ?, ?, 'buyer')`,
      [data.username, passwordHash, data.nickname, data.phone]
    );

    res.status(201).json(signUser({
      id: result.insertId,
      username: data.username,
      nickname: data.nickname,
      role: 'buyer'
    }));
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [data.username]);
    const user = rows[0];
    if (!user) throw httpError(401, '账号或密码错误');

    const ok = user.password_hash.startsWith('plain:')
      ? data.password === user.password_hash.slice(6)
      : await bcrypt.compare(data.password, user.password_hash);
    if (!ok) throw httpError(401, '账号或密码错误');

    res.json(signUser(user));
  } catch (error) {
    next(error);
  }
});

export default router;
