package com.unispeaking.domain.scene;

import com.unispeaking.domain.realtime.ProviderType;

public record SceneConfig(
		SceneType type,
		ProviderType providerType,
		String model,
		String defaultVoice,
		boolean translationEnabled) {
}
