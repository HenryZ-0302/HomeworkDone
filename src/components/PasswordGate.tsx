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

export default function PasswordGate(props: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [ok, setOk] = useState(false);
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  // 封装获取配置
  async function loadConfig() {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/config?ts=' + String(Date.now()), { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('HTTP ' + String(res.status));
      }
      const data = (await res.json()) as Config;

      // 基本校验
      if (
        !data ||
        typeof data.version !== 'number' ||
        !data.passwordHash ||
        typeof data.passwordHash !== 'string'
      ) {
        throw new Error('Bad config format');
      }

      setConfig(data);

      // 命中相同版本的已登录记录则直接放行
      const key = 'site_unlocked_v' + String(data.version);
      if (localStorage.getItem(key) === '1') {
        setOk(true);
      }
    } catch (e) {
      setErr('配置加载失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  }

  // 启动时拉配置
  useEffect(function () {
    loadConfig();
  }, []);

  // 提交密码
  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!config) {
      setErr('配置未就绪，请刷新页面重试。');
      return;
    }

    try {
      const inputHash = (await sha256Hex(pwd)).toLowerCase();
      const target = (config.passwordHash || '')
        .replace(/^sha256:/, '')
        .toLowerCase();

      if (target.length === 0) {
        setErr('配置无效：缺少密码哈希。');
        return;
      }

      if (inputHash === target) {
        const key = 'site_unlocked_v' + String(config.version);
        try {
          localStorage.setItem(key, '1');
        } catch (_) { /* ignore */ }
        // 写一个 30 天有效的 Cookie（无需模板字符串）
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
    } catch (e2) {
      setErr('校验失败，请稍后再试。');
    }
  }

  // 已验证通过
  if (ok) return <>{props.children}</>;

  // 配置加载中：不渲染，避免闪一下
  if (loading && !err) return null;

  // 弹窗界面
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0 as unknown as number, // 兼容 TS 的行内样式类型
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

        {/* 如果配置加载失败，显示错误和重试按钮 */}
        {err && config === null ? (
          <>
            <div style={{ color: '#d33', marginTop: 8, fontSize: 12 }}>{err}</div>
            <button
              type="button"
              onClick={function () { loadConfig(); }}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                background: '#111',
                color: '#fff'
              }}
            >
              重新加载配置
            </button>
          </>
        ) : (
          <>
            <input
              type="password"
              value={pwd}
              onChange={function (e) { setPwd(e.target.value); }}
              placeholder="访问密码"
              autoFocus
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
          </>
        )}
      </form>
    </div>
  );
}
