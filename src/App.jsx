import { useState, useEffect, useRef } from "react";

// ── Palette & mock data ──────────────────────────────────────────────────────
const JOBS = [
  { id: 1, title: "ML Engineer", company: "DeepMind", location: "London, UK", salary: "$120k–$160k", type: "Full-time", level: "Senior", tags: ["Python", "PyTorch", "LLMs"], category: "AI", logo: "D", color: "#4F46E5", desc: "Join our world-class research team building next-generation AI systems. You'll work on cutting-edge deep learning models and collaborate with top researchers globally. Responsibilities include designing scalable ML pipelines, training large language models, publishing research, and deploying production AI systems.", posted: "2d ago", applicants: 312 },
  { id: 2, title: "React Developer", company: "Vercel", location: "Remote", salary: "$90k–$130k", type: "Full-time", level: "Mid", tags: ["React", "TypeScript", "Next.js"], category: "Tech", logo: "V", color: "#000000", desc: "Build the future of web development tooling. You'll work on Vercel's core platform, optimizing the developer experience for millions of users. Tasks include building UI components, improving build times, and maintaining open-source Next.js integrations.", posted: "1d ago", applicants: 189 },
  { id: 3, title: "AI Research Intern", company: "Anthropic", location: "San Francisco, CA", salary: "$8k/mo", type: "Internship", level: "Entry", tags: ["Python", "Research", "Transformers"], category: "AI", logo: "A", color: "#D97706", desc: "Work alongside leading AI safety researchers on some of the most important problems in the field. This 12-week internship involves running experiments, writing research papers, and contributing to alignment techniques.", posted: "3d ago", applicants: 892 },
  { id: 4, title: "Product Manager", company: "Notion", location: "New York, NY", salary: "$140k–$180k", type: "Full-time", level: "Senior", tags: ["Strategy", "Roadmapping", "B2B"], category: "Management", logo: "N", color: "#374151", desc: "Lead product strategy for Notion's enterprise suite. You'll own the roadmap, work closely with engineering and design, conduct user research, and define the future of collaborative productivity tools.", posted: "5d ago", applicants: 547 },
  { id: 5, title: "Data Science Intern", company: "Spotify", location: "Stockholm, SE", salary: "€4k/mo", type: "Internship", level: "Entry", tags: ["Python", "SQL", "Analytics"], category: "Tech", logo: "S", color: "#22C55E", desc: "Analyze listening data at massive scale to improve music recommendations. You'll build dashboards, run A/B tests, and present findings to cross-functional teams.", posted: "1d ago", applicants: 421 },
  { id: 6, title: "Backend Engineer", company: "Stripe", location: "Dublin, IE", salary: "$110k–$150k", type: "Full-time", level: "Mid", tags: ["Ruby", "Go", "APIs"], category: "Tech", logo: "S", color: "#635BFF", desc: "Build the financial infrastructure of the internet. You'll work on payment processing systems, fraud detection pipelines, and developer APIs used by millions of businesses.", posted: "4d ago", applicants: 278 },
  { id: 7, title: "Prompt Engineer", company: "OpenAI", location: "Remote", salary: "$100k–$140k", type: "Full-time", level: "Mid", tags: ["LLMs", "Python", "NLP"], category: "AI", logo: "O", color: "#10B981", desc: "Shape how humans interact with AI systems. You'll design evaluation frameworks, craft system prompts, build red-teaming pipelines, and work with researchers to improve model behavior.", posted: "6h ago", applicants: 1203 },
  { id: 8, title: "Engineering Manager", company: "Figma", location: "San Francisco, CA", salary: "$200k–$250k", type: "Full-time", level: "Senior", tags: ["Leadership", "WebGL", "TypeScript"], category: "Management", logo: "F", color: "#F24E1E", desc: "Lead a team of 8–12 engineers building Figma's real-time collaboration engine. Responsibilities include hiring, performance reviews, technical strategy, and scaling infrastructure.", posted: "2d ago", applicants: 156 },
];

const CATEGORIES = ["All", "AI", "Tech", "Management"];
const LEVELS = ["All", "Entry", "Mid", "Senior"];
const TYPES = ["All", "Full-time", "Internship", "Contract"];

// ── Groq API call ─────────────────────────────────────────────────────────────
import Groq from "groq-sdk";

// 1. Initialize the client with the 'dangerously' flag
const groq = new Groq({ 
  apiKey: "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", // Replace with a fresh key
  dangerouslyAllowBrowser: true 
});

async function callGroq(systemPrompt, userMessage) {
  
  try {
    // 2. Use the SDK's built-in method instead of fetch
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    // 3. Log the exact error to your browser console (F12)
    console.error("Groq API Error:", error);
    return "Error: " + error.message;
  }
}

async function getFitScore(jobDesc, resumeText) {
  const sys = `You are a precise hiring algorithm. Given a job description and resume, respond ONLY with valid JSON in this exact shape:
{"score": <0-100 integer>, "label": "<Weak|Fair|Good|Strong> Match", "missing": ["skill1","skill2","skill3"], "strengths": ["s1","s2"], "summary": "<2 sentence plain-english summary>"}
No markdown, no extra text.`;
  const msg = `JOB:\n${jobDesc}\n\nRESUME:\n${resumeText}`;
  const raw = await callGroq(sys, msg);
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); } catch { return null; }
}

async function getAISummary(jobDesc) {
  const sys = `You are a concise job summarizer. Given a job description, return ONLY valid JSON:
{"bullets": ["•  point 1", "•  point 2", "•  point 3", "•  point 4"], "tldr": "<one punchy sentence>", "difficulty": "Entry|Mid|Senior", "skills": ["s1","s2","s3"]}
No markdown, no extra text.`;
  const raw = await callGroq(sys, jobDesc);
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); } catch { return null; }
}

// ── Tiny components ──────────────────────────────────────────────────────────
const Badge = ({ children, color = "#3B82F6" }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{children}</span>
);

const levelColor = { Entry: "#22C55E", Mid: "#3B82F6", Senior: "#8B5CF6" };
const typeColor = { "Full-time": "#0EA5E9", Internship: "#F59E0B", Contract: "#EC4899" };

function JobCard({ job, onClick, selected }) {
  return (
    <div onClick={() => onClick(job)} style={{
      background: selected ? "linear-gradient(135deg,#0F172A,#1E293B)" : "#0F172A",
      border: selected ? "1.5px solid #3B82F6" : "1.5px solid #1E293B",
      borderRadius: 14, padding: "18px 20px", cursor: "pointer",
      transition: "all 0.2s", boxShadow: selected ? "0 0 0 3px #3B82F620" : "none",
    }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = "#334155"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = "#1E293B"; }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: job.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#fff", flexShrink: 0 }}>{job.logo}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#F1F5F9", marginBottom: 2 }}>{job.title}</div>
          <div style={{ fontSize: 13, color: "#94A3B8" }}>{job.company} · {job.location}</div>
        </div>
        <div style={{ fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>{job.posted}</div>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Badge color={levelColor[job.level]}>{job.level}</Badge>
        <Badge color={typeColor[job.type]}>{job.type}</Badge>
        <Badge color="#64748B">{job.salary}</Badge>
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {job.tags.map(t => <span key={t} style={{ fontSize: 11, color: "#64748B", background: "#1E293B", borderRadius: 4, padding: "2px 7px" }}>{t}</span>)}
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const r = 36, c = 2 * Math.PI * r, dash = (score / 100) * c;
  const col = score >= 75 ? "#22C55E" : score >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <svg width="90" height="90" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="45" cy="45" r={r} fill="none" stroke="#1E293B" strokeWidth="7" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={col} strokeWidth="7" strokeDasharray={`${dash} ${c}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="45" y="50" textAnchor="middle" fill={col} fontSize="16" fontWeight="800" style={{ transform: "rotate(90deg)", transformOrigin: "45px 45px" }}>{score}%</text>
    </svg>
  );
}

// ── PAGES ─────────────────────────────────────────────────────────────────────

function LandingPage({ onNavigate }) {
  const [search, setSearch] = useState("");
  const [typed, setTyped] = useState("");
  const words = ["React Developer", "ML Engineer", "AI Researcher", "Product Manager"];
  const [wi, setWi] = useState(0);

  useEffect(() => {
    let i = 0; let del = false;
    const t = setInterval(() => {
      const w = words[wi % words.length];
      if (!del) { setTyped(w.slice(0, i + 1)); i++; if (i === w.length) { del = true; i = w.length; } }
      else { setTyped(w.slice(0, i - 1)); i--; if (i === 0) { del = false; setWi(p => p + 1); } }
    }, 80);
    return () => clearInterval(t);
  }, [wi]);

  const stats = [{ n: "12,400+", l: "Live Jobs" }, { n: "340+", l: "Companies" }, { n: "AI-Powered", l: "Matching" }, { n: "98%", l: "Satisfaction" }];

  return (
    <div style={{ minHeight: "100vh", background: "#020817" }}>
      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden", padding: "120px 20px 100px", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, #1E3A5F55 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(circle, #3B82F615 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0F172A", border: "1px solid #1E3A5F", borderRadius: 100, padding: "6px 14px", marginBottom: 28, fontSize: 12, color: "#60A5FA" }}>
            <span style={{ width: 6, height: 6, background: "#22C55E", borderRadius: "50%", animation: "pulse 2s infinite" }} />
            AI-Powered Job Discovery — Now Live
          </div>

          <h1 style={{ fontSize: "clamp(36px,6vw,72px)", fontWeight: 900, lineHeight: 1.08, color: "#F8FAFC", marginBottom: 20, fontFamily: "'Georgia', serif", letterSpacing: "-0.03em" }}>
            Find Your Dream Role<br />
            <span style={{ background: "linear-gradient(135deg,#3B82F6,#8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Powered by AI</span>
          </h1>

          <p style={{ fontSize: 18, color: "#94A3B8", marginBottom: 40, lineHeight: 1.6 }}>
            CareerNest aggregates thousands of opportunities and uses AI to show you <em style={{ color: "#60A5FA" }}>exactly</em> where you stand — before you apply.
          </p>

          <div style={{ display: "flex", gap: 10, maxWidth: 600, margin: "0 auto 20px", background: "#0F172A", border: "1.5px solid #1E293B", borderRadius: 14, padding: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && onNavigate("discover", search)}
              placeholder={`Search "${typed}|"`}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#F1F5F9", fontSize: 15, padding: "10px 12px", fontFamily: "inherit" }} />
            <button onClick={() => onNavigate("discover", search)} style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Search
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {["🤖 AI & ML", "⚛️ React", "📊 Data Science", "🏗️ Backend", "🎯 Product"].map(tag => (
              <button key={tag} onClick={() => onNavigate("discover", tag.split(" ")[1])} style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#94A3B8", cursor: "pointer" }}>{tag}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "center", gap: "clamp(16px,4vw,64px)", padding: "40px 20px", borderTop: "1px solid #0F172A", borderBottom: "1px solid #0F172A", background: "#050D1A", flexWrap: "wrap" }}>
        {stats.map(s => (
          <div key={s.l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#F1F5F9", fontFamily: "'Georgia',serif" }}>{s.n}</div>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Featured Categories */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 20px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: "#F1F5F9", marginBottom: 8, fontFamily: "'Georgia',serif" }}>Browse by Category</h2>
        <p style={{ color: "#64748B", marginBottom: 40 }}>Curated clusters of the best opportunities</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          {[
            { name: "Artificial Intelligence", icon: "🤖", count: 4820, color: "#4F46E5", desc: "LLMs, Computer Vision, NLP, MLOps" },
            { name: "Software Engineering", icon: "⚙️", count: 6210, color: "#0EA5E9", desc: "Frontend, Backend, Full-Stack, DevOps" },
            { name: "Product & Management", icon: "🎯", count: 1890, color: "#8B5CF6", desc: "PM, TPM, Strategy, Operations" },
            { name: "Data & Analytics", icon: "📊", count: 3140, color: "#22C55E", desc: "Data Science, BI, SQL, Pipelines" },
          ].map(cat => (
            <div key={cat.name} onClick={() => onNavigate("discover", cat.name)} style={{ background: "#0A1628", border: `1.5px solid ${cat.color}33`, borderRadius: 16, padding: 28, cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = cat.color + "66"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = cat.color + "33"; }}
            >
              <div style={{ position: "absolute", top: -30, right: -30, fontSize: 80, opacity: 0.06 }}>{cat.icon}</div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{cat.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#F1F5F9", marginBottom: 4 }}>{cat.name}</div>
              <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>{cat.desc}</div>
              <div style={{ fontSize: 12, color: cat.color, fontWeight: 700 }}>{cat.count.toLocaleString()} openings →</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Jobs Preview */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9", fontFamily: "'Georgia',serif" }}>Featured Opportunities</h2>
            <p style={{ color: "#64748B", marginTop: 4 }}>Hand-picked by our AI for quality and relevance</p>
          </div>
          <button onClick={() => onNavigate("discover", "")} style={{ background: "none", border: "1px solid #1E293B", borderRadius: 8, padding: "8px 16px", color: "#60A5FA", cursor: "pointer", fontSize: 14 }}>View All →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
          {JOBS.slice(0, 3).map(j => <JobCard key={j.id} job={j} onClick={() => onNavigate("detail", j)} selected={false} />)}
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}

function DiscoverPage({ onNavigate, initSearch }) {
  const [search, setSearch] = useState(initSearch || "");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All");
  const [type, setType] = useState("All");
  const [salaryMin, setSalaryMin] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);

  const filtered = JOBS.filter(j => {
    const q = search.toLowerCase();
    const matchQ = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.tags.some(t => t.toLowerCase().includes(q)) || j.category.toLowerCase().includes(q);
    const matchCat = category === "All" || j.category === category;
    const matchLvl = level === "All" || j.level === level;
    const matchType = type === "All" || j.type === type;
    return matchQ && matchCat && matchLvl && matchType;
  });

  const FilterBtn = ({ val, active, onClick }) => (
    <button onClick={onClick} style={{ background: active ? "#3B82F6" : "#0F172A", border: `1px solid ${active ? "#3B82F6" : "#1E293B"}`, borderRadius: 7, padding: "5px 12px", fontSize: 12, color: active ? "#fff" : "#94A3B8", cursor: "pointer", fontWeight: active ? 700 : 400, transition: "all 0.15s" }}>{val}</button>
  );

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 60px)", background: "#020817" }}>
      {/* Sidebar */}
      <div style={{ width: 240, flexShrink: 0, background: "#050D1A", borderRight: "1px solid #0F172A", padding: "28px 20px", overflowY: "auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Category</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CATEGORIES.map(c => <FilterBtn key={c} val={c} active={category === c} onClick={() => setCategory(c)} />)}
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Level</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {LEVELS.map(l => <FilterBtn key={l} val={l} active={level === l} onClick={() => setLevel(l)} />)}
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Job Type</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {TYPES.map(t => <FilterBtn key={t} val={t} active={type === t} onClick={() => setType(t)} />)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Min Salary</div>
          <input type="range" min={0} max={200} step={10} value={salaryMin} onChange={e => setSalaryMin(+e.target.value)} style={{ width: "100%", accentColor: "#3B82F6" }} />
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>${salaryMin}k+</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "28px 24px", overflowY: "auto" }}>
        <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles, companies, skills…"
            style={{ flex: 1, background: "#0F172A", border: "1.5px solid #1E293B", borderRadius: 10, padding: "10px 16px", color: "#F1F5F9", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          <div style={{ fontSize: 13, color: "#64748B", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>{filtered.length} results</div>
        </div>

        {selectedJob ? (
          <JobDetailPanel job={selectedJob} onClose={() => setSelectedJob(null)} onNavigate={onNavigate} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
            {filtered.map(j => <JobCard key={j.id} job={j} onClick={j => { setSelectedJob(j); }} selected={false} />)}
            {filtered.length === 0 && <div style={{ color: "#475569", fontSize: 15, gridColumn: "1/-1", padding: 40, textAlign: "center" }}>No jobs match your filters. Try adjusting your search.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function JobDetailPanel({ job, onClose, onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [loadingSum, setLoadingSum] = useState(false);
  const [resume, setResume] = useState("");
  const [fit, setFit] = useState(null);
  const [loadingFit, setLoadingFit] = useState(false);
  const [tab, setTab] = useState("desc");

  const fetchSummary = async () => {
    setLoadingSum(true);
    const r = await getAISummary(job.desc);
    setSummary(r);
    setLoadingSum(false);
  };

  const fetchFit = async () => {
    if (!resume.trim()) return;
    setLoadingFit(true);
    const r = await getFitScore(job.desc, resume);
    setFit(r);
    setLoadingFit(false);
  };

  return (
    <div style={{ background: "#050D1A", border: "1.5px solid #1E293B", borderRadius: 16, padding: 28, maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: job.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#fff" }}>{job.logo}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#F8FAFC" }}>{job.title}</div>
            <div style={{ fontSize: 14, color: "#94A3B8" }}>{job.company} · {job.location} · {job.salary}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8, padding: "6px 12px", color: "#94A3B8", cursor: "pointer", fontSize: 13 }}>← Back</button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        <Badge color={levelColor[job.level]}>{job.level}</Badge>
        <Badge color={typeColor[job.type]}>{job.type}</Badge>
        {job.tags.map(t => <Badge key={t} color="#475569">{t}</Badge>)}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#0A1628", borderRadius: 10, padding: 4 }}>
        {[["desc", "Description"], ["ai", "AI Summary"], ["fit", "Check My Fit"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, background: tab === k ? "#1E293B" : "none", border: "none", borderRadius: 7, padding: "8px 0", fontSize: 13, color: tab === k ? "#F1F5F9" : "#64748B", cursor: "pointer", fontWeight: tab === k ? 700 : 400, transition: "all 0.15s" }}>{l}</button>
        ))}
      </div>

      {tab === "desc" && (
        <div>
          <p style={{ color: "#94A3B8", lineHeight: 1.7, fontSize: 14 }}>{job.desc}</p>
          <div style={{ marginTop: 16, padding: 16, background: "#0A1628", borderRadius: 10, border: "1px solid #1E293B" }}>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>👥 Applicants</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>{job.applicants.toLocaleString()}</div>
            <div style={{ width: "100%", height: 4, background: "#1E293B", borderRadius: 2, marginTop: 8 }}>
              <div style={{ width: `${Math.min(100, (job.applicants / 1500) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#3B82F6,#8B5CF6)", borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Competition level: {job.applicants > 500 ? "🔴 High" : job.applicants > 200 ? "🟡 Medium" : "🟢 Low"}</div>
          </div>
        </div>
      )}

      {tab === "ai" && (
        <div>
          {!summary && !loadingSum && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
              <p style={{ color: "#64748B", marginBottom: 20 }}>Let AI distill this job into what actually matters</p>
              <button onClick={fetchSummary} style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Generate AI Summary</button>
            </div>
          )}
          {loadingSum && <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}><span style={{ fontSize: 24 }}>✨</span> Analyzing with AI…</div>}
          {summary && (
            <div>
              <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", border: "1px solid #3B82F633", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#60A5FA", fontWeight: 700, marginBottom: 6 }}>TL;DR</div>
                <div style={{ color: "#F1F5F9", fontWeight: 600, lineHeight: 1.5 }}>{summary.tldr}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                {summary.bullets?.map((b, i) => <div key={i} style={{ color: "#94A3B8", fontSize: 14, padding: "6px 0", borderBottom: "1px solid #0F172A" }}>{b}</div>)}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge color={levelColor[summary.difficulty]}>{summary.difficulty} Level</Badge>
                {summary.skills?.map(s => <Badge key={s} color="#475569">{s}</Badge>)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "fit" && (
        <div>
          {!fit && (
            <div>
              <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10 }}>Paste your resume or list your skills & experience:</p>
              <textarea value={resume} onChange={e => setResume(e.target.value)} placeholder="e.g. 2 years React experience, built 3 projects, familiar with TypeScript and Node.js. CS graduate from NIT…"
                style={{ width: "100%", height: 120, background: "#0A1628", border: "1px solid #1E293B", borderRadius: 10, padding: 12, color: "#F1F5F9", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              <button onClick={fetchFit} disabled={loadingFit || !resume.trim()} style={{ marginTop: 12, background: loadingFit ? "#1E293B" : "linear-gradient(135deg,#22C55E,#16A34A)", color: loadingFit ? "#64748B" : "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: loadingFit ? "not-allowed" : "pointer" }}>
                {loadingFit ? "⏳ Calculating…" : "🎯 Calculate Fit Score"}
              </button>
            </div>
          )}
          {fit && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, background: "#050D1A", border: "1px solid #1E293B", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <ScoreRing score={fit.score} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 22, color: "#F1F5F9" }}>{fit.label}</div>
                  <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4, maxWidth: 320, lineHeight: 1.5 }}>{fit.summary}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "#0A1628", border: "1px solid #22C55E33", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, color: "#22C55E", fontWeight: 700, marginBottom: 8 }}>✅ Strengths</div>
                  {fit.strengths?.map(s => <div key={s} style={{ fontSize: 13, color: "#94A3B8", padding: "3px 0" }}>• {s}</div>)}
                </div>
                <div style={{ background: "#0A1628", border: "1px solid #EF444433", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, color: "#EF4444", fontWeight: 700, marginBottom: 8 }}>⚠️ Missing Skills</div>
                  {fit.missing?.map(s => <div key={s} style={{ fontSize: 13, color: "#94A3B8", padding: "3px 0" }}>• {s}</div>)}
                </div>
              </div>
              <button onClick={() => setFit(null)} style={{ marginTop: 12, background: "none", border: "1px solid #1E293B", borderRadius: 8, padding: "7px 14px", color: "#64748B", cursor: "pointer", fontSize: 12 }}>Recalculate</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardPage({ onNavigate }) {
  const [resume, setResume] = useState("1 year React, some Python, built 2 web apps, CS junior");
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({});
  const [loadingScores, setLoadingScores] = useState({});

  const fetchRecommendations = async () => {
    setLoading(true);
    const sys = `You are a career advisor AI. Given a candidate profile, recommend 3 job IDs from this list: ${JOBS.map(j => `${j.id}: ${j.title} at ${j.company} (${j.level})`).join(", ")}. Respond ONLY with JSON: {"ids":[id1,id2,id3],"reason":"brief explanation"}. No markdown.`;
    const raw = await callGroq(sys, `My profile: ${resume}`);
    try {
      const r = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setRecommendations(r);
    } catch { setRecommendations({ ids: [1, 2, 3], reason: "Based on your profile, these roles match your current skill level." }); }
    setLoading(false);
  };

  const fetchScore = async (job) => {
    setLoadingScores(p => ({ ...p, [job.id]: true }));
    const r = await getFitScore(job.desc, resume);
    setScores(p => ({ ...p, [job.id]: r }));
    setLoadingScores(p => ({ ...p, [job.id]: false }));
  };

  const recJobs = recommendations ? JOBS.filter(j => recommendations.ids.includes(j.id)) : [];

  return (
    <div style={{ background: "#020817", minHeight: "calc(100vh - 60px)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#F8FAFC", fontFamily: "'Georgia',serif", marginBottom: 4 }}>Your Dashboard</h1>
        <p style={{ color: "#64748B", marginBottom: 32 }}>AI-powered insights personalized for you</p>

        {/* Profile card */}
        <div style={{ background: "#050D1A", border: "1px solid #1E293B", borderRadius: 16, padding: 24, marginBottom: 28 }}>
          <div style={{ fontWeight: 700, color: "#F1F5F9", marginBottom: 10 }}>Your Profile Summary</div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea value={resume} onChange={e => setResume(e.target.value)}
              style={{ flex: 1, background: "#0A1628", border: "1px solid #1E293B", borderRadius: 10, padding: 12, color: "#F1F5F9", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit", minHeight: 72 }} />
            <button onClick={fetchRecommendations} disabled={loading} style={{ background: loading ? "#1E293B" : "linear-gradient(135deg,#4F46E5,#7C3AED)", color: loading ? "#64748B" : "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
              {loading ? "Finding…" : "Get Recommendations"}
            </button>
          </div>
        </div>

        {/* Recommendations */}
        {recJobs.length > 0 && (
          <div>
            <div style={{ background: "#0A1628", border: "1px solid #4F46E533", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#94A3B8" }}>
              🤖 <strong style={{ color: "#818CF8" }}>AI Recommendation:</strong> {recommendations.reason}
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              {recJobs.map(job => (
                <div key={job.id} style={{ background: "#050D1A", border: "1px solid #1E293B", borderRadius: 16, padding: 22, display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: job.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#fff", flexShrink: 0 }}>{job.logo}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#F1F5F9" }}>{job.title}</div>
                    <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 8 }}>{job.company} · {job.location} · {job.salary}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Badge color={levelColor[job.level]}>{job.level}</Badge>
                      {job.tags.map(t => <Badge key={t} color="#475569">{t}</Badge>)}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    {scores[job.id] ? (
                      <div style={{ textAlign: "center" }}>
                        <ScoreRing score={scores[job.id].score} />
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{scores[job.id].label}</div>
                      </div>
                    ) : (
                      <button onClick={() => fetchScore(job)} disabled={loadingScores[job.id]} style={{ background: "#0A1628", border: "1px solid #1E293B", borderRadius: 8, padding: "8px 14px", color: loadingScores[job.id] ? "#475569" : "#60A5FA", cursor: loadingScores[job.id] ? "not-allowed" : "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
                        {loadingScores[job.id] ? "Scoring…" : "📊 Check Fit"}
                      </button>
                    )}
                    <button onClick={() => onNavigate("detail", job)} style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View Job</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!recJobs.length && !loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
            <div style={{ fontSize: 16, marginBottom: 4, color: "#64748B" }}>No recommendations yet</div>
            <div style={{ fontSize: 13 }}>Update your profile above and click "Get Recommendations"</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── App Shell ────────────────────────────────────────────────────────────────
export default function CareerNest() {
  const [page, setPage] = useState("landing");
  const [pageData, setPageData] = useState(null);

  const navigate = (p, data = null) => { setPage(p); setPageData(data); window.scrollTo(0, 0); };

  const Nav = () => (
    <nav style={{ height: 60, background: "#050D1A", borderBottom: "1px solid #0F172A", display: "flex", alignItems: "center", padding: "0 24px", gap: 0, position: "sticky", top: 0, zIndex: 100 }}>
      <button onClick={() => navigate("landing")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginRight: 32 }}>
        <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#3B82F6,#8B5CF6)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🪺</div>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#F8FAFC", fontFamily: "'Georgia',serif" }}>CareerNest</span>
      </button>
      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {[["landing","Home"],["discover","Discover"],["dashboard","Dashboard"]].map(([p, l]) => (
          <button key={p} onClick={() => navigate(p)} style={{ background: "none", border: "none", padding: "6px 14px", borderRadius: 7, color: page === p ? "#60A5FA" : "#94A3B8", fontWeight: page === p ? 700 : 400, fontSize: 14, cursor: "pointer", background: page === p ? "#0F172A" : "none" }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8, padding: "7px 16px", color: "#94A3B8", fontSize: 13, cursor: "pointer" }}>Sign in</button>
        <button style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)", border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Post a Job</button>
      </div>
    </nav>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", background: "#020817", minHeight: "100vh" }}>
      <Nav />
      {page === "landing" && <LandingPage onNavigate={navigate} />}
      {page === "discover" && <DiscoverPage onNavigate={navigate} initSearch={typeof pageData === "string" ? pageData : ""} />}
      {page === "detail" && pageData && (
        <div style={{ padding: "32px 24px", maxWidth: 800, margin: "0 auto" }}>
          <button onClick={() => navigate("discover")} style={{ background: "none", border: "1px solid #1E293B", borderRadius: 8, padding: "7px 14px", color: "#64748B", cursor: "pointer", fontSize: 13, marginBottom: 20 }}>← Back to Jobs</button>
          <JobDetailPanel job={pageData} onClose={() => navigate("discover")} onNavigate={navigate} />
        </div>
      )}
      {page === "dashboard" && <DashboardPage onNavigate={navigate} />}
    </div>
  );
}