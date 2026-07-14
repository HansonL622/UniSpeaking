# UniSpeaking - 自由对话 WebRTC 功能嵌入指南

你好！这是一份专为**自由对话（FreeTalk）WebRTC 核心功能嵌入**准备的对接说明文档，旨在帮助你快速理清当前 React 前端工程的架构，并将上周开发完成的 WebRTC 自由对话 demo 顺利融入当前已定稿的界面中。

---

## 一、 项目前端架构概述

该工程为标准 **Vite + React (ES6/JSX)** 结构，样式统一使用原生 CSS（已在 `styles.css` 中定稿，**无需修改样式代码**）。

### 1. 核心目录与文件
```text
src/
├── App.jsx                 # 全局状态管理、路由分发与事件总线
├── data.js                 # 初始演示数据（包含对话历史列表数据）
├── main.jsx                # 应用入口
├── components/             # 通用基础组件（Icon, PageHeading 等）
└── views/                  # 视图页面组件
    ├── ConversationView.jsx # 自由对话核心界面（本次集成的核心文件 🌟）
    ├── CustomSceneView.jsx  # 场景生成与预览
    ├── TrainingView.jsx     # 三步式口语训练视图
    └── ...                  # 其它功能视图（Scenes, Review, Profile 等）
```

### 2. 状态流动设计 (App.jsx -> ConversationView.jsx)
在 `src/App.jsx` 中，全局状态由 `useState` 统一维护，并提供了一个更新状态的通用方法 `updateState`：

*   **`state.activeConversation`**:
    *   值为 `"new"` 时，表示处于**闲聊准备状态**（展示「开启闲聊练习」大字标题和语音球）。
    *   值为具体的会话 ID（如 `"lunch"`）时，表示处于**聊天对话状态**（渲染气泡列表）。
*   **`state.voiceState`**:
    *   `"ready"`: 待命状态（显示“点击上方语音球开启字幕”）。
    *   `"listening"`: 正在倾听（显示“你可以开始说话”，波纹球处于动画状态）。
*   **`state.conversations`**:
    *   对话历史记录数组，包含 `turns`（角色与文本元组，例如：`[["AI", "Hello"], ["You", "Hi"]]`）。
*   **`updateState(patch)`**:
    *   用于局部更新全局 `state` 的函数（支持传入对象或更新回调）。

---

## 二、 WebRTC 功能嵌入技术指南

你的任务是在 `src/views/ConversationView.jsx`（或抽离成 `src/hooks/useWebRTC.js`）中引入 WebRTC 的连接和媒体流处理。

### 1. 界面元素与 WebRTC 逻辑映射关系

已经定稿的 UI 提供了完整的状态和交互挂载点：

| 界面元素 (UI Element) | React 事件挂载点 (Callback) | 对应的 WebRTC / 媒体流操作 |
| :--- | :--- | :--- |
| **中心红球/语音球** (`.voice-orb`) | `handleToggleTextMode` | **开始对话/触发连接**：<br>1. 获取麦克风流 (`getUserMedia`)；<br>2. 建立 `RTCPeerConnection` ；<br>3. 发送 Offer 开启 WebRTC 会话。 |
| **麦克风控制按钮** (`.mic-toggle-btn`) | `handleToggleMic` | **麦克风静音切换**：<br>通过 `localStream.getAudioTracks()[0].enabled = !enabled` 控制静音。 |
| **结束对话按钮** (`.end-session-btn`) | `handleEndConversation` | **断开连接**：<br>1. 关闭 WebRTC 连接（`pc.close()`）；<br>2. 停止本地音轨；<br>3. 调用 `resetConversation()` 回到准备页。 |
| **底部文字输入框** (`form.chat-input-form`) | `handleSubmitMessage` | **发送文本（若支持）**：<br>将输入的文字通过信令或 Data Channel 发送，并追加至对话框。 |

### 2. 具体集成步骤建议

#### 第一步：声明隐藏的 `<audio>` 播放器
为了播放远端 AI 的声音，需要在 `ConversationView.jsx` 中放置一个隐藏的 `<audio>` 标签：
```jsx
// 1. 在组件内声明 ref
const remoteAudioRef = useRef(null);

// 2. 在 JSX 的合适位置放置（例如 section 的底部）
<audio ref={remoteAudioRef} autoPlay />
```

#### 第二步：处理远端音频轨道监听
在 `RTCPeerConnection` 的 `ontrack` 回调函数中，将流赋给隐藏播放器：
```javascript
pc.ontrack = (event) => {
  if (remoteAudioRef.current) {
    remoteAudioRef.current.srcObject = event.streams[0];
  }
};
```

#### 第三步：对接实时字幕与转文字气泡
当 WebRTC 会话收到 AI 的语音回复，或者实时 STT 识别出你的说话内容时：
1.  计算或获取当前活跃的会话数据。
2.  调用 `updateState` 将新的发言元组（例如 `["AI", "这里是大模型回复的英文内容"]`）追加到 `state.conversations` 列表的 `turns` 中。
3.  气泡列表组件会自动感应到状态变更并重新渲染，并带有丝滑的过渡动画。

#### 第四步：同步语音球动画状态
WebRTC 在连接中，可以根据连接状态更新 `state.voiceState`：
*   正在建立连接时：可设置 `voiceState: "connecting"` (有闪烁动画效果)。
*   连接成功并正在收听时：设置 `voiceState: "listening"` (语音球波纹动画开启)。
*   未开启或断开时：设置 `voiceState: "ready"`。

---

## 三、 本次协助已完成的界面基调（直接可用）

在本次优化中，我们已经帮你完成了以下界面的视觉优化：
1.  **清空多余话题**：去除了原有的预设话题按钮，使主界面更加干净专注。
2.  **视觉放大效果**：放大了准备页（`.chat-bubbles-ready-state`）中的标题字号（`36px`）及说明排版，更加美观大气。
3.  **头像重构**：对话气泡中的助手头像标识由 `C` 统一修改为 `AI`。
4.  **无 Clara 概念**：界面文案修改为泛用引导句，支持任何声音伴侣。

祝集成顺利！有任何细节问题我们随时沟通。
