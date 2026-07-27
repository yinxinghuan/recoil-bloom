# Recoil Bloom 技术文档

## 1. 技术栈

项目使用原生 JavaScript、CSS 与 Vite 6。视觉主体完全由 DOM/CSS 构成，`requestAnimationFrame` 负责位置更新，Pointer Events 负责鼠标与触屏的统一输入。

## 2. 目录结构

- `src/main.js`：对象模型、弹道、弹性后坐力、粒子、六瓣目标课程与输入生命周期。
- `src/audio.js`：按用户手势解锁的低频反冲、打偏提示、方向命中与完成和弦。
- `src/style.css`：原作视觉机制、平台安全区、HUD、触控反馈与响应式尺寸。
- `src/i18n.js`：中文/英文文案与 `game_locale` 覆盖。
- `public/THIRD_PARTY_NOTICES.txt`：原作来源、修改项与 MIT 完整文本。
- `upstream/SOURCE.md`：固定来源与复原边界。

## 3. 核心模块

`GameObject` 统一维护位置、速度、旋转与 DOM 同步；`Player` 增加朝向、反向冲量、中心弹簧、阻尼、速度上限和软边界。`RecoilBloom` 为每局生成六个不连续重复的边缘目标，逐帧把可见花瓣放在“玩家到真实边缘命中点”的射线上，因此玩家瞄准花瓣后弹丸会继续抵达对应边缘。弹丸打偏仍生成飞溅，只有命中当前花瓣才推进。`?baseline=1` 继续使用原作的 `54ms` 喷射、`1.55` 反冲和无弹簧物理，并隐藏产品目标与牵引线。每帧只更新高频对象，不触发框架重渲染；页面不可见时暂停计算，重新可见后继续。音频由原生 Web Audio 按首次触摸解锁并限频，不依赖外部音频素材。

## 4. 扩展点

玩法数值集中在 `src/main.js` 的发射间隔、弹簧 / 阻尼、速度上限、后坐力、目标容差和粒子数；颜色、目标动效、尺寸与安全区在 `src/style.css`。替换闭环时保留 `GameObject → explode()` 机制，调整 `setupCourse()`、`checkTarget()` 与 `markTarget()`；增加平台统计或存档时在 `finish()` 的即时视觉反馈之后异步接入。
