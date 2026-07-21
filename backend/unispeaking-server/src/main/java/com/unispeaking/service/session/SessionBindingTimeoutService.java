package com.unispeaking.service.session;

import java.time.Duration;

public interface SessionBindingTimeoutService {
	void schedule(String localSessionId, Duration timeout);
	void cancel(String localSessionId);
	void sendCloseWebRtc(String localSessionId);
}
