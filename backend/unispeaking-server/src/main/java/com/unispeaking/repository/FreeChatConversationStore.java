package com.unispeaking.repository;

import com.unispeaking.domain.conversation.ConversationMessage;
import java.util.List;

public interface FreeChatConversationStore {
	void append(ConversationMessage message);
	List<ConversationMessage> findByLocalSessionId(String localSessionId);
	void clear(String localSessionId);
}
