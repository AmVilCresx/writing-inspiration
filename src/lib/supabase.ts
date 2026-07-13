import { createClient, SupabaseClient } from "@supabase/supabase-js";

const host = process.env.SUPABASE_HOST;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!host) throw new Error("缺少环境变量 SUPABASE_HOST");
if (!anonKey) throw new Error("缺少环境变量 SUPABASE_ANON_KEY");
if (!serviceRoleKey) throw new Error("缺少环境变量 SUPABASE_SERVICE_ROLE_KEY；（1.3）确保生产环境使用强密钥");

/**
 * 自定义 fetch，带超时控制（5 秒）
 */
const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeout)
  );
};

/**
 * 匿名客户端 — 前端只读查询
 */
export const supabaseAnon: SupabaseClient = createClient(host, anonKey, {
  global: { fetch: fetchWithTimeout },
});

/**
 * 服务端客户端 — admin CRUD（绕过 RLS）
 */
export const supabaseService: SupabaseClient = createClient(host, serviceRoleKey, {
  global: { fetch: fetchWithTimeout },
});