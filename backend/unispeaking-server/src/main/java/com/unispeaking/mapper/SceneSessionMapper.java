package com.unispeaking.mapper;

import com.unispeaking.dto.StartFreeChatRequest;
import com.unispeaking.dto.StartSessionResponse;
import com.unispeaking.domain.scene.SceneType;
import com.unispeaking.command.StartCommand;
import com.unispeaking.result.StartResult;
import org.springframework.stereotype.Component;

@Component
public class SceneSessionMapper {

	public StartCommand toCommand(StartFreeChatRequest request) {
		return new StartCommand(SceneType.FREE_CHAT, request.userId(), null, request.offerSdp(), request.topic(),
				request.provider(), request.model(), request.voice(), request.translationEnabled());
	}

	public StartSessionResponse toResponse(StartResult result) {
		return new StartSessionResponse(result.localSessionId(), result.providerSessionId(),
				result.answerSdp(), result.credentialExpiresAt(), result.systemPrompt(), result.voiceId(),
				result.status(), result.createdAt(), result.endedAt());
	}
}
