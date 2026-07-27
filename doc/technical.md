# Recoil Bloom 技术文档

## 1. 技术栈

项目使用原生 JavaScript、CSS 与 Vite 6。视觉主体完全由 DOM/CSS 构成，`requestAnimationFrame` 负责位置更新，Pointer Events 负责鼠标与触屏的统一输入。

## 2. 目录结构

- `src/main.js`：对象模型、弹道、后坐力、粒子、四边完成状态与输入生命周期。
- `src/style.css`：原作视觉机制、平台安全区、HUD、触控反馈与响应式尺寸。
- `src/i18n.js`：中文/英文文案与 `game_locale` 覆盖。
- `public/THIRD_PARTY_NOTICES.txt`：原作来源、修改项与 MIT 完整文本。
- `upstream/SOURCE.md`：固定来源与复原边界。

## 3. 核心模块

`GameObject` 统一维护位置、速度、旋转与 DOM 同步；`Player` 增加朝向和反向冲量；`RecoilBloom` 管理弹丸、活动粒子、停驻飞溅与四边集合。每帧只更新高频对象，不触发框架重渲染。页面不可见时暂停计算，重新可见后继续。项目无网络、存档或音频依赖。

## 4. 扩展点

玩法数值集中在 `src/main.js` 的发射间隔、速度、后坐力、粒子数和命中集合；颜色、尺寸与安全区在 `src/style.css`。替换闭环时保留 `GameObject → explode()` 机制，仅调整 `markEdge()`；增加平台统计或存档时在 `finish()` 的即时视觉反馈之后异步接入。
