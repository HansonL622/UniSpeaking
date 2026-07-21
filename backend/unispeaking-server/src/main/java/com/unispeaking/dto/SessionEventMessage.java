package com.unispeaking.dto;

import java.time.Instant;
import java.util.Map;

public record SessionEventMessage(
		String eventId,
		String type,
		String localSessionId,
		String sceneSessionId,
		String providerSessionId,
		Instant occurredAt,
		Map<String, Object> payload) {

	public String resolvedLocalSessionId() {
		if (localSessionId != null && !localSessionId.isBlank()) {
			return localSessionId;
		}
		return sceneSessionId;
	}
}
