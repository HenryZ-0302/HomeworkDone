import React, { useEffect, useState } from 'react';

// 计算 sha256（前端验证用）
async function sha256Hex(text: string) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map(function (b) { return b.toString(16).padStart(2, '0'); })
    .join('');
}

type Config = { version: number; passwordHash: string };

// 带超时的 fetch，方便定位错误
async function fetchJSONWithTimeout(url: string, ms: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, ms);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
    const text = await res.text();
    if (!res.ok) throw new Error('HTTP ' + String(res.status) + ' ' + text.slice(0, 200));
    try { return JSON.parse(text); }
    catch (e) { throw new Error('JSON parse error: ' + text.slice(0, 200)); }
  } finally {
    clearTimeout(timer);
  }
}

export default function PasswordGate(props: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [ok, setOk] = useState(false);
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadConfig() {
    setLoading(true);
    setErr('');
    setDetail('');
    try {
      // 必须用相对路径 /config，才能命中同域 Worker 路由
      const data = await fetchJSONWithTimeout('/config?ts=' + String(Date.now()), 8000);
      if (!data || typeof (data as any).version !== 'number' || !(data as any).passwordHash) {
        throw new Error('Bad config format');
      }
      const cfg = data as Config;
      setConfig(cfg);
      const key = 'site_unlocked_v' + String(cfg.version);
      if (localStorage.getItem(key) === '1') setOk(true);
    } catch (e: any) {
      setErr('配置加载失败，请稍后再试。');
      setDetail(String(e && e.message ? e.message : e));
      console.error('配置拉取失败：', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () { loadConfig(); }, []);

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!config) { setErr('配置未就绪，请先重试加载。'); return; }
    try {
      const inputHash = (await sha256Hex(pwd)).toLowerCase();
      const target = (config.passwordHash || '').replace(/^sha256:/, '').toLowerCase();
      if (target.length === 0) { setErr('配置无效：缺少密码哈希。'); return; }
      if (inputHash === target) {
        const key = 'site_unlocked_v' + String(config.version);
        try { localStorage.setItem(key, '1'); } catch (_) {}
        document.cookie = key + '=1; Max-Age=' + String(60*60*24*30) + '; Path=/; SameSite=Lax; Secure';
        setOk(true); setPwd(''); setErr('');
      } else {
        setErr('密码错误，请重试。');
      }
    } catch (_) {
      setErr('校验失败，请稍后再试。');
    }
  }

  if (ok) return <>{props.children}</>;
  if (loading && !err) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0 as unknown as number, display: 'flex',
      alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', zIndex: 9999
    }}>
      <form onSubmit={submit} style={{
        background: '#fff', padding: 24, borderRadius: 12, width: 360,
        boxShadow: '0 10px 30px rgba(0,0,0,.2)'
      }}>
        <h3 style={{ marginTop: 0 }}>请输入访问密码</h3>

        {config === null ? (
          <>
            <div style={{ color: '#d33', marginTop: 8, fontSize: 12 }}>
              {err || '配置加载失败'}
            </div>
            {detail ? (
              <pre style={{
                marginTop: 8, padding: 8, background: '#f7f7f7',
                border: '1px solid #eee', maxHeight: 150, overflow: 'auto', fontSize: 12
              }}>{detail}</pre>
            ) : null}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" onClick={function(){ loadConfig(); }}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: '#111', color: '#fff' }}>
                重新加载配置
              </button>
              <a href="/config" target="_blank" rel="noreferrer"
                style={{ flex: 1, textAlign: 'center', padding: '10px 12px',
                         borderRadius: 8, background: '#eee', color: '#111', textDecoration: 'none' }}>
                打开 /config
              </a>
            </div>
          </>
        ) : (
          <>
            <input
              type="password" value={pwd}
              onChange={function(e){ setPwd(e.target.value); }}
              placeholder="访问密码" autoFocus
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd' }}
            />
            {err ? <div style={{ color: '#d33', marginTop: 8, fontSize: 12 }}>{err}</div> : null}
            <button type="submit" style={{
              marginTop: 12, width: '100%', padding: '10px 12px',
              borderRadius: 8, background: '#111', color: '#fff'
            }}>进入</button>
            <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
              登录状态保存在本机。管理员修改密码或版本后将强制重新登录。
            </div>
          </>
        )}
      </form>
    </div>
  );
}
