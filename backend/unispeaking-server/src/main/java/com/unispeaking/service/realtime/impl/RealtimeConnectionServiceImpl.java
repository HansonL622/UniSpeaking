package com.unispeaking.service.realtime.impl;

import com.unispeaking.exception.BusinessException;
import com.unispeaking.domain.prompt.SessionPrompt;
import com.unispeaking.domain.realtime.ProviderType;
import com.unispeaking.domain.realtime.RealtimeConnectionResult;
import com.unispeaking.domain.session.AbstractSceneSession;
import com.unispeaking.command.StartCommand;
import com.unispeaking.provider.RealtimeProvider;
import com.unispeaking.service.realtime.RealtimeConnectionService;
import com.unispeaking.service.realtime.RealtimeCredentialService;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class RealtimeConnectionServiceImpl implements RealtimeConnectionService {

	private final Map<ProviderType, RealtimeProvider> providers = new EnumMap<>(ProviderType.class);
	private final RealtimeCredentialService credentialService;

	public RealtimeConnectionServiceImpl(
			List<RealtimeProvider> providers,
			RealtimeCredentialService credentialService) {
		providers.forEach(provider -> this.providers.put(provider.type(), provider));
		this.credentialService = credentialService;
	}

	@Override
	public RealtimeConnectionResult connect(
			ProviderType type, AbstractSceneSession session, SessionPrompt prompt, StartCommand command) {
		RealtimeProvider provider = providers.get(type);
		if (provider == null) {
			throw new BusinessException("UNSUPPORTED_PROVIDER", "Unsupported realtime provider: " + type);
		}
		var credential = credentialService.getCredential(type);
		return provider.connect(session, prompt, command, credential);
	}
}
