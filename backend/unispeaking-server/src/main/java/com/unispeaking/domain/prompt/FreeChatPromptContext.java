package com.unispeaking.domain.prompt;

import com.unispeaking.domain.profile.UserProfile;
import com.unispeaking.domain.scene.SceneConfig;

public record FreeChatPromptContext(
		UserProfile profile,
		SceneConfig sceneConfig,
		String topic) {
}
