package com.unispeaking.service.memory;

import com.unispeaking.domain.session.AbstractSceneSession;

public interface SessionMemoryService {
	void updateAfterCompletion(AbstractSceneSession session);
}
