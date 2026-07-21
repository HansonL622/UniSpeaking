package com.unispeaking.controller;

import com.unispeaking.mapper.SceneSessionMapper;
import com.unispeaking.dto.StartFreeChatRequest;
import com.unispeaking.dto.StartSessionResponse;
import com.unispeaking.dto.ApiResponse;
import com.unispeaking.common.logging.RealtimeFlowLog;
import com.unispeaking.service.session.FreeChatSessionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scene-sessions")
public class FreeChatSessionController {

	private final FreeChatSessionService service;
	private final SceneSessionMapper mapper;

	public FreeChatSessionController(FreeChatSessionService service, SceneSessionMapper mapper) {
		this.service = service;
		this.mapper = mapper;
	}

	@PostMapping
	public ApiResponse<StartSessionResponse> start(@Valid @RequestBody StartFreeChatRequest request) {
		RealtimeFlowLog.info("flow.1.start.request userId={} provider={} model={} voice={} translationEnabled={} topic={} offerSdp={}",
				request.userId(), request.provider(), request.model(), request.voice(), request.translationEnabled(),
				RealtimeFlowLog.textSummary(request.topic()), RealtimeFlowLog.sdpSummary(request.offerSdp()));
		StartSessionResponse response = mapper.toResponse(service.start(mapper.toCommand(request)));
		RealtimeFlowLog.info("flow.4.start.response localSessionId={} providerSessionId={} status={} voiceId={} credentialExpiresAt={} answerSdp={}",
				response.localSessionId(), response.providerSessionId(), response.status(), response.voiceId(),
				response.credentialExpiresAt(), RealtimeFlowLog.sdpSummary(response.answerSdp()));
		return ApiResponse.success(response);
	}
}
