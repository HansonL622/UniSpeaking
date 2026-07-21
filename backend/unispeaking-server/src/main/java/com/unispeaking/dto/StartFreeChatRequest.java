package com.unispeaking.dto;

import com.unispeaking.domain.realtime.ProviderType;
import jakarta.validation.constraints.NotBlank;

public record StartFreeChatRequest(
		String userId,
		@NotBlank String offerSdp,
		String topic,
		ProviderType provider,
		String model,
		String voice,
		Boolean translationEnabled) {
}
