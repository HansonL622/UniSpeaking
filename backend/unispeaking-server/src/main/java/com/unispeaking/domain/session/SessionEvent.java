package com.unispeaking.domain.session;

import com.unispeaking.domain.conversation.ConversationMessage;
import com.unispeaking.domain.conversation.SpeakerType;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record SessionEvent(
		String eventId,
		String rawType,
		SessionEventType type,
		String providerSessionId,
		Instant occurredAt,
		SpeakerType speaker,
		String transcript,
		String errorCode,
		String errorMessage,
		Map<String, Object> payload) {

	public SessionEvent {
		rawType = rawType == null ? "" : rawType;
		payload = payload == null ? Map.of() : Map.copyOf(payload);
	}

	public static SessionEvent bindTimeout() {
		return new SessionEvent("event_" + UUID.randomUUID(), "BIND_TIMEOUT", SessionEventType.BIND_TIMEOUT,
				null, Instant.now(), null, null, "PROVIDER_BIND_TIMEOUT", "模型会话绑定超时", Map.of());
	}

	public ConversationMessage toConversationMessage(String localSessionId) {
		return new ConversationMessage(
				"message_" + UUID.randomUUID(),
				localSessionId,
				speaker,
				transcript == null ? "" : transcript,
				occurredAt == null ? Instant.now() : occurredAt);
	}
}
