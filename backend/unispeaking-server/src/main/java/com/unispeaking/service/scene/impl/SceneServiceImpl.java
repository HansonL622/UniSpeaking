package com.unispeaking.service.scene.impl;

import com.unispeaking.domain.scene.SceneConfig;
import com.unispeaking.domain.scene.SceneType;
import com.unispeaking.exception.SceneNotFoundException;
import com.unispeaking.repository.SceneRepository;
import com.unispeaking.service.scene.SceneService;
import org.springframework.stereotype.Service;

@Service
public class SceneServiceImpl implements SceneService {

	private final SceneRepository repository;

	public SceneServiceImpl(SceneRepository repository) {
		this.repository = repository;
	}

	@Override
	public SceneType type() {
		return SceneType.FREE_CHAT;
	}

	@Override
	public SceneConfig getConfig() {
		return repository.findByType(type())
				.orElseThrow(() -> new SceneNotFoundException(type().name()));
	}

	@Override
	public void validateAccess(String userId) {
	}
}
