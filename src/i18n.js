const copy = {
  en: {
    eyebrow: "EDGE PRINT / 04",
    title: "RECOIL BLOOM",
    hint: "Drag to aim · hold to spray",
    progress: (n) => `${n} OF 4 EDGES PRINTED`,
    complete: "FIELD SIGNED",
    replay: "Clear and replay",
    error: "This visual needs Pointer Events.",
  },
  zh: {
    eyebrow: "边缘印记 / 04",
    title: "后坐绽放",
    hint: "拖动瞄准 · 按住喷射",
    progress: (n) => `已印下 ${n} / 4 边`,
    complete: "画面已签署",
    replay: "清空重来",
    error: "当前浏览器不支持指针交互。",
  },
};

const override = localStorage.getItem("game_locale");
export const locale = override === "zh" || override === "en"
  ? override
  : navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
export const t = (key, value) => {
  const item = copy[locale][key];
  return typeof item === "function" ? item(value) : item;
};
