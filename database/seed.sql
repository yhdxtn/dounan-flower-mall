USE dounan_flower_mall;

INSERT INTO users (username, password_hash, nickname, phone, role) VALUES
('admin', 'plain:admin123', '斗南运营员', '13800000001', 'admin'),
('buyer', 'plain:buyer123', '鲜花采购商', '13800000002', 'buyer');

INSERT INTO categories (name, sort_order) VALUES
('玫瑰', 1),
('百合', 2),
('康乃馨', 3),
('配草配叶', 4);

INSERT INTO products (category_id, name, cover_url, origin, grade, unit, price, status, description) VALUES
(1, '卡罗拉红玫瑰', 'https://images.unsplash.com/photo-1518709779341-56cf4535e94b?auto=format&fit=crop&w=900&q=80', '昆明斗南', 'A级', '扎', 36.80, 'on_sale', '花头饱满，适合节庆和花店日常备货。'),
(1, '粉雪山玫瑰', 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&w=900&q=80', '昆明斗南', 'A级', '扎', 42.00, 'on_sale', '浅粉色系，适合婚庆和礼盒花束。'),
(2, '西伯利亚百合', 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&q=80', '昆明斗南', 'B级', '扎', 28.50, 'on_sale', '香味浓郁，开放度稳定。'),
(3, '红色康乃馨', 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=80', '昆明斗南', 'A级', '扎', 19.90, 'on_sale', '家庭与节日场景常用花材。'),
(4, '尤加利叶', 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80', '昆明斗南', '通货', '把', 12.80, 'on_sale', '搭配玫瑰、百合可提升花束层次。');

INSERT INTO inventory (product_id, stock, locked_stock, warn_stock) VALUES
(1, 300, 0, 50),
(2, 160, 0, 30),
(3, 220, 0, 40),
(4, 500, 0, 80),
(5, 360, 0, 60);
