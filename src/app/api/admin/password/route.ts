import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookie } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase";

export async function PUT(req: NextRequest) {
  const admin = await verifyAdminCookie();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { oldPassword, newPassword } = await req.json();
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "请填写完整" }, { status: 400 });
  }

  // 查当前密码哈希
  const { data, error } = await supabaseService
    .from("wi_admins")
    .select("password_hash")
    .eq("email", admin.email)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "用户不存在" }, { status: 400 });
  }

  // 校验旧密码
  const bcrypt = await import("bcryptjs");
  const ok = await bcrypt.compare(oldPassword, data.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "当前密码错误" }, { status: 400 });
  }

  // 更新为新密码
  const newHash = await bcrypt.hash(newPassword, 10);
  await supabaseService
    .from("wi_admins")
    .update({ password_hash: newHash })
    .eq("email", admin.email);

  return NextResponse.json({ ok: true });
}
