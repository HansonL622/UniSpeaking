package com.unispeaking.command;

import com.unispeaking.domain.realtime.ProviderType;
import com.unispeaking.domain.scene.SceneType;

public record StartCommand(
		SceneType sceneType,
		String userId,
		String sceneId,
		String offerSdp,
		String topic,
		ProviderType provider,
		String model,
		String voice,
		Boolean translationEnabled) {
}
