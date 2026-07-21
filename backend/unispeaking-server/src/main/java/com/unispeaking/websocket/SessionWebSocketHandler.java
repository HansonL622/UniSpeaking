package com.unispeaking.websocket;

import com.unispeaking.common.logging.RealtimeFlowLog;
import com.unispeaking.domain.session.SessionEvent;
import com.unispeaking.domain.session.SessionEventType;
import com.unispeaking.dto.SessionEventMessage;
import com.unispeaking.mapper.SessionEventMapper;
import com.unispeaking.service.session.FreeChatSessionService;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Component
public class SessionWebSocketHandler extends TextWebSocketHandler {

	private final ObjectMapper objectMapper;
	private final SessionEventMapper eventMapper;
	private final ObjectProvider<FreeChatSessionService> freeChatSessionServiceProvider;
	private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

	public SessionWebSocketHandler(
			ObjectMapper objectMapper,
			SessionEventMapper eventMapper,
			ObjectProvider<FreeChatSessionService> freeChatSessionServiceProvider) {
		this.objectMapper = objectMapper;
		this.eventMapper = eventMapper;
		this.freeChatSessionServiceProvider = freeChatSessionServiceProvider;
	}

	@Override
	protected void handleTextMessage(WebSocketSession webSocketSession, TextMessage message) throws Exception {
		SessionEventMessage eventMessage = objectMapper.readValue(message.getPayload(), SessionEventMessage.class);
		String localSessionId = eventMessage.resolvedLocalSessionId();
		if (localSessionId == null || localSessionId.isBlank()) {
			throw new IllegalArgumentException("localSessionId is required");
		}
		sessions.put(localSessionId, webSocketSession);
		SessionEvent event = eventMapper.toDomain(eventMessage);
		logReceived(localSessionId, eventMessage, event);
		freeChatSessionServiceProvider.getObject().handleEvent(localSessionId, event);
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
		sessions.entrySet().removeIf(entry -> entry.getValue().getId().equals(session.getId()));
	}

	public void sendCloseWebRtc(String localSessionId) {
		WebSocketSession session = sessions.get(localSessionId);
		if (session == null || !session.isOpen()) {
			return;
		}
		try {
			session.sendMessage(new TextMessage(closeMessage(localSessionId)));
		}
		catch (IOException exception) {
			sessions.remove(localSessionId);
		}
	}

	private String closeMessage(String localSessionId) {
		try {
			return objectMapper.writeValueAsString(Map.of(
					"type", "webrtc.close",
					"localSessionId", localSessionId,
					"reason", "PROVIDER_BIND_TIMEOUT"));
		}
		catch (JacksonException exception) {
			return "{\"type\":\"webrtc.close\"}";
		}
	}

	private void logReceived(String localSessionId, SessionEventMessage message, SessionEvent event) {
		if (!shouldLog(event.type())) {
			return;
		}
		RealtimeFlowLog.info("flow.event.websocket localSessionId={} eventId={} rawType={} mappedType={} providerSessionId={} occurredAt={} payloadKeys={}",
				localSessionId,
				message.eventId(),
				message.type(),
				event.type(),
				event.providerSessionId(),
				event.occurredAt(),
				message.payload() == null ? List.of() : message.payload().keySet());
	}

	private boolean shouldLog(SessionEventType type) {
		return switch (type) {
			case PROVIDER_SESSION_CREATED,
					PROVIDER_SESSION_UPDATED,
					SESSION_PAUSE,
					SESSION_RESUME,
					SESSION_INTERRUPT,
					SESSION_COMPLETE,
					SESSION_ERROR,
					BIND_TIMEOUT -> true;
			default -> false;
		};
	}
}
