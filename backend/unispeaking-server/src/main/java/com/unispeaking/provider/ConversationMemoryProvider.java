package com.unispeaking.provider;

import com.unispeaking.domain.conversation.ConversationMessage;
import java.util.List;

public interface ConversationMemoryProvider {
	String summarize(List<ConversationMessage> messages);
	String merge(String existingMemory, String sessionSummary);
}
