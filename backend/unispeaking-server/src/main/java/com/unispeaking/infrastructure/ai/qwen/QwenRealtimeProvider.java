package com.unispeaking.infrastructure.ai.qwen;

import com.unispeaking.common.logging.RealtimeFlowLog;
import com.unispeaking.domain.prompt.SessionPrompt;
import com.unispeaking.domain.realtime.ProviderType;
import com.unispeaking.domain.realtime.RealtimeConnectionResult;
import com.unispeaking.domain.realtime.RealtimeCredential;
import com.unispeaking.domain.session.AbstractSceneSession;
import com.unispeaking.exception.BusinessException;
import com.unispeaking.provider.RealtimeProvider;
import com.unispeaking.command.StartCommand;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.springframework.stereotype.Component;

@Component
public class QwenRealtimeProvider implements RealtimeProvider {

	private final HttpClient httpClient;
	private final RealtimeProperties properties;

	public QwenRealtimeProvider(HttpClient realtimeHttpClient, RealtimeProperties properties) {
		this.httpClient = realtimeHttpClient;
		this.properties = properties;
	}

	@Override
	public ProviderType type() {
		return ProviderType.QWEN;
	}

	@Override
	public RealtimeConnectionResult connect(AbstractSceneSession session, SessionPrompt prompt,
			StartCommand command, RealtimeCredential credential) {
		String offerSdp = command.offerSdp();
		if (offerSdp == null || offerSdp.isBlank()) {
			throw new BusinessException("INVALID_SDP", "WebRTC offer SDP is required");
		}
		if (credential.bearerToken() == null || credential.bearerToken().isBlank()) {
			throw new BusinessException("QWEN_CREDENTIAL_MISSING", "Qwen bearer credential is not configured");
		}
		String sdpExchangeUrl = properties.getWebRtcSdpExchangeUrl();
		if (sdpExchangeUrl.isBlank()) {
			throw new BusinessException(
					"QWEN_WORKSPACE_OR_MODEL_MISSING",
					"Set BAILIAN_WORKSPACE_ID and BAILIAN_MODEL before starting a Qwen realtime session");
		}
		try {
			RealtimeFlowLog.info("flow.3.sdp.request localSessionId={} userId={} provider={} url={} model={} voiceId={} temporaryToken={} offerSdp={}",
					session.getId(), session.getUserId(), type(), sdpExchangeUrl, properties.getModel(),
					session.getVoiceId(), RealtimeFlowLog.maskSecret(credential.bearerToken()),
					RealtimeFlowLog.sdpSummary(offerSdp));
			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(sdpExchangeUrl))
					.timeout(properties.getReadTimeout())
					.header("Authorization", "Bearer " + credential.bearerToken())
					.header("Content-Type", "application/sdp")
					.POST(HttpRequest.BodyPublishers.ofString(offerSdp))
					.build();
			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				throw new BusinessException("QWEN_SIGNALING_FAILED",
						"Qwen signaling returned " + response.statusCode());
			}
			if (response.body().length() > properties.getMaxAnswerBytes()) {
				throw new BusinessException("QWEN_ANSWER_TOO_LARGE", "Qwen answer SDP exceeds the configured limit");
			}
			RealtimeFlowLog.info("flow.3.sdp.response localSessionId={} status={} credentialExpiresAt={} answerSdp={}",
					session.getId(), response.statusCode(), credential.expiresAt(),
					RealtimeFlowLog.sdpSummary(response.body()));
			return new RealtimeConnectionResult(null, response.body(), credential.expiresAt());
		}
		catch (IOException exception) {
			throw new BusinessException("QWEN_SIGNALING_IO_ERROR", "Failed to call Qwen signaling");
		}
		catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
			throw new BusinessException("QWEN_SIGNALING_INTERRUPTED", "Qwen signaling call was interrupted");
		}
	}
}
