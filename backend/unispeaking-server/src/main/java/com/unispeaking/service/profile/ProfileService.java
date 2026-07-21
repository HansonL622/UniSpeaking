package com.unispeaking.service.profile;

import com.unispeaking.domain.profile.UserProfile;

public interface ProfileService {
	UserProfile getProfile(String userId);
	UserProfile updateMemory(String userId, String memory);
}
