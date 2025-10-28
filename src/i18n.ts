import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";

// 先内置一小部分你首页需要的中文；其余缺的先回退到英文，保证界面完整
const zhCommons = {
  "init-page.tagline": "一步配置，立即使用",
  "init-page.headline.highlight": "作业更快完成",
  "init-page.headline.subtitle": "贴上你的 API Key 即可开始",
  "init-page.intro": "本工具在本地运行，你的密钥仅保存在浏览器。",
  "init-page.features.telemetry": "无遥测 / 无跟踪",
  "init-page.features.camera": "可选摄像头输入",
  "init-page.features.setup": "1 分钟完成设置",
  "init-page.form.provider.label": "服务提供商",
  "init-page.form.k": "API Key",
  "init-page.form.submit": "保存并开始",
  "init-page.form.advanced.title": "高级设置",
  "form.api-hint": "只会保存在你的浏览器本地",
  "init-page.form.storage-note": "可随时在设置中更改",
};

i18n
  .use(HttpApi)           // 仍然支持按需从 /locales 加载
  .use(initReactI18next)
  .init({
    // 🟢 始终以中文为首选
    lng: "zh",
    // 🟢 中文缺词时回退英文（这样界面不会缺字/破版）
    fallbackLng: ["zh", "en"],
    supportedLngs: ["zh", "en"],
    load: "languageOnly",       // zh-CN/zh-TW 都按 zh 处理
    nonExplicitSupportedLngs: true,

    // 内置一部分中文，先把首页关键文案顶上
    resources: { zh: { commons: zhCommons } },

    ns: ["commons"],
    defaultNS: "commons",
    debug: false,

    interpolation: { escapeValue: false },

    backend: {
      // 如果将来你放了 /public/locales/zh/commons.json，会自动覆盖上面的内置中文
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },

    react: { useSuspense: false },

    // ❌ 不再隐藏缺失键，避免界面“缺块”；让它自然回退到英文
    returnEmptyString: false,
    returnNull: false,
  });

export default i18n;