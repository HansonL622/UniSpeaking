package com.unispeaking.service.realtime;

import com.unispeaking.domain.realtime.ProviderType;
import com.unispeaking.domain.realtime.RealtimeCredential;

public interface RealtimeCredentialService {
	RealtimeCredential getCredential(ProviderType providerType);
}
