package com.unispeaking.infrastructure.config;

import com.unispeaking.websocket.SessionWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class SessionWebSocketConfig implements WebSocketConfigurer {

	private final SessionWebSocketHandler sessionWebSocketHandler;

	public SessionWebSocketConfig(SessionWebSocketHandler sessionWebSocketHandler) {
		this.sessionWebSocketHandler = sessionWebSocketHandler;
	}

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(sessionWebSocketHandler, "/ws/session-events")
				.setAllowedOrigins("*");
	}
}
