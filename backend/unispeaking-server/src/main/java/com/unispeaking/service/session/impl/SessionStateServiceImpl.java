package com.unispeaking.service.session.impl;

import com.unispeaking.exception.SessionNotFoundException;
import com.unispeaking.domain.session.AbstractSceneSession;
import com.unispeaking.repository.SessionStateStore;
import com.unispeaking.service.session.SessionStateService;
import org.springframework.stereotype.Service;

@Service
public class SessionStateServiceImpl implements SessionStateService {

	private final SessionStateStore store;

	public SessionStateServiceImpl(SessionStateStore store) {
		this.store = store;
	}

	@Override
	public void create(AbstractSceneSession session) { store.save(session); }
	@Override
	public void update(AbstractSceneSession session) { store.save(session); }

	@Override
	public AbstractSceneSession get(String localSessionId) {
		return store.findById(localSessionId)
				.orElseThrow(() -> new SessionNotFoundException(localSessionId));
	}

	@Override
	public void remove(String localSessionId) { store.remove(localSessionId); }
}
