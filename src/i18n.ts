import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";

// ✅ 内置一个最小中文文案，保证页面不再显示键名
const zhCommons = {
  // 你截图里出现的这些键，先给出基础中文
  "init-page.tagline": "一步配置，立即使用",
  "init-page.headline.highlight": "作业更快完成",
  "init-page.headline.subtitle": "贴上你的 API Key 即可开始",
  "init-page.intro": "本工具在本地运行，你的密钥仅保存在浏览器。",
  "init-page.features.telemetry": "无遥测 / 无跟踪",
  "init-page.features.camera": "可选摄像头输入",
  "init-page.features.setup": "1分钟完成设置",
  "init-page.form.provider.label": "服务提供商",
  "init-page.form.k": "API Key",
  "init-page.form.submit": "保存并开始",
  "init-page.form.advanced.title": "高级设置",
  "form.api-hint": "只会保存在你的浏览器本地",
  "init-page.form.storage-note": "可随时在设置中更改",
};

i18n
  // 仍保留 http-backend（若将来放置 /locales/zh/commons.json，会自动覆盖这里内置的）
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    // ✅ 永远中文，不再检测、不再回退
    lng: "zh",
    fallbackLng: "zh",
    supportedLngs: ["zh"],
    load: "languageOnly",

    // ✅ 直接内置中文资源，命名空间与项目一致
    resources: {
      zh: { commons: zhCommons },
    },

    ns: ["commons"],
    defaultNS: "commons",
    debug: false,

    interpolation: { escapeValue: false },

    backend: {
      // 如果以后你添加了 /public/locales/zh/commons.json，会优先用文件里的内容
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },

    react: { useSuspense: false },

    // ✅ 关键：缺词时不要把键名渲染出来（避免“乱码”）
    parseMissingKeyHandler: () => "",
    returnEmptyString: true,
    returnNull: true,
  });

export default i18n;