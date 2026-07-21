# Realtime sequence

```mermaid
sequenceDiagram
  participant Browser
  participant Spring as Spring Boot
  participant Provider as QwenRealtimeProvider
  participant Qwen as Qwen Realtime

  Browser->>Browser: Create RTCPeerConnection and offer SDP
  Browser->>Spring: Start session with offerSdp
  Spring->>Spring: Read permanent API key from server environment
  Spring->>Qwen: POST offer SDP + Bearer API key
  Qwen-->>Spring: Answer SDP
  Spring-->>Browser: localSessionId and answerSdp
  Browser->>Browser: setRemoteDescription(answerSdp)
  Browser->>Qwen: session.update over DataChannel
  Browser<<->>Qwen: Realtime audio and events
  Browser->>Spring: Report normalized lifecycle/transcript events
```

For Alibaba Model Studio WebRTC, the permanent API key stays on the Spring
server and authenticates the SDP exchange directly. There is no temporary-token
exchange in this protocol. Alibaba's AOQ protocol is a different flow: its
gateway returns an `aoqTokenForClient` that the native client uses to connect.
