package com.unispeaking.service.session.impl;

import com.unispeaking.common.logging.RealtimeFlowLog;
import com.unispeaking.domain.session.SessionEvent;
import com.unispeaking.service.session.FreeChatSessionService;
import com.unispeaking.service.session.SessionBindingTimeoutService;
import com.unispeaking.websocket.SessionWebSocketHandler;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class SessionBindingTimeoutServiceImpl implements SessionBindingTimeoutService {

	private final ObjectProvider<FreeChatSessionService> freeChatSessionServiceProvider;
	private final SessionWebSocketHandler sessionWebSocketHandler;
	private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
	private final Map<String, ScheduledFuture<?>> tasks = new ConcurrentHashMap<>();

	public SessionBindingTimeoutServiceImpl(
			ObjectProvider<FreeChatSessionService> freeChatSessionServiceProvider,
			SessionWebSocketHandler sessionWebSocketHandler) {
		this.freeChatSessionServiceProvider = freeChatSessionServiceProvider;
		this.sessionWebSocketHandler = sessionWebSocketHandler;
	}

	@Override
	public void schedule(String localSessionId, Duration timeout) {
		cancel(localSessionId);
		ScheduledFuture<?> task = scheduler.schedule(
				() -> {
					RealtimeFlowLog.info("flow.event.bindTimeout trigger localSessionId={} timeoutMillis={}",
							localSessionId, timeout.toMillis());
					freeChatSessionServiceProvider.getObject().handleEvent(localSessionId, SessionEvent.bindTimeout());
				},
				timeout.toMillis(),
				TimeUnit.MILLISECONDS);
		tasks.put(localSessionId, task);
		RealtimeFlowLog.info("flow.event.bindTimeout scheduled localSessionId={} timeoutMillis={}",
				localSessionId, timeout.toMillis());
	}

	@Override
	public void cancel(String localSessionId) {
		ScheduledFuture<?> task = tasks.remove(localSessionId);
		if (task != null) {
			task.cancel(false);
			RealtimeFlowLog.info("flow.event.bindTimeout canceled localSessionId={}", localSessionId);
		}
	}

	@Override
	public void sendCloseWebRtc(String localSessionId) {
		sessionWebSocketHandler.sendCloseWebRtc(localSessionId);
	}
}
