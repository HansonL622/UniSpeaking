package com.unispeaking.service.realtime;

import com.unispeaking.domain.prompt.SessionPrompt;
import com.unispeaking.domain.realtime.ProviderType;
import com.unispeaking.domain.realtime.RealtimeConnectionResult;
import com.unispeaking.domain.session.AbstractSceneSession;
import com.unispeaking.command.StartCommand;

public interface RealtimeConnectionService {
	RealtimeConnectionResult connect(
			ProviderType type, AbstractSceneSession session, SessionPrompt prompt, StartCommand command);
}
