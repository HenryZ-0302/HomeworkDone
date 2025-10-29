// src/components/PasswordGate.tsx
import React, { useEffect, useState } from "react";

// ① 固定一个版本化键名（换全员重登时，把 _v2 改成 _v3）
const STORAGE_KEY = "site_unlocked_v3"; // ← 现在就用这个，不要每次发布都换
const COOKIE_NAME = "site_unlocked_v3";

// ② 简单密码（先跑通；要改就改这里）
const PASSWORD = "Henry";

// 读/写 Cookie（前端可读）——双保险：有任意一个命中就算已登录
function getCookie(name: string) {
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="))
    ?.split("=")[1];
}
function setCookie(name: string, value: string, days = 30) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  // ③ 在 useState 初始值里同步读取（避免首次渲染先出现遮罩）
  const [ok, setOk] = useState<boolean>(() => {
    try {
      if (typeof window === "undefined") return false;
      const ls = localStorage.getItem(STORAGE_KEY) === "1";
      const ck = getCookie(COOKIE_NAME) === "1";
      return ls || ck;
    } catch {
      return false;
    }
  });
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  // ④ 多标签页同步（A 标签登录，B 标签自动放行）
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue === "1") setOk(true);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr("");
    if (pwd === PASSWORD) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {}
      setCookie(COOKIE_NAME, "1", 30);
      setOk(true);
      setPwd("");
    } else {
      setErr("密码错误，请重试");
    }
  };

  if (ok) return <>{children}</>;

  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.55)",zIndex:99999}}>
      <form onSubmit={submit} style={{background:"#fff",padding:24,borderRadius:12,width:320,boxShadow:"0 10px 30px rgba(0,0,0,.2)"}}>
        <h3 style={{marginTop:0, marginBottom:12}}>请输入访问密码</h3>
        <input
          type="password"
          value={pwd}
          onChange={(e)=>setPwd(e.target.value)}
          placeholder="访问密码"
          autoFocus
          style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #ddd"}}
        />
        {err && <div style={{ color:"#d33", marginTop:8, fontSize:12 }}>{err}</div>}
        <button type="submit" style={{marginTop:12,width:"100%",padding:"10px 12px",borderRadius:8,background:"#111",color:"#fff"}}>进入</button>
        <div style={{ marginTop:8, color:"#888", fontSize:12 }}>
          登录状态会保存在本机（localStorage + Cookie）。如需强制所有人重登，请更改版本号。
        </div>
      </form>
    </div>
  );
}
