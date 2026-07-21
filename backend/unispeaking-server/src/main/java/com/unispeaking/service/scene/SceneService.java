package com.unispeaking.service.scene;

import com.unispeaking.domain.scene.SceneConfig;
import com.unispeaking.domain.scene.SceneType;

public interface SceneService {
	SceneType type();
	SceneConfig getConfig();
	void validateAccess(String userId);
}
