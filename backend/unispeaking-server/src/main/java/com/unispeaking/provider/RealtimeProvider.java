package com.unispeaking.provider;

import com.unispeaking.domain.prompt.SessionPrompt;
import com.unispeaking.domain.realtime.ProviderType;
import com.unispeaking.domain.realtime.RealtimeConnectionResult;
import com.unispeaking.domain.realtime.RealtimeCredential;
import com.unispeaking.domain.session.AbstractSceneSession;
import com.unispeaking.command.StartCommand;

public interface RealtimeProvider {
	ProviderType type();
	RealtimeConnectionResult connect(AbstractSceneSession session, SessionPrompt prompt,
			StartCommand command, RealtimeCredential credential);
}
