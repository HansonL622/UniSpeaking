package com.unispeaking.domain.conversation;

import java.time.Instant;

public record ConversationMessage(
		String id,
		String localSessionId,
		SpeakerType speaker,
		String text,
		Instant createdAt) {
}
