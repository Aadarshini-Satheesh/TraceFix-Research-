<<<<<<< HEAD
# TraceFix Research – Evidence-Driven AI Debugging with Causal Verification

[![Platform](https://img.shields.io/badge/Platform-Windows-blue.svg)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12-emerald.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Tailwind%20%7C%20Vite-cyan.svg)]()
[![Verification](https://img.shields.io/badge/Verification-Dual--Gate%20Pytest%20Sandbox-purple.svg)]()
[![Storage](https://img.shields.io/badge/Storage%20Quota-Strict%20E%3A%20Drive%20Isolation-orange.svg)]()

> **TraceFix Research** is an automated program repair (APR) and AI debugging research platform built for national-level technical hackathon presentation. TraceFix eliminates **plausibility bias** and **silent regressions** in LLM code repair by enforcing a strict **Causal Invariant Verification Protocol**: requiring pre-repair reproduction tests to fail before fixing, ranking culprit symbols via Spectrum-Based Fault Localization (SBFL), and subjecting patches to dual-gate sandbox verification.

---

## 1. Problem Formulation & Causal Theory

### 1.1 The Vulnerabilities of Standard LLM Repair
Current Automated Program Repair (APR) systems that rely directly on LLMs suffer from two critical failure modes:
1. **Plausibility Bias**: The LLM outputs code that looks syntactically and semantically plausible, but fails under boundary execution or edge conditions.
2. **Regression Blindness**: Fixing a reported bug often introduces breaking changes into unmonitored code paths, degrading the overall software invariant.
3. **Absence of Negative Evidence**: A fix is frequently accepted without proving that an automated reproduction test reliably failed on the original codebase.

### 1.2 The TraceFix Causal Verification Protocol
TraceFix models program repair as a causal graph where a patch $P$ is deemed valid **if and only if** it satisfies two formal conditions:

$$\Delta \text{Reproduction}(P) = \text{FAIL} \longrightarrow \text{PASS}$$
$$\Delta \text{RegressionSuite}(P) = \text{PASS} \longrightarrow \text{PASS}$$

If the candidate reproduction test does not fail on the baseline codebase, the investigation terminates with an `UNREPRODUCED_ANOMALY` status, preventing spurious fixes.

---

## 2. System Architecture

```mermaid
flowchart TD
    User([User / Bug Report]) --> Investigation[Phase 1: AST & SBFL Investigation]
    Investigation --> StackParser[Stack Trace Frame Extraction]
    Investigation --> Ochiai[Spectrum-Based Fault Localization (Ochiai)]
    
    Ochiai --> TestFirst[Phase 2: Regression-Test-First Protocol]
    TestFirst --> SandboxPre[Sandbox Pre-Repair Run]
    SandboxPre -->|Must FAIL| CausalDossier[Causal Evidence Dossier]
    SandboxPre -->|If PASS| RejectTest[Reject: False Positive Reproduction]
    
    CausalDossier --> LLMRepair[Phase 3: Evidence-Guided LLM Repair]
    LLMRepair --> ASTSyntax[AST Syntax Validation ast.parse]
    ASTSyntax --> PatchDiff[Unified Git Diff Generation]
    
    PatchDiff --> DualGate[Phase 4: Dual-Gate Sandbox Verification]
    DualGate --> Gate1[Gate 1: Reproduction Test PASS]
    DualGate --> Gate2[Gate 2: Full Regression Suite PASS]
    
    Gate1 & Gate2 -->|Both Pass| VerifiedSuccess([VERIFIED SUCCESS])
    Gate2 -->|Fails| RegressionDetected([REGRESSION DETECTED - REJECTED])
```

---

## 3. Core Features & Research Modules

### 1. Research Dashboard
- Aggregated metrics: Total Sessions, Verified Repairs, Failed Repairs, Regression Rate, Average Latency, and API Cost.
- Real-time comparative win-rate charts comparing Baseline (Standard LLM) vs TraceFix (Causal APR) across 5 bug categories.

### 2. Repository Analysis
- Interactive file tree explorer.
- Python AST Symbol Inspector: Extracts classes, methods, cyclomatic complexity branch metrics, line numbers, and docstrings.
- Syntax validator ensuring code integrity.

### 3. Bug Investigation & SBFL
- Traceback parser isolating internal repository frames from standard library/virtualenv code.
- **Spectrum-Based Fault Localization (SBFL)**: Implements the Ochiai metric:
  $$\text{Suspiciousness}(s) = \frac{\text{failed}(s)}{\sqrt{\text{total\_failed} \cdot (\text{failed}(s) + \text{passed}(s))}} + \omega \cdot \text{Complexity}(s)$$
- Visual call stack frame hierarchy and culprit code slice viewer.

### 4. Regression-Test-First Repair
- Formulates a targeted reproduction test.
- Executes the test in an isolated subprocess sandbox on the unmodified repository.
- Asserts that the test fails (Causal Requirement 1) before allowing patch generation.

### 5. AI Repair Workspace
- Independently executable methods:
  - **Baseline APR**: Standard direct LLM prompt without negative evidence constraints.
  - **Proposed TraceFix**: Evidence-guided causal prompt with confirmed failing test and SBFL slices.
- Deterministic **Mock AI Engine** bundled for offline demonstration, plus live Gemini/OpenAI/Anthropic/Ollama API integration.

### 6. Patch Comparison
- Side-by-side split diff and unified Git diff viewers.
- Line additions (`+` green) and deletions (`-` red).
- Python AST syntax validator (`ast.parse`) checking for syntax errors before execution.
- Source protection invariant: original files are never mutated.

### 7. Dual-Gate Sandbox Verification
- Creates an ephemeral isolated clone of the codebase inside `E:\Projects\TraceFix-Research\.cache\sandbox_runs\<run_id>`.
- Applies patch strictly to the sandbox copy.
- Executes full pytest suite with subprocess timeouts (20s) and process-tree termination.
- Assigns causal verdicts: `VERIFIED_SUCCESS`, `REGRESSION_DETECTED`, `REPRODUCTION_FAILED`, or `TIMEOUT`.

### 8. Controlled A/B Research Experiments
- Batch executes Baseline vs TraceFix across selected benchmark tasks.
- Tracks Verified Resolution Rate, Regression Avoidance, Repair Latency, and Token Cost.
- Exports trial data as **CSV** and **JSON**.

### 9. Benchmark Suite & SWE-bench Lite
- Bundles 6 diverse, realistic defect scenarios:
  1. `BENCH-01` (`math_stats`): Off-by-one boundary index in percentile calculation.
  2. `BENCH-02` (`string_toolkit`): Regex delimiter collapsing and boundary stripping.
  3. `BENCH-03` (`data_cache`): NoneType float comparison in TTL cache expiration.
  4. `BENCH-04` (`string_toolkit`): Unicode NFKD accent normalization.
  5. `BENCH-05` (`math_stats`): Singleton array percentile interpolation.
  6. `BENCH-06` (`data_cache`): LRU capacity eviction race.
- SWE-bench Lite JSON dataset importer.

### 10. Research Reports
- Compiles a complete scientific academic paper containing Abstract, Hypotheses, Methodology, Empirical Tables, Case Studies, Threats to Validity, and Conclusions.
- Downloadable as `.md`, styled `.html`, or printable to **PDF**.

---

## 4. Strict Storage Architecture (E: Drive Only)

To prevent disk overflow on constrained systems (e.g. C: drive &lt; 1 GB free), TraceFix enforces zero file creation on C:.

| Component | Path |
| :--- | :--- |
| **Project Root** | `E:\Projects\TraceFix-Research` |
| **Python Virtual Environment** | `E:\Projects\TraceFix-Research\backend\venv` |
| **Pip Cache** | `E:\Projects\TraceFix-Research\.cache\pip` |
| **NPM Cache** | `E:\Projects\TraceFix-Research\.cache\npm` |
| **Subprocess Sandbox Runs** | `E:\Projects\TraceFix-Research\.cache\sandbox_runs` |
| **Temporary Files (`TEMP`/`TMP`)** | `E:\Projects\TraceFix-Research\.cache\temp` |
| **SQLite Database** | `E:\Projects\TraceFix-Research\backend\data\tracefix.db` |

---

## 5. Quick Start (Windows)

### 1. Launch the Application
Simply double-click or run:
```cmd
E:\Projects\TraceFix-Research\run.bat
```
This script sets environment cache variables on E: and starts both:
- **FastAPI Backend Server**: `http://127.0.0.1:8000`
- **Vite React Frontend**: `http://localhost:5173`
- Automatically opens `http://localhost:5173` in your default browser.

### 2. Manual Startup Commands
If you prefer running services manually in separate terminals:

**Terminal 1 (Backend):**
```cmd
cd /d E:\Projects\TraceFix-Research\backend
set TEMP=E:\Projects\TraceFix-Research\.cache\temp
set TMP=E:\Projects\TraceFix-Research\.cache\temp
E:\Projects\TraceFix-Research\backend\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 (Frontend):**
```cmd
cd /d E:\Projects\TraceFix-Research\frontend
set TEMP=E:\Projects\TraceFix-Research\.cache\temp
set TMP=E:\Projects\TraceFix-Research\.cache\temp
npm run dev
```

---

## 6. Hackathon Live Demonstration Walkthrough

Follow this step-by-step sequence during presentation:

1. **Dashboard Overview**:
   - Open `http://localhost:5173`.
   - Point out the KPI cards and the comparative resolution rate chart showing Baseline vs TraceFix.
2. **Initialize New Session (1-Click Preset)**:
   - Click **New Debugging Session** in the sidebar.
   - Click **math_stats: IndexError on 100th Percentile** to load the authentic bug report.
   - Click **Create Session & Start Investigation**.
3. **Inspect Evidence & SBFL**:
   - In **Bug Investigation**, view the parsed call stack frame at `stats/metrics.py:42`.
   - Review the Ochiai Suspiciousness score ($0.85$) ranking `calculate_percentile` as primary culprit.
4. **Enforce Regression-Test-First**:
   - Click **Proceed to Test-First**.
   - Click **Execute Pre-Repair Test**.
   - Observe the test run in the isolated sandbox clone and exit with a confirmed failure:
     `CAUSAL VERIFICATION CONFIRMED: REPRODUCTION FAILED AS EXPECTED`.
5. **Compare AI Repair (Baseline vs Proposed)**:
   - Click **Proceed to AI Code Repair**.
   - Select **Method A (Baseline)**, generate patch, and observe the naive fix.
   - Select **Method B (Proposed TraceFix)**, generate causal patch with AST invariant guards.
6. **Inspect Git Diff**:
   - Switch to **Patch Comparison** to view the clean side-by-side diff with syntax validation.
7. **Dual-Gate Sandbox Verification**:
   - Switch to **Test Verification** and click **Execute Dual-Gate Verification**.
   - Watch pytest execute in the sandbox: Gate 1 passes (FAIL $\rightarrow$ PASS) and Gate 2 passes (all regression tests pass).
   - Show the green `VERIFIED SUCCESS` verdict.
8. **Run Benchmark A/B Evaluation**:
   - Switch to **Research Experiments**, click **Run Controlled Evaluation**.
   - Show the live A/B matrix where Baseline incurs regressions while TraceFix achieves 100% verified resolution.
   - Click **Export CSV** to demonstrate reproducible research data.
9. **Academic Report**:
   - Switch to **Research Reports** to review the compiled academic paper with methodology and citations.

---

## 7. Verification & Automated Test Commands

Run the backend unit and sandbox tests:
```cmd
cd /d E:\Projects\TraceFix-Research\backend
E:\Projects\TraceFix-Research\backend\venv\Scripts\python.exe -m pytest tests/
```
All 7 unit and integration tests verify AST parsing, SBFL ranking, sandbox isolation, and reproduction checking.
=======
![Netlify CLI](cli.png)

[![Coverage Status](https://codecov.io/gh/netlify/cli/branch/main/graph/badge.svg)](https://codecov.io/gh/netlify/cli)
[![npm version][npm-img]][npm] [![downloads][dl-img]][dl] [![netlify-status][netlify-img]][netlify]
[![security][snyk-img]][snyk]

Interact with [Netlify](http://netlify.com/) from the comfort of your CLI.

See the [CLI command line reference](https://cli.netlify.com/#commands) to get started and the docs on using
[Netlify Dev](https://github.com/netlify/cli/blob/main/docs/commands/dev.md) to run your site locally.

## Table of Contents

<!-- AUTO-GENERATED-CONTENT:START (TOC:collapse=true&collapseText=Click to expand) -->
<details>
<summary>Click to expand</summary>

- [Installation](#installation)
- [Usage](#usage)
- [Documentation](#documentation)
- [Commands](#commands)
  - [api](#api)
  - [blobs](#blobs)
  - [build](#build)
  - [completion](#completion)
  - [deploy](#deploy)
  - [dev](#dev)
  - [env](#env)
  - [functions](#functions)
  - [init](#init)
  - [integration](#integration)
  - [link](#link)
  - [login](#login)
  - [open](#open)
  - [recipes](#recipes)
  - [serve](#serve)
  - [sites](#sites)
  - [status](#status)
  - [switch](#switch)
  - [unlink](#unlink)
  - [watch](#watch)
- [Contributing](#contributing)
- [Development](#development)
- [License](#license)

</details>
<!-- AUTO-GENERATED-CONTENT:END -->

## Installation

Netlify CLI requires [Node.js](https://nodejs.org) version 22.13.0 or above. To install, run the following command from
any directory in your terminal:

```bash
npm install netlify-cli -g
```

When using the CLI in a CI environment we recommend installing it locally as a development dependency, instead of
globally. To install locally, run the following command from the root directory of your project:

```bash
npm install --save-dev netlify-cli
```

**Important:** Running `npm install netlify-cli -g` in CI means you're always installing the latest version of the CLI,
including **breaking changes**. When you install locally and use a
[lock file](https://docs.npmjs.com/cli/v7/commands/npm-ci) you guarantee reproducible builds. To manage CLI updates we
recommend using an automated tool like [renovate](https://github.com/renovatebot/renovate) or
[dependabot](https://github.com/dependabot).

Alternatively you may also use Homebrew: `brew install netlify-cli` (thanks
[@cglong](https://github.com/netlify/cli/issues/291)).

## Usage

Installing the CLI globally provides access to the `netlify` command.

```sh-session
netlify [command]

# Run `help` for detailed information about CLI commands
netlify [command] help
```

## Documentation

To learn how to log in to Netlify and start deploying projects, visit the
[documentation on Netlify](https://docs.netlify.com/cli/get-started/).

## Commands

For a full command reference visit [cli.netlify.com](https://cli.netlify.com/).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for more info on how to make contributions to this project.

## Development

You'll need to follow these steps to run Netlify CLI locally:

    uninstall any globally installed versions of netlify-cli
    clone and install deps for https://github.com/netlify/cli
    npm link from inside the cli folder

Now you're both ready to start testing and to contribute to the project!

## License

MIT. See [LICENSE](LICENSE) for more details.

[npm-img]: https://img.shields.io/npm/v/netlify-cli.svg
[npm]: https://npmjs.org/package/netlify-cli
[av-img]: https://ci.appveyor.com/api/projects/status/imk2qjc34ly7x11b/branch/master?svg=true
[av]: https://ci.appveyor.com/project/netlify/cli
[dl-img]: https://img.shields.io/npm/dm/netlify-cli.svg
[dl]: https://npmjs.org/package/netlify-cli
[david-img]: https://david-dm.org/netlify/cli/status.svg
[david]: https://david-dm.org/netlify/cli
[snyk-img]: https://snyk.io/test/npm/netlify-cli/badge.svg
[snyk]: https://snyk.io/test/npm/netlify-cli
[netlify-img]: https://api.netlify.com/api/v1/badges/d3807379-2dcf-4a43-9c00-e7e8d90ecf70/deploy-status
[netlify]: https://app.netlify.com/projects/cli/deploys
>>>>>>> b9fab37429ea4aadc2be7e6dd29acb7f68af6f15
