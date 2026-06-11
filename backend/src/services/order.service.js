import { nanoid } from 'nanoid';
import { withTransaction } from '../config/db.js';
import { delCacheByPattern } from '../config/redis.js';
import { httpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

export async function createOrder(userId, payload) {
  const orderNo = `DN${new Date().toISOString().slice(0, 10).replaceAll('-', '')}${nanoid(8).toUpperCase()}`;

  const result = await withTransaction(async (conn) => {
    const [cartRows] = await conn.query(
      `SELECT ca.product_id, ca.quantity, p.name, p.cover_url, p.price, i.stock
         FROM carts ca
         JOIN products p ON p.id = ca.product_id AND p.status = 'on_sale'
         JOIN inventory i ON i.product_id = p.id
        WHERE ca.user_id = ?
        FOR UPDATE`,
      [userId]
    );

    if (!cartRows.length) throw httpError(400, '购物车为空，无法下单');

    for (const item of cartRows) {
      if (item.stock < item.quantity) {
        throw httpError(400, `${item.name} 库存不足，当前库存 ${item.stock}`);
      }
    }

    const totalAmount = cartRows.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_no, user_id, total_amount, receiver_name, receiver_phone, receiver_address, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderNo, userId, totalAmount, payload.receiverName, payload.receiverPhone, payload.receiverAddress, payload.remark || null]
    );

    const orderId = orderResult.insertId;

    for (const item of cartRows) {
      const beforeStock = item.stock;
      const afterStock = beforeStock - item.quantity;
      await conn.query('UPDATE inventory SET stock = ? WHERE product_id = ?', [afterStock, item.product_id]);
      await conn.query(
        `INSERT INTO inventory_logs (product_id, change_type, quantity, before_stock, after_stock, ref_order_no, remark)
         VALUES (?, 'order_deduct', ?, ?, ?, ?, '下单扣减库存')`,
        [item.product_id, -item.quantity, beforeStock, afterStock, orderNo]
      );
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_cover, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.cover_url, item.price, item.quantity, Number(item.price) * item.quantity]
      );
    }

    await conn.query('DELETE FROM carts WHERE user_id = ?', [userId]);
    return { orderId, orderNo, totalAmount };
  });

  await delCacheByPattern('products:list:*');
  logger.info('order created and inventory deducted', result);
  return result;
}

export async function updateOrderStatus(orderId, nextStatus) {
  const allowed = {
    pending_pay: ['paid', 'cancelled'],
    paid: ['shipped', 'cancelled'],
    shipped: ['completed'],
    completed: [],
    cancelled: []
  };

  const result = await withTransaction(async (conn) => {
    const [orders] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    const order = orders[0];
    if (!order) throw httpError(404, '订单不存在');
    if (!allowed[order.status].includes(nextStatus)) {
      throw httpError(400, `订单状态不能从 ${order.status} 流转到 ${nextStatus}`);
    }

    if (nextStatus === 'cancelled') {
      const [items] = await conn.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of items) {
        const [inventories] = await conn.query('SELECT * FROM inventory WHERE product_id = ? FOR UPDATE', [item.product_id]);
        const inventory = inventories[0];
        const beforeStock = inventory.stock;
        const afterStock = beforeStock + item.quantity;
        await conn.query('UPDATE inventory SET stock = ? WHERE product_id = ?', [afterStock, item.product_id]);
        await conn.query(
          `INSERT INTO inventory_logs (product_id, change_type, quantity, before_stock, after_stock, ref_order_no, remark)
           VALUES (?, 'order_cancel_return', ?, ?, ?, ?, '取消订单回补库存')`,
          [item.product_id, item.quantity, beforeStock, afterStock, order.order_no]
        );
      }
    }

    const timeColumn = {
      paid: 'paid_at',
      shipped: 'shipped_at',
      completed: 'completed_at',
      cancelled: 'cancelled_at'
    }[nextStatus];

    await conn.query(`UPDATE orders SET status = ?, ${timeColumn} = NOW() WHERE id = ?`, [nextStatus, orderId]);
    return { orderNo: order.order_no, status: nextStatus };
  });

  await delCacheByPattern('products:list:*');
  logger.info('order status changed', result);
  return result;
}
