# 倒数日 · 网页版（PWA）

一个**仿《倒数日 Days Matter》体验**的独立实现：倒计时 / 纪念日 / 农历 / 背景卡片 / 每年重复 / 提醒 / 备份，
纯前端、可离线、可“添加到主屏幕”当 App 用。**与官方应用无关，未使用其任何素材**，仅供学习与自用。

## 一、快速开始（Windows / Mac 通用）

双击 **`run.bat`**（或在项目目录执行 `node tools/serve.mjs`），然后浏览器打开：

> http://localhost:8123

也可以用任意静态服务器托管整个文件夹（`index.html` 在根目录），或部署到 GitHub Pages / Netlify / Vercel 等。

> 提示：请通过 `http://localhost:8123` 访问，**不要直接双击 index.html**（Service Worker / PWA 需要 http 环境）。

### 手机当 App 用
- iPhone：Safari 打开网页 → 分享 → **添加到主屏幕**（iOS 16.4+ 且允许通知时还支持推送提醒）。
- Android：Chrome/Edge → 菜单 → **安装应用 / 添加到主屏幕**。
- 安装后可离线打开，图标、独立窗口一应俱全。

## 二、功能对照

| 功能 | 说明 |
| --- | --- |
| 倒计时 | 日期在未来：卡片大数字“还有 N 天” |
| 纪念日 | 日期已过：显示“已过 N 天”或开启“纪念日模式”后显示“第 N 天”，自动换算 X年X月X天 |
| 农历 | 事件可设农历月日（含闰月选择），自动换算每年公历日期；卡片/日历显示农历与干支生肖 |
| 每年重复 | 生日、节日按年自动跳转到下一次；2/29 自动处理 |
| 分类 | 内置 纪念日/生日/旅行/工作/学习/生活/节日/其他，可增删改名，每个分类有颜色与图标 |
| 背景卡片 | 纯色卡片 / 7 种渐变 / 上传自己的照片作为事件背景 |
| 列表操作 | 点击编辑、左滑删除（可撤销）、右滑隐藏、右上角更多菜单（置顶/复制/删除） |
| 置顶/搜索 | 置顶事件排最前；顶部搜索按名称/备注过滤；分类与“已过去/每年重复”筛选 |
| 日历视图 | 月历显示事件圆点、农历日期与主要节日（春节/中秋/端午/元旦…），点某天看当天事件 |
| 提醒 | 事件可设“当天/提前1/3/7天 + 时刻”的系统通知（见下方限制） |
| 备份 | 导出 JSON（含背景图）/ 导入恢复；数据只存本机浏览器 |
| 外观 | 浅色 / 深色 / 跟随系统；深色模式全适配 |
| PWA | 离线缓存、桌面图标、独立窗口 |

### 提醒的浏览器限制（重要）
Web 通知受平台限制，**不可能**做到 iOS 原生 App 那种“完全后台准时推送”：
- 电脑 Chrome/Edge：浏览器开启时能按时提醒；关闭浏览器后无法提醒。
- Android：安装为应用后可注册周期性同步，较可靠。
- iOS：必须 iOS 16.4+、网页“添加到主屏幕”、并允许通知，效果视系统而定。
- 无论如何，**打开本页时所有到期的提醒会立即补发**，卡片数据永远准确。

## 三、目录结构

```
daoshuri/
├─ index.html / css/app.css    页面与样式
├─ js/lunar.js                 公历⇄农历（转换器源自 MIT 项目，见文末）
├─ js/core.js                  纯日期/事件逻辑（可 Node 自测）
├─ js/store.js                 localStorage + IndexedDB(背景图) + 备份
├─ js/notify.js / sw.js        通知与离线缓存
├─ js/ui.js / app.js           界面与入口
├─ manifest.webmanifest        PWA 清单
├─ icons/                      生成的图标
├─ capacitor.config.json       套壳成 iOS/Android 原生 App 的配置
├─ tools/serve.mjs             零依赖本地服务器（node tools/serve.mjs）
├─ tools/selftest.mjs          核心逻辑自测（node tools/selftest.mjs）
├─ tools/domsmoke.mjs          DOM 冒烟自测（node tools/domsmoke.mjs）
└─ tools/genicons.mjs          重新生成图标（node tools/genicons.mjs）
```

## 四、测试

```bash
node tools/selftest.mjs     # 农历/日期/事件状态 23 项断言
node tools/domsmoke.mjs     # 首屏/列表/日历/编辑器冒烟
```

## 五、以后想要真正的 .ipa（iOS 安装包）怎么办？

Windows 无法直接签名出 .ipa；网页版可**零改动套壳**成原生 App。两条路（都需要一台 Mac 或云 Mac 服务）：

1. **本地 Mac（最方便）**
   ```bash
   npm install
   npx cap add ios          # 用 capacitor.config.json 生成 ios/ 原生工程
   npx cap open ios         # 在 Xcode 中运行；改 Bundle ID、选签名 Team
   ```
   Xcode：Product → Archive → Distribute App → 得到 `.ipa`（个人免费 Apple ID 仅能装自己设备 7 天）。

2. **云 Mac / CI（没有实体 Mac）**
   - [Codemagic](https://codemagic.io/)（免费档）或 GitHub Actions `macos-latest` runner + `xcodebuild -exportArchive`；
   - 或 MacinCloud / AWS EC2 Mac 等远程桌面 Mac 上执行步骤 1。

同一套网页代码也能出安卓：`npx cap add android` 后用 Android Studio 打包 APK。

## 六、数据与隐私

所有数据只保存在你的浏览器（localStorage + IndexedDB），不上传任何服务器。
请经常用“更多 → 备份与恢复 → 导出备份”保存 JSON，可放进网盘/iCloud 文件夹备份。

## 七、致谢与许可

- 农历转换表与算法改编自 [isee15/Lunar-Solar-Calendar-Converter](https://github.com/isee15/Lunar-Solar-Calendar-Converter)
  （MIT License），支持 1888–2110 年；项目代码见 `js/lunar.js` 头部注释。
- 本程序为独立编写的示例项目，**非官方《倒数日 / Days Matter》**；图标为程序化生成，无版权素材。
