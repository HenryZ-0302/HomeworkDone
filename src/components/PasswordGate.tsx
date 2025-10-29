// src/components/PasswordGate.tsx
import React, { useEffect, useState } from "react";

// 小工具：算 sha256（前端验证用）
async function sha256Hex(text: string) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type Config = { version: number; passwordHash: string };

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [ok, setOk] = useState(false);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  // 1️⃣ 拉取配置
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/config?ts=" + Date.now(), { cache: "no-store" });
        const data = (await res.json()) as Config;
        setConfig(data);
        // 如果本地存有相同版本登录记录，则直接放行
        if (localStorage.getItem("site_unlocked_v" + data.version) === "1") {
          setOk(true);
        }
      } catch {
        setErr("配置加载失败，请稍后再试。");
      }
    })();
  }, []);

  // 2️⃣ 提交密码
  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!config) return;
    const inputHash = await sha256Hex(pwd);
    const target = config.passwordHash.replace(/^sha256:/, "").toLowerCase();
    if (inputHash === target) {
      localStorage.setItem("site_unlocked_v" + config.version, "1");
      document.cookie = `site_unlocked_v${config.version}=1; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=*
