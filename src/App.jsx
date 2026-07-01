import React from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import PolicyScoringDashboard from "./PolicyScoringDashboard.jsx";

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
          <Link to="/" className="font-display text-lg font-semibold tracking-tight">
            Policy Scoring <span className="text-crimson">|</span> DU CAID
          </Link>
          <nav className="flex gap-5">
            <NavLink to="/" end className={navClass}>Score</NavLink>
            <NavLink to="/about" className={navClass}>About</NavLink>
            <NavLink to="/contact" className={navClass}>Contact</NavLink>
          </nav>
        </div>
      </header>

      <main className="px-4 py-10 sm:px-6">
        <Routes>
          <Route path="/" element={<PolicyScoringDashboard />} />
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
