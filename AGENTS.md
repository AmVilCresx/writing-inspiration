# 仓库指南

## 项目结构与模块组织

本项目为「词林」，一个基于 Next.js 14 (App Router) 的写作灵感收录网站。

```
writing-inspiration/
├── src/
│   ├── app/              # App Router 路由与页面
│   │   ├── admin/        # 管理员后台（登录、密码、控制面板）
│   │   ├── api/          # 后端 API 路由
│   │   │   └── admin/    # 管理端 API（entry / tag / type CRUD）
│   │   └── entry/        # 条目展示（列表与详情页）
│   ├── components/       # 共享 React 组件
│   ├── data/             # 数据访问层（封装 Supabase 查询）
│   └── lib/              # 工具库（auth、supabase 客户端）
├── public/               # 静态资源
├── schema.sql            # 数据库初始化脚本（表结构 + 示例数据）
├── next.config.js        # Next.js 配置
└── package.json          # 依赖与脚本
```

数据库四张表：`wi_entries`（主数据）、`wi_tags`（标签字典）、`wi_entry_tags`（条目 ↔ 标签关联）、`wi_admins`（管理员账号）。

## 构建、测试与开发命令

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务（端口 3001）
npm run build      # 构建生产版本
npm run start      # 启动生产服务
```

环境变量配置：复制 `.env.local.example` 为 `.env.local`，填入 Supabase 信息（`SUPABASE_HOST`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`）。

首次运行前需在 Supabase 中执行 `schema.sql` 初始化数据库。

## 编码风格与命名约定

- **语言**：TypeScript（`.ts` / `.tsx`），组件文件使用 PascalCase
- **工具/数据文件**：camelCase（如 `entries.ts`、`auth.ts`）
- **API 路由**：每接口一个 `route.ts`，按资源分子目录
- **数据库表名**：统一 `wi_` 前缀
- **样式**：原生 CSS（毛玻璃风格），全局样式位于 `src/app/globals.css`
- **格式化**：Prettier（`singleQuote: true`、`trailingComma: all`、`tabWidth: 2`）

## 测试指南

项目暂缺自动化测试。开发新功能时请：

1. 本地 `npm run dev` 手动验证渲染与交互
2. 通过浏览器开发者工具或 `curl` 验证 API 响应格式
3. 涉及数据库变更时同步更新 `schema.sql` 的示例数据

后续建议引入 Vitest（单元测试）与 Playwright（端到端测试）。

## 提交与 Pull Request 指南

提交信息遵循 Conventional Commits 规范：

```
<type>(<scope>): <description>
```

type 包括：`feat`（新功能）、`fix`（修复）、`docs`（文档）、`style`（格式）、`refactor`（重构）、`chore`（杂项）。

示例：`feat(entry): 添加分页功能`

PR 要求：
- 清晰描述变更内容与动机
- 关联 Issue 时引用编号（如 `Closes #3`）
- UI 变更请附截图或录屏
- 确保 `npm run build` 通过后再提 PR

## 安全与配置提示

- **默认管理员账号**：`admin@example.com` / `admin123`——上线前务必修改
- **密钥管理**：`.env.local` 已在 `.gitignore` 中，切勿提交到仓库
- **Service Role Key**：仅在服务端使用，禁止暴露给客户端
- **密码存储**：使用 bcrypt 加密（cost factor ≥ 10）
