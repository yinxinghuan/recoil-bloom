const copy = {
  en: {
    eyebrow: "RECOIL COURSE / 06",
    title: "RECOIL BLOOM",
    hint: "Aim at the lit petal · release to recenter",
    progress: (n) => `${n} OF 6 PETALS LIT`,
    complete: "BLOOM COMPLETE",
    replay: "Clear and replay",
    error: "This visual needs Pointer Events.",
  },
  zh: {
    eyebrow: "反冲花序 / 06",
    title: "RECOIL BLOOM",
    hint: "瞄准亮起花瓣 · 松手回中",
    progress: (n) => `已点亮 ${n} / 6 瓣`,
    complete: "花迹完成",
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
