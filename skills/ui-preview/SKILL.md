---
name: ui-preview
description: 用本机 Edge 无头浏览器渲染本地网页并截图（手机/桌面两尺寸），用于预览和核对倒数日应用 UI。
when_to_use: 需要查看当前页面真实渲染效果、对比改动前后、或把截图交给可识图模型评审 UI 时。
---

# UI 预览技能（ui-preview）

## 功能
用微软 Edge 的 Headless（无头）模式，把**本地运行的网页**真实渲染出来，并输出：
- `shots/*-phone.png`（390×844，手机竖屏）
- `shots/*-desktop.png`（1280×900，桌面）

适合两种用法：
1. **给用户看**：直接打开生成的 PNG；
2. **给“可看图的模型”评审**：在支持图片输入的模型会话里，把 PNG 发过去要求逐屏点评并对照需求。

> 注意：当前纯文本模型**看不到图片**。用本技能时，文本模型应以脚本输出的 JSON 状态/文件信息为准，把 PNG 交给人或识图模型查看。

## 运行环境（已具备）
- Windows + Edge：`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
- Node.js ≥ 18
- 页面服务器请先启动：项目根目录执行 `node tools/serve.mjs`（或双击 run.bat），地址默认 `http://localhost:8123`

## 用法
```bash
node skills/ui-preview/preview.mjs                      # 截 http://localhost:8123/
node skills/ui-preview/preview.mjs --url http://localhost:8123/ --out shots
```
可选参数：`--url`（默认 http://localhost:8123/）、`--out`（默认 shots）、`--phone 390x844`、`--desktop 1280x900`。

输出示例：
```
✓ 手机截图: shots/ui-20260919-101500-phone.png (  82 KB)
✓ 桌面截图: shots/ui-20260919-101500-desktop.png ( 146 KB)
```
退出码 0 = 成功；非 0 = 渲染失败（通常是服务器未启动或 Edge 占用）。

## 常见排查
- 提示 “服务器未运行 / fetch 失败”：先执行 `node tools/serve.mjs` 再试；
- 生成的 PNG 为空：关闭正在使用的 Edge 再试，或用 `--profile` 指向新临时目录（脚本默认已用随机临时目录）。
