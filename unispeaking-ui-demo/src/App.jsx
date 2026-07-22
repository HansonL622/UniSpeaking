import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Briefcase,
  CalendarBlank,
  CaretDown,
  CaretRight,
  Subtitles,
  Check,
  CheckCircle,
  Clock,
  Crown,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Fire,
  GearSix,
  Headphones,
  LockKey,
  Medal,
  Microphone,
  MicrophoneSlash,
  PaperPlaneTilt,
  Password,
  PhoneDisconnect,
  Play,
  Plus,
  ShieldCheck,
  SignOut,
  SlidersHorizontal,
  SpeakerHigh,
  SpeakerSlash,
  SquaresFour,
  Trash,
  Translate,
  UploadSimple,
  User,
  Waveform,
  X,
} from "@phosphor-icons/react";
import { assetRecords, learningItems, levels, plans, recommendations, teachers } from "./data.js";
import { createRealtimeClient } from "./realtimeClient.js";

const cx = (...parts) => parts.filter(Boolean).join(" ");

function Brand({ compact = false }) {
  return (
    <div className={cx("brand", compact && "brand--compact")}>
      <span className="brand__mark"><img src="/brand/unispeaking-mark-user.jpg" alt="" /></span>
      {!compact && <img className="brand__wordmark" src="/brand/unispeaking-wordmark.png" alt="UniSpeaking" />}
    </div>
  );
}

function AudioToggle({ label = "播放声音", compact = false, mini = false }) {
  const [muted, setMuted] = useState(false);
  return (
    <button
      type="button"
      className={cx("audio-toggle", compact && "audio-toggle--compact", mini && "audio-toggle--mini", muted && "is-muted")}
      aria-label={muted ? `开启${label}` : `关闭${label}`}
      aria-pressed={!muted}
      onClick={() => setMuted(!muted)}
    >
      <span className="audio-toggle__speaker"><SpeakerHigh weight="fill" /></span>
      <span className="audio-toggle__muted"><SpeakerSlash weight="fill" /></span>
    </button>
  );
}

function MicrophoneToggle({ label = "麦克风", className, onActivate }) {
  const [active, setActive] = useState(false);
  const toggle = () => {
    const nextActive = !active;
    setActive(nextActive);
    if (nextActive) onActivate?.();
  };
  return (
    <button
      type="button"
      className={cx("microphone-toggle", active && "is-active", className)}
      aria-label={active ? `关闭${label}` : `开启${label}`}
      aria-pressed={active}
      onClick={toggle}
    >
      <MicrophoneSlash className="microphone-toggle__slash" weight="fill" />
      <Microphone className="microphone-toggle__active" weight="fill" />
    </button>
  );
}

const formatCallDuration = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

function CallTimer({ state = "active", paused = false, className }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const updateElapsed = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const duration = formatCallDuration(elapsedSeconds);
  const label = state === "connecting"
    ? "连接中"
    : state === "ended"
      ? "已结束"
      : paused
        ? `已暂停 · ${duration}`
        : duration;

  return <time className={cx("call-presence__time", className)}>{label}</time>;
}

function CallControls({ paused, onToggleMicrophone, onEnd, disabled = false, subtitles = false, onToggleSubtitles, showSubtitles = true, className }) {
  return (
    <div className={cx("call-controls", className)}>
      <button className={cx("round-control", paused && "is-on")} aria-label={paused ? "恢复会话" : "暂停会话"} disabled={disabled} onClick={onToggleMicrophone}>{paused ? <MicrophoneSlash /> : <Microphone />}</button>
      {showSubtitles && <button className={cx("round-control", subtitles && "is-on")} aria-label={subtitles ? "关闭字幕" : "打开字幕"} onClick={onToggleSubtitles}><Subtitles /></button>}
      <button className="round-control round-control--end" aria-label="结束当前会话" disabled={disabled} onClick={onEnd}><PhoneDisconnect weight="fill" /></button>
    </div>
  );
}

const voiceWaveRestingLevels = [.28, .52, .78, 1, .72, .48, .3];

function VoiceWaveform({ active, compact = false }) {
  const waveformRef = useRef(null);

  useEffect(() => {
    const waveform = waveformRef.current;
    if (!waveform) return undefined;
    const bars = [...waveform.querySelectorAll(".voice-wave__bar")];
    const resetBars = () => bars.forEach((bar) => { bar.style.transform = ""; });

    if (!active) {
      waveform.classList.remove("is-fallback");
      resetBars();
      return undefined;
    }

    let cancelled = false;
    let animationFrame;
    let audioContext;
    let stream;

    const startListening = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("microphone unavailable");
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = .76;
        audioContext.createMediaStreamSource(stream).connect(analyser);
        const frequencies = new Uint8Array(analyser.frequencyBinCount);

        const animate = () => {
          analyser.getByteFrequencyData(frequencies);
          bars.forEach((bar, index) => {
            const bin = 2 + index * 2;
            const energy = Math.max(0, (frequencies[bin] - 12) / 118);
            const scale = Math.min(1, .18 + energy * (1.05 + voiceWaveRestingLevels[index] * .35));
            bar.style.transform = `scaleY(${scale})`;
          });
          animationFrame = requestAnimationFrame(animate);
        };
        animate();
      } catch {
        waveform.classList.add("is-fallback");
      }
    };

    startListening();
    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      audioContext?.close();
      waveform.classList.remove("is-fallback");
      resetBars();
    };
  }, [active]);

  return (
    <div ref={waveformRef} className={cx("voice-wave", active && "is-active", compact && "voice-wave--compact")} aria-hidden="true">
      {voiceWaveRestingLevels.map((level, index) => <span key={index} className="voice-wave__bar" style={{ "--rest-level": level }} />)}
    </div>
  );
}

function ExpandingCta({ children, className, direction = "forward", ...props }) {
  const Arrow = direction === "back" ? ArrowLeft : ArrowRight;
  return <button className={cx("expanding-cta", direction === "back" && "expanding-cta--back", className)} {...props}><span>{children}</span><Arrow weight="bold" /></button>;
}

function Button({ children, variant = "primary", icon, className, ...props }) {
  return (
    <button className={cx("button", `button--${variant}`, className)} {...props}>
      <span>{children}</span>{icon}
    </button>
  );
}

function SplashStartButton({ onClick }) {
  return (
    <button className="splash-start-button" type="button" onClick={onClick}>
      <span>开始练习</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polygon points="4,4 12,12 4,20" />
        <polygon points="9,4 17,12 9,20" />
        <polygon points="14,4 22,12 14,20" />
      </svg>
    </button>
  );
}

function Splash({ onStart, onLogin }) {
  return (
    <main className="splash">
      <header className="splash__header">
        <Brand />
        <button className="text-button" onClick={onLogin}>登录</button>
      </header>
      <section className="splash__hero">
        <p className="eyebrow">AI ENGLISH SPEAKING PARTNER</p>
        <h1>Speak More,<br />Speak Better.</h1>
        <p className="splash__cn">越说，越会说。</p>
        <p className="splash__copy">和懂你的 AI 老师自然对话，在低压力的练习中慢慢建立表达自信。</p>
        <SplashStartButton onClick={onStart} />
      </section>
      <footer className="splash__footer"><span>语你说</span><span>Web · Desktop</span></footer>
    </main>
  );
}

function Auth({ mode: initialMode, onBack, onSuccess }) {
  const [mode, setMode] = useState(initialMode || "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <main className="auth-layout">
        <aside className="auth-layout__aside"><Brand /><div><p className="eyebrow">ONE STEP LEFT</p><h2>先验证邮箱，<br />再开始第一次对话。</h2></div><p>语你说 · UniSpeaking</p></aside>
        <section className="auth-panel verify-panel">
          <div className="verify-icon"><EnvelopeSimple /></div>
          <p className="eyebrow">CHECK YOUR INBOX</p>
          <h1>验证你的邮箱</h1>
          <p>验证邮件已发送至 <strong>hello@example.com</strong>。完成验证后即可进入产品。</p>
          <Button onClick={onSuccess}>我已完成验证</Button>
          <button className="text-button">重新发送邮件</button>
        </section>
      </main>
    );
  }
  return (
    <main className="auth-layout">
      <aside className="auth-layout__aside">
        <Brand />
        <div><p className="eyebrow">SPEAK WITH EASE</p><h2>不用准备好，<br />也可以先开口。</h2><p>每一次自然表达，都是进步。</p></div>
        <p>语你说 · UniSpeaking</p>
      </aside>
      <section className="auth-panel">
        <button className="back-link" onClick={onBack}><ArrowLeft />返回</button>
        <div className="auth-panel__heading"><h1>{mode === "signup" ? "创建账号" : "欢迎回来"}</h1><p>{mode === "signup" ? "用邮箱注册，开始你的口语练习。" : "继续上一次的学习进度。"}</p></div>
        <form onSubmit={(event) => { event.preventDefault(); mode === "signup" ? setSent(true) : onSuccess(); }}>
          <label>邮箱<input type="email" placeholder="name@example.com" required /></label>
          <label>密码<span className="password-field"><input type={showPassword ? "text" : "password"} placeholder="至少 8 位字符" required /><button type="button" aria-label={showPassword ? "隐藏密码" : "显示密码"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeSlash /> : <Eye />}</button></span></label>
          {mode === "login" && <button type="button" className="forgot-link">忘记密码？</button>}
          <Button className="auth-submit" type="submit">{mode === "signup" ? "注册并验证邮箱" : "登录"}</Button>
        </form>
        <p className="auth-switch">{mode === "signup" ? "已经有账号？" : "还没有账号？"}<button onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "直接登录" : "创建账号"}</button></p>
      </section>
    </main>
  );
}

function LevelSetup({ selected, onSelect, onNext }) {
  return (
    <main className="setup-page">
      <header><Brand /><span>1 / 2</span></header>
      <section className="setup-card">
        <p className="eyebrow">A SIMPLE START</p><h1>你现在说英语时，<br />更接近哪种状态？</h1><p className="setup-lead">没有测试，也没有标准答案。这个选择只用于匹配对话难度。</p>
        <div className="level-options">
          {levels.map((level, index) => <button key={level.id} className={cx("level-option", selected === level.id && "is-selected")} onClick={() => onSelect(level.id)}><span className="level-option__number">0{index + 1}</span><span><strong>{level.title}</strong><small>{level.note}</small></span>{selected === level.id && <Check weight="bold" />}</button>)}
        </div>
        <ExpandingCta className="setup-next" disabled={!selected} onClick={onNext}>下一步</ExpandingCta>
      </section>
    </main>
  );
}

function TeacherSetup({ selectedId, onSelect, onFinish }) {
  const activeIndex = teachers.findIndex((teacher) => teacher.id === selectedId);
  const active = teachers[activeIndex];
  return (
    <main className="teacher-setup">
      <header><Brand /><span>2 / 2</span></header>
      <section className="teacher-heading"><p className="eyebrow">CHOOSE YOUR PARTNER</p><h1>选择一位 AI 老师</h1><p>每位老师都有固定口音和陪练方式，之后可在设置中更换。</p></section>
      <div className="coverflow" aria-label="AI 老师选择">
        {teachers.map((teacher, index) => {
          let distance = index - activeIndex;
          if (distance > teachers.length / 2) distance -= teachers.length;
          if (distance < -teachers.length / 2) distance += teachers.length;
          const absDistance = Math.abs(distance);
          const visible = absDistance <= 2;
          return (
            <button
              key={teacher.id}
              className={cx("teacher-card", distance === 0 && "is-active", !visible && "is-hidden")}
              style={{ "--distance": distance, "--abs-distance": absDistance }}
              onClick={() => onSelect(teacher.id)}
              aria-label={`选择 ${teacher.name}`}
              aria-hidden={!visible}
              tabIndex={visible ? 0 : -1}
            >
              <img src={teacher.image} alt={teacher.name} />
              <span className="teacher-card__meta"><strong>{teacher.name}</strong><small>{teacher.accent} · {teacher.personality}</small></span>
            </button>
          );
        })}
      </div>
      <section className="teacher-detail">
        <span className="teacher-detail__spacer" aria-hidden="true" />
        <div className="teacher-detail__audition"><AudioToggle mini label={`${active.name} 的自我介绍`} /><p>“{active.intro}”</p></div>
        <ExpandingCta className="teacher-cta" onClick={onFinish}>选择这位老师</ExpandingCta>
      </section>
    </main>
  );
}

function AppShell({ page, setPage, teacher, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = [
    { id: "conversation", label: "自由对话", icon: Waveform },
    { id: "scenes", label: "场景广场", icon: SquaresFour },
    { id: "assets", label: "学习资产", icon: BookOpenText },
  ];
  return (
    <div className={cx("app-shell", sidebarOpen && "is-sidebar-open")}>
      <aside className={cx("sidebar", sidebarOpen && "is-open")} onMouseEnter={() => setSidebarOpen(true)} onMouseLeave={() => setSidebarOpen(false)}>
        <Brand compact={!sidebarOpen} />
        <nav>{items.map(({ id, label, icon: Icon }) => <button key={id} className={cx("sidebar__item", page === id && "is-active")} onClick={() => setPage(id)} aria-label={label} title={label}><Icon weight={page === id ? "bold" : "regular"} /><span className="sidebar__label"><span>{label}</span></span></button>)}</nav>
        <button className={cx("sidebar__avatar", ["profile", "membership", "settings"].includes(page) && "is-active")} onClick={() => setPage("profile")}><img src={teacher.image} alt="个人中心" /></button>
      </aside>
      <div className="app-main">{children}</div>
    </div>
  );
}

function PageHeader({ eyebrow, title, subtitle, action }) {
  return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</header>;
}

function LevelSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);
  const closeTimerRef = useRef(null);
  const selectedLevel = levels.find((item) => item.id === value) || levels[0];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const selectLevel = (levelId) => {
    onChange(levelId);
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 180);
  };

  return (
    <div ref={selectRef} className={cx("level-select", open && "is-open")}>
      <button id="conversation-level" className="level-select__trigger" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span><strong>{selectedLevel.title}</strong><small>{selectedLevel.note}</small></span>
        <CaretDown weight="bold" />
      </button>
      {open && (
        <div className="level-select__menu" role="listbox" aria-label="英语水平">
          {levels.map((item, index) => (
            <button key={item.id} type="button" role="option" aria-selected={item.id === value} className={cx("level-select__option", item.id === value && "is-selected")} style={{ "--option-index": index }} onClick={() => selectLevel(item.id)}>
              <span><strong>{item.title}</strong><small>{item.note}</small></span>
              {item.id === value && <Check weight="bold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationSettings({ speed, level, teacher, onSave, onClose }) {
  const [draftSpeed, setDraftSpeed] = useState(speed);
  const [draftLevel, setDraftLevel] = useState(level || "basic");
  const [draftTeacherId, setDraftTeacherId] = useState(teacher.id);
  const speedOptions = ["慢一些", "适中", "自然", "快一些"];
  const speedIndex = Math.max(0, speedOptions.indexOf(draftSpeed));
  return (
    <section className="conversation-settings" role="dialog" aria-modal="false" aria-labelledby="conversation-settings-title">
      <button className="conversation-settings__close" aria-label="关闭对话设置" onClick={onClose}><X /></button>
      <div className="conversation-settings__heading"><h2 id="conversation-settings-title">对话设置</h2><p>调整后会从下一次对话开始生效。</p></div>
      <div className="conversation-settings__group"><label>对话语速</label><div className="conversation-settings__segment" style={{ "--speed-index": speedIndex }}><span className="conversation-settings__segment-indicator" aria-hidden="true" />{speedOptions.map((item) => <button key={item} className={draftSpeed === item ? "is-active" : ""} onClick={() => setDraftSpeed(item)}>{item}</button>)}</div></div>
      <div className="conversation-settings__group"><label htmlFor="conversation-level">英语水平</label><LevelSelect value={draftLevel} onChange={setDraftLevel} /></div>
      <div className="conversation-settings__group"><label>AI 老师</label><div className="conversation-settings__teachers">{teachers.map((item) => <button key={item.id} className={draftTeacherId === item.id ? "is-active" : ""} onClick={() => setDraftTeacherId(item.id)}><img src={item.image} alt="" /><span><strong>{item.name}</strong><small>{item.accent}</small></span></button>)}</div></div>
      <div className="conversation-settings__actions"><button onClick={onClose}>取消</button><button className="is-primary" onClick={() => onSave({ speed: draftSpeed, level: draftLevel, teacher: teachers.find((item) => item.id === draftTeacherId) })}>保存设置</button></div>
    </section>
  );
}

function Conversation({ teacher, speed, level, onSettingsChange }) {
  const [inCall, setInCall] = useState(false);
  const [callState, setCallState] = useState("idle");
  const [callStatus, setCallStatus] = useState("准备开始");
  const [callError, setCallError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subtitles, setSubtitles] = useState(true);
  const [paused, setPaused] = useState(false);
  const [translated, setTranslated] = useState([]);
  const [lines, setLines] = useState([]);
  const clientRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const transcriptRef = useRef(null);
  const transcriptPinnedRef = useRef(true);
  const toggleTranslation = (index) => setTranslated((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  const handleTranscriptScroll = () => {
    const transcript = transcriptRef.current;
    if (!transcript) return;
    transcriptPinnedRef.current = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 48;
  };

  const updateRealtimeTranscript = ({ id, who, delta = "", text = "", final = false }) => {
    const content = String(text || delta || "");
    if (!content) return;
    setLines((current) => {
      const lineId = id || `${who}-live`;
      const index = current.findIndex((line) => line.id === lineId && !line.final);
      if (index < 0) {
        const idSuffix = final ? `-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : "";
        return [...current, { id: `${lineId}${idSuffix}`, who, en: content, final }];
      }
      const next = [...current];
      next[index] = {
        ...next[index],
        id: final ? `${next[index].id}-final-${Date.now()}` : next[index].id,
        en: text || `${next[index].en}${delta}`,
        final,
      };
      return next;
    });
  };

  const handleRealtimeEvent = (event) => {
    if (event.type === "local.connecting") {
      setCallState("connecting");
      setCallStatus("正在连接模型");
      return;
    }
    if (event.type === "local.connected") {
      setCallState("connected");
      setCallStatus("正在等待模型会话");
      return;
    }
    if (event.type === "session.created") {
      setCallState("connected");
      setCallStatus("模型会话已建立");
      return;
    }
    if (event.type === "session.updated") {
      setCallState("active");
      setCallStatus("可以开始说了");
      return;
    }
    if (event.type === "conversation.item.input_audio_transcription.completed") {
      updateRealtimeTranscript({
        id: event.item_id || event.item?.id || "user-live",
        who: "你",
        text: event.transcript || event.text || "",
        final: true,
      });
      return;
    }
    if (
      event.type === "conversation.item.input_audio_transcription.delta"
      || event.type === "conversation.item.input_audio_transcription.text"
    ) {
      const preview = `${event.text || ""}${event.stash || ""}`;
      updateRealtimeTranscript({
        id: event.item_id || event.item?.id || "user-live",
        who: "你",
        ...(preview ? { text: preview } : { delta: event.delta || "" }),
      });
      return;
    }
    if (event.type === "response.audio_transcript.delta" || event.type === "response.text.delta") {
      updateRealtimeTranscript({
        id: event.item_id || event.response_id || "assistant-live",
        who: teacher.name,
        delta: event.delta || event.text || "",
      });
      return;
    }
    if (event.type === "response.audio_transcript.done") {
      updateRealtimeTranscript({
        id: event.item_id || event.response_id || "assistant-live",
        who: teacher.name,
        text: event.transcript || event.text || "",
        final: true,
      });
      return;
    }
    if (event.type === "input_audio_buffer.speech_started") {
      setCallStatus("正在听你说话");
      return;
    }
    if (event.type === "response.audio.delta") {
      setCallStatus(`${teacher.name} 正在回应`);
      return;
    }
    if (event.type === "local.paused") {
      setCallState("paused");
      setCallStatus("会话已暂停");
      return;
    }
    if (event.type === "local.resumed") {
      setCallState("active");
      setCallStatus("会话已恢复");
      return;
    }
    if (event.type === "local.interrupted") {
      setCallStatus("已打断当前回应");
      return;
    }
    if (event.type === "local.ended") {
      setInCall(false);
      setSubtitles(false);
      setPaused(false);
      setCallState("idle");
      setCallStatus("准备开始");
      clientRef.current = null;
      return;
    }
    if (event.type === "error" || event.type === "local.error") {
      setCallState("error");
      setCallError(event.message || event.error?.message || "实时会话发生错误");
      setCallStatus("连接异常");
    }
  };

  const getClient = () => {
    if (!clientRef.current) {
      clientRef.current = createRealtimeClient({
        onEvent: handleRealtimeEvent,
        onRemoteStream: (stream) => {
          if (!remoteAudioRef.current) return;
          remoteAudioRef.current.srcObject = stream;
          void remoteAudioRef.current.play().catch(() => {
            setCallStatus("点击页面后可播放 AI 声音");
          });
        },
      });
    }
    return clientRef.current;
  };

  const startConversation = async () => {
    setInCall(true);
    setPaused(false);
    setSubtitles(true);
    setLines([]);
    setTranslated([]);
    setCallError("");
    setCallState("connecting");
    setCallStatus("正在请求麦克风");
    try {
      await getClient().start({
        topic: `自由对话。老师：${teacher.name}。语速：${speed}。水平：${level || "basic"}。`,
      });
    } catch (error) {
      setCallState("error");
      setCallError(error instanceof Error ? error.message : "无法开始实时对话");
      setCallStatus("连接失败");
    }
  };

  const togglePaused = async () => {
    if (callState === "ended") return;
    const next = !paused;
    setPaused(next);
    if (next) await getClient().pause();
    else await getClient().resume();
  };

  const stopConversation = async () => {
    const client = clientRef.current;
    clientRef.current = null;
    setInCall(false);
    setSubtitles(false);
    setPaused(false);
    setCallState("idle");
    setCallStatus("准备开始");
    await client?.stop({ reason: "user_stop" });
  };

  useEffect(() => () => {
    void clientRef.current?.stop({ notifyBackend: false, reason: "component_unmount" });
  }, []);

  useEffect(() => {
    if (!subtitles) return undefined;
    transcriptPinnedRef.current = true;
    const frame = requestAnimationFrame(() => {
      const transcript = transcriptRef.current;
      if (transcript) transcript.scrollTop = transcript.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [subtitles]);

  useEffect(() => {
    if (!subtitles || !transcriptPinnedRef.current) return undefined;
    const frame = requestAnimationFrame(() => {
      const transcript = transcriptRef.current;
      if (transcript && transcriptPinnedRef.current) transcript.scrollTop = transcript.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [subtitles, lines]);

  if (!inCall) return (
    <main className="conversation standby">
      <div className="conversation__top conversation__top--standby"><button className="dialog-settings-button" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}><GearSix className="dialog-settings-button__icon" /><span>对话设置</span></button></div>
      {settingsOpen && <ConversationSettings speed={speed} level={level} teacher={teacher} onClose={() => setSettingsOpen(false)} onSave={(settings) => { onSettingsChange(settings); setSettingsOpen(false); }} />}
      <section className="standby__center">
        <div className="portrait portrait--large"><img src={teacher.image} alt={teacher.name} /></div>
        <p className="eyebrow">{teacher.name.toUpperCase()} · {teacher.accent}</p>
        <h1>想聊什么都可以</h1>
        <p>像打电话一样自然开口</p>
        {callError && <p className="call-error">{callError}</p>}
        <ExpandingCta className="standby__cta" onClick={startConversation}>开始对话</ExpandingCta>
      </section>
      <p className="privacy-note"><ShieldCheck />自由对话内容不会保存</p>
    </main>
  );
  return (
    <main className={cx("conversation call", subtitles && "call--subtitles")}>
      <audio ref={remoteAudioRef} className="remote-audio" autoPlay playsInline />
      <div className="conversation__top conversation__top--empty" />
      <section className="call__stage">
        <div className={cx("call-presence", subtitles && "call-presence--compact")}>
          <div className={cx("portrait", subtitles ? "portrait--small" : "portrait--call")}><img src={teacher.image} alt={teacher.name} /></div>
          <div className={cx("listening-state", subtitles && "listening-state--compact")}>
            <VoiceWaveform active={!paused && callState !== "connecting" && callState !== "ended"} compact={subtitles} />
            <CallTimer state={callState} paused={paused} />
            {!subtitles && <span>{callStatus}</span>}
          </div>
        </div>
        {subtitles && <div ref={transcriptRef} className="transcript" onScroll={handleTranscriptScroll} tabIndex="0" aria-label="对话字幕，可滚动查看历史内容">{lines.length === 0 ? <article className="transcript__line"><small>字幕</small><p>{callStatus}</p></article> : lines.map((line, index) => <article key={line.id || index} className={cx("transcript__line", line.who === "你" && "is-user")}><small>{line.who}</small><p>{line.en}</p>{line.zh && <button onClick={() => toggleTranslation(index)}><Translate />{translated.includes(index) ? "收起翻译" : "翻译"}</button>}{translated.includes(index) && <span>{line.zh}</span>}</article>)}</div>}
        {callError && <p className="call-error">{callError}</p>}
      </section>
      <CallControls paused={paused} onToggleMicrophone={togglePaused} onEnd={stopConversation} disabled={callState === "ended"} subtitles={subtitles} onToggleSubtitles={() => setSubtitles(!subtitles)} />
    </main>
  );
}

function Scenes({ onStartTraining, onLocked }) {
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const examples = ["餐厅点餐并说明忌口", "商场退换一件商品", "问路并确认交通方式", "预约理发并说明需求"];
  const generate = () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    window.setTimeout(() => {
      setPreview({ title: "我的专属练习", task: prompt.trim(), duration: "约 10 分钟", role: "你与场景角色" });
      setGenerating(false);
    }, 700);
  };
  return (
    <main className="page page--scenes">
      <PageHeader title="场景广场" subtitle="把真实生活中的需求，变成高质量的口语练习。" />
      <div className="scene-plaza-content section-block">
        <section className="scene-builder scene-module">
          <div className="scene-section-heading"><div><p className="eyebrow">CREATE YOUR OWN</p><h2>创建专属场景</h2></div><p>描述一个真实需求，我们会把它整理成有目标的练习。</p></div>
          <div className={cx("scene-input", prompt.trim() && "has-content")}>
            <textarea value={prompt} maxLength={200} onChange={(event) => setPrompt(event.target.value)} placeholder="例如：第一次去健身房，咨询设施、开放时间和会员体验" />
            <div className="scene-input__footer">
              <div className="example-chips"><small>快速开始</small>{examples.map((example) => <button key={example} onClick={() => setPrompt(example)}>{example}</button>)}</div>
              <div className="scene-input__controls"><span>{prompt.length}/200</span><ExpandingCta className={cx("scene-generate", generating && "is-generating")} disabled={!prompt.trim() || generating} onClick={generate}>{generating ? <><span className="scene-generate__dots"><i /><i /><i /></span>正在生成</> : "生成练习场景"}</ExpandingCta></div>
            </div>
          </div>
        </section>

        <section className="professional scene-module">
          <div className="scene-section-heading"><div><p className="eyebrow">PRO TRAINING</p><h2>专业特训</h2></div><p>针对考试与职场目标的结构化训练。</p></div>
          <div className="professional-grid">
            <article><span className="professional__icon professional__icon--ielts"><abbr title="International English Language Testing System">IELTS</abbr></span><span className="professional__copy"><small>权威题库 · 全真模拟</small><strong>IELTS 雅思口语</strong><em>覆盖 Part 1 / 2 / 3，提供维度评分与预估分数</em></span><ExpandingCta className="scene-card-cta" onClick={() => onLocked("IELTS 雅思口语")}>开始练习</ExpandingCta></article>
            <article><span className="professional__icon"><Briefcase /></span><span className="professional__copy"><small>材料分析 · 结构化准备</small><strong>英文面试</strong><em>上传简历或职位描述，生成针对性模拟面试</em></span><ExpandingCta className="scene-card-cta" onClick={() => onLocked("英文面试")}>开始练习</ExpandingCta></article>
          </div>
        </section>

        <section className="recommendations scene-module">
          <div className="scene-section-heading"><div><p className="eyebrow">DAILY PRACTICE</p><h2>今日推荐</h2></div><p>精选 3 个场景，每日刷新。</p></div>
          <div className="recommendation-list">{recommendations.map((item) => <article key={item.id}><span className="recommendation__number">{item.number}</span><span className="recommendation__title"><span className="tag">{item.tag}</span><strong>{item.title}</strong></span><small>{item.duration}<i>·</i>{item.level}</small><p>{item.goal}</p><ExpandingCta className="scene-card-cta" onClick={() => onStartTraining(item.title)}>开始练习</ExpandingCta></article>)}</div>
        </section>
      </div>
      {preview && <Modal onClose={() => setPreview(null)}><p className="eyebrow">SCENE READY</p><h2>练习场景已生成</h2><p className="modal-lead">确认信息后进入“学—读—说”训练流程。</p><dl className="scene-summary"><div><dt>场景</dt><dd>{preview.title}</dd></div><div><dt>你的任务</dt><dd>{preview.task}</dd></div><div><dt>角色</dt><dd>{preview.role}</dd></div><div><dt>预计时间</dt><dd>{preview.duration}</dd></div></dl><div className="modal-actions"><Button variant="secondary" onClick={() => setPreview(null)}>返回修改</Button><Button onClick={() => onStartTraining(preview.title)} icon={<ArrowRight />}>确认并开始</Button></div></Modal>}
    </main>
  );
}

function Modal({ children, onClose, wide = false, dismissible = true, className }) {
  return <div className="modal-backdrop" onMouseDown={dismissible ? onClose : undefined}><div className={cx("modal", wide && "modal--wide", className)} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>{dismissible && <button className="modal__close" aria-label="关闭" onClick={onClose}><X /></button>}{children}</div></div>;
}

const completedSimulationMetrics = [
  { label: "发音清晰度", value: 84 },
  { label: "流利度", value: 78 },
  { label: "表达完整度", value: 91 },
  { label: "互动回应", value: 86 },
  { label: "自然度", value: 80 },
];

const incompleteSimulationMetrics = [
  { label: "发音清晰度", value: 72 },
  { label: "流利度", value: 64 },
  { label: "表达完整度", value: 70 },
  { label: "互动回应", value: 62 },
  { label: "自然度", value: 68 },
];

function RadarChart({ metrics }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 320;
    const density = window.devicePixelRatio || 1;
    canvas.width = size * density;
    canvas.height = size * density;
    const context = canvas.getContext("2d");
    context.scale(density, density);
    context.clearRect(0, 0, size, size);

    const center = size / 2;
    const radius = 92;
    const angleAt = (index) => -Math.PI / 2 + index * (Math.PI * 2 / metrics.length);
    const pointAt = (index, pointRadius) => ({
      x: center + Math.cos(angleAt(index)) * pointRadius,
      y: center + Math.sin(angleAt(index)) * pointRadius,
    });
    const traceShape = (pointRadius) => {
      context.beginPath();
      metrics.forEach((_, index) => {
        const point = pointAt(index, pointRadius);
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.closePath();
    };

    context.lineWidth = 1;
    context.strokeStyle = "#deded9";
    for (let level = 1; level <= 4; level += 1) {
      traceShape(radius * level / 4);
      context.stroke();
    }
    metrics.forEach((_, index) => {
      const point = pointAt(index, radius);
      context.beginPath();
      context.moveTo(center, center);
      context.lineTo(point.x, point.y);
      context.stroke();
    });

    context.beginPath();
    metrics.forEach((metric, index) => {
      const point = pointAt(index, radius * metric.value / 100);
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.fillStyle = "rgba(21, 21, 21, .15)";
    context.strokeStyle = "#151515";
    context.lineWidth = 2;
    context.fill();
    context.stroke();

    context.fillStyle = "#151515";
    metrics.forEach((metric, index) => {
      const point = pointAt(index, radius * metric.value / 100);
      context.beginPath();
      context.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
      context.fill();
    });

    context.font = '600 14px Inter, "PingFang SC", sans-serif';
    context.textBaseline = "middle";
    metrics.forEach((metric, index) => {
      const labelPoint = pointAt(index, 126);
      context.textAlign = Math.abs(labelPoint.x - center) < 10 ? "center" : labelPoint.x < center ? "right" : "left";
      context.fillText(metric.label, labelPoint.x, labelPoint.y);
    });
  }, [metrics]);

  return <canvas ref={canvasRef} role="img" aria-label={`五维雷达图：${metrics.map((metric) => `${metric.label} ${metric.value} 分`).join("，")}`} />;
}

function ResultModal({ completed, onBack, onAssets }) {
  const metrics = completed ? completedSimulationMetrics : incompleteSimulationMetrics;
  const totalScore = completed ? 84 : 68;
  return (
    <Modal wide dismissible={false} className="result-modal">
      <header className="result-modal__header">
        <div><p className="eyebrow">SIMULATION COMPLETE</p><h2>{completed ? "模拟完成" : "本次模拟已结束"}</h2><p className="result-modal__lead">{completed ? "你顺利完成了本次模拟，五个维度的表现如下。" : "本次对话已保存，下面是截至结束时的五维表现。"}</p></div>
        <div className="result-modal__score"><strong>{totalScore}</strong><span>/100</span></div>
      </header>
      <section className="result-modal__overview">
        <div className="result-radar"><RadarChart metrics={metrics} /></div>
        <ul className="result-metrics">{metrics.map((metric) => <li key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></li>)}</ul>
      </section>
      <div className="result-modal__actions"><ExpandingCta direction="back" className="result-action result-action--light" onClick={onBack}>返回场景广场</ExpandingCta><ExpandingCta className="result-action result-action--dark" onClick={onAssets}>查看学习资产</ExpandingCta></div>
    </Modal>
  );
}

const readFocusWords = ["recommend", "trying", "oat", "recommend"];

function HighlightedReadSentence({ sentence, focus }) {
  const start = sentence.toLowerCase().indexOf(focus.toLowerCase());
  if (start < 0) return sentence;
  return <>{sentence.slice(0, start)}<mark>{sentence.slice(start, start + focus.length)}</mark>{sentence.slice(start + focus.length)}</>;
}

function ReadScoreModal({ feedback, onClose }) {
  const feedbackItem = learningItems[feedback.index];
  return (
    <Modal dismissible={false} className="read-score-modal">
      <div className="read-score-modal__score"><strong>{feedback.score}</strong><span>/100</span></div>
      <h2>本句发音评估</h2>
      <p className="read-score-modal__lead">{feedback.score >= 70 ? "整体清晰，再留意标记部分的重音与连读。" : "再留意标记部分的重音与连读，然后重新朗读。"}</p>
      <div className="read-score-modal__focus"><small>发音定位</small><p><HighlightedReadSentence sentence={feedbackItem.en} focus={readFocusWords[feedback.index]} /></p></div>
      <button type="button" className="read-score-modal__confirm" onClick={onClose}>知道了</button>
    </Modal>
  );
}

function Training({ sceneTitle, teacher, initialStep = "learn", result, onExit, onComplete, onBack, onAssets }) {
  const steps = [
    { id: "learn", label: "学" },
    { id: "read", label: "读" },
    { id: "speak", label: "说" },
  ];
  const initialStepIndex = Math.max(0, steps.findIndex((item) => item.id === initialStep));
  const [step, setStep] = useState(initialStep);
  const [unlockedStepIndex, setUnlockedStepIndex] = useState(initialStepIndex);
  const [completedSteps, setCompletedSteps] = useState(() => steps.slice(0, initialStepIndex).map((item) => item.id));
  const [learnIndex, setLearnIndex] = useState(0);
  const [readIndex, setReadIndex] = useState(0);
  const [learnedItems, setLearnedItems] = useState([]);
  const [readScores, setReadScores] = useState({});
  const [heardReadDemos, setHeardReadDemos] = useState([]);
  const [readFeedback, setReadFeedback] = useState(null);
  const [speakingLines, setSpeakingLines] = useState(2);
  const [simulationPaused, setSimulationPaused] = useState(false);
  const itemIndex = step === "read" ? readIndex : learnIndex;
  const item = learningItems[itemIndex];
  const score = readScores[readIndex] ?? null;
  const completeStep = (id) => setCompletedSteps((current) => current.includes(id) ? current : [...current, id]);
  const goToStep = (id) => {
    const targetIndex = steps.findIndex((item) => item.id === id);
    if (targetIndex <= unlockedStepIndex) setStep(id);
  };
  const nextLearn = () => {
    setLearnedItems((current) => current.includes(learnIndex) ? current : [...current, learnIndex]);
    if (learnIndex < learningItems.length - 1) setLearnIndex(learnIndex + 1);
    else {
      completeStep("learn");
      setUnlockedStepIndex((current) => Math.max(current, 1));
      setStep("read");
    }
  };
  const submitRead = () => {
    const nextScore = readIndex === 1 && score === null ? 68 : 86;
    setReadScores((current) => ({ ...current, [readIndex]: nextScore }));
    setReadFeedback({ index: readIndex, score: nextScore });
  };
  const playReadDemo = () => {
    setHeardReadDemos((current) => current.includes(readIndex) ? current : [...current, readIndex]);
  };
  const nextRead = () => {
    if ((readScores[readIndex] ?? 0) < 70) return;
    if (readIndex < learningItems.length - 1) setReadIndex(readIndex + 1);
    else {
      completeStep("read");
      setUnlockedStepIndex((current) => Math.max(current, 2));
      setStep("speak");
    }
  };
  return (
    <main className="training-page">
      <header className="training-header"><div><strong>{sceneTitle}</strong><span>从语言到真实表达</span></div><button className="training-exit" aria-label="关闭训练" onClick={onExit}><span><X weight="bold" /></span></button></header>
      <nav className="stepper" aria-label="练习进度">
        <span className="stepper__track" aria-hidden="true"><span style={{ width: `${unlockedStepIndex * 50}%` }} /></span>
        {steps.map((stepItem, index) => {
          const done = completedSteps.includes(stepItem.id);
          return <button key={stepItem.id} className={cx("stepper__item", step === stepItem.id && "is-active", done && "is-done")} disabled={index > unlockedStepIndex} onClick={() => goToStep(stepItem.id)}><span className="stepper__check">{done ? <Check weight="bold" /> : index + 1}</span><span className="stepper__copy"><strong>{stepItem.label}</strong></span></button>;
        })}
      </nav>
      {step === "learn" && <section className="training-workspace"><aside className="lesson-list"><div><span>本组语言</span><small>{learnIndex + 1} / {learningItems.length}</small></div>{learningItems.map((learningItem, index) => <button key={learningItem.en} className={cx(index === learnIndex && "is-active", learnedItems.includes(index) && "is-done")} onClick={() => setLearnIndex(index)}><small>{learningItem.type}</small><strong>{learningItem.en}</strong><span>{learnedItems.includes(index) ? <Check weight="bold" /> : index + 1}</span></button>)}</aside><article className="learn-stage"><small>{item.type}</small><h1>{item.en}</h1><div className="pronunciation"><span>/ˌrekəˈmend/</span><AudioToggle mini label={`${item.en} 的发音`} /></div><p>{item.zh}</p><div className="stage-footer"><ExpandingCta direction="back" disabled={learnIndex === 0} onClick={() => setLearnIndex(learnIndex - 1)}>上一个</ExpandingCta><ExpandingCta onClick={nextLearn}>{learnIndex === learningItems.length - 1 ? "进入朗读" : "下一个"}</ExpandingCta></div></article></section>}
      {step === "read" && <section className="training-workspace"><aside className="lesson-list"><div><span>完整表达</span><small>{readIndex + 1} / {learningItems.length}</small></div>{learningItems.map((learningItem, index) => <button key={learningItem.en} className={cx(index === readIndex && "is-active", (readScores[index] ?? 0) >= 70 && "is-done")} onClick={() => setReadIndex(index)}><small>句子</small><strong>{learningItem.en}</strong><span>{(readScores[index] ?? 0) >= 70 ? <Check weight="bold" /> : index + 1}</span></button>)}</aside><article className="read-stage"><h1>{item.en}</h1><p>{item.zh}</p><div className="rhythm"><span>节奏重点</span><strong>{item.en.split(" ").slice(0, 4).join(" · ")}</strong></div><MicrophoneToggle label="朗读麦克风" onActivate={submitRead} /><h3>{score === null ? "轮到你说" : score >= 70 ? "朗读通过" : "再试一次"}</h3>{score === null && <p>尽量完整、连贯地说出整句话。</p>}<button type="button" className="read-replay" onClick={playReadDemo}><SpeakerHigh weight="fill" />{heardReadDemos.includes(readIndex) ? "再听一次标准示范" : "听标准示范"}</button>{score >= 70 && <div className="stage-footer read-stage-footer"><span /><ExpandingCta onClick={nextRead}>{readIndex === learningItems.length - 1 ? "进入模拟" : "下一句"}</ExpandingCta></div>}</article></section>}
      {step === "speak" && <section className="simulation call call--subtitles"><section className="call__stage"><div className="call-presence call-presence--avatarless"><div className="listening-state listening-state--compact"><VoiceWaveform active={!simulationPaused && !result} compact /><CallTimer paused={simulationPaused} /></div></div><div className="transcript simulation__transcript" tabIndex="0" aria-label="模拟对话字幕，可滚动查看历史内容"><article className="transcript__line"><small>店员</small><p>Hi! What can I get started for you today?</p></article><article className="transcript__line is-user"><small>你</small><p>Could you recommend something less sweet?</p></article>{speakingLines >= 3 && <article className="transcript__line"><small>店员</small><p>Sure — how about a medium oat milk latte?</p></article>}{speakingLines >= 4 && <article className="transcript__line is-user"><small>你</small><p>That sounds great. I’ll have that, thank you.</p></article>}</div></section><CallControls paused={simulationPaused} onToggleMicrophone={() => { setSimulationPaused((current) => !current); setSpeakingLines((current) => Math.min(4, current + 1)); }} onEnd={() => onComplete(speakingLines >= 4)} showSubtitles={false} /></section>}
      {result && <ResultModal completed={result.completed} onBack={onBack} onAssets={onAssets} />}
      {readFeedback && <ReadScoreModal feedback={readFeedback} onClose={() => setReadFeedback(null)} />}
    </main>
  );
}

function Assets({ onRepeat }) {
  const [filter, setFilter] = useState("全部");
  const [selected, setSelected] = useState(assetRecords[0]);
  const [deleted, setDeleted] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const records = assetRecords.filter((record) => !deleted.includes(record.id) && (filter === "全部" || record.category === filter));
  return (
    <main className="page assets-page"><PageHeader title="学习资产" subtitle="把场景练习中真正用过的表达，留在这里继续复习。" />
      <div className="asset-filters">{["全部", "普通场景", "IELTS", "英文面试"].map((item) => <button key={item} className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <section className="asset-layout"><aside className="asset-list">{records.map((record) => <button key={record.id} className={selected.id === record.id ? "is-active" : ""} onClick={() => setSelected(record)}><span><small>{record.date} · {record.category}</small><strong>{record.title}</strong><em>{record.items} 个语言资产</em></span><span className="asset-status">{record.status}{record.score && ` · ${record.score}`}</span></button>)}</aside><article className="asset-detail"><header><div><p className="eyebrow">{selected.category}</p><h2>{selected.title}</h2><p>{selected.date} · {selected.status}</p></div><div><Button variant="secondary" aria-label="删除记录" onClick={() => setDeleteOpen(true)}><Trash /></Button><Button onClick={() => onRepeat(selected.title)} icon={<Play weight="fill" />}>复练场景</Button></div></header><nav>{["学习内容", "模拟对话", "表达反馈", "综合报告"].map((item, index) => <button key={item} className={index === 0 ? "is-active" : ""}>{item}</button>)}</nav><div className="asset-items">{learningItems.map((item) => <div key={item.en}><span className="tag">{item.type}</span><p><strong>{item.en}</strong><small>{item.zh}</small></p><AudioToggle compact label={`${item.en} 的发音`} /></div>)}</div></article></section>
      {deleteOpen && <Modal onClose={() => setDeleteOpen(false)}><p className="eyebrow">DELETE RECORD</p><h2>删除这条学习记录？</h2><p className="modal-lead">场景对话、学习资产和评分报告将一起删除，且无法恢复。</p><div className="modal-actions"><Button variant="secondary" onClick={() => setDeleteOpen(false)}>取消</Button><Button onClick={() => { setDeleted([...deleted, selected.id]); setDeleteOpen(false); setSelected(assetRecords[1]); }}>确认删除</Button></div></Modal>}
    </main>
  );
}

function Profile({ section, setSection, teacher, onTeacherChange, onLogout }) {
  return (
    <main className="profile-layout"><aside className="profile-nav"><div className="profile-user"><img src={teacher.image} alt="Yufan" /><span><strong>Yufan</strong><small>yufan@example.com</small></span></div><nav><button className={section === "profile" ? "is-active" : ""} onClick={() => setSection("profile")}><User />个人概览</button><button className={section === "membership" ? "is-active" : ""} onClick={() => setSection("membership")}><Crown />会员权益</button><button className={section === "settings" ? "is-active" : ""} onClick={() => setSection("settings")}><SlidersHorizontal />助手设置</button></nav><button className="logout" onClick={onLogout}><SignOut />退出登录</button></aside><section className="profile-content">{section === "profile" && <Overview />}{section === "membership" && <Membership />}{section === "settings" && <Settings teacher={teacher} onTeacherChange={onTeacherChange} />}</section></main>
  );
}

function Overview() {
  return <><PageHeader eyebrow="PERSONAL OVERVIEW" title="你的学习空间" subtitle="把每一次开口变成看得见、可继续的成长记录。" /><div className="stat-grid"><article><Clock /><span><small>本周学习时长</small><strong>183 <em>分钟</em></strong></span></article><article><BookOpenText /><span><small>已保存学习资产</small><strong>12 <em>项</em></strong></span></article><article><Fire /><span><small>连续学习天数</small><strong>7 <em>天</em></strong></span></article></div><section className="overview-grid"><article className="calendar-card"><p className="eyebrow">LEARNING CALENDAR</p><h2>7 月学习日历</h2><div className="calendar-days">{Array.from({ length: 31 }, (_, index) => <span key={index} className={index < 19 ? "is-practiced" : index === 19 ? "is-today" : ""}>{index + 1}</span>)}</div><Button><CalendarBlank />今天已自动打卡</Button></article><article className="rhythm-card"><p className="eyebrow">LAST SEVEN DAYS</p><h2>练习节奏</h2><div className="bars">{[38, 62, 78, 26, 92, 70, 48].map((height, index) => <span key={index} style={{ height: `${height}%` }}><small>{[18, 26, 34, 12, 40, 31, 22][index]}m</small></span>)}</div></article></section><section className="milestones"><div><p className="eyebrow">MILESTONES</p><h2>最近成就</h2></div><article><Medal /><span><strong>开口先锋</strong><small>完成首次自由对话</small></span><em>已解锁</em></article><article><Fire /><span><strong>坚持不懈</strong><small>连续学习 7 天</small></span><em>已解锁</em></article><article><Crown /><span><strong>更上层楼</strong><small>单项诊断达到 90 分</small></span><em>待解锁</em></article></section></>;
}

function Membership() {
  const [checkout, setCheckout] = useState(null);
  return <><PageHeader eyebrow="MEMBERSHIP & PRICING" title="会员与订阅中心" subtitle="练习额度平时不会打扰你，只会在不足 20% 或无法开始时提醒。" /><div className="plan-grid">{plans.map((plan) => <article key={plan.id} className={cx("plan-card", plan.id === "pro" && "is-featured")}><div>{plan.id === "free" && <span className="plan-label">当前方案</span>}{plan.id === "pro" && <span className="plan-label">推荐</span>}<h2>{plan.name}</h2><p>{plan.desc}</p></div><p className="price"><small>¥</small><strong>{plan.price}</strong><span>{plan.suffix}</span></p><ul>{plan.features.map((feature) => <li key={feature}><Check />{feature}</li>)}</ul>{plan.id === "free" ? <div className="quota"><span><small>今日自由对话</small><strong>3 / 5 分钟</strong></span><progress value="3" max="5" /><span><small>今日普通场景</small><strong>0 / 1 次</strong></span></div> : <Button variant={plan.id === "pro" ? "primary" : "secondary"} onClick={() => setCheckout(plan)}>升级{plan.name}</Button>}</article>)}</div>{checkout && <Modal onClose={() => setCheckout(null)}><p className="eyebrow">MOCK PAYMENT</p><h2>确认升级至{checkout.name}</h2><p className="modal-lead">首版为支付演示。确认后仅展示成功状态，不会产生真实扣款。</p><dl className="checkout-summary"><div><dt>订阅方案</dt><dd>{checkout.name}</dd></div><div><dt>订阅金额</dt><dd>¥{checkout.price} / 月</dd></div><div><dt>生效时间</dt><dd>立即生效</dd></div></dl><Button onClick={() => setCheckout(null)}>模拟支付并完成</Button></Modal>}</>;
}

function Settings({ teacher, onTeacherChange }) {
  const [speed, setSpeed] = useState("自然");
  const [level, setLevel] = useState("可以简单交流");
  return <><PageHeader eyebrow="ASSISTANT SETTINGS" title="AI 助手设置" subtitle="只调整真正影响对话体验的选项。" action={<span className="sync-state"><CheckCircle />设置已同步</span>} /><section className="settings-list"><article><div><h2>对话语速</h2><p>选择更舒适的回应节奏。</p></div><div className="segment">{["慢一些", "适中", "自然", "快一些"].map((item) => <button key={item} className={speed === item ? "is-active" : ""} onClick={() => setSpeed(item)}>{item}</button>)}</div></article><article><div><h2>英语水平</h2><p>新对话会按照该难度调整表达。</p></div><div className="select-like"><span>{level}</span><CaretDown /></div></article><article className="teacher-settings"><div><h2>AI 老师</h2><p>每位老师有固定口音和陪练方式。</p></div><div className="teacher-setting-grid">{teachers.map((item) => <button key={item.id} className={teacher.id === item.id ? "is-active" : ""} onClick={() => onTeacherChange(item)}><img src={item.image} alt={item.name} /><span><strong>{item.name}</strong><small>{item.accent} · {item.personality}</small></span><Headphones /></button>)}</div></article><article><div><h2>账户与隐私</h2><p>管理密码与账户数据。</p></div><div className="account-actions"><button><Password />修改密码<CaretRight /></button><button className="danger"><Trash />删除账户<CaretRight /></button></div></article></section></>;
}

function Paywall({ title, onClose, onMembership }) {
  return <Modal onClose={onClose}><div className="paywall-icon"><LockKey /></div><p className="eyebrow">SPECIAL TRAINING</p><h2>开始“{title}”需要特训版</h2><p className="modal-lead">你可以自由查看介绍；只有正式开始训练时才会检查权益。</p><ul className="paywall-list"><li><Check />IELTS 全真模拟与预估分数</li><li><Check />上传 PDF / DOCX 或粘贴面试材料</li><li><Check />雅思与面试共用 5 次/天</li></ul><div className="modal-actions"><Button variant="secondary" onClick={onClose}>稍后再说</Button><Button onClick={onMembership}>查看特训版</Button></div></Modal>;
}

const appPages = ["conversation", "scenes", "assets", "profile", "membership", "settings"];
const pagePaths = {
  conversation: "/conversation",
  scenes: "/scenes",
  assets: "/assets",
  profile: "/profile",
  membership: "/membership",
  settings: "/settings",
};

function routeFromLocation() {
  const preview = new URLSearchParams(window.location.search).get("preview");
  if (preview) {
    if (preview === "teacher") return { flow: "teacher", page: "conversation", authMode: "signup", training: null, result: null };
    if (preview === "training") return { flow: "app", page: "scenes", authMode: "signup", training: { initialStep: "learn" }, result: null };
    if (preview === "result") return { flow: "app", page: "scenes", authMode: "signup", training: { initialStep: "speak" }, result: { completed: true } };
    if (appPages.includes(preview)) return { flow: "app", page: preview, authMode: "signup", training: null, result: null };
  }

  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/login") return { flow: "auth", page: "conversation", authMode: "login", training: null, result: null };
  if (path === "/signup") return { flow: "auth", page: "conversation", authMode: "signup", training: null, result: null };
  if (path === "/level") return { flow: "level", page: "conversation", authMode: "signup", training: null, result: null };
  if (path === "/teacher") return { flow: "teacher", page: "conversation", authMode: "signup", training: null, result: null };
  if (path === "/training") return { flow: "app", page: "scenes", authMode: "signup", training: { initialStep: "learn" }, result: null };
  if (path === "/result") return { flow: "app", page: "scenes", authMode: "signup", training: { initialStep: "speak" }, result: { completed: true } };

  const page = Object.entries(pagePaths).find(([, routePath]) => routePath === path)?.[0];
  if (page) return { flow: "app", page, authMode: "signup", training: null, result: null };
  return { flow: "splash", page: "conversation", authMode: "signup", training: null, result: null };
}

export function App() {
  const initialRoute = useMemo(routeFromLocation, []);
  const [flow, setFlow] = useState(initialRoute.flow);
  const [authMode, setAuthMode] = useState(initialRoute.authMode);
  const [level, setLevel] = useState("");
  const [conversationSpeed, setConversationSpeed] = useState("自然");
  const [teacher, setTeacher] = useState(teachers[0]);
  const [page, setPage] = useState(initialRoute.page);
  const [sceneTitle, setSceneTitle] = useState("咖啡店点单");
  const [training, setTraining] = useState(initialRoute.training);
  const [result, setResult] = useState(initialRoute.result);
  const [paywall, setPaywall] = useState(null);

  const applyRoute = (route) => {
    setFlow(route.flow);
    setAuthMode(route.authMode);
    setPage(route.page);
    setTraining(route.training);
    setResult(route.result);
    setPaywall(null);
  };

  const navigate = (path, route, replace = false) => {
    if (window.location.pathname !== path || window.location.search) {
      window.history[replace ? "replaceState" : "pushState"]({}, "", path);
    }
    applyRoute(route);
  };

  useEffect(() => {
    const handlePopState = () => applyRoute(routeFromLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const goSplash = () => navigate("/", { flow: "splash", page: "conversation", authMode: "signup", training: null, result: null });
  const goAuth = (mode) => navigate(mode === "login" ? "/login" : "/signup", { flow: "auth", page: "conversation", authMode: mode, training: null, result: null });
  const goLevel = () => navigate("/level", { flow: "level", page: "conversation", authMode: authMode, training: null, result: null });
  const goTeacher = () => navigate("/teacher", { flow: "teacher", page: "conversation", authMode: authMode, training: null, result: null });
  const enterApp = () => setMainPage("conversation");
  const startTraining = (title, initialStep = "learn") => {
    setSceneTitle(title);
    navigate("/training", { flow: "app", page: "scenes", authMode, training: { initialStep }, result: null });
  };
  const showResult = (completed) => setResult({ completed });
  const setMainPage = (next) => navigate(pagePaths[next] || "/conversation", { flow: "app", page: next, authMode, training: null, result: null });

  if (flow === "splash") return <Splash onStart={() => goAuth("signup")} onLogin={() => goAuth("login")} />;
  if (flow === "auth") return <Auth mode={authMode} onBack={goSplash} onSuccess={goLevel} />;
  if (flow === "level") return <LevelSetup selected={level} onSelect={setLevel} onNext={goTeacher} />;
  if (flow === "teacher") return <TeacherSetup selectedId={teacher.id} onSelect={(id) => setTeacher(teachers.find((item) => item.id === id))} onFinish={enterApp} />;
  let content;
  if (training) content = <Training sceneTitle={sceneTitle} teacher={teacher} initialStep={training.initialStep} result={result} onExit={() => setMainPage("scenes")} onComplete={showResult} onBack={() => setMainPage("scenes")} onAssets={() => setMainPage("assets")} />;
  else if (page === "conversation") content = <Conversation teacher={teacher} speed={conversationSpeed} level={level} onSettingsChange={(settings) => { setConversationSpeed(settings.speed); setLevel(settings.level); setTeacher(settings.teacher); }} />;
  else if (page === "scenes") content = <Scenes onStartTraining={startTraining} onLocked={setPaywall} />;
  else if (page === "assets") content = <Assets onRepeat={(title) => startTraining(title, "speak")} />;
  else content = <Profile section={page} setSection={setMainPage} teacher={teacher} onTeacherChange={setTeacher} onLogout={goSplash} />;
  return <AppShell page={page} setPage={setMainPage} teacher={teacher}>{content}{paywall && <Paywall title={paywall} onClose={() => setPaywall(null)} onMembership={() => { setPaywall(null); setMainPage("membership"); }} />}</AppShell>;
}
