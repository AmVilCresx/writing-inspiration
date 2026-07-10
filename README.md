# 词林

> 遣词之源，落笔之林

一个简约的写作灵感收录网站，收集成语、短语、名人名言，为写作者提供参考。

## 特性

- 🎨 毛玻璃风格 UI（Glassmorphism）
- 🔍 全文搜索（标题、释义、出处、作者、例句、标签）
- 🏷️ 按类型筛选（成语 / 名言 / 俗语 / 诗词 / 歇后语）
- 🔐 管理员后台（JWT 认证）
- 📱 响应式设计

## 技术栈

- **框架**：Next.js 14 (App Router)
- **数据库**：Supabase (PostgreSQL)
- **样式**：原生 CSS（毛玻璃风格）
- **认证**：JWT + bcrypt

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 填入 Supabase 信息

# 启动开发服务（端口 3001）
npm run dev
```

### 环境变量

| 变量 | 说明 |
|---|---|
| `SUPABASE_HOST` | Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |

## 数据库

项目使用四张表：

| 表 | 用途 |
|---|---|
| `wi_entries` | 主数据（成语、名言等） |
| `wi_tags` | 标签字典 |
| `wi_entry_tags` | 条目 ↔ 标签关联 |
| `wi_admins` | 管理员账号 |

执行 `schema.sql` 初始化数据库结构和示例数据。

## 默认账号

- 邮箱：`admin@example.com`
- 密码：`admin123`

> ⚠️ 上线前请务必修改默认密码

## License

MIT
