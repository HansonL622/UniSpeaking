package com.unispeaking.infrastructure.ai.qwen;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.unispeaking.domain.prompt.SessionPrompt;
import com.unispeaking.domain.realtime.ProviderType;
import com.unispeaking.domain.realtime.RealtimeCredential;
import com.unispeaking.domain.scene.SceneType;
import com.unispeaking.domain.session.FreeChatSceneSession;
import com.unispeaking.command.StartCommand;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Flow;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSession;
import org.junit.jupiter.api.Test;

class QwenRealtimeProviderTest {

	@Test
	void exchangesOfferAndAnswerSdpWithTheTemporaryBearerCredential()
			throws IOException, InterruptedException {
		RecordingHttpClient httpClient = new RecordingHttpClient("answer-sdp");
		RealtimeProperties properties = new RealtimeProperties(
				"",
				"workspace-123",
				"qwen3.5-omni-plus-realtime",
				"cn-beijing",
				"https://dashscope.aliyuncs.com/api/v1/tokens",
				300,
				Duration.ofSeconds(10),
				Duration.ofSeconds(20),
				1_048_576);
		properties.validate();
		QwenRealtimeProvider provider = new QwenRealtimeProvider(httpClient, properties);
		StartCommand command = new StartCommand(
				SceneType.FREE_CHAT,
				"user-1",
				null,
				"offer-sdp",
				"travel",
				ProviderType.QWEN,
				null,
				null,
				false);

		var result = provider.connect(
				new FreeChatSceneSession("session-1", "user-1"),
				new SessionPrompt("prompt"),
				command,
				new RealtimeCredential("temporary-token", Instant.parse("2026-07-20T00:05:00Z")));

		HttpRequest request = httpClient.request;
		assertEquals(
				"https://workspace-123.cn-beijing.maas.aliyuncs.com/api/v1/webrtc/realtime?model=qwen3.5-omni-plus-realtime",
				request.uri().toString());
		assertEquals("Bearer temporary-token",
				request.headers().firstValue("Authorization").orElseThrow());
		assertEquals("application/sdp",
				request.headers().firstValue("Content-Type").orElseThrow());
		assertEquals("offer-sdp", readBody(request));
		assertEquals("answer-sdp", result.answerSdp());
		assertEquals(Instant.parse("2026-07-20T00:05:00Z"), result.credentialExpiresAt());
	}

	private String readBody(HttpRequest request) {
		ByteArrayOutputStream bytes = new ByteArrayOutputStream();
		CompletableFuture<Void> completed = new CompletableFuture<>();
		request.bodyPublisher().orElseThrow().subscribe(new Flow.Subscriber<>() {
			@Override
			public void onSubscribe(Flow.Subscription subscription) {
				subscription.request(Long.MAX_VALUE);
			}

			@Override
			public void onNext(ByteBuffer item) {
				byte[] chunk = new byte[item.remaining()];
				item.get(chunk);
				bytes.writeBytes(chunk);
			}

			@Override
			public void onError(Throwable throwable) {
				completed.completeExceptionally(throwable);
			}

			@Override
			public void onComplete() {
				completed.complete(null);
			}
		});
		completed.join();
		return bytes.toString(java.nio.charset.StandardCharsets.UTF_8);
	}

	private static final class RecordingHttpClient extends HttpClient {

		private final String answerSdp;
		private HttpRequest request;

		private RecordingHttpClient(String answerSdp) {
			this.answerSdp = answerSdp;
		}

		@Override
		@SuppressWarnings("unchecked")
		public <T> HttpResponse<T> send(
				HttpRequest request,
				HttpResponse.BodyHandler<T> responseBodyHandler) {
			this.request = request;
			return (HttpResponse<T>) new StringHttpResponse(request, answerSdp);
		}

		@Override
		public <T> CompletableFuture<HttpResponse<T>> sendAsync(
				HttpRequest request,
				HttpResponse.BodyHandler<T> responseBodyHandler) {
			throw new UnsupportedOperationException();
		}

		@Override
		public <T> CompletableFuture<HttpResponse<T>> sendAsync(
				HttpRequest request,
				HttpResponse.BodyHandler<T> responseBodyHandler,
				HttpResponse.PushPromiseHandler<T> pushPromiseHandler) {
			throw new UnsupportedOperationException();
		}

		@Override public Optional<CookieHandler> cookieHandler() { return Optional.empty(); }
		@Override public Optional<Duration> connectTimeout() { return Optional.empty(); }
		@Override public Redirect followRedirects() { return Redirect.NEVER; }
		@Override public Optional<ProxySelector> proxy() { return Optional.empty(); }
		@Override public SSLContext sslContext() { return null; }
		@Override public SSLParameters sslParameters() { return new SSLParameters(); }
		@Override public Optional<Authenticator> authenticator() { return Optional.empty(); }
		@Override public Version version() { return Version.HTTP_1_1; }
		@Override public Optional<Executor> executor() { return Optional.empty(); }
	}

	private record StringHttpResponse(HttpRequest request, String body)
			implements HttpResponse<String> {

		@Override public int statusCode() { return 200; }
		@Override public Optional<HttpResponse<String>> previousResponse() { return Optional.empty(); }
		@Override public HttpHeaders headers() {
			return HttpHeaders.of(Map.of(), (name, value) -> true);
		}
		@Override public Optional<SSLSession> sslSession() { return Optional.empty(); }
		@Override public URI uri() { return request.uri(); }
		@Override public HttpClient.Version version() { return HttpClient.Version.HTTP_1_1; }
	}
}
