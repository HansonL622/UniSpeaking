import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CaretRight,
  Check,
  CheckCircle,
  Clock,
  FilePdf,
  FileText,
  Microphone,
  MicrophoneSlash,
  Pause,
  Play,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { teachers } from "./data.js";
import { NewtonsCradle } from "./NewtonsCradle.jsx";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const interviewHistory = [
  { id: "product-manager", role: "Product Manager", company: "Consumer Technology", date: "今天 14:20", duration: "18:42", score: 82, status: "报告已生成", focus: "结构化表达" },
  { id: "growth", role: "Growth Strategy", company: "SaaS", date: "7 月 19 日", duration: "14:08", score: 76, status: "报告已生成", focus: "语法控制" },
  { id: "operations", role: "Global Operations", company: "E-commerce", date: "7 月 16 日", duration: "20:00", score: null, status: "部分结果", focus: "发音可懂度" },
];

const dimensions = [
  { label: "流利度", weight: "30%", score: 84, note: "大部分回答衔接自然，个别长句出现自我修正。" },
  { label: "逻辑与连贯", weight: "25%", score: 86, note: "能够先给结论，再用背景、行动和结果展开。" },
  { label: "语法控制", weight: "20%", score: 76, note: "时态整体稳定，复杂句中的冠词仍需留意。" },
  { label: "发音可懂度", weight: "15%", score: 82, note: "关键词重音清楚，语速加快时尾音略弱。" },
  { label: "词汇与面试表达", weight: "10%", score: 80, note: "业务词汇准确，可以进一步减少重复使用 “help”。" },
];

const transcript = [
  { who: "AI 面试官", text: "Could you walk me through a product decision you made with incomplete information?" },
  { who: "你", text: "In my last internship, our activation rate dropped after a redesign. I first separated new and returning users, then interviewed five users before deciding what to change." },
  { who: "AI 面试官", text: "What trade-off did you have to make, and how did you communicate it to the team?" },
  { who: "你", text: "We chose to postpone a visual improvement and fix onboarding clarity first. I showed the team the funnel data and explained why this was the fastest way to reduce risk." },
];

function InterviewButton({ children, onClick, variant = "primary", disabled = false, type = "button", icon }) {
  return <button type={type} className={cx("interview-button", `interview-button--${variant}`)} onClick={onClick} disabled={disabled}><span>{children}</span>{icon || (variant === "primary" && <ArrowRight weight="bold" />)}</button>;
}

function InterviewGradientButton({ children, className, ...props }) {
  return <button className={cx("expanding-cta", "teacher-gradient-cta", "ielts-training-cta", "interview-gradient-cta", className)} {...props}><span>{children}</span><ArrowRight weight="bold" /></button>;
}

function InterviewHeader({ title, subtitle, onBack, action, compact = false, hideEyebrow = false }) {
  return <header className={cx("interview-header", compact && "is-compact")}><div>{onBack && <button className="interview-back" onClick={onBack}><ArrowLeft />返回</button>}{!hideEyebrow && <p className="interview-eyebrow">REALTIME INTERVIEW</p>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</header>;
}

function InterviewInput({ onStart, onAssets, onBack }) {
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState("");
  const [duration, setDuration] = useState("15");
  const [error, setError] = useState("");
  const valid = resume && jd.trim().length >= 30;
  const chooseFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(extension) || file.size > 10 * 1024 * 1024) {
      setResume(null);
      setError("请上传 10MB 以内的 PDF、DOC 或 DOCX 文件。");
      return;
    }
    setResume(file);
    setError("");
  };
  const submit = (event) => {
    event.preventDefault();
    if (!valid) { setError("请上传简历，并补充完整的目标岗位说明。"); return; }
    onStart();
  };
  return <main className="interview-page interview-input-page">
    <InterviewHeader hideEyebrow onBack={onBack} title="英文模拟面试" subtitle="用真实经历回答真实问题，只评估你的英语口语表现。" action={<InterviewGradientButton onClick={onAssets}>查看学习资产</InterviewGradientButton>} />
    <section className="interview-input-intro"><div><span>一次完整模拟</span><h2>把你的经历，练成清楚可信的英文回答</h2></div><dl><div><dt>01</dt><dd>上传简历</dd></div><div><dt>02</dt><dd>补充目标岗位</dd></div><div><dt>03</dt><dd>开始实时面试</dd></div></dl></section>
    <form className="interview-material-form" onSubmit={submit}>
      <section className="interview-form-section">
        <header><span>01</span><div><h2>上传简历</h2><p>用于生成与你真实经历相关的问题，不会在页面展示完整分析内容。</p></div></header>
        <label className={cx("interview-upload", resume && "has-file")}>
          <input type="file" accept=".pdf,.doc,.docx" onChange={chooseFile} />
          {resume ? <><span><FilePdf weight="duotone" /></span><div><strong>{resume.name}</strong><small>{(resume.size / 1024 / 1024).toFixed(1)} MB · 已准备</small></div><button type="button" aria-label="移除简历" onClick={(event) => { event.preventDefault(); setResume(null); }}><X /></button></> : <><span><UploadSimple /></span><div><strong>选择简历文件</strong><small>支持 PDF、DOC、DOCX，最大 10MB</small></div><em>浏览文件</em></>}
        </label>
      </section>
      <section className="interview-form-section">
        <header><span>02</span><div><h2>目标岗位 JD</h2><p>粘贴岗位职责和任职要求，至少 30 个字符。</p></div></header>
        <div className="interview-jd-field"><textarea value={jd} onChange={(event) => setJd(event.target.value)} maxLength={5000} placeholder="粘贴目标岗位的职位描述，例如岗位职责、核心能力和团队背景……" /><span>{jd.length} / 5000</span></div>
      </section>
      <section className="interview-form-section interview-duration-section">
        <header><span>03</span><div><h2>面试时长</h2><p>到达时长后，系统会自然结束当前问题并生成报告。</p></div></header>
        <div className="interview-duration-options">{["10", "15", "20"].map((item) => <button type="button" key={item} className={duration === item ? "is-active" : ""} onClick={() => setDuration(item)}><strong>{item}</strong><span>分钟</span>{item === "15" && <small>推荐</small>}</button>)}</div>
      </section>
      {error && <p className="interview-form-error"><WarningCircle weight="fill" />{error}</p>}
      <footer className="interview-form-footer"><p><CheckCircle weight="fill" />仅用于本次面试训练；结束后按服务规则清理临时材料。</p><InterviewGradientButton type="submit" disabled={!valid}>开始模拟面试</InterviewGradientButton></footer>
    </form>
  </main>;
}

function InterviewPreparing({ onReady, onBack }) {
  const steps = ["正在读取简历", "正在生成面试场景", "正在连接面试官", "准备完成"];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (index >= steps.length - 1) { const done = window.setTimeout(onReady, 900); return () => window.clearTimeout(done); }
    const timer = window.setTimeout(() => setIndex((value) => value + 1), 850);
    return () => window.clearTimeout(timer);
  }, [index, onReady]);
  return <main className="interview-page interview-preparing-page"><button className="interview-back" onClick={onBack}><ArrowLeft />返回修改材料</button><section><NewtonsCradle size={64} label={steps[index]} className="interview-main-loader" /><p className="interview-eyebrow">PREPARING YOUR INTERVIEW</p><h1>{steps[index]}</h1><p>正在安全地准备本次实时口语面试，请保持当前页面打开。</p><ol>{steps.map((step, stepIndex) => <li key={step} className={cx(stepIndex < index && "is-done", stepIndex === index && "is-active")}><span>{stepIndex < index ? <Check weight="bold" /> : stepIndex + 1}</span><strong>{step}</strong>{stepIndex === index && <NewtonsCradle size={24} label={`${step}中`} />}</li>)}</ol><small>不会在页面显示简历分析、内部提示词或评分规则</small></section></main>;
}

function InterviewLive({ onEnd }) {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [elapsed, setElapsed] = useState(412);
  useEffect(() => { if (paused) return undefined; const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000); return () => window.clearInterval(timer); }, [paused]);
  const time = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  return <main className="interview-live-page">
    <header><div><span className="interview-live-dot" />Realtime 已连接</div><h1>产品经理英文模拟面试</h1><time><Clock />{time} / 20:00</time></header>
    <section className="interview-live-stage">
      <aside><div className={cx("interviewer-portrait", paused && "is-paused")}><img src={teachers[3].image} alt="AI 面试官 David" /><span><i /><i /><i /></span></div><p>{paused ? "面试已暂停" : "正在聆听"}</p><strong>David</strong><small>AI Interviewer · American English</small></aside>
      <article><div className="interview-current-question"><span>当前问题</span><h2>What trade-off did you have to make, and how did you communicate it to the team?</h2></div><div className="interview-transcript"><header><span>实时字幕</span><small>仅展示完整问题与回答</small></header>{transcript.map((item, index) => <div key={`${item.who}-${index}`} className={item.who === "你" ? "is-user" : ""}><span>{item.who}</span><p>{item.text}</p></div>)}</div></article>
    </section>
    <footer className="interview-live-controls"><button className={muted ? "is-alert" : ""} onClick={() => setMuted((value) => !value)}>{muted ? <MicrophoneSlash weight="fill" /> : <Microphone weight="fill" />}<span>{muted ? "麦克风已关闭" : "麦克风开启"}</span></button><button onClick={() => setPaused((value) => !value)}>{paused ? <Play weight="fill" /> : <Pause weight="fill" />}<span>{paused ? "继续面试" : "暂停"}</span></button><button className="is-end" onClick={() => setConfirming(true)}><X weight="bold" /><span>结束面试</span></button></footer>
    {paused && <div className="interview-pause-overlay"><Pause weight="fill" /><h2>面试已暂停</h2><p>计时和麦克风音频已暂停。</p><InterviewButton onClick={() => setPaused(false)} icon={<Play weight="fill" />}>继续面试</InterviewButton></div>}
    {confirming && <div className="interview-modal-backdrop"><section className="interview-confirm-modal"><span><WarningCircle weight="duotone" /></span><h2>确定结束本次模拟面试吗？</h2><p>结束后将生成本次口语表现报告。</p><div><InterviewButton variant="secondary" onClick={() => setConfirming(false)}>继续面试</InterviewButton><InterviewButton onClick={onEnd}>确认结束</InterviewButton></div></section></div>}
  </main>;
}

function InterviewFinalizing({ onReady }) {
  useEffect(() => { const timer = window.setTimeout(onReady, 2600); return () => window.clearTimeout(timer); }, [onReady]);
  return <main className="interview-page interview-finalizing"><section><CheckCircle weight="duotone" /><p className="interview-eyebrow">INTERVIEW COMPLETE</p><h1>面试已结束</h1><p>正在分析你的口语表现……</p><NewtonsCradle label="正在分析面试报告" /><small>最后一轮分析可能需要约 45 秒；等待期间不会显示临时分数。</small></section></main>;
}

function InterviewReport({ partial = false, transcriptOnly = false, onHome, onRetry, onTranscript, onBack }) {
  if (transcriptOnly) return <main className="interview-page interview-report-page"><InterviewHeader compact onBack={onBack} title="完整问答记录" subtitle="本页保留面试中的原始完整字幕，不添加纠错或评分标记。" /><section className="interview-full-transcript">{transcript.map((item, index) => <article key={`${item.who}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{item.who}</small><p>{item.text}</p></div></article>)}</section></main>;
  return <main className="interview-page interview-report-page"><InterviewHeader compact title="模拟面试报告" subtitle="Product Manager · Consumer Technology" action={<div className="interview-report-actions"><InterviewButton variant="secondary" onClick={onHome}>返回首页</InterviewButton><InterviewButton onClick={onRetry}>再练一次</InterviewButton></div>} />
    {partial && <div className="interview-partial-banner"><WarningCircle weight="fill" /><div><strong>部分评分暂未完成</strong><span>已展示当前可用的分析结果，缺失维度不会以 0 分替代。</span></div></div>}
    <section className="interview-report-summary"><article><span>口语综合分数</span><strong>{partial ? "—" : "82"}<small>{partial ? "结果收集中" : "/ 100"}</small></strong><p>{partial ? "综合分需等待全部维度完成" : "表达清楚可信，结构化回答是本次优势。"}</p></article><dl><div><dt>面试时长</dt><dd>18:42</dd></div><div><dt>完成问题</dt><dd>6 道</dd></div><div><dt>训练时间</dt><dd>2026.07.22</dd></div><div><dt>重点建议</dt><dd>语法控制</dd></div></dl></section>
    <section className="interview-dimensions"><header><h2>五维评分与证据</h2><p>评分只反映本次英语口语表现，不代表岗位匹配或录用判断。</p></header>{dimensions.map((item, index) => { const missing = partial && index > 2; return <article key={item.label} className={missing ? "is-missing" : ""}><div><span>{item.label}</span><small>权重 {item.weight}</small></div><strong>{missing ? "暂未获得结果" : item.score}</strong><div className="interview-score-track"><i style={{ width: missing ? "0%" : `${item.score}%` }} /></div><p>{missing ? "该维度仍在生成中。" : item.note}</p></article>; })}</section>
    <section className="interview-training-advice"><article><span>可复用高分表达</span><h2>Make a trade-off based on evidence</h2><blockquote>“We chose to postpone the visual improvement and fix onboarding clarity first.”</blockquote><p>适合回答资源取舍、优先级和跨团队协作类问题。</p></article><article><span>结合真实经历的示范回答</span><h2>把结论提前，再解释判断依据</h2><p>I had to choose between polishing the interface and fixing activation. I prioritized activation because our interviews and funnel data pointed to a clarity problem...</p><button>展开完整示范回答<CaretRight /></button></article></section>
    <footer className="interview-report-footer"><button onClick={onTranscript}><FileText />查看完整问答记录<ArrowRight /></button><small>训练建议不参与综合分数计算</small></footer>
  </main>;
}

function InterviewFailure({ kind, onRetry, onHome }) {
  const reportFailed = kind === "report-failed";
  return <main className="interview-page interview-failure"><section><WarningCircle weight="duotone" /><p className="interview-eyebrow">{reportFailed ? "REPORT FAILED" : "CONNECTION INTERRUPTED"}</p><h1>{reportFailed ? "本次面试已完成，但报告生成失败" : "面试连接异常"}</h1><p>{reportFailed ? "本次会话已经安全结束，无法从原会话重新生成报告。" : "麦克风和计时已停止。原会话已进入清理流程，无法直接恢复。"}</p><div><InterviewButton variant="secondary" onClick={onHome}>返回首页</InterviewButton><InterviewButton onClick={onRetry}>重新开始一次面试</InterviewButton></div><small>错误信息不会包含简历正文、内部提示词或系统异常堆栈。</small></section></main>;
}

export function InterviewTrainingCenter({ route, onNavigate, onExit, onAssets }) {
  const screen = route?.screen || "input";
  if (screen === "preparing") return <InterviewPreparing onBack={() => onNavigate("/interview")} onReady={() => onNavigate("/interview/live")} />;
  if (screen === "live") return <InterviewLive onEnd={() => onNavigate("/interview/finalizing")} />;
  if (screen === "finalizing") return <InterviewFinalizing onReady={() => onNavigate("/interview/report")} />;
  if (screen === "report") return <InterviewReport partial={route?.result === "partial"} onHome={() => onNavigate("/interview")} onRetry={() => onNavigate("/interview")} onTranscript={() => onNavigate("/interview/report/transcript")} />;
  if (screen === "transcript") return <InterviewReport transcriptOnly onBack={() => onNavigate("/interview/report")} />;
  if (["error", "report-failed"].includes(screen)) return <InterviewFailure kind={screen} onHome={() => onNavigate("/interview")} onRetry={() => onNavigate("/interview")} />;
  return <InterviewInput onStart={() => onNavigate("/interview/preparing")} onAssets={onAssets} onBack={onExit} />;
}

function InterviewAssetsOverview({ onOpen, onTraining }) {
  return <><section className="interview-assets-summary"><article><span>累计模拟</span><strong>12 <small>次</small></strong><p>最近一次：今天 14:20</p></article><article><span>当前口语均分</span><strong>82</strong><p>最近 3 次提升 6 分</p></article><article><span>首要提升项</span><strong>语法控制</strong><p>复杂句冠词与时态</p></article><InterviewButton onClick={onTraining}>开始新面试</InterviewButton></section><section className="interview-assets-recent"><header><div><span>最近报告</span><h2>用每一次真实回答，形成下一次训练重点</h2></div></header>{interviewHistory.map((item) => <button key={item.id} onClick={() => onOpen(item.id)}><span>{item.date}</span><div><strong>{item.role}</strong><small>{item.company} · {item.duration}</small></div><p>{item.score ?? "—"}<small>{item.score ? "分" : "部分"}</small></p><em>{item.focus}</em><CaretRight /></button>)}</section></>;
}

function InterviewAssetsHistory({ onOpen }) {
  const [filter, setFilter] = useState("全部");
  const items = useMemo(() => filter === "全部" ? interviewHistory : interviewHistory.filter((item) => item.status === filter), [filter]);
  return <section className="interview-assets-history"><header><div><h2>模拟面试记录</h2><p>报告只评估英语口语表现，不提供岗位排名或录用建议。</p></div><div>{["全部", "报告已生成", "部分结果"].map((item) => <button key={item} className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div></header>{items.map((item) => <button className="interview-history-row" key={item.id} onClick={() => onOpen(item.id)}><span><Briefcase /></span><div><strong>{item.role}</strong><small>{item.company} · {item.date}</small></div><p>{item.duration}</p><em>{item.status}</em><b>{item.score ?? "—"}</b><CaretRight /></button>)}</section>;
}

export function InterviewAssets({ route, onNavigate, onBackToAssets, onTraining }) {
  const tab = route?.tab || "overview";
  const openReport = (id) => onNavigate(`/interview/assets/${id}`);
  if (route?.record) return <InterviewReport partial={route.record === "operations"} onHome={() => onNavigate("/interview/assets/history")} onRetry={onTraining} onTranscript={() => onNavigate("/interview/report/transcript")} />;
  return <main className="interview-page interview-assets-page"><InterviewHeader title="英文面试学习资产" subtitle="查看历史评分、证据与可复用表达，把报告变成下一次训练计划。" action={<div className="interview-assets-actions"><button onClick={onTraining}>返回训练中心</button><button onClick={onBackToAssets}>其他资产<ArrowRight /></button></div>} /><nav className="interview-assets-tabs"><button className={tab === "overview" ? "is-active" : ""} onClick={() => onNavigate("/interview/assets")}>概览</button><button className={tab === "history" ? "is-active" : ""} onClick={() => onNavigate("/interview/assets/history")}>面试记录 <span>12</span></button></nav>{tab === "history" ? <InterviewAssetsHistory onOpen={openReport} /> : <InterviewAssetsOverview onOpen={openReport} onTraining={onTraining} />}</main>;
}
