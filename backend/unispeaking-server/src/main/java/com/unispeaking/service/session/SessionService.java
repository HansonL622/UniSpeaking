package com.unispeaking.service.session;

import com.unispeaking.command.StartCommand;
import com.unispeaking.component.SessionIdGenerator;
import com.unispeaking.common.logging.RealtimeFlowLog;
import com.unispeaking.domain.conversation.ConversationMessage;
import com.unispeaking.domain.profile.UserProfile;
import com.unispeaking.domain.prompt.SessionPrompt;
import com.unispeaking.domain.realtime.ProviderType;
import com.unispeaking.domain.realtime.RealtimeConnectionResult;
import com.unispeaking.domain.session.AbstractSceneSession;
import com.unispeaking.domain.session.SessionEvent;
import com.unispeaking.domain.session.SessionStatus;
import com.unispeaking.result.StartResult;
import com.unispeaking.service.auth.AuthService;
import com.unispeaking.service.profile.ProfileService;
import com.unispeaking.service.quota.UsageQuotaService;
import com.unispeaking.service.realtime.RealtimeConnectionService;
import java.time.Duration;

public abstract class SessionService {

	private static final Duration BIND_TIMEOUT = Duration.ofSeconds(10);

	protected final SessionStateService sessionStateService;
	private final AuthService authService;
	private final ProfileService profileService;
	private final RealtimeConnectionService realtimeConnectionService;
	private final SessionBindingTimeoutService bindingTimeoutService;
	private final UsageQuotaService usageQuotaService;
	private final SessionIdGenerator sessionIdGenerator;

	protected SessionService(
			SessionStateService sessionStateService,
			AuthService authService,
			ProfileService profileService,
			RealtimeConnectionService realtimeConnectionService,
			SessionBindingTimeoutService bindingTimeoutService,
			UsageQuotaService usageQuotaService,
			SessionIdGenerator sessionIdGenerator) {
		this.sessionStateService = sessionStateService;
		this.authService = authService;
		this.profileService = profileService;
		this.realtimeConnectionService = realtimeConnectionService;
		this.bindingTimeoutService = bindingTimeoutService;
		this.usageQuotaService = usageQuotaService;
		this.sessionIdGenerator = sessionIdGenerator;
	}

	public final StartResult start(StartCommand command) {
		String userId = authService.requireUserId(command.userId());
		UserProfile profile = profileService.getProfile(userId);
		String localSessionId = generateSessionId();
		AbstractSceneSession session = createSession(localSessionId, userId);
		SessionPrompt prompt = prepareScene(session, profile, command);

		usageQuotaService.reserve(userId, localSessionId);
		session.markConnecting();
		sessionStateService.create(session);

		RealtimeFlowLog.info("flow.state.start localSessionId={} userId={} requestedUserId={} provider={} voiceId={} status={}",
				session.getId(), session.getUserId(), command.userId(), session.getProviderType(),
				session.getVoiceId(), session.getStatus());

		RealtimeConnectionResult connection = realtimeConnectionService.connect(
				provider(session), session, prompt, command);

		session.markConnecting();
		sessionStateService.update(session);
		bindingTimeoutService.schedule(localSessionId, BIND_TIMEOUT);

		return toResult(session, connection);
	}

	public final void handleEvent(String localSessionId, SessionEvent event) {
		AbstractSceneSession session = get(localSessionId);
		synchronized (session) {
			switch (event.type()) {
				case PROVIDER_SESSION_CREATED -> {
					String previous = session.getProviderSessionId();
					session.bindProviderSession(event.providerSessionId());
					bindingTimeoutService.cancel(localSessionId);
					usageQuotaService.startMetering(localSessionId);
					sessionStateService.update(session);
					RealtimeFlowLog.info("flow.5.datachannel.session localSessionId={} providerSessionId={} eventId={} occurredAt={}",
							localSessionId, event.providerSessionId(), event.eventId(), event.occurredAt());
					RealtimeFlowLog.info("flow.6.bind localSessionId={} previousProviderSessionId={} providerSessionId={} bound={}",
							localSessionId, previous, session.getProviderSessionId(),
							session.getProviderSessionId() != null && !session.getProviderSessionId().isBlank());
				}
				case PROVIDER_SESSION_UPDATED -> {
					SessionStatus before = session.getStatus();
					session.activate();
					sessionStateService.update(session);
					RealtimeFlowLog.info("flow.event.handle localSessionId={} eventType={} rawType={} providerSessionId={} statusBefore={} statusAfter={}",
							localSessionId, event.type(), event.rawType(), session.getProviderSessionId(), before, session.getStatus());
				}
				case USER_TRANSCRIPT_COMPLETED, AI_TRANSCRIPT_COMPLETED -> saveTranscript(localSessionId, event);
				case SESSION_PAUSE -> {
					SessionStatus before = session.getStatus();
					session.pause();
					sessionStateService.update(session);
					logState("pause", session, before);
				}
				case SESSION_RESUME -> {
					SessionStatus before = session.getStatus();
					session.resume();
					sessionStateService.update(session);
					logState("resume", session, before);
				}
				case SESSION_INTERRUPT -> {
					SessionStatus before = session.getStatus();
					session.recordInterrupt();
					sessionStateService.update(session);
					logState("interrupt", session, before);
				}
				case SESSION_COMPLETE -> {
					if (session.getStatus() == SessionStatus.COMPLETED) {
						RealtimeFlowLog.info("flow.state.stop ignored localSessionId={} status={}",
								localSessionId, session.getStatus());
						return;
					}
					SessionStatus before = session.getStatus();
					session.complete();
					sessionStateService.update(session);
					usageQuotaService.settle(localSessionId);
					handleSessionCompleted(localSessionId);
					RealtimeFlowLog.info("flow.state.stop localSessionId={} providerSessionId={} statusBefore={} statusAfter={} endedAt={}",
							localSessionId, session.getProviderSessionId(), before, session.getStatus(), session.getEndedAt());
				}
				case SESSION_ERROR -> {
					SessionStatus before = session.getStatus();
					session.fail(event.errorCode(), event.errorMessage());
					sessionStateService.update(session);
					usageQuotaService.settle(localSessionId);
					RealtimeFlowLog.info("flow.event.error localSessionId={} providerSessionId={} statusBefore={} statusAfter={} errorCode={} errorMessage={}",
							localSessionId, session.getProviderSessionId(), before, session.getStatus(),
							event.errorCode(), event.errorMessage());
				}
				case BIND_TIMEOUT -> {
					if (session.getProviderSessionId() == null || session.getProviderSessionId().isBlank()) {
						SessionStatus before = session.getStatus();
						session.fail(event.errorCode(), event.errorMessage());
						sessionStateService.update(session);
						usageQuotaService.settleReservedQuota(localSessionId);
						bindingTimeoutService.sendCloseWebRtc(localSessionId);
						RealtimeFlowLog.info("flow.event.bindTimeout localSessionId={} statusBefore={} statusAfter={} errorCode={} errorMessage={}",
								localSessionId, before, session.getStatus(), event.errorCode(), event.errorMessage());
					}
					else {
						RealtimeFlowLog.info("flow.event.bindTimeout ignored localSessionId={} providerSessionId={} status={}",
								localSessionId, session.getProviderSessionId(), session.getStatus());
					}
				}
				default -> { }
			}
		}
	}

	public AbstractSceneSession get(String localSessionId) {
		return sessionStateService.get(localSessionId);
	}

	protected String generateSessionId() {
		return sessionIdGenerator.generate();
	}

	protected abstract AbstractSceneSession createSession(String localSessionId, String userId);
	protected abstract SessionPrompt prepareScene(AbstractSceneSession session, UserProfile profile, StartCommand command);
	protected abstract void saveTranscript(String localSessionId, SessionEvent event);
	protected abstract void handleSessionCompleted(String localSessionId);

	protected ConversationMessage toConversationMessage(String localSessionId, SessionEvent event) {
		return event.toConversationMessage(localSessionId);
	}

	private ProviderType provider(AbstractSceneSession session) {
		if (session.getProviderType() == null) {
			throw new IllegalStateException("session provider type is not prepared");
		}
		return session.getProviderType();
	}

	private StartResult toResult(AbstractSceneSession session, RealtimeConnectionResult connection) {
		return new StartResult(session.getId(), connection.providerSessionId(), connection.answerSdp(),
				connection.credentialExpiresAt(), session.getPrompt().systemPrompt(), session.getVoiceId(),
				session.getStatus(), session.getCreatedAt(), session.getEndedAt());
	}

	private void logState(String action, AbstractSceneSession session, SessionStatus before) {
		RealtimeFlowLog.info("flow.state.{} localSessionId={} providerSessionId={} statusBefore={} statusAfter={}",
				action, session.getId(), session.getProviderSessionId(), before, session.getStatus());
	}
}
