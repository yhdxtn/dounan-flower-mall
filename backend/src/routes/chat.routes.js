import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { auth } from '../middleware/auth.js';

const router = Router();
let tablesReady = false;

export async function ensureChatReady() {
  if (tablesReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key VARCHAR(80) PRIMARY KEY,
      setting_value TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      status ENUM('ai', 'human', 'closed') NOT NULL DEFAULT 'ai',
      last_message VARCHAR(500),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_chat_sessions_user (user_id, status),
      CONSTRAINT fk_chat_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      session_id BIGINT NOT NULL,
      sender ENUM('user', 'ai', 'staff', 'system') NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_chat_messages_session (session_id, created_at),
      CONSTRAINT fk_chat_messages_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  tablesReady = true;
}

async function getSetting(key) {
  await ensureChatReady();
  const [rows] = await pool.query('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]);
  return rows[0]?.setting_value || '';
}

async function findOrCreateSession(userId) {
  await ensureChatReady();
  const [rows] = await pool.query(
    `SELECT id, status FROM chat_sessions
      WHERE user_id = ? AND status <> 'closed'
      ORDER BY updated_at DESC LIMIT 1`,
    [userId]
  );
  if (rows[0]) return rows[0];
  const [result] = await pool.query('INSERT INTO chat_sessions (user_id, status) VALUES (?, "ai")', [userId]);
  return { id: result.insertId, status: 'ai' };
}

async function askDeepSeek(message) {
  const apiKey = await getSetting('deepseek_api_key') || process.env.DEEPSEEK_API_KEY;
  const model = await getSetting('deepseek_model') || process.env.DEEPSEEK_MODEL || 'gpt-5.4-mini';
  const baseUrl = await getSetting('deepseek_base_url') || process.env.DEEPSEEK_BASE_URL || 'https://fumin.ai/v1';
  if (!apiKey) throw new Error('DeepSeek API Key not configured');

  const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 75000);

  const response = await fetch(endpoint, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: '你是斗斗鲜花商城客服，回答要简短温柔。可以帮助用户选花、查询下单流程、说明库存与配送。无法处理售后或人工操作时，引导转人工客服。'
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    })
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) throw new Error(`DeepSeek request failed: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '我已经收到啦，可以再详细说说你的需求吗？';
}

router.use(auth());

router.get('/session', async (req, res, next) => {
  try {
    const session = await findOrCreateSession(req.user.id);
    const [messages] = await pool.query(
      'SELECT id, sender, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [session.id]
    );
    res.json({ session, messages });
  } catch (error) {
    next(error);
  }
});

router.post('/messages', async (req, res, next) => {
  try {
    const data = z.object({ content: z.string().min(1).max(1000) }).parse(req.body);
    const session = await findOrCreateSession(req.user.id);
    await pool.query('INSERT INTO chat_messages (session_id, sender, content) VALUES (?, "user", ?)', [session.id, data.content]);
    await pool.query('UPDATE chat_sessions SET last_message = ? WHERE id = ?', [data.content, session.id]);

    if (session.status === 'human') {
      return res.json({ mode: 'human', reply: '已为你转接人工客服，客服看到后会在这里回复。' });
    }

    try {
      const reply = await askDeepSeek(data.content);
      await pool.query('INSERT INTO chat_messages (session_id, sender, content) VALUES (?, "ai", ?)', [session.id, reply]);
      await pool.query('UPDATE chat_sessions SET last_message = ? WHERE id = ?', [reply, session.id]);
      return res.json({ mode: 'ai', reply });
    } catch (error) {
      const fallback = error.name === 'AbortError'
        ? 'DeepSeek 回复时间较长，已为你转接人工客服。你也可以稍后点击“DeepSeek 接管”再试。'
        : 'DeepSeek 客服暂时不可用，已为你转接人工客服，请留下你的需求或订单号。';
      await pool.query('UPDATE chat_sessions SET status = "human", last_message = ? WHERE id = ?', [fallback, session.id]);
      await pool.query('INSERT INTO chat_messages (session_id, sender, content) VALUES (?, "system", ?)', [session.id, fallback]);
      return res.json({ mode: 'human', reply: fallback });
    }
  } catch (error) {
    next(error);
  }
});

router.post('/human', async (req, res, next) => {
  try {
    const session = await findOrCreateSession(req.user.id);
    const message = '已为你转接人工客服，请描述问题或留下订单号。';
    await pool.query('UPDATE chat_sessions SET status = "human", last_message = ? WHERE id = ?', [message, session.id]);
    await pool.query('INSERT INTO chat_messages (session_id, sender, content) VALUES (?, "system", ?)', [session.id, message]);
    res.json({ message });
  } catch (error) {
    next(error);
  }
});

router.post('/ai', async (req, res, next) => {
  try {
    const session = await findOrCreateSession(req.user.id);
    const message = '已切换为 DeepSeek 智能客服，将优先由 AI 回复。';
    await pool.query('UPDATE chat_sessions SET status = "ai", last_message = ? WHERE id = ?', [message, session.id]);
    await pool.query('INSERT INTO chat_messages (session_id, sender, content) VALUES (?, "system", ?)', [session.id, message]);
    res.json({ message });
  } catch (error) {
    next(error);
  }
});

export default router;
