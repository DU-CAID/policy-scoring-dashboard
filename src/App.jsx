import React from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import PolicyScoringDashboard from "./PolicyScoringDashboard.jsx";
import caidLogo from "./assets/caid-logo.png";
import duLogo from "./assets/du-logo.png";

const navClass = ({ isActive }) =>
  `text-sm font-medium underline-offset-4 ${isActive ? "text-crimson underline" : "text-ink hover:text-crimson"}`;

const Page = ({ title, children }) => (
  <div className="mx-auto max-w-3xl rounded-xl border border-line bg-white p-6 sm:p-8 shadow-sm">
    <h1 className="font-display text-3xl font-semibold">{title}</h1>
    <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted">{children}</div>
  </div>
);

const About = () => (
  <Page title="About this tool">
    <p>
      This dashboard scores policy documents against a rubric grounded in evidence-based policymaking research.
      Each document is evaluated on five dimensions: Use of Empirical Research, Formal Evidence-Gathering
      Process, Transparency and Accessibility, Expert and Stakeholder Input, and Evaluation and Iteration. This is done on a
      0–3 scale with a written justification per dimension.
    </p>
    <p>
      Scoring is performed by an open-weights language model served through the Hugging Face Inference API. The
      scores are model judgments, not ground truth. They are best used as a structured first read that points you
      to where a document is strong or thin, to be verified against the text itself.
    </p>
    <p>
      This is a research tool of the <a className="text-crimson underline underline-offset-2" href="https://du-caid.github.io" target="_blank" rel="noopener noreferrer">Center for Analytics and Innovation with Data (CAID)</a> at
      the University of Denver's Daniels College of Business.
    </p>
  </Page>
);

const Research = () => (
  <Page title="Research">
    <div>
      <h2 className="font-display text-xl font-semibold text-ink">How Evidence Use in Congressional Research Changes Over Time</h2>
      <p className="mt-1 text-sm italic">
        From the paper "Volatility in Evidence Use: A Computational Analysis of Punctuated Equilibrium Theory"
      </p>
    </div>
    <p>
      Policymakers are often encouraged to base decisions on solid evidence. But how consistently does that happen,
      and does it change over time? This project looks at more than 13,000 Congressional Research Service (CRS)
      reports written between 2000 and 2021. CRS is Congress's nonpartisan research agency.
    </p>
    <p>
      Each report was scored on five features of evidence-based policymaking using the policy scoring dashboard: use
      of empirical research, a formal process for gathering evidence, transparency, input from experts and
      stakeholders, and attention to evaluation and learning. Scores were first assigned by a large language model
      and then extended to the full set of reports with machine learning. Reports were grouped into 20 policy areas,
      such as health, defense, and agriculture. Each area was then labeled by how its evidence use behaved over time:
      stable, gradually changing, or prone to sharp shifts.
    </p>
    <h3 className="font-display text-lg font-semibold text-ink">Main findings</h3>
    <ul className="list-disc space-y-2 pl-5">
      <li>
        <strong className="text-ink">Most policy areas change gradually.</strong> Sudden, dramatic shifts in evidence
        use are less common.
      </li>
      <li>
        <strong className="text-ink">Public attention matters.</strong> When the public sees an issue as the country's
        most important problem, evidence use in that area becomes much more likely to shift abruptly. Media coverage
        and presidential attention are also linked to less stable evidence use.
      </li>
      <li>
        <strong className="text-ink">Partisan control matters little.</strong> Whether one party controls both
        Congress and the White House has almost no effect. This suggests CRS analysis is largely buffered from
        short-term partisan politics.
      </li>
      <li>
        <strong className="text-ink">Policy areas differ.</strong> Government Operations, Macroeconomics, and Defense
        see the most volatile evidence use. Agriculture, Public Lands, and Transportation are among the steadiest,
        which likely reflects well-established expert routines.
      </li>
    </ul>
    <p>
      <strong className="text-ink">Why it matters:</strong> Evidence use in policymaking isn't fixed. It responds to
      the political environment. Building strong analytic capacity and institutional expertise may help keep evidence
      use steady, even when an issue becomes politically heated.
    </p>
  </Page>
);

const Contact = () => (
  <Page title="Contact">
    <p>
      This project is maintained by Dr. Stefani Langehennig and the CAID team. The code is open source:
    </p>
    <p>
      <a className="text-crimson underline underline-offset-2" href="https://github.com/DU-CAID/policy-scoring-dashboard" target="_blank" rel="noopener noreferrer">
        github.com/DU-CAID/policy-scoring-dashboard
      </a>
    </p>
  </Page>
);

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-crimson bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <a href="https://du-caid.github.io" aria-label="Center for Analytics and Innovation with Data home">
              <img src={caidLogo} alt="CAID logo" className="h-10 w-auto rounded-md" />
            </a>
            <img src={duLogo} alt="University of Denver logo" className="h-7 w-auto" />
          </div>
          <nav className="flex gap-5">
            <NavLink to="/" end className={navClass}>Score</NavLink>
            <NavLink to="/research" className={navClass}>Research</NavLink>
            <NavLink to="/about" className={navClass}>About</NavLink>
            <NavLink to="/contact" className={navClass}>Contact</NavLink>
          </nav>
        </div>
      </header>

      <main className="px-4 py-10 sm:px-6">
        <Routes>
          <Route path="/" element={<PolicyScoringDashboard />} />
          <Route path="/research" element={<Research />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<PolicyScoringDashboard />} />
        </Routes>
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Center for Analytics and Innovation with Data | University of Denver
      </footer>
    </div>
  );
}
