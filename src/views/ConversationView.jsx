import React, { useState } from "react";
import Icon from "../components/Icon";

const TRANSLATIONS = {
  "Could you recommend something less sweet?": "你能推荐一些不太甜的吗？",
  "I feel like trying something different today.": "我今天想尝尝不一样的东西。",
  "latte with oat milk": "加燕麦奶的拿铁",
  "Would you like me to recommend something?": "需要我为您推荐一些东西吗？",
  "I’ll have a medium latte with oat milk.": "我要一杯中杯燕麦奶拿铁。",
  "That’s all, thank you.": "就这些，谢谢。",
  "Hey, hello!": "嘿，你好！",
  "Hi there! How can I help you today?": "嗨！今天有什么可以帮您的吗？",
  "Could you recommend me something less sweet?": "你能推荐一些不太甜的吗？",
  "How was lunch with your classmates today?": "今天和同学的午餐怎么样？",
  "It was relaxing. We talked about our group project and the food near campus.": "挺轻松的。我们聊了聊小组项目，还有校区附近的美食。",
  "That sounds nice. Which part of the project are you taking care of?": "听起来真不错。你负责项目的哪一部分呢？",
  "I watched a documentary about ocean exploration.": "我看了部关于海洋探索的纪录片。",
  "What surprised you most about it?": "关于它，最让你感到惊喜的是什么？",
  "Do you have anything planned for this weekend?": "你这周末有什么计划吗？",
  "I might visit a small exhibition downtown.": "我可能会去市中心看个小展览。"
};

export default function ConversationView({ state, updateState, resetConversation, showToast }) {
  const [inputText, setInputText] = useState("");

  const active = state.conversations.find((item) => item.id === state.activeConversation) || state.conversations[0];
  const turns = active?.turns || [];
  const ready = state.activeConversation === "new";
  const translatedTurns = state.translatedTurns || {};

  const handleTopicClick = () => {
    updateState({ activeConversation: "lunch", voiceState: "listening" });
  };

  const handleToggleTranslation = (index) => {
    const nextTranslations = { ...translatedTurns };
    nextTranslations[index] = !nextTranslations[index];
    updateState({ translatedTurns: nextTranslations });
  };

  const handleToggleTextMode = () => {
    updateState({ textOpen: !state.textOpen });
  };

  const handleToggleMic = () => {
    updateState({ voiceState: state.voiceState === "listening" ? "ready" : "listening" });
  };

  const handleEndConversation = () => {
    resetConversation();
    showToast("对话已结束，已回到准备状态");
  };

  const handleSubmitMessage = (e) => {
    e.preventDefault();
    const value = inputText.trim();
    if (!value) return;

    // Mutate the local turns in state for cleaner state rendering
    const updatedConversations = state.conversations.map((conv) => {
      if (conv.id === active.id) {
        return {
          ...conv,
          turns: [...conv.turns, ["You", value]]
        };
      }
      return conv;
    });

    updateState({
      conversations: updatedConversations,
      textOpen: false
    });
    setInputText("");
  };

  const modeClass = state.textOpen ? "text-mode" : "voice-mode";

  return (
    <section className={`conversation-view doubao-theme brand-style ${modeClass} view-enter`}>

      {/* Subtitles/Chat Bubbles Area */}
      <div className="chat-bubbles-container">
        {ready ? (
          <div className="chat-bubbles-ready-state">
            <div className="ready-content">
              <p className="eyebrow">Today's Topic</p>
              <h2>开启闲聊练习</h2>
              <p>随时准备着，说点什么开始吧</p>
            </div>
          </div>
        ) : (
          <div className="chat-bubbles-list">
            {turns.map(([speaker, text], index) => {
              const isYou = speaker === "You";
              const isTranslated = translatedTurns[index];
              const translation = TRANSLATIONS[text] || `(已翻译：${text})`;
              return (
                <article key={index} className={`chat-bubble-row ${isYou ? "you" : "ai"}`}>
                  <div className="bubble-avatar">{isYou ? "Me" : "AI"}</div>
                  <div className="bubble-content-box">
                    <div className="bubble-text">
                      <p>{text}</p>
                      {isTranslated && (
                        <p className="bubble-translation-text">{translation}</p>
                      )}
                    </div>
                    {!isYou && (
                      <div className="bubble-actions">
                        <button
                          type="button"
                          className={`action-btn translation-toggle ${isTranslated ? "active" : ""}`}
                          onClick={() => handleToggleTranslation(index)}
                        >
                          <Icon name="help" /> <span>{isTranslated ? "收起" : "翻译"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* The Red Circular Voice Orb */}
      <div className="glowing-orb-wrapper">
        <div className={`orb-pulsing-glow ${state.voiceState === "listening" ? "active" : ""}`}></div>
        <button
          className={`voice-orb is-${state.voiceState}`}
          type="button"
          onClick={handleToggleTextMode}
          aria-label="显示字幕"
        >
          <span className="orb-core"></span>
          <span className="orb-ring ring-a"></span>
          <span className="orb-ring ring-b"></span>
          <span className="orb-bars" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          </span>
        </button>
      </div>

      {/* Status Text */}
      <div className="doubao-status">
        <div className={`voice-indicators ${state.voiceState === "listening" ? "animating" : ""}`}>
          <span></span><span></span><span></span>
        </div>
        <p className="status-desc">
          {state.voiceState === "listening"
            ? "你可以开始说话"
            : ready
            ? "点击上方语音球开启字幕"
            : "随时接着说"}
        </p>
        <span className={`muted-badge ${state.muted ? "visible" : ""}`}>麦克风静音中</span>
      </div>

      {/* Bottom Composer Bar */}
      <div className="bottom-composer-wrapper">
        <div className="capsule-composer">
          <button
            className={`chat-toggle-btn ${state.textOpen ? "active" : ""}`}
            type="button"
            onClick={handleToggleTextMode}
            aria-label="切换文字显示"
          >
            <Icon name="chat" />
          </button>
          <form className="chat-input-form" onSubmit={handleSubmitMessage} style={{ flex: 1, display: "flex", margin: 0, background: "transparent", height: "auto", padding: 0 }}>
            <input
              className="composer-input"
              name="message"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入你想说话..."
              autoComplete="off"
            />
            <button type="submit" className="send-message-btn">
              <Icon name="arrow" />
            </button>
          </form>
        </div>

        {/* Action Buttons */}
        <button
          className={`action-btn-circle mic-toggle-btn is-${state.voiceState}`}
          type="button"
          onClick={handleToggleMic}
          aria-label="麦克风开关"
        >
          <Icon name="mic" />
        </button>
        <button
          className="action-btn-circle end-session-btn"
          type="button"
          onClick={handleEndConversation}
          aria-label="结束对话"
        >
          <span className="close-cross"></span>
        </button>
      </div>

      <div className="ai-footnote">内容由 AI 模拟生成</div>
    </section>
  );
}
