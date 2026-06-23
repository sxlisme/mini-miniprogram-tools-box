# 提效工具箱

微信小程序工具箱，集成照片水印、JSON 格式化、房贷计算、天数计算、延时摄影计算、壁纸全屏、UUID 生成、时间戳转换、随机决策、字符计数、Markdown 预览等实用工具。

## 技术栈

| 项 | 说明 |
|---|---|
| 渲染引擎 | Skyline + glass-easel |
| 导航栏 | `navigationStyle: "custom"` |
| 组件库 | `tdesign-miniprogram ^1.5.0` |
| 云环境 | `cloud1-d4gosyf2293bb7a50` |
| 代码加载 | `lazyCodeLoading: "requiredComponents"` |

## 项目结构

```
├── app.js / app.json / app.wxss   # 全局配置
├── pages/
│   ├── home/                       # 首页 - 工具网格
│   ├── favorites/                  # 收藏页
│   ├── profile/                    # 个人中心
│   └── tools/                      # 【子包】全部工具页
│       ├── photo-watermark/        # 照片水印
│       ├── json-formatter/         # JSON 格式化
│       ├── mortgage-calc/          # 房贷计算器
│       ├── days-calc/              # 天数计算器
│       ├── timelapse-calc/         # 延时摄影计算
│       ├── clock-wallpaper/        # 壁纸全屏
│       ├── uuid-generator/         # UUID 生成器
│       ├── timestamp-converter/    # 时间戳转换器
│       ├── random-decision/        # 随机决策器（转盘/骰子/硬币/自定义）
│       ├── char-counter/           # 字符计数器
│       └── markdown-preview/       # Markdown 预览
├── components/
│   └── navigation-bar/             # 自定义导航栏
├── custom-tab-bar/                 # 自定义 TabBar
├── cloudfunctions/                 # 云函数 (msgSecCheck / mediaCheckAsync)
└── project.config.json             # IDE 配置
```

### 分包策略

主包仅保留 3 个 tab 页（轻量），所有工具页放入 `pages/tools` 子包按需加载。`packOptions.ignore` 排除 `cloudfunctions/` + TDesign 未使用组件。

## 色彩系统

| 用途 | 颜色 | 说明 |
|---|---|---|
| Primary | `#4A7BEC` | 选中态、按钮、icon 激活 |
| Primary Dark | `#3661CC` | 渐变收尾 |
| Primary Gradient | `linear-gradient(135deg, #4A7BEC, #3661CC)` | 头部、主按钮 |
| Primary Light | `#EEF2FD` | chip 选中背景 |
| Page BG | `#F5F5F5` | 页面底色 |
| Card | `#FFF` + `0 2rpx 8rpx rgba(0,0,0,0.04)` | section 卡片 |
| Success | `#07C160` | 滑块 activeColor |
| Danger | `#FF4D4F` / `#FF6B6B` | 错误/删除 |
| Tool Card 蓝 | `#4A7BEC ~ #667eea` | 6 个蓝色变体 |

## 样式约定

每个工具页遵循一致的 CSS 模板：

```css
/* 页面根容器 */
page { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

/* 滚动区域 */
.page { flex: 1; overflow-y: auto; background: #F5F5F5; padding: 0 24rpx; }

/* 内容卡片 */
.section { background: #FFF; border-radius: 20rpx; padding: 28rpx; margin-top: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }

/* 主按钮 */
.calc-btn { width: 100%; height: 88rpx; background: linear-gradient(135deg, #4A7BEC, #3661CC); color: #FFF; font-size: 30rpx; font-weight: 600; border-radius: 20rpx; border: none; }
.calc-btn::after { border: none; }

/* 选中态 */
.chip.active { background: #EEF2FD; color: #4A7BEC; border-color: #4A7BEC; }

/* 输入框 */
background: #F8F8F8; border-radius: 14rpx; padding: 20rpx;

/* 错误提示 */
background: #FFF0F0; color: #FF4D4F; border-radius: 12rpx;

/* 底部安全距离 */
.bottom-safe { height: calc(110rpx + env(safe-area-inset-bottom)); }
```

## 添加新工具

只需改 3 处、新建 4 个文件，已有页面自动渲染。

### 1. 注册页面 — `app.json`

在 `subpackages[0].pages` 中添加 `"new-tool/new-tool"`

### 2. 注册工具 — `app.js` globalData.tools

```javascript
{
  id: 'new-tool',          // 唯一 ID，用于收藏
  name: '新工具',           // 中文名
  icon: 'tdesign-icon',    // TDesign 图标名
  desc: '简短描述',
  path: '/pages/tools/new-tool/new-tool',
  color: '#4A7BEC'         // 蓝色系变体
}
```

### 3. 创建 4 个文件 `pages/tools/new-tool/`

**`new-tool.json`:**
```json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  }
}
```

**`new-tool.wxml` — 标准布局:**
```xml
<navigation-bar title="新工具" back="{{true}}" color="black" background="#FFF"></navigation-bar>
<scroll-view class="page" scroll-y enhanced show-scrollbar="{{false}}">
  <view class="section"><!-- 内容 --></view>
  <view class="btn-wrap">
    <button class="calc-btn">操作</button>
  </view>
  <view class="section" wx:if="{{result}}"><!-- 结果 --></view>
  <view class="bottom-safe"></view>
</scroll-view>
```

**`new-tool.wxss` — 复制上面的标准 CSS + 业务样式**

**`new-tool.js`:**
```javascript
Page({
  data: { /* 业务数据 */ },
  onLoad() {},
  // 业务方法
})
```

## 过往问题记录

| # | 问题 | 修复 |
|---|---|---|
| 1 | `t-icon` 找不到 | 配置 `packNpmRelationList` + "构建 npm" |
| 2 | IDE 解析云函数 js 报错 | 删云函数 `node_modules` + `packOptions.ignore` |
| 3 | `money-circle` icon 无效 | 换为 TDesign 支持的 `wallet` |
| 4 | 彩色背景 + 黑色 icon 看不清 | 卡片 icon 统一加 `color="#FFFFFF"` |
| 5 | Tab Bar icon 无激活态 | `custom-tab-bar/index.wxml` 选中态 `#4A7BEC` |
| 6 | 全局绿色高亮不统一 | 32 处 `#07C160` → 蓝色系 |
| 7 | 主包超 2048KB | 工具页入子包 + TDesign 组件精简 |
| 8 | 精简后 icon 消失 | 改 `packOptions.ignore` 方式排除，保留完整 `miniprogram_npm` |
| 9 | 底部工具列表被 TabBar 遮挡 | `.bottom-safe` 从 40rpx → `calc(110rpx + env(safe-area-inset-bottom))` |
| 10 | 转盘 GO 按钮不显示 | `view` 改 `cover-view`，解决 canvas 原生组件层级覆盖 |
| 11 | 转盘结果与指针不匹配 | 归一化当前角度后计算相对旋转增量，修复重复旋转时的累计误差 |

## 云函数

| 云函数 | 用途 |
|---|---|
| `msgSecCheck` | 文本内容安全检测 |
| `mediaCheckAsync` | 图片异步安全检测 |
