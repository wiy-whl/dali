# 大理小程序 · 前端设计作品集

一套围绕「扎染蓝白」展开的前端设计作品集：**「苍洱之间，一匹蓝」**。
作品集本身就用产品的设计系统来做——同色板、同字体、同版式语言，把配色 / 字体 / 版式方案与可交互原型放在同一个长滚动页面里。

## 在线预览

| 入口 | 链接 |
| --- | --- |
| 作品集（GitHub Pages，推送自动更新） | https://wiy-whl.github.io/dali/ |
| 可交互原型直链 | https://wiy-whl.github.io/dali/prototype/index.html |
| 作品集（WorkBuddy 托管镜像） | https://dali-portfolio.app.workbuddy.host/ |

纯静态站点，无构建步骤，克隆下来即可本地打开。

## 目录结构

```
index.html          作品集长页（13 个章节，含全屏原型浮层）
prototype/          可交互小程序原型（自包含，含 styles.css / app.js / assets）
assets/             作品集图片素材（界面截图与视觉稿）
vercel.json         Vercel 静态站点配置（含缓存头）
```

## 本地预览

```bash
python -m http.server 8080     # 或：npx serve .
# 打开 http://localhost:8080
```

> 直接双击 `index.html` 也能看作品集；但内嵌原型使用 iframe，建议用本地服务器打开。

## 设计系统速览

- **色彩**（靛蓝谱，点缀不过 3% 面积）
  `#0F2A4A` 墨蓝 · `#173B63` 深靛 · `#2A86C8` 洱海蓝 · `#E8F1F8` 雾蓝 · `#F3F5F1` 生宣米 · `#FBFCF9` 宣纸白 · `#71322D` 瓦猫朱
- **字体**：站酷小薇（展示标题）· 马善政毛笔（情绪笔触）· Cormorant Garamond（拉丁与数字）· 思源黑体（正文）
- **版式**：8pt 栅格 · 卡片语言 · 章节级构图切换（页页不同）

## 部署

### GitHub Pages（已开启 · 推荐）

已配置为 **从 `main` 分支根目录发布**，每次 `git push` 后自动更新：https://wiy-whl.github.io/dali/

如需改为其他方式：仓库 **Settings → Pages → Source**，可选 `Deploy from a branch`（`main` / `(root)`）或 `GitHub Actions`。

### Vercel

方式 A（网页）：打开 https://vercel.com/new/import?s=https://github.com/wiy-whl/dali ，用 GitHub 登录后导入本仓库，**Framework Preset 选 Other**，根目录不变，直接 Deploy。

方式 B（CLI）：

```bash
npm i -g vercel
vercel login
vercel --prod        # 框架 Preset 选 Other，目录保持根目录
```

`vercel.json` 已配置好静态站点与缓存头，无需额外设置。

## 说明

- 界面中的字体通过 Google Fonts 在线加载，离线环境会退回系统字体。
- 本仓库是**网页版**呈现；微信小程序本体需用 WXML/WXSS/JS + app.json 的另一套代码结构，不能由本 HTML 直接转换。
