import { createClient, SupabaseClient } from "@supabase/supabase-js";

const host = process.env.SUPABASE_HOST;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!host) throw new Error("缺少环境变量 SUPABASE_HOST");
if (!anonKey) throw new Error("缺少环境变量 SUPABASE_ANON_KEY");
if (!serviceRoleKey) throw new Error("缺少环境变量 SUPABASE_SERVICE_ROLE_KEY");

/**
 * 匿名客户端 — 用于前端只读查询（搜索、列表、详情）
 */
export const supabaseAnon: SupabaseClient = createClient(host, anonKey);

/**
 * 服务端客户端 — 用于 admin 后台增删改（绕过 RLS）
 */
export const supabaseService: SupabaseClient = createClient(host, serviceRoleKey);
