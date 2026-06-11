# Windows 本地部署说明

以下路径都按 D 盘组织：

```text
D:\github\dounan-flower-mall
D:\dev\node
D:\dev\redis
D:\dev\nginx
D:\JAVA\MySQL\mysql-8.0.46-winx64
```

## 1. Node.js

下载安装 Node.js Windows x64 zip 包，解压到：

```text
D:\dev\node
```

把下面路径加入系统 PATH：

```text
D:\dev\node
```

确认：

```powershell
node -v
npm -v
```

## 2. MySQL

当前机器已检测到 MySQL：

```text
D:\JAVA\MySQL\mysql-8.0.46-winx64\bin\mysql.exe
```

导入数据库：

```powershell
cd D:\github\dounan-flower-mall
mysql -uroot -p < database\schema.sql
mysql -uroot -p < database\seed.sql
```

修改后端配置：

```powershell
Copy-Item backend\.env.example backend\.env
notepad backend\.env
```

重点检查：

```text
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=dounan_flower_mall
```

## 3. Redis

Windows 可使用 Redis 兼容发行版或 Docker 运行。若使用本地 zip 包，建议放在：

```text
D:\dev\redis
```

启动后确认 6379 端口可用。后端把 Redis 当缓存使用，Redis 未启动时接口仍可访问，只是没有缓存。

## 4. 安装依赖

```powershell
cd D:\github\dounan-flower-mall
npm install
npm run setup
```

## 5. 开发启动

```powershell
npm run dev
```

访问：

```text
http://localhost:5173
```

或者：

```powershell
powershell -ExecutionPolicy Bypass -File deploy\start-dev.ps1
```

## 6. 生产构建

```powershell
npm run build
npm install -g pm2
pm2.cmd start deploy\pm2.ecosystem.config.cjs
pm2.cmd save
```

或者：

```powershell
powershell -ExecutionPolicy Bypass -File deploy\start-prod.ps1
```

常用命令：

```powershell
pm2.cmd list
pm2.cmd logs dounan-api
pm2.cmd restart dounan-api
pm2.cmd stop dounan-api
```

## 7. Nginx

安装 Nginx 到：

```text
D:\dev\nginx
```

把 `deploy\nginx.conf` 复制覆盖到：

```text
D:\dev\nginx\conf\nginx.conf
```

启动：

```powershell
cd D:\dev\nginx
start nginx
```

访问：

```text
http://localhost:8080
```

重载配置：

```powershell
nginx -s reload
```

停止：

```powershell
nginx -s stop
```

也可以从项目目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File deploy\start-nginx.ps1
```

## 8. 常见问题

### 下单后库存未同步

检查后端日志：

```powershell
pm2 logs dounan-api
```

重点看 `createOrder` 是否进入事务、是否存在库存不足报错。数据库可查：

```sql
SELECT * FROM inventory WHERE product_id = 1;
SELECT * FROM inventory_logs ORDER BY id DESC LIMIT 20;
```

### 订单状态异常

系统只允许：

```text
pending_pay -> paid -> shipped -> completed
pending_pay/paid -> cancelled
```

取消订单会回补库存。若提示状态不能流转，说明当前状态和操作不匹配。

### 后台查询数据不一致

后台订单查询使用 `orders + users + order_items` 联表。若明细缺失，检查：

```sql
SELECT * FROM orders ORDER BY id DESC LIMIT 5;
SELECT * FROM order_items WHERE order_id = 订单ID;
```

### 回滚

前端回滚：重新部署上一版 `frontend/dist`。

后端回滚：

```powershell
pm2 stop dounan-api
cd D:\github\dounan-flower-mall
git checkout 上一版本
npm install --prefix backend
pm2 start deploy\pm2.ecosystem.config.cjs
```
