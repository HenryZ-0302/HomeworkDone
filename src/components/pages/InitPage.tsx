import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Camera, Rocket } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useGeminiStore } from "@/store/gemini-store";
import { useLocation, useNavigate } from "react-router-dom";

export default function InitPage() {
  const [key, setKey] = useState("");
  const setGeminiKey = useGeminiStore((s) => s.setGeminiKey);
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setGeminiKey(key.trim());
    const to = location.state?.from?.pathname ?? "/";
    navigate(to, { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b">
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.12]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-fuchsia-500/20 blur-3xl" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          <span className="text-lg font-semibold tracking-tight">
            SkidHomework
          </span>
        </div>
        <div className="text-sm text-slate-300">Local • Private • Free</div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-6">
        <section className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl"
            >
              <span className="bg-gradient-to-r from-indigo-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
                Welcome to SkidHomework
              </span>
              <br />
              <span className="text-slate-300">Escape the homework grind.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mt-5 max-w-prose text-slate-300"
            >
              Prefer Khan Academy–style self‑study but still get stuck with
              endless assignments? SkidHomework runs locally, respects your
              privacy, and helps you focus on learning instead of busywork.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-6 grid gap-3 text-sm text-slate-300"
            >
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> No Telemetry or spamming
                calls. Just Gemini API
              </li>
              <li className="flex items-center gap-2">
                <Camera className="h-4 w-4" /> Snap homework, get step‑by‑step
                help
              </li>
              <li className="flex items-center gap-2">
                <Rocket className="h-4 w-4" /> Fast setup — paste your Gemini
                API key and go
              </li>
            </motion.ul>

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-8 flex w-full max-w-md items-center gap-3"
            >
              <Input
                type="password"
                placeholder="Gemini API Key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="h-11 flex-1 bg-slate-900/60 placeholder:text-slate-500 focus-visible:ring-indigo-500"
              />
              <Button type="submit" className="h-11 px-5">
                Get My Time Back!
              </Button>
            </motion.form>
            <p className="mt-3 text-xs text-slate-400">
              Get an API Key at{" "}
              <a
                href="https://aistudio.google.com/api-keys"
                className="underline"
              >
                Google AI Studio
              </a>
            </p>

            <p className="mt-3 text-xs text-slate-400">
              We store your key locally using encrypted browser storage and
              never send it to our servers.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl backdrop-blur">
              <div className="mb-4 flex items-center gap-2 text-slate-300">
                <Camera className="h-5 w-5" />
                <span className="text-sm">Homework Camera</span>
              </div>
              <div className="aspect-[16/10] w-full rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 ring-1 ring-white/10" />
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                  OCR
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                  Steps
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                  Hints
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-10 text-xs text-slate-500">
        <div className="opacity-80">
          Licensed under GPLv3, created by cubewhy.{" "}
          <a
            href="https://github.com/cubewhy/skid-homework"
            className="underline"
          >
            Source Code
          </a>
        </div>
      </footer>
    </div>
  );
}
