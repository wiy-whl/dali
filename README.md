# 大理小程序 · 前端设计作品集（静态站点）

纯静态站点，无构建步骤：`index.html`（作品集长页）+ `prototype/`（可交互小程序原型）+ `assets/`（图片素材）。

- 作品集入口：`index.html`
- 原型直链：`prototype/index.html`

## 本地预览

任选其一：

```bash
python -m http.server 8080
# 或
npx serve .
```

打开 http://localhost:8080

## 部署到 Vercel

方式 A（CLI）：

```bash
npm i -g vercel
vercel          # 首次登录后按提示选择：项目名 dali-portfolio，框架 Preset 选 Other，目录保持根目录
vercel --prod
```

方式 B（网页）：打开 https://vercel.com/new ，导入本仓库（GitHub），Framework Preset 选 **Other**，直接 Deploy。

## 部署到 GitHub Pages（备选）

```bash
git init && git add -A && git commit -m "dali portfolio v2"
# 在 GitHub 新建仓库后：
git remote add origin https://github.com/<你的用户名>/dali-portfolio-v2.git
git push -u origin main
# 仓库 Settings → Pages → Source 选 main 分支 / (root)
```

## 目录结构

```
index.html          作品集（含全屏原型模式）
prototype/          可交互原型（自包含）
assets/             作品集图片素材
vercel.json         Vercel 静态站点配置
```
