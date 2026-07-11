import { createClient, SupabaseClient } from "@supabase/supabase-js";

const host = process.env.SUPABASE_HOST;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!host) throw new Error("缺少环境变量 SUPABASE_HOST");
if (!anonKey) throw new Error("缺少环境变量 SUPABASE_ANON_KEY");
if (!serviceRoleKey) throw new Error("缺少环境变量 SUPABASE_SERVICE_ROLE_KEY");

/**
 * 自定义 fetch，带超时控制（5 秒），避免 Supabase 查询无限等待
 */
const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeout)
  );
};

/**
 * 匿名客户端 — 用于前端只读查询（搜索、列表、详情）
 */
export const supabaseAnon: SupabaseClient = createClient(host, anonKey, {
  global: { fetch: fetchWithTimeout },
});

/**
 * 服务端客户端 — 用于 admin 后台增删改（绕过 RLS）
 */
export const supabaseService: SupabaseClient = createClient(host, serviceRoleKey, {
  global: { fetch: fetchWithTimeout },
});
