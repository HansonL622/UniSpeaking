package com.unispeaking.infrastructure.persistence.inmemory;

import com.unispeaking.domain.realtime.ProviderType;
import com.unispeaking.domain.scene.SceneConfig;
import com.unispeaking.domain.scene.SceneType;
import com.unispeaking.repository.SceneRepository;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class InMemorySceneRepository implements SceneRepository {

	@Override
	public Optional<SceneConfig> findByType(SceneType type) {
		return Optional.of(new SceneConfig(type, ProviderType.QWEN, null, "Katerina", true));
	}
}
