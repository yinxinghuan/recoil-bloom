# Recoil Bloom 视觉方向

## 1. Visual thesis

- Game and audience: 面向短时触摸探索的全屏视觉玩具。
- Emotional promise: 用后坐力失控地“签署”一张只属于本轮的喷溅画。
- One-sentence visual thesis: 一台极简白边喷射器在炭灰画布上留下高彩度 LCH 墨迹。
- Signature visual moment: 第四条边首次爆裂时，四个边缘印记同时退场，玩家生成的飞溅成为完整作品。
- Three required qualities: 原作 CSS DOM 质感、连续色相、画布无框。
- Three directions to avoid: Canvas 粒子近似、霓虹玻璃 HUD、卡通枪械。

## 2. Composition and camera

- Orientation and aspect ratios: 全响应式无相机画布，覆盖 `320×568`、`390×844` 与桌面。
- Camera and perspective: 正交屏幕空间；所有元素使用 CSS 像素定位。
- Playfield focal area: 全屏；四边是目标，中心是初始焦点。
- Foreground, midground, background: UI/喷射器、弹丸与粒子、`#202126` 纯色背景。
- HUD safe areas: 标题和进度避开顶部安全区，完成文案与重播避开底部安全区。
- Attention path: 中心喷射器 → 指针方向弹丸 → 边缘爆裂 → 四边完成。

## 3. Color

- Background `#202126`; primary text `#F6F3EC`; muted text `rgba(246,243,236,.58)`.
- Player/subject and projectiles use `lch(100 60 hue)` with hue advancing one degree per active frame.
- Usage ratios: 85% 炭灰、10% 生成色、5% 米白 UI。
- Forbidden combinations: 固定品牌渐变、彩虹描边、蓝紫霓虹外发光。

## 4. Typography

- Display and body: Inter / system UI / `Noto Sans SC`.
- Title `24–40px`, weight `900`, negative tracking; utility labels `9–11px`, weight `750–800`, wide tracking.

## 5. Shape, material, and lighting

- Dominant shapes: 圆形喷射器、椭圆弹丸、圆形粒子、十字定位印记。
- Borders: 1px 米白半透明；按钮无面板。
- Materials: 纯 CSS 实色与 box-shadow，不增加纹理或光照。
- Atmosphere: 高对比、平面、像丝网印刷前的暗底。

## 6. Characters, environments, and assets

- 无外部图片或角色资产。
- 原作主体全部由 DOM/CSS 生成，保持尺寸随 `vmin` 缩放并为窄屏设像素下限。
- 不引入不可替换的示例图片或文字输入。

## 7. UI and icons

- Icon family: 自绘 24×24 单线 SVG，1.7px 圆端描边；手势提示使用 Material `touch_app` 路径。
- Button targets: 重播 44×44。
- HUD: 无卡片；仅边缘排版与一条细描边提示。
- Press/focus: 重播保留浏览器焦点并用颜色变化反馈；完成前隐藏。
- Emoji policy: never use emoji as functional UI icons.

## 8. Motion and VFX

- Routine: 喷射器 `100ms` 交替压缩；弹丸与粒子逐帧更新。
- Hit: `180ms` 目标放大并降低不透明度。
- Completion: `260ms` 文案上移淡入，喷射器只增加同色柔和阴影。
- Reduced motion: 关闭喷射器压缩动画，保留物理位移和完成状态。

## 9. References translated into principles

- Reference: David Aerne, “css splatters (click for craze)”.
- Useful principle: CSS 盒模型本身就是粒子渲染器，碰撞后停驻比消散更有画面记忆。
- Adaptation: 用四边首次命中建立自定节奏闭环，不改变弹道、后坐力与 LCH 配色。
- Element not to copy: CodePen 外壳与注释掉的分数。

## 10. Anti-patterns

- 禁止 Canvas/WebGL 重写飞溅。
- 禁止倒计时、生命、排行榜或常规得分。
- 禁止固定色板替代连续 LCH 色相。
- 禁止大面积毛玻璃、圆角卡片和功能 Emoji。

## 11. Vertical-slice acceptance

- Entry/start: 首帧即见喷射器、四个定位印记与真实手势提示。
- Gameplay: 按住产生原作弹道与后坐力，边缘碰撞产生停驻粒子。
- High-feedback moment: 首次命中每条边时定位印记以弹丸颜色确认。
- Completion/end: 四边命中后保留全画面并出现重播。
- Narrow mobile: `320×568` 标题、进度、底部提示不重叠；无水平滚动。
- Visual QA findings and decision: 待真实运行截图与复验后填写。
