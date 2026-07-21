package com.unispeaking.domain.session;

public enum SessionStatus {
	CREATED,
	CONNECTING,
	WAITING_CLIENT,
	ACTIVE,
	PAUSED,
	INTERRUPTED,
	COMPLETED,
	FAILED
}
