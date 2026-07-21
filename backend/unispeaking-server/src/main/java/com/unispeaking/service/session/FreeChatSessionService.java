package com.unispeaking.service.session;

import com.unispeaking.command.StartCommand;
import com.unispeaking.component.SessionIdGenerator;
import com.unispeaking.domain.profile.UserProfile;
import com.unispeaking.domain.prompt.FreeChatPromptContext;
import com.unispeaking.domain.prompt.SessionPrompt;
import com.unispeaking.domain.realtime.ProviderType;
import com.unispeaking.domain.scene.SceneConfig;
import com.unispeaking.domain.session.AbstractSceneSession;
import com.unispeaking.domain.session.FreeChatSceneSession;
import com.unispeaking.domain.session.SessionEvent;
import com.unispeaking.service.auth.AuthService;
import com.unispeaking.service.conversation.FreeChatConversationService;
import com.unispeaking.service.memory.SessionMemoryService;
import com.unispeaking.service.profile.ProfileService;
import com.unispeaking.service.prompt.FreeChatPromptService;
import com.unispeaking.service.quota.UsageQuotaService;
import com.unispeaking.service.realtime.RealtimeConnectionService;
import com.unispeaking.service.scene.SceneService;
import org.springframework.stereotype.Service;

@Service
public class FreeChatSessionService extends SessionService {

	private final SceneService sceneService;
	private final FreeChatPromptService promptService;
	private final FreeChatConversationService conversationService;
	private final SessionMemoryService memoryService;

	public FreeChatSessionService(
			SessionStateService sessionStateService,
			AuthService authService,
			ProfileService profileService,
			RealtimeConnectionService realtimeConnectionService,
			SessionBindingTimeoutService bindingTimeoutService,
			UsageQuotaService usageQuotaService,
			SessionIdGenerator sessionIdGenerator,
			SceneService sceneService,
			FreeChatPromptService promptService,
			FreeChatConversationService conversationService,
			SessionMemoryService memoryService) {
		super(sessionStateService, authService, profileService, realtimeConnectionService,
				bindingTimeoutService, usageQuotaService, sessionIdGenerator);
		this.sceneService = sceneService;
		this.promptService = promptService;
		this.conversationService = conversationService;
		this.memoryService = memoryService;
	}

	@Override
	protected AbstractSceneSession createSession(String localSessionId, String userId) {
		return new FreeChatSceneSession(localSessionId, userId);
	}

	@Override
	protected SessionPrompt prepareScene(AbstractSceneSession session, UserProfile profile, StartCommand command) {
		SceneConfig sceneConfig = sceneService.getConfig();
		sceneService.validateAccess(session.getUserId());
		ProviderType provider = command.provider() == null ? sceneConfig.providerType() : command.provider();
		session.setProviderType(provider);
		session.setVoiceId(command.voice() == null || command.voice().isBlank()
				? profile.voiceId() : command.voice());
		SessionPrompt prompt = promptService.build(new FreeChatPromptContext(profile, sceneConfig, command.topic()));
		session.setPrompt(prompt);
		return prompt;
	}

	@Override
	protected void saveTranscript(String localSessionId, SessionEvent event) {
		conversationService.appendMessage(toConversationMessage(localSessionId, event));
	}

	@Override
	protected void handleSessionCompleted(String localSessionId) {
		memoryService.updateAfterCompletion(get(localSessionId));
	}
}
