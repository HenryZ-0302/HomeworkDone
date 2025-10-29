// src/components/PasswordGate.tsx
import React, { useEffect, useState } from 'react';

// 计算 sha256（前端验证用）
async function sha256Hex(text: string) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

type Config = { version: number; passwordHash: string };

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [ok, setOk] = useState(false);
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');

  // 1) 拉取配置
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/config?ts=' + String(Date.now()), { cache: 'no-store' });
        const data = (await res.json()) as Config;
        setConfig(data);

        // 命中相同版本的已登录记录则直接放行
        if (localStorage.getItem('site_unlocked_v' + String(data.version)) === '1') {
          setOk(true);
        }
      } catch {
        setErr('配置加载失败，请稍后再试。');
      }
    })();
  }, []);

  // 2) 提交密码
  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!config) return;

    const inputHash = (await sha256Hex(pwd)).toLowerCase();
    const target = (config.passwordHash || '').replace(/^sha256:/, '').toLowerCase();

    if (inputHash === target && target.length > 0) {
      const key = 'site_unlocked_v' + String(config.version);
      try {
        localStorage.setItem(key, '1');
      } catch {}
      // 写一个 30 天有效的 Cookie（无反引号）
      document.cookie =
        key +
        '=1; Max-Age=' +
        String(60 * 60 * 24 * 30) +
        '; Path=/; SameSite=Lax; Secure';
      setOk(true);
      setPwd('');
      setErr('');
    } else {
      setErr('密码错误，请重试。');
    }
  }

  // 3) 已验证通过
  if (ok) return <>{children}</>;

  // 4) 等配置回来前不渲染（避免闪烁）
  if (!config && !err) return null;

  // 5) 弹窗界面
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999
      }}
    >
      <form
        onSubmit={submit}
        style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          width: 320,
          boxShadow: '0 10px 30px rgba(0,0,0,.2)'
        }}
      >
        <h3 style={{ marginTop: 0 }}>请输入访问密码</h3>
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="访问密码"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #ddd'
          }}
        />
        {err ? (
          <div style={{ color: '#d33', marginTop: 8, fontSize: 12 }}>{err}</div>
        ) : null}
        <button
          type="submit"
          style={{
            marginTop: 12,
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            background: '#111',
            color: '#fff'
          }}
        >
          进入
        </button>
        <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
          登录状态保存在本机。管理员修改密码或版本后将强制重新登录。
        </div>
      </form>
    </div>
  );
}
