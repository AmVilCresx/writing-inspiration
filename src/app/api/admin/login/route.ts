import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import jwt from "jsonwebtoken";
import { COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/constants";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "";
if (!JWT_SECRET) throw new Error("缺少 JWT_SECRET");

// ── 内存速率限制器 ──
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 分钟窗口
const RATE_MAX_ATTEMPTS = 10;           // 窗口内最多 10 次尝试
const attemptsMap = new Map<string, number[]>();

// 定期清理过期记录，防止内存泄漏
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of attemptsMap) {
    const valid = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
    if (valid.length === 0) attemptsMap.delete(key);
    else attemptsMap.set(key, valid);
  }
}, 60_000);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (attemptsMap.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  attemptsMap.set(ip, timestamps);
  if (timestamps.length >= RATE_MAX_ATTEMPTS) return true;
  timestamps.push(now);
  return false;
}

export async function POST(req: NextRequest) {
  // 速率限制：基于客户端 IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "登录尝试过于频繁，请 15 分钟后再试" },
      { status: 429 },
    );
  }

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "请填写邮箱和密码" }, { status: 400 });
  }

  const admin = await verifyAdmin(email, password);
  if (!admin) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }

  const token = jwt.sign({ email: admin.email }, JWT_SECRET, { expiresIn: "7d" as const });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}
