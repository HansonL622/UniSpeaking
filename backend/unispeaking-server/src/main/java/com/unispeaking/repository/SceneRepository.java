package com.unispeaking.repository;

import com.unispeaking.domain.scene.SceneConfig;
import com.unispeaking.domain.scene.SceneType;
import java.util.Optional;

public interface SceneRepository {
	Optional<SceneConfig> findByType(SceneType type);
}
