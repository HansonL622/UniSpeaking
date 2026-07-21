# UniSpeaking 前后端接口文档

本文档用于前端和后端对齐接口。当前后端已实现自由会话启动和会话事件 WebSocket；登录注册、用户偏好、场景、评分、个人中心等接口属于建议新增契约。

## 1. 基础约定

### 1.1 Base URL

本地开发：

```text
HTTP: http://127.0.0.1:8080
WebSocket: ws://127.0.0.1:8080
```

Vite 前端开发代理：

```text
/api -> http://127.0.0.1:8080
/ws  -> ws://127.0.0.1:8080
```

### 1.2 统一 HTTP 响应

后端 HTTP 接口统一返回：

```json
{
  "success": true,
  "code": "OK",
  "message": "success",
  "data": {}
}
```

失败示例：

```json
{
  "success": false,
  "code": "BUSINESS_ERROR",
  "message": "错误说明",
  "data": null
}
```

### 1.3 会话 ID

| 字段 | 来源 | 说明 |
| --- | --- | --- |
| `localSessionId` | Java 后端生成 | 本地场景会话 ID，前后端业务状态以它为准 |
| `providerSessionId` | Qwen DataChannel `session.created` 返回 | 模型侧会话 ID，后端收到后绑定到本地会话 |

`start()` 返回时 `providerSessionId` 可以为 `null`，这是正常的。真正绑定发生在 DataChannel 收到 `session.created` 后，前端通过 `/ws/session-events` 上报给后端。

## 2. 登录注册 HTTP 接口

状态：建议新增。

### 2.1 注册

```text
POST /api/auth/register
```

请求：

```json
{
  "email": "name@example.com",
  "password": "password123"
}
```

响应：

```json
{
  "userId": "user_123",
  "email": "name@example.com",
  "emailVerified": false,
  "nextStep": "VERIFY_EMAIL"
}
```

### 2.2 登录

```text
POST /api/auth/login
```

请求：

```json
{
  "email": "name@example.com",
  "password": "password123"
}
```

响应：

```json
{
  "accessToken": "jwt_or_session_token",
  "user": {
    "userId": "user_123",
    "email": "name@example.com",
    "displayName": "Yufan"
  }
}
```

### 2.3 当前用户

```text
GET /api/auth/me
Authorization: Bearer <accessToken>
```

响应：

```json
{
  "userId": "user_123",
  "email": "name@example.com",
  "displayName": "Yufan",
  "emailVerified": true
}
```

## 3. Level 和老师选择 HTTP 接口

状态：建议新增。

### 3.1 保存新手引导偏好

```text
PUT /api/users/me/onboarding
Authorization: Bearer <accessToken>
```

请求：

```json
{
  "level": "starter",
  "teacherId": "james"
}
```

字段：

| 字段 | 可选值 |
| --- | --- |
| `level` | `starter`, `basic`, `independent`, `fluent` |
| `teacherId` | `clara`, `james`, `leo`, `david`, `emily`, `arthur` |

响应：

```json
{
  "userId": "user_123",
  "level": "starter",
  "teacherId": "james",
  "onboardingCompleted": true
}
```

### 3.2 获取用户偏好

```text
GET /api/users/me/profile
Authorization: Bearer <accessToken>
```

响应：

```json
{
  "userId": "user_123",
  "displayName": "Yufan",
  "level": "starter",
  "teacherId": "james",
  "voiceId": "Katerina",
  "conversationSpeed": "自然"
}
```

### 3.3 更新用户偏好

```text
PATCH /api/users/me/profile
Authorization: Bearer <accessToken>
```

请求：

```json
{
  "level": "basic",
  "teacherId": "clara",
  "conversationSpeed": "适中",
  "voiceId": "Katerina"
}
```

响应同 `GET /api/users/me/profile`。

## 4. 自由会话接口

状态：已部分实现。

### 4.1 启动自由会话

状态：已实现。

```text
POST /api/scene-sessions
```

请求：

```json
{
  "userId": "local-demo-user",
  "offerSdp": "v=0\r\n...",
  "topic": "自由对话。老师：James。语速：自然。水平：starter。",
  "provider": "QWEN",
  "model": null,
  "voice": "Katerina",
  "translationEnabled": true
}
```

响应：

```json
{
  "localSessionId": "scene_801cca60-5b30-49ce-be9c-54a55655754a",
  "providerSessionId": null,
  "answerSdp": "v=0\r\n...",
  "credentialExpiresAt": "2026-07-21T08:20:08Z",
  "systemPrompt": "完整系统提示词",
  "voiceId": "Katerina",
  "status": "CONNECTING",
  "createdAt": "2026-07-21T08:15:07Z",
  "endedAt": null
}
```

前端处理：

1. 创建 `RTCPeerConnection`。
2. 创建 DataChannel，label 建议为 `oai-events`。
3. 生成 offer SDP。
4. 调用本接口。
5. 使用 `answerSdp` 设置 remote description。
6. 连接 `/ws/session-events`。
7. 等待模型 DataChannel 返回 `session.created`。

### 4.2 会话事件 WebSocket

状态：已实现。

```text
WS /ws/session-events
```

前端发送给后端的统一消息：

```json
{
  "eventId": "evt_1784621747194_78p3gu",
  "type": "session.completed",
  "localSessionId": "scene_801cca60-5b30-49ce-be9c-54a55655754a",
  "sceneSessionId": "scene_801cca60-5b30-49ce-be9c-54a55655754a",
  "providerSessionId": "sess_Y8tInRGb5oBQKTMCPXvHM",
  "occurredAt": "2026-07-21T08:15:47.194Z",
  "payload": {
    "type": "session.completed",
    "reason": "user_stop"
  }
}
```

后端会通过 `type` 映射为业务事件。

| 前端发送 `type` | 后端映射 | 业务含义 |
| --- | --- | --- |
| `session.created` | `PROVIDER_SESSION_CREATED` | 模型会话创建，绑定 `providerSessionId` |
| `session.updated` | `PROVIDER_SESSION_UPDATED` | 模型会话配置完成，会话激活 |
| `conversation.item.input_audio_transcription.completed` | `USER_TRANSCRIPT_COMPLETED` | 用户字幕完成 |
| `response.audio_transcript.done` | `AI_TRANSCRIPT_COMPLETED` | AI 字幕完成 |
| `session.paused` | `SESSION_PAUSE` | 暂停 |
| `session.resumed` | `SESSION_RESUME` | 恢复 |
| `session.interrupted` | `SESSION_INTERRUPT` | 打断 |
| `session.completed` | `SESSION_COMPLETE` | 结束 |
| `error` | `SESSION_ERROR` | 异常 |

### 4.3 DataChannel 事件转发规则

前端从 Qwen DataChannel 收到以下事件后，需要转发到 `/ws/session-events`：

#### session.created

Qwen DataChannel 原始事件示例：

```json
{
  "event_id": "event_abc",
  "type": "session.created",
  "session": {
    "id": "sess_Y8tInRGb5oBQKTMCPXvHM"
  }
}
```

前端转发：

```json
{
  "eventId": "event_abc",
  "type": "session.created",
  "localSessionId": "scene_xxx",
  "sceneSessionId": "scene_xxx",
  "providerSessionId": "sess_Y8tInRGb5oBQKTMCPXvHM",
  "occurredAt": "2026-07-21T08:15:08.554Z",
  "payload": {
    "event_id": "event_abc",
    "type": "session.created",
    "session": {
      "id": "sess_Y8tInRGb5oBQKTMCPXvHM"
    }
  }
}
```

后端行为：

1. 绑定 `localSessionId` 和 `providerSessionId`。
2. 取消 bind timeout。
3. 记录日志：

```text
flow.5.datachannel.session
flow.6.bind
flow.event.bindTimeout canceled
```

#### 用户字幕完成

```json
{
  "type": "conversation.item.input_audio_transcription.completed",
  "item_id": "item_123",
  "transcript": "Hello."
}
```

后端会保存为用户消息。

#### AI 字幕完成

```json
{
  "type": "response.audio_transcript.done",
  "item_id": "item_456",
  "transcript": "Great! What's on your mind today?"
}
```

后端会保存为 AI 消息。

### 4.4 暂停、恢复、打断、结束

这些不走 HTTP，全部通过 `/ws/session-events`。

#### 暂停

```json
{
  "type": "session.paused",
  "localSessionId": "scene_xxx",
  "sceneSessionId": "scene_xxx",
  "occurredAt": "2026-07-21T08:15:17.161Z",
  "payload": {
    "type": "session.paused"
  }
}
```

#### 恢复

```json
{
  "type": "session.resumed",
  "localSessionId": "scene_xxx",
  "sceneSessionId": "scene_xxx",
  "payload": {
    "type": "session.resumed"
  }
}
```

#### 打断

```json
{
  "type": "session.interrupted",
  "localSessionId": "scene_xxx",
  "sceneSessionId": "scene_xxx",
  "payload": {
    "type": "session.interrupted",
    "source": {
      "type": "input_audio_buffer.speech_started"
    }
  }
}
```

#### 结束

```json
{
  "type": "session.completed",
  "localSessionId": "scene_xxx",
  "sceneSessionId": "scene_xxx",
  "payload": {
    "type": "session.completed",
    "reason": "user_stop"
  }
}
```

后端行为：

1. 会话状态变为 `COMPLETED`。
2. 结算用量。
3. 更新 session memory。
4. 记录日志：

```text
flow.state.stop
```

### 4.5 后端发给前端的 WebSocket 消息

当前已实现：bind timeout 后关闭 WebRTC。

```json
{
  "type": "webrtc.close",
  "localSessionId": "scene_xxx",
  "reason": "PROVIDER_BIND_TIMEOUT"
}
```

前端收到后应：

1. 关闭 PeerConnection。
2. 停止麦克风 track。
3. 关闭 DataChannel。
4. 回到自由对话主页。

## 5. 自定义场景接口

状态：建议新增。

### 5.1 生成自定义场景

```text
POST /api/scenes/custom
Authorization: Bearer <accessToken>
```

请求：

```json
{
  "prompt": "第一次去健身房，咨询设施、开放时间和会员体验",
  "level": "basic",
  "teacherId": "clara"
}
```

响应：

```json
{
  "sceneId": "scene_def_123",
  "title": "健身房会员咨询",
  "task": "咨询设施、开放时间和体验课",
  "role": "你与前台工作人员",
  "duration": "约 10 分钟",
  "level": "basic"
}
```

### 5.2 启动场景训练

建议复用自由会话启动接口，但增加 `sceneId` 或 `sceneType`。如果后端希望统一入口，可以扩展当前请求：

```text
POST /api/scene-sessions
```

扩展请求：

```json
{
  "userId": "user_123",
  "offerSdp": "v=0\r\n...",
  "sceneId": "scene_def_123",
  "sceneType": "CUSTOM_SCENE",
  "topic": "健身房会员咨询",
  "provider": "QWEN",
  "voice": "Katerina",
  "translationEnabled": true
}
```

## 6. 个人中心 HTTP 接口

状态：建议新增。

### 6.1 学习概览

```text
GET /api/users/me/overview
Authorization: Bearer <accessToken>
```

响应：

```json
{
  "weeklyMinutes": 183,
  "assetCount": 12,
  "streakDays": 7,
  "calendar": [
    {
      "date": "2026-07-21",
      "practiced": true,
      "minutes": 31
    }
  ],
  "milestones": [
    {
      "id": "first_free_chat",
      "title": "开口先锋",
      "unlocked": true
    }
  ]
}
```

### 6.2 会员和额度

```text
GET /api/users/me/subscription
Authorization: Bearer <accessToken>
```

响应：

```json
{
  "plan": "free",
  "freeChatQuota": {
    "usedMinutesToday": 3,
    "limitMinutesToday": 5
  },
  "sceneQuota": {
    "usedToday": 0,
    "limitToday": 1
  }
}
```

### 6.3 学习资产列表

```text
GET /api/learning-assets
Authorization: Bearer <accessToken>
```

查询参数：

```text
category=普通场景|IELTS|英文面试
page=1
pageSize=20
```

响应：

```json
{
  "items": [
    {
      "assetId": "asset_123",
      "title": "咖啡店点单",
      "category": "普通场景",
      "date": "2026-07-21",
      "status": "COMPLETED",
      "score": 84,
      "itemCount": 4
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

### 6.4 学习资产详情

```text
GET /api/learning-assets/{assetId}
Authorization: Bearer <accessToken>
```

响应：

```json
{
  "assetId": "asset_123",
  "title": "咖啡店点单",
  "category": "普通场景",
  "status": "COMPLETED",
  "learningItems": [
    {
      "type": "短语",
      "en": "with oat milk",
      "zh": "换成燕麦奶"
    }
  ],
  "conversation": [
    {
      "role": "USER",
      "text": "Could you recommend something less sweet?",
      "createdAt": "2026-07-21T08:15:40Z"
    }
  ],
  "scoreReport": {
    "totalScore": 84
  }
}
```

### 6.5 删除学习资产

```text
DELETE /api/learning-assets/{assetId}
Authorization: Bearer <accessToken>
```

响应：

```json
{
  "deleted": true
}
```

## 7. 评分接口

状态：建议新增。

评分可在会话结束后由后端异步生成，也可前端主动查询。

### 7.1 查询会话评分

```text
GET /api/scene-sessions/{localSessionId}/score
Authorization: Bearer <accessToken>
```

响应：

```json
{
  "localSessionId": "scene_xxx",
  "status": "READY",
  "totalScore": 84,
  "dimensions": [
    {
      "name": "pronunciation",
      "label": "发音清晰度",
      "score": 84
    },
    {
      "name": "fluency",
      "label": "流利度",
      "score": 78
    },
    {
      "name": "completeness",
      "label": "表达完整度",
      "score": 91
    },
    {
      "name": "interaction",
      "label": "互动回应",
      "score": 86
    },
    {
      "name": "naturalness",
      "label": "自然度",
      "score": 80
    }
  ],
  "feedback": [
    {
      "type": "GRAMMAR",
      "title": "表达问题",
      "original": "I feel like to try something different.",
      "suggestion": "I feel like trying something different.",
      "explanation": "feel like 后面应接动名词。"
    }
  ]
}
```

### 7.2 评分状态

如果评分异步生成：

```text
GET /api/scene-sessions/{localSessionId}/score/status
Authorization: Bearer <accessToken>
```

响应：

```json
{
  "localSessionId": "scene_xxx",
  "status": "PENDING"
}
```

可选值：

```text
PENDING, READY, FAILED
```

## 8. 前端页面和接口对应关系

| 前端页面 | HTTP 接口 | WebSocket/DataChannel |
| --- | --- | --- |
| 登录 | `POST /api/auth/login` | 无 |
| 注册 | `POST /api/auth/register` | 无 |
| Level 选择 | `PUT /api/users/me/onboarding` | 无 |
| 老师选择 | `PUT /api/users/me/onboarding`, `PATCH /api/users/me/profile` | 无 |
| 自由会话主页 | `POST /api/scene-sessions` | `/ws/session-events`, Qwen DataChannel |
| 自由会话暂停/恢复/打断/结束 | 无 | `/ws/session-events` |
| 字幕 | 无 | Qwen DataChannel -> `/ws/session-events` |
| 自定义场景 | `POST /api/scenes/custom` | 启动训练后同会话协议 |
| 场景训练 | `POST /api/scene-sessions` | `/ws/session-events`, Qwen DataChannel |
| 学习资产 | `GET /api/learning-assets` | 无 |
| 个人中心 | `GET /api/users/me/overview`, `GET /api/users/me/profile` | 无 |
| 会员额度 | `GET /api/users/me/subscription` | 无 |
| 评分结果 | `GET /api/scene-sessions/{localSessionId}/score` | 无 |

## 9. 当前后端已实现清单

| 能力 | 状态 | 文件 |
| --- | --- | --- |
| 启动自由会话 | 已实现 | `FreeChatSessionController` |
| 申请 Qwen 临时 token | 已实现 | `RealtimeCredentialServiceImpl` |
| Offer SDP 换 Answer SDP | 已实现 | `QwenRealtimeProvider` |
| 接收 WebSocket 会话事件 | 已实现 | `SessionWebSocketHandler` |
| 绑定 providerSessionId | 已实现 | `SessionService.handleEvent` |
| 暂停/恢复/打断/结束 | 已实现，走 WebSocket | `SessionService.handleEvent` |
| 用户/AI 字幕保存 | 已实现，走 WebSocket | `FreeChatSessionService.saveTranscript` |
| 登录注册 | 未实现 | 建议新增 |
| 用户偏好 | 仓储和服务雏形存在，HTTP 未实现 | 建议新增 Controller |
| 自定义场景 | 未实现 | 建议新增 |
| 学习资产 | 未实现 | 建议新增 |
| 评分 | 未实现 | 建议新增 |

## 10. 联调时看日志

日志文件：

```text
backend/unispeaking-server/logs/realtime-flow.log
```

命令：

```bash
tail -f backend/unispeaking-server/logs/realtime-flow.log
```

关键日志：

```text
flow.1.start.request
flow.2.token.request
flow.2.token.response
flow.3.sdp.request
flow.3.sdp.response
flow.4.start.response
flow.event.websocket
flow.5.datachannel.session
flow.6.bind
flow.event.transcript
flow.state.pause
flow.state.resume
flow.state.interrupt
flow.state.stop
```
