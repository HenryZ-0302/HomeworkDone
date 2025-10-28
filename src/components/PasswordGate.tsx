// src/components/PasswordGate.tsx
import React, { useEffect, useState } from "react";

const PASSWORD = "Madebyhenry"; // 先用明文，等跑通再升级。把 1234 换成你想要的密码

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const s = localStorage.getItem("site_unlocked_v2"); // 改密码时把 v1 改成 v2 可强制全员重新登录
    if (s === "1") setOk(true);
  }, []);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (pwd === PASSWORD) {
      localStorage.setItem("site_unlocked_v1", "1");
      setOk(true);
    } else {
      setErr("密码错误");
    }
  }

  if (ok) return <>{children}</>;

  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.55)",zIndex:99999}}>
      <form onSubmit={submit} style={{background:"#fff",padding:24,borderRadius:12,width:320,boxShadow:"0 10px 30px rgba(0,0,0,.2)"}}>
        <h3 style={{marginTop:0}}>请输入访问密码</h3>
        <input
          type="password"
          value={pwd}
          onChange={(e)=>setPwd(e.target.value)}
          placeholder="访问密码"
          autoFocus
          style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #ddd"}}
        />
        {err && <div style={{color:"#d33",marginTop:8,fontSize:12}}>{err}</div>}
        <button type="submit" style={{marginTop:12,width:"100%",padding:"10px 12px",borderRadius:8,background:"#111",color:"#fff"}}>进入</button>
        <div style={{marginTop:8,color:"#888",fontSize:12}}>请询问网站创建者Henry以获取密码</div>
      </form>
    </div>
  );
}
