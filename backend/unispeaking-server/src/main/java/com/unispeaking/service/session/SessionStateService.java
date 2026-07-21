package com.unispeaking.service.session;

import com.unispeaking.domain.session.AbstractSceneSession;

public interface SessionStateService {
	void create(AbstractSceneSession session);
	void update(AbstractSceneSession session);
	AbstractSceneSession get(String localSessionId);
	void remove(String localSessionId);
}
