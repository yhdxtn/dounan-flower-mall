# 斗南鲜花商城业务系统

基于 Vue3 / Element Plus / Node.js / Express / MySQL / Redis / Nginx / PM2 的本地部署全栈项目，围绕昆明斗南鲜花交易场景，覆盖商品、购物车、订单、库存和后台管理。

## 目录

```text
dounan-flower-mall
  backend/              Express API 服务
  frontend/             Vue3 + Element Plus 前端
  database/             MySQL 建表与初始化数据
  deploy/               Nginx、PM2、Windows 部署脚本
```

## 功能

- 商城端：鲜花商品浏览、分类筛选、购物车、下单、订单查询。
- 管理端：商品管理、库存调整、订单查询、订单状态流转。
- 库存：下单事务内扣减库存，取消订单自动回补库存。
- 查询：后台订单列表使用 SQL 联表返回用户、订单、明细和商品信息，避免页面数据不一致。
- 缓存：Redis 缓存分类与商品列表，库存/订单变更后自动失效。
- 部署：PM2 进程守护，Nginx 静态资源与 API 反向代理。

## D 盘本地部署

项目路径建议：

```powershell
D:\github\dounan-flower-mall
```

环境建议放在：

```powershell
D:\dev\node
D:\dev\redis
D:\dev\nginx
D:\JAVA\MySQL\mysql-8.0.46-winx64
```

详细步骤见 [deploy/windows-local.md](deploy/windows-local.md)。

## 快速启动

1. 安装 Node.js 到 `D:\dev\node`，并确保 `node`、`npm` 可用。
2. 在 MySQL 中执行：

```powershell
mysql -uroot -p < D:\github\dounan-flower-mall\database\schema.sql
mysql -uroot -p < D:\github\dounan-flower-mall\database\seed.sql
```

3. 复制后端环境变量：

```powershell
Copy-Item backend\.env.example backend\.env
```

4. 安装依赖并启动：

```powershell
npm run setup
npm run dev
```

前端默认：http://localhost:5173

后端默认：http://localhost:3000/api

也可以直接使用脚本：

```powershell
powershell -ExecutionPolicy Bypass -File deploy\init-database.ps1
powershell -ExecutionPolicy Bypass -File deploy\start-dev.ps1
```

## 默认账号

```text
管理员：admin / admin123
买家：buyer / buyer123
```

## 常用部署命令

```powershell
npm run build
pm2.cmd start deploy\pm2.ecosystem.config.cjs
pm2.cmd logs dounan-api
pm2.cmd restart dounan-api
pm2.cmd stop dounan-api
```

生产启动脚本：

```powershell
powershell -ExecutionPolicy Bypass -File deploy\start-prod.ps1
powershell -ExecutionPolicy Bypass -File deploy\start-nginx.ps1
```
