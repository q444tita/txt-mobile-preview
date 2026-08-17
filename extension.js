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

const DEFAULT_CONFIG = {
    phoneSize: '390x844',
    lineHeight: 1.7,
    fontSize: 16,
    backgroundColor: '#ffffff',
    textColor: '#1d1d1f'
};

function activate(context) {
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

    const resetCommand = vscode.commands.registerCommand(
        'txtMobilePreview.resetSettings',
        async () => {
            const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
            await Promise.all(
                Object.values(CONFIG_KEYS).map(key => config.update(key, undefined, vscode.ConfigurationTarget.Global))
            );
            vscode.window.showInformationMessage('TXT 手机预览设置已重置为默认值');
        }
    );

    const configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(CONFIG_SECTION)) {
            previewPanels.forEach((panel, uriString) => {
                vscode.workspace.openTextDocument(vscode.Uri.parse(uriString)).then(document => {
                    const config = getConfig();
                    panel.webview.html = getMobileHtml(document.getText(), config);
                });
            });
        }
    });

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

function createOrShowPreview(document) {
    const uriString = document.uri.toString();
    let panel = previewPanels.get(uriString);

    if (panel) {
        panel.reveal(vscode.ViewColumn.Beside);
        const config = getConfig();
        panel.webview.html = getMobileHtml(document.getText(), config);
        return;
    }

    panel = vscode.window.createWebviewPanel(
        'txtMobilePreview',
        `📱 预览: ${document.fileName}`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,   // 启用脚本实现滚动同步
            retainContextWhenHidden: true
        }
    );

    const config = getConfig();
    panel.webview.html = getMobileHtml(document.getText(), config);

    previewPanels.set(uriString, panel);

    panel.onDidDispose(() => {
        previewPanels.delete(uriString);
    }, null, context.subscriptions);
}

function getMobileHtml(content, config) {
    const { phoneSize, lineHeight, fontSize, backgroundColor, textColor } = config;
    const [width, height] = phoneSize.split('x').map(Number);

    // 按行分割并转义
    const lines = content.split('\n');
    const lineHtml = lines.map(line => {
        const escaped = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        return `<div class="line">${escaped}</div>`;
    }).join('');

    // 手机样式
    const phoneStyle = `
        width: ${width}px;
        height: ${height}px;
        background-color: ${backgroundColor};
        border-radius: 40px;
        padding: 20px 0 10px 0; /* 左右无内边距，给滚动条留位置 */
        box-shadow: 0 30px 80px rgba(0,0,0,0.25), 0 0 0 10px #222;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        position: relative;
    `;

    // 内容区域（右侧留出滚动条空间）
    const contentWrapperStyle = `
        flex: 1;
        overflow-y: scroll;      /* 让内容可滚动，但滚动条隐藏 */
        padding: 0 16px 0 20px;  /* 右侧留空给自定义滚动条 */
        margin: 0;
        background-color: ${backgroundColor};
        scrollbar-width: none;   /* Firefox */
        -ms-overflow-style: none; /* IE/Edge */
    `;
    // 隐藏 WebKit 滚动条
    const contentWebkitStyle = `
        .content-wrapper::-webkit-scrollbar {
            display: none;
        }
    `;

    // 自定义滚动条容器（位于手机框右侧外部）
    const scrollbarContainerStyle = `
        width: 8px;
        height: ${height - 40}px; /* 扣除上下 padding */
        background: rgba(200, 200, 200, 0.3);
        border-radius: 4px;
        position: absolute;
        right: 8px;
        top: 20px;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
    `;
    const scrollbarThumbStyle = `
        width: 100%;
        background: #888;
        border-radius: 4px;
        position: absolute;
        top: 0;
        left: 0;
        cursor: pointer;
        min-height: 30px;
        transition: background 0.2s;
    `;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>手机预览</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #e0e0e0;
            font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
            margin: 0;
        }
        .phone {
            ${phoneStyle}
        }
        .status-bar {
            height: 24px;
            border-bottom: 1px solid #f0f0f0;
            margin: 0 16px 8px 16px;
            flex-shrink: 0;
            background-color: ${backgroundColor};
        }
        .content-wrapper {
            ${contentWrapperStyle}
        }
        ${contentWebkitStyle}
        .line {
            text-indent: 2em;
            line-height: ${lineHeight};
            font-size: ${fontSize}px;
            color: ${textColor};
            word-wrap: break-word;
            white-space: pre-wrap;
            min-height: ${fontSize * lineHeight}px;
            padding-bottom: 2px;
        }
        .home-indicator {
            height: 5px;
            width: 134px;
            background: #d9d9d9;
            border-radius: 100px;
            margin: 12px auto 0;
            flex-shrink: 0;
        }
        .scrollbar-track {
            ${scrollbarContainerStyle}
        }
        .scrollbar-thumb {
            ${scrollbarThumbStyle}
        }
        .scrollbar-track:hover {
            opacity: 1;
        }
        .scrollbar-thumb:hover {
            background: #666;
        }
    </style>
</head>
<body>
    <div class="phone" id="phoneContainer">
        <div class="status-bar"></div>
        <div class="content-wrapper" id="contentWrapper">
            ${lineHtml}
        </div>
        <div class="home-indicator"></div>

        <!-- 自定义滚动条 -->
        <div class="scrollbar-track" id="scrollbarTrack">
            <div class="scrollbar-thumb" id="scrollbarThumb"></div>
        </div>
    </div>

    <script>
        (function() {
            const content = document.getElementById('contentWrapper');
            const track = document.getElementById('scrollbarTrack');
            const thumb = document.getElementById('scrollbarThumb');

            // 更新滑块高度和位置
            function updateThumb() {
                const scrollHeight = content.scrollHeight;
                const clientHeight = content.clientHeight;
                if (scrollHeight <= clientHeight) {
                    thumb.style.display = 'none';
                    return;
                }
                thumb.style.display = 'block';
                const thumbHeight = Math.max(30, (clientHeight / scrollHeight) * track.clientHeight);
                thumb.style.height = thumbHeight + 'px';
                const scrollTop = content.scrollTop;
                const maxScroll = scrollHeight - clientHeight;
                const thumbTop = (scrollTop / maxScroll) * (track.clientHeight - thumbHeight);
                thumb.style.top = thumbTop + 'px';
            }

            // 内容滚动时同步滑块
            content.addEventListener('scroll', updateThumb);

            // 拖动滑块滚动内容
            let isDragging = false;
            let startY = 0;
            let startScrollTop = 0;

            thumb.addEventListener('mousedown', function(e) {
                isDragging = true;
                startY = e.clientY;
                startScrollTop = content.scrollTop;
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                e.preventDefault();
            });

            function onMouseMove(e) {
                if (!isDragging) return;
                const deltaY = e.clientY - startY;
                const trackHeight = track.clientHeight;
                const thumbHeight = thumb.clientHeight;
                const maxScroll = content.scrollHeight - content.clientHeight;
                const ratio = (deltaY / (trackHeight - thumbHeight)) * maxScroll;
                content.scrollTop = Math.min(Math.max(startScrollTop + ratio, 0), maxScroll);
                updateThumb();
            }

            function onMouseUp() {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            // 点击轨道跳转
            track.addEventListener('click', function(e) {
                if (e.target === thumb) return;
                const rect = track.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const thumbHeight = thumb.clientHeight;
                const trackHeight = track.clientHeight;
                const ratio = (clickY - thumbHeight/2) / (trackHeight - thumbHeight);
                const maxScroll = content.scrollHeight - content.clientHeight;
                content.scrollTop = Math.min(Math.max(ratio * maxScroll, 0), maxScroll);
                updateThumb();
            });

            // 窗口大小变化时重新计算
            window.addEventListener('resize', updateThumb);

            // 初次加载和内容变化时更新
            updateThumb();
        })();
    </script>
</body>
</html>`;
}

module.exports = {
    activate
};