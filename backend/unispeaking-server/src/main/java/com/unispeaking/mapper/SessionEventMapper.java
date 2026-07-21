package com.unispeaking.mapper;

import com.unispeaking.domain.conversation.SpeakerType;
import com.unispeaking.domain.session.SessionEvent;
import com.unispeaking.domain.session.SessionEventType;
import com.unispeaking.dto.SessionEventMessage;
import java.time.Instant;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class SessionEventMapper {

	public SessionEvent toDomain(SessionEventMessage message) {
		Map<String, Object> payload = message.payload() == null ? Map.of() : message.payload();
		SessionEventType type = type(message.type());
		SpeakerType speaker = speaker(type);
		return new SessionEvent(
				message.eventId(),
				message.type(),
				type,
				providerSessionId(message, payload),
				message.occurredAt() == null ? Instant.now() : message.occurredAt(),
				speaker,
				transcript(payload),
				text(payload, "code", "SESSION_ERROR"),
				text(payload, "message", ""),
				payload);
	}

	private SessionEventType type(String value) {
		if (value == null || value.isBlank()) {
			return SessionEventType.UNKNOWN;
		}
		return switch (value) {
			case "session.created", "PROVIDER_SESSION_CREATED" -> SessionEventType.PROVIDER_SESSION_CREATED;
			case "session.updated", "PROVIDER_SESSION_UPDATED" -> SessionEventType.PROVIDER_SESSION_UPDATED;
			case "conversation.item.input_audio_transcription.completed", "USER_TRANSCRIPT_COMPLETED" ->
					SessionEventType.USER_TRANSCRIPT_COMPLETED;
			case "response.audio_transcript.done", "AI_TRANSCRIPT_COMPLETED", "ASSISTANT_TRANSCRIPT_COMPLETED" ->
					SessionEventType.AI_TRANSCRIPT_COMPLETED;
			case "session.paused", "SESSION_PAUSE" -> SessionEventType.SESSION_PAUSE;
			case "session.resumed", "SESSION_RESUME" -> SessionEventType.SESSION_RESUME;
			case "session.interrupted", "SESSION_INTERRUPT" -> SessionEventType.SESSION_INTERRUPT;
			case "session.completed", "SESSION_COMPLETE" -> SessionEventType.SESSION_COMPLETE;
			case "error", "SESSION_ERROR" -> SessionEventType.SESSION_ERROR;
			case "BIND_TIMEOUT" -> SessionEventType.BIND_TIMEOUT;
			default -> SessionEventType.UNKNOWN;
		};
	}

	private SpeakerType speaker(SessionEventType type) {
		return switch (type) {
			case USER_TRANSCRIPT_COMPLETED -> SpeakerType.USER;
			case AI_TRANSCRIPT_COMPLETED -> SpeakerType.ASSISTANT;
			default -> null;
		};
	}

	private String providerSessionId(SessionEventMessage message, Map<String, Object> payload) {
		if (message.providerSessionId() != null && !message.providerSessionId().isBlank()) {
			return message.providerSessionId();
		}
		Object session = payload.get("session");
		if (session instanceof Map<?, ?> sessionMap) {
			Object id = sessionMap.get("id");
			if (id instanceof String value && !value.isBlank()) {
				return value;
			}
		}
		Object sessionId = payload.get("session_id");
		return sessionId instanceof String value && !value.isBlank() ? value : null;
	}

	private String transcript(Map<String, Object> payload) {
		String text = text(payload, "text", null);
		return text == null ? text(payload, "transcript", "") : text;
	}

	private String text(Map<String, Object> payload, String key, String fallback) {
		Object value = payload.get(key);
		return value instanceof String string ? string : fallback;
	}
}
