# TXT 手机预览

一个用于 Visual Studio Code 的插件，让你在手机尺寸的预览窗口中舒适地阅读 `.txt` 文件。所有样式（如屏幕尺寸、行高、字号、颜色）均通过 VS Code 设置统一控制，完美适配网文章节、小说、剧本等文本的移动端预览体验。

## ✨ 特性

- 📱 **手机模拟预览**：提供多种主流手机尺寸（iPhone、Android）的屏幕框架，让你提前感受文本在移动设备上的呈现效果。
- 🎨 **完全配置驱动**：所有样式参数均通过 VS Code 的设置面板或 `settings.json` 管理，无需在预览界面操作，保持界面清爽。
- 🔄 **实时响应**：修改配置或编辑 `.txt` 文件内容后，预览窗口会自动刷新，无需手动重开。
- 🚀 **轻量快速**：纯静态展示，无多余脚本，启动迅速。
- 🔧 **一键重置**：提供命令可快速将所有配置恢复为默认值。

## 📦 安装

### 从 VS Code 市场安装（推荐）
在 VS Code 扩展面板（`Ctrl+Shift+X`）中搜索 `TXT 手机预览`，点击安装即可。

### 离线安装（.vsix）
如果你收到 `.vsix` 文件：
1. 打开 VS Code，进入扩展面板。
2. 点击右上角的 `…` 菜单，选择 `Install from VSIX…`。
3. 选择下载的 `.vsix` 文件，完成安装。

## ⚙️ 配置

所有配置项归属于 `txtMobilePreview` 域。你可以通过以下方式调整：

- 打开 VS Code 设置（`Ctrl+,` 或 `Cmd+,`），在搜索框输入 `txtMobilePreview` 查看所有选项。
- 直接编辑 `settings.json` 文件。

### 配置项列表

| 配置键 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `txtMobilePreview.phoneSize` | `string` | `"390x844"` | 手机屏幕尺寸（宽×高）。可选值：<br/>• `375x667`（iPhone SE）<br/>• `390x844`（iPhone 12/13/14）<br/>• `430x932`（iPhone 14 Pro Max）<br/>• `360x780`（Android 小屏）<br/>• `412x915`（Android 大屏） |
| `txtMobilePreview.lineHeight` | `number` | `1.7` | 行间距倍数，范围 `1.0` ~ `3.0`。 |
| `txtMobilePreview.fontSize` | `number` | `16` | 字体大小（像素），范围 `10` ~ `30`。 |
| `txtMobilePreview.backgroundColor` | `string` | `"#ffffff"` | 预览背景颜色（十六进制色值）。 |
| `txtMobilePreview.textColor` | `string` | `"#1d1d1f"` | 字体颜色（十六进制色值）。 |

### 示例 `settings.json`
```json
{
  "txtMobilePreview.phoneSize": "430x932",
  "txtMobilePreview.lineHeight": 2.0,
  "txtMobilePreview.fontSize": 18,
  "txtMobilePreview.backgroundColor": "#f5f5f0",
  "txtMobilePreview.textColor": "#2c3e50"
}
```

## 🚀 使用方法

1. 在 VS Code 的资源管理器或编辑器中，右键点击任意 `.txt` 文件。
2. 在上下文菜单中选择 **“手机预览”**。
3. 预览面板将在侧边打开，以你配置的手机尺寸和样式展示文件内容。
4. 调整设置或编辑文件后，预览面板会自动更新。

### 重置所有设置为默认值
- 打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）。
- 输入并执行 **“重置手机预览设置为默认值”** 命令。

## 📝 注意事项

- 本插件仅用于预览，不支持编辑，所有修改需在原文件中进行。
- 预览面板不支持深色/浅色主题跟随（但可通过设置背景色/字体颜色自由调整）。

## 🛠 开发与打包

如需自行修改或构建插件：

```bash
# 克隆仓库（或下载源码）
git clone https://github.com/your-username/txt-mobile-preview.git
cd txt-mobile-preview

# 安装依赖（如有）
npm install

# 打包 .vsix 文件
npm install -g @vscode/vsce
vsce package

# 发布到市场（需先创建发布者并获取 PAT）
vsce login <publisher-id>
vsce publish
```

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

**Enjoy your mobile reading experience!** 📖