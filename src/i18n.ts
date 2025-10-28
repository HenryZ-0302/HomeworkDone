import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";

i18n
  .use(HttpApi)
  .use(initReactI18next)
  // ✅ 优先读取 URL ?lng=xx 和 localStorage，再看浏览器语言
  .use(
    new LanguageDetector(undefined, {
      order: ["querystring", "localStorage", "navigator"],
      caches: ["localStorage"],                 // 记住用户选择
      lookupQuerystring: "lng",
      lookupLocalStorage: "i18nextLng",
    }),
  )
  .init({
    // ✅ 首选中文；若中文里个别键缺失，才临时用英文兜底，界面不缺字
    fallbackLng: ["zh", "en"],
    supportedLngs: ["zh", "en"],
    nonExplicitSupportedLngs: true, // zh-CN / zh-TW -> zh
    load: "languageOnly",           // 统一用 zh / en

    ns: ["commons"],
    defaultNS: "commons",
    debug: false,
    interpolation: { escapeValue: false },

    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },

    // React 推荐项，防止 Suspense 造成白屏
    react: { useSuspense: false },
  });

// ✅ 保险：如果本地没有记录，则强制写入中文（避免首次访问被环境拖去英文）
try {
  if (!localStorage.getItem("i18nextLng")) {
    localStorage.setItem("i18nextLng", "zh");
  }
} catch (e) {}

export default i18n;
