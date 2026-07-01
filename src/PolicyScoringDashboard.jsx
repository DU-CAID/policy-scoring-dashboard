import React, { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileText, ImageDown, Loader2, UploadCloud } from "lucide-react";
import html2canvas from "html2canvas";
import {
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Legend,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "https://steflangehennig-policy-scoring-api.hf.space";

const DIMENSIONS = [
  { key: "Use of Empirical Research", short: "Empirical Research" },
  { key: "Formal Evidence-Gathering Process", short: "Evidence Gathering" },
  { key: "Transparency and Accessibility", short: "Transparency" },
  { key: "Expert and Stakeholder Input", short: "Stakeholder Input" },
  { key: "Evaluation and Iteration", short: "Evaluation" },
];

const SERIES_COLORS = ["#8C2332", "#A89968", "#3D5A6C", "#7A6A8A", "#4F6F52"];

const scoreLabel = (s) => (s === "NA" ? "NA" : `${s} / 3`);

function ScorePip({ score }) {
  if (score === "NA") return <span className="text-muted text-sm">NA</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i <= score ? "bg-crimson" : "bg-line"}`} />
        ))}
      </span>
      <span className="font-semibold tabular-nums">{score}</span>
    </span>
  );
}

export default function PolicyScoringDashboard() {
  const [files, setFiles] = useState([]);          // [{file, status: queued|scoring|done|error, result?, error?}]
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState(null);  // index into done results, or "compare"
  const [formatError, setFormatError] = useState(null);
  const chartRef = useRef(null);
  const inputRef = useRef(null);

  const done = files.filter((f) => f.status === "done");

  const onPick = (e) => {
    const picked = Array.from(e.target.files || []);
    const bad = picked.find((f) => !/\.(pdf|docx|txt)$/i.test(f.name));
    if (bad) {
      setFormatError(`"${bad.name}" isn't a supported type. Upload PDF, DOCX, or TXT files.`);
      return;
    }
    setFormatError(null);
    setFiles(picked.map((file) => ({ file, status: "queued" })));
    setSelected(null);
  };

  const run = async () => {
    setRunning(true);
    const next = [...files];
    for (let i = 0; i < next.length; i++) {
      if (next[i].status === "done") continue;
      next[i] = { ...next[i], status: "scoring" };
      setFiles([...next]);
      try {
        const fd = new FormData();
        fd.append("file", next[i].file);
        const res = await fetch(`${API_URL}/score`, { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || `Scoring failed (${res.status}).`);
        next[i] = { ...next[i], status: "done", result: data };
      } catch (err) {
        next[i] = { ...next[i], status: "error", error: err.message };
      }
      setFiles([...next]);
    }
    setRunning(false);
    const firstDone = next.findIndex((f) => f.status === "done");
    if (firstDone !== -1) setSelected(firstDone);
  };

  const exportCSV = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["File", ...DIMENSIONS.flatMap((d) => [d.key, `${d.key} - Justification`])];
    const rows = done.map(({ result }) => [
      result.filename,
      ...DIMENSIONS.flatMap((d) => {
        const e = result.scores[d.key] || {};
        return [e.score, e.justification];
      }),
    ]);
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = "policy_scores.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportPNG = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { backgroundColor: "#FFFFFF", scale: 2 });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "policy_scores_radar.png";
    link.click();
  };

  const chartData = DIMENSIONS.map((d) => {
    const row = { dimension: d.short };
    if (selected === "compare") {
      done.forEach((f, i) => {
        const s = f.result.scores[d.key]?.score;
        row[`s${i}`] = s === "NA" ? 0 : s;
      });
    } else if (selected !== null && files[selected]?.result) {
      const s = files[selected].result.scores[d.key]?.score;
      row.score = s === "NA" ? 0 : s;
    }
    return row;
  });

  const selectedResult = selected !== null && selected !== "compare" ? files[selected]?.result : null;

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* ---- upload ---- */}
      <section className="rounded-xl border border-line bg-white p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Evidence-based policy rubric</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Score a policy document</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Upload a policy document and an open-weights language model scores it 0–3 on five dimensions of
          evidence-based policymaking - empirical research, formal evidence gathering, transparency, stakeholder
          input, and evaluation - with a written justification for each score.
        </p>
        <p className="mt-2 text-sm text-muted">
          Accepts PDF, DOCX, and TXT up to 8 MB. To keep the free hosting fair, scoring is limited to 8 documents
          per 30 minutes. Scores are model judgments - read the justifications, not just the numbers.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.txt" onChange={onPick} className="hidden" />
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm font-medium hover:border-gold"
          >
            <FileText className="h-4 w-4 text-crimson" />
            {files.length ? `${files.length} file${files.length > 1 ? "s" : ""} selected` : "Choose files"}
          </button>
          <button
            onClick={run}
            disabled={!files.length || running}
            className="inline-flex items-center gap-2 rounded-lg bg-crimson px-5 py-2.5 text-sm font-semibold text-white hover:bg-crimson-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {running ? "Scoring…" : "Score documents"}
          </button>
        </div>

        {formatError && (
          <p className="mt-4 flex items-center gap-2 text-sm text-crimson"><AlertTriangle className="h-4 w-4" />{formatError}</p>
        )}

        {files.length > 0 && (
          <ul className="mt-5 divide-y divide-line rounded-lg border border-line">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="truncate">{f.file.name}</span>
                {f.status === "queued" && <span className="text-muted">queued</span>}
                {f.status === "scoring" && <span className="inline-flex items-center gap-1.5 text-gold"><Loader2 className="h-3.5 w-3.5 animate-spin" />scoring</span>}
                {f.status === "done" && <span className="inline-flex items-center gap-1.5 text-crimson"><CheckCircle2 className="h-3.5 w-3.5" />scored</span>}
                {f.status === "error" && <span className="max-w-[60%] truncate text-crimson" title={f.error}><AlertTriangle className="mr-1 inline h-3.5 w-3.5" />{f.error}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- results ---- */}
      {done.length > 0 && (
        <section className="rounded-xl border border-line bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold">Scores</h2>
            <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-medium hover:border-gold">
              <Download className="h-4 w-4" /> Download CSV
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink/80 text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4 font-semibold">Document</th>
                  {DIMENSIONS.map((d) => <th key={d.key} className="px-3 py-2 font-semibold">{d.short}</th>)}
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {files.map((f, i) =>
                  f.status === "done" ? (
                    <tr key={i} className={`border-b border-line ${selected === i ? "bg-gold-pale/60" : ""}`}>
                      <td className="max-w-[16rem] truncate py-2.5 pr-4 font-medium">{f.result.filename}</td>
                      {DIMENSIONS.map((d) => (
                        <td key={d.key} className="px-3 py-2.5"><ScorePip score={f.result.scores[d.key]?.score} /></td>
                      ))}
                      <td className="px-3 py-2.5">
                        <button onClick={() => setSelected(i)} className="text-sm font-medium text-crimson underline-offset-2 hover:underline">View</button>
                      </td>
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>

          {done.length > 1 && (
            <button
              onClick={() => setSelected("compare")}
              className={`mt-4 rounded-lg border px-3.5 py-2 text-sm font-medium ${selected === "compare" ? "border-crimson bg-crimson-pale text-crimson" : "border-line hover:border-gold"}`}
            >
              Compare all on one chart
            </button>
          )}

          {/* radar */}
          {selected !== null && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-lg font-semibold">
                  {selected === "compare" ? "All documents" : files[selected]?.result.filename}
                </h3>
                <button onClick={exportPNG} className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-medium hover:border-gold">
                  <ImageDown className="h-4 w-4" /> Save chart as PNG
                </button>
              </div>
              <div ref={chartRef} className="mt-3 h-80 rounded-lg border border-line bg-white p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
                    <PolarGrid stroke="#E5DFD6" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: "#211C17", fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 3]} tickCount={4} tick={{ fill: "#6B6257", fontSize: 11 }} />
                    {selected === "compare" ? (
                      <>
                        {done.map((f, i) => (
                          <Radar key={i} name={f.result.filename} dataKey={`s${i}`}
                            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                            fill={SERIES_COLORS[i % SERIES_COLORS.length]} fillOpacity={0.18} />
                        ))}
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </>
                    ) : (
                      <Radar name="Score" dataKey="score" stroke="#8C2332" fill="#8C2332" fillOpacity={0.45} />
                    )}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* scoring memo */}
          {selectedResult && (
            <div className="mt-6 rounded-lg border border-line bg-paper p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold">Scoring memo</p>
              <dl className="mt-3 space-y-4">
                {DIMENSIONS.map((d) => {
                  const e = selectedResult.scores[d.key] || {};
                  return (
                    <div key={d.key}>
                      <dt className="flex items-baseline justify-between gap-4 font-display text-[15px] font-semibold">
                        {d.key}
                        <span className="whitespace-nowrap text-sm font-body text-crimson">{scoreLabel(e.score)}</span>
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed text-muted">{e.justification || "No justification returned."}</dd>
                    </div>
                  );
                })}
              </dl>
              <p className="mt-4 border-t border-line pt-3 text-xs text-muted">Scored by {selectedResult.model}. AI-generated assessment - verify against the source document.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
