const vscode = require('vscode');

// 存储所有打开的预览面板，key = 文档URI字符串，value = webviewPanel
const previewPanels = new Map();

// 配置项名称常量
const CONFIG_SECTION = 'txtMobilePreview';
const CONFIG_KEYS = {
    phoneSize: 'phoneSize',
    lineHeight: 'lineHeight',
    fontSize: 'fontSize',
    backgroundColor: 'backgroundColor',
    textColor: 'textColor'
};

// 默认配置（与 package.json 中的 default 一致，但也可作为后备）
const DEFAULT_CONFIG = {
    phoneSize: '390x844',
    lineHeight: 1.7,
    fontSize: 16,
    backgroundColor: '#ffffff',
    textColor: '#1d1d1f'
};

function activate(context) {
    // 1. 注册预览命令
    const previewCommand = vscode.commands.registerCommand(
        'txtMobilePreview.preview',
        async (uri) => {
            let document;
            if (uri) {
                document = await vscode.workspace.openTextDocument(uri);
            } else {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('没有打开的文本文件');
                    return;
                }
                document = editor.document;
            }
            createOrShowPreview(document);
        }
    );

    // 2. 注册重置设置命令
    const resetCommand = vscode.commands.registerCommand(
        'txtMobilePreview.resetSettings',
        async () => {
            const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
            // 将所有配置项重置为 undefined（即恢复默认值）
            await Promise.all(
                Object.values(CONFIG_KEYS).map(key => config.update(key, undefined, vscode.ConfigurationTarget.Global))
            );
            vscode.window.showInformationMessage('TXT 手机预览设置已重置为默认值');
        }
    );

    // 3. 监听配置变化，自动刷新所有打开的预览面板
    const configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(CONFIG_SECTION)) {
            // 遍历所有面板，刷新
            previewPanels.forEach((panel, uriString) => {
                // 重新获取文档内容
                vscode.workspace.openTextDocument(vscode.Uri.parse(uriString)).then(document => {
                    const config = getConfig();
                    panel.webview.html = getMobileHtml(document.getText(), config);
                });
            });
        }
    });

    // 4. 监听文档内容变化，刷新对应面板（如果配置未变，但内容变了）
    const contentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
        const document = event.document;
        const uriString = document.uri.toString();
        if (previewPanels.has(uriString)) {
            const panel = previewPanels.get(uriString);
            const config = getConfig();
            panel.webview.html = getMobileHtml(document.getText(), config);
        }
    });

    context.subscriptions.push(previewCommand, resetCommand, configChangeListener, contentChangeListener);
}

/**
 * 获取当前配置（合并默认值，确保所有字段存在）
 */
function getConfig() {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return {
        phoneSize: config.get(CONFIG_KEYS.phoneSize, DEFAULT_CONFIG.phoneSize),
        lineHeight: config.get(CONFIG_KEYS.lineHeight, DEFAULT_CONFIG.lineHeight),
        fontSize: config.get(CONFIG_KEYS.fontSize, DEFAULT_CONFIG.fontSize),
        backgroundColor: config.get(CONFIG_KEYS.backgroundColor, DEFAULT_CONFIG.backgroundColor),
        textColor: config.get(CONFIG_KEYS.textColor, DEFAULT_CONFIG.textColor)
    };
}

/**
 * 创建或显示预览面板（如果已存在则激活并刷新）
 */
function createOrShowPreview(document) {
    const uriString = document.uri.toString();
    let panel = previewPanels.get(uriString);

    if (panel) {
        panel.reveal(vscode.ViewColumn.Beside);
        // 刷新内容（配置可能已变化）
        const config = getConfig();
        panel.webview.html = getMobileHtml(document.getText(), config);
        return;
    }

    // 创建新面板
    panel = vscode.window.createWebviewPanel(
        'txtMobilePreview',
        `📱 预览: ${document.fileName}`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: false,   // 无需脚本，纯展示
            retainContextWhenHidden: true
        }
    );

    // 生成并设置 HTML
    const config = getConfig();
    panel.webview.html = getMobileHtml(document.getText(), config);

    // 保存面板
    previewPanels.set(uriString, panel);

    // 面板关闭时从 Map 移除
    panel.onDidDispose(() => {
        previewPanels.delete(uriString);
    }, null, context.subscriptions);
}

/**
 * 生成手机预览 HTML（所有样式基于配置）
 */
function getMobileHtml(content, config) {
    const { phoneSize, lineHeight, fontSize, backgroundColor, textColor } = config;
    const [width, height] = phoneSize.split('x').map(Number);

    // 按行分割并转义，每行使用内联样式确保生效
    const lines = content.split('\n');
    const lineHtml = lines.map(line => {
        const escaped = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        // 内联样式：首行缩进、行高、字号、颜色、最小高度
        const style = `text-indent:2em; line-height:${lineHeight}; font-size:${fontSize}px; color:${textColor}; word-wrap:break-word; white-space:pre-wrap; min-height:${fontSize * lineHeight}px;`;
        return `<div style="${style}">${escaped}</div>`;
    }).join('');

    // 手机容器的内联样式（背景色等）
    const phoneStyle = `width:${width}px; height:${height}px; background-color:${backgroundColor}; border-radius:40px; padding:20px 20px 10px 20px; box-shadow: 0 30px 80px rgba(0,0,0,0.25), 0 0 0 10px #222; display:flex; flex-direction:column; flex-shrink:0;`;
    const statusBarStyle = `height:24px; border-bottom:1px solid #f0f0f0; margin-bottom:8px; flex-shrink:0; background-color:${backgroundColor};`;
    const contentStyle = `flex:1; overflow-y:auto; padding:4px 2px; border-radius:4px; background-color:${backgroundColor}; scrollbar-width:none; -ms-overflow-style:none;`;
    // 隐藏滚动条 (WebKit)
    const contentWebkitStyle = `::-webkit-scrollbar { display: none; }`;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>手机预览</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #e0e0e0;
            font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
        }
        .phone { ${phoneStyle} }
        .status-bar { ${statusBarStyle} }
        .content { ${contentStyle} }
        .content${contentWebkitStyle}
        .home-indicator {
            height: 5px;
            width: 134px;
            background: #d9d9d9;
            border-radius: 100px;
            margin: 12px auto 0;
            flex-shrink: 0;
        }
    </style>
</head>
<body>
    <div class="phone">
        <div class="status-bar"></div>
        <div class="content">
            ${lineHtml}
        </div>
        <div class="home-indicator"></div>
    </div>
</body>
</html>`;
}

module.exports = {
    activate
};