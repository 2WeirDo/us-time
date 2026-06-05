# UsTime — 属于两个人的私密空间 💕

一个温暖的情侣时光胶囊 App，记录在一起的每一天。

## 功能

- **时光轴** — 记录每一天的文字、照片、语音和心情
- **照片墙** — 展示所有照片的瀑布流视图
- **纪念日倒计时** — 自动计算在一起的天数和下一个纪念日
- **今日心情** — 双向记录每日心情，同步显示双方状态
- **手写信** — 手写画布，写一封给TA的信
- **情侣清单** — 一起完成的心愿清单
- **足迹地图** — 记录一起走过的地点
- **那年今日** — 回顾去年的今天
- **虚拟宠物** — 一起照顾的小宠物，心情越好宠物越开心
- **实时同步** — 基于 Supabase Realtime 即时同步双方数据
- **设备配对** — 通过配对码 / QR 码连接两台设备
- **数据管理** — 导出 / 导入备份，重置数据

## 技术栈

- **框架**: React 18 + TypeScript (strict mode)
- **构建**: Vite 5
- **路由**: React Router v7 (HashRouter)
- **动画**: framer-motion + CSS animations
- **状态管理**: React Context + hooks (分领域管理)
- **数据库**: Supabase (PostgreSQL)
- **实时同步**: Supabase Realtime (统一单通道)
- **存储**: Supabase Storage (照片/语音)
- **样式**: Tailwind CSS
- **PWA**: vite-plugin-pwa (离线缓存，运行时缓存)
- **地图**: Leaflet + MarkerCluster
- **二维码**: qrcode (动态导入)

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build

# 预览构建
npm run preview

# 代码检查
npm run lint
```

### Supabase 配置

1. 在 [supabase.com](https://supabase.com) 创建免费项目
2. 在 Dashboard → SQL Editor 中执行 `supabase-migration.sql`
3. 进入 Settings → API，复制 Project URL 和 anon/public key
4. 在 App 中输入这些信息即可连接

## 安全说明

- 密码使用 **SHA-256** 哈希后存储，不保存明文
- 客户端有防暴力破解机制（5 次失败后锁定 30 秒）
- Supabase 使用 RLS 启用（所有表已启用行级安全）
- PWA 运行时缓存策略：API 请求走 NetworkFirst，静态资源走 CacheFirst

## 优化历史

详见 [CHANGELOG](./CHANGELOG.md)（待补充）。
