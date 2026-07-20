# Product Experience Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve mobile layout, terminology, task focus, and legibility while preserving all existing local-first learning and mission behavior.

**Architecture:** Keep `App.tsx` as the coordinator and refine the existing page components in place. Behavioral contracts are protected with Testing Library tests; shared visual changes stay in token and surface CSS files, followed by real-browser desktop and mobile checks.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS custom properties, headless Chrome.

## Global Constraints

- Preserve hash routes and all existing local-storage keys and data shapes.
- Use navigation labels: Home, Path, Practice, Missions, Progress.
- Use the learning loop: Learn, Practice, Build, Stress-test, Revise.
- Use the content hierarchy: Stage, Chapter, Lesson, Drill.
- Essential supporting text must be at least 13px; normal explanatory text must be at least 14px.
- Mobile controls must remain at least 44px high and must not overflow at 375px, 500px, or 720px.
- Do not add dependencies, backend behavior, mission engines, or new learning content.

---

### Task 1: Standardize learner-facing terminology

**Files:**
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/PracticePage.tsx`
- Modify: `src/components/HomePage.tsx`
- Modify: `src/components/PathPage.tsx`
- Modify: `src/components/ProgressPage.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: existing `AppSection` navigation IDs and page props.
- Produces: unchanged route IDs with consistent visible labels and copy.

- [ ] **Step 1: Write the failing terminology regression test**

Add an application test that renders `<App />`, asserts the navigation contains `Practice` and not `Training`, opens Progress, and asserts the visible route copy contains `Learn → Practice → Build → Stress-test → Revise`.

```tsx
it("uses one learner-facing vocabulary", async () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "Practice" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Training" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Progress" }));
  expect(await screen.findByText("Learn → Practice → Build → Stress-test → Revise", { exact: false })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm.cmd test -- src/App.test.tsx`

Expected: FAIL because the current shell label is `Training` and Progress uses `Practise` and `Stress`.

- [ ] **Step 3: Implement the vocabulary changes**

Change the shell item label to `Practice`, the Practice page heading and accessible tablist label to `Practice`, and all loop copy to `Learn → Practice → Build → Stress-test → Revise`. Replace learner-facing `module/modules` with `chapter/chapters` where the count represents the 23 curriculum entries. Keep internal type and variable names unchanged.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm.cmd test -- src/App.test.tsx`

Expected: all tests in `src/App.test.tsx` pass after updating any existing copy assertions to the new vocabulary.

- [ ] **Step 5: Commit**

```powershell
git add src/App.test.tsx src/components/AppShell.tsx src/components/PracticePage.tsx src/components/HomePage.tsx src/components/PathPage.tsx src/components/ProgressPage.tsx
git commit -m "Standardize learning vocabulary"
```

### Task 2: Fix and clarify the Missions catalogue

**Files:**
- Modify: `src/components/MissionCatalogue.tsx`
- Modify: `src/missions.css`
- Test: `src/App.test.tsx`
- Create: `src/missionsCss.test.ts`

**Interfaces:**
- Consumes: existing catalogue hash state, `onOpen`, `onModeChange`, and saved attempt props.
- Produces: the same catalogue behavior with honest availability copy and a stable mobile search control.

- [ ] **Step 1: Write failing catalogue and CSS contract tests**

Update the existing Missions assertion to require `1 interactive mission · 99 reference cases`. Add `src/missionsCss.test.ts` using `import missionsCss from "./missions.css?raw"` and assert the mobile media block contains `.mission-field--search { flex: none; }`.

```ts
import { expect, it } from "vitest";
import missionsCss from "./missions.css?raw";

it("resets the search flex basis in the mobile layout", () => {
  expect(missionsCss).toMatch(/@media \(max-width: 720px\)[\s\S]*\.mission-field--search\s*{\s*flex:\s*none;/);
});
```

- [ ] **Step 2: Run both tests and verify RED**

Run: `npm.cmd test -- src/App.test.tsx src/missionsCss.test.ts`

Expected: FAIL because the current copy claims 100 cases without distinguishing availability and mobile CSS does not reset the flex basis.

- [ ] **Step 3: Implement the catalogue changes**

Change the page subtitle to `1 interactive mission · 99 reference cases for system-design practice.` Add `.mission-field--search { flex: none; width: 100%; }` inside the 720px media query. Keep the desktop `flex: 1 1 280px` rule unchanged.

- [ ] **Step 4: Run both tests and verify GREEN**

Run: `npm.cmd test -- src/App.test.tsx src/missionsCss.test.ts`

Expected: both files pass.

- [ ] **Step 5: Commit**

```powershell
git add src/App.test.tsx src/missionsCss.test.ts src/components/MissionCatalogue.tsx src/missions.css
git commit -m "Clarify mission availability and mobile filters"
```

### Task 3: Simplify Workspace progress status

**Files:**
- Modify: `src/components/MissionWorkspace.tsx`
- Modify: `src/workspace.css`
- Test: `src/components/MissionWorkspace.test.tsx`

**Interfaces:**
- Consumes: existing `deriveLoopSteps(attempt)` and `loopLiveText` status announcement.
- Produces: a concise visible `Current phase` summary while retaining the detailed screen-reader live region and stage checklist.

- [ ] **Step 1: Write a failing Workspace status test**

Render the initial attempt and assert the page has one visible `Current phase` region containing `Draft`, does not render `Stress event Pending`, and still exposes `Design loop status` through the accessible live-status text.

```tsx
expect(screen.getByText("Current phase")).toBeInTheDocument();
expect(screen.getByText("Draft")).toBeInTheDocument();
expect(screen.queryByText("Stress event Pending")).not.toBeInTheDocument();
expect(screen.getByText(/Design loop status: draft in progress/i)).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm.cmd test -- src/components/MissionWorkspace.test.tsx`

Expected: FAIL because four visible loop chips are rendered and `Current phase` is absent.

- [ ] **Step 3: Implement the concise summary**

Replace the visible `<ol className="workspace-loop-steps">` with one `workspace-loop-current` line containing the active phase label and a short next-phase hint. Keep `loopLiveText` and the `role="status"` screen-reader node unchanged. Update `workspace.css` for the new line and remove unused chip rules. Allow stage titles to wrap and give the five stepper columns enough width at desktop; retain horizontal scrolling on narrow layouts.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm.cmd test -- src/components/MissionWorkspace.test.tsx`

Expected: all Workspace tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/components/MissionWorkspace.test.tsx src/components/MissionWorkspace.tsx src/workspace.css
git commit -m "Simplify workspace progress status"
```

### Task 4: Focus the zero-evidence Progress state

**Files:**
- Modify: `src/components/ProgressPage.tsx`
- Modify: `src/progress.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `completedModules`, `reviewed`, and `attempt.completedStages`.
- Produces: a `hasEvidence` presentation branch without changing competency calculations or navigation callbacks.

- [ ] **Step 1: Write a failing first-use test**

Open Progress with cleared storage and assert there is exactly one `Start first lesson` button and the full milestone list is marked as a compact preview rather than presenting two primary CTAs.

```tsx
fireEvent.click(screen.getByRole("button", { name: "Progress" }));
expect(await screen.findAllByRole("button", { name: /Start first lesson/i })).toHaveLength(1);
expect(screen.getByText(/Your route at a glance/i)).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm.cmd test -- src/App.test.tsx`

Expected: FAIL because the current zero-progress view repeats `Start first lesson` and does not use the compact-preview heading.

- [ ] **Step 3: Implement the first-use branch**

Derive `const hasEvidence = completedModules.length > 0 || reviewed > 0 || attempt.completedStages.length > 0;`. For `!hasEvidence`, remove milestone-level CTAs from the journey, label it `Your route at a glance`, and retain one primary `Start first lesson` action in the empty competency profile. Keep the full milestone layout and actions when evidence exists.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm.cmd test -- src/App.test.tsx`

Expected: all App tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/App.test.tsx src/components/ProgressPage.tsx src/progress.css
git commit -m "Focus the first-use progress state"
```

### Task 5: Improve shared legibility and visual hierarchy

**Files:**
- Modify: `src/tokens.css`
- Modify: `src/components.css`
- Modify: `src/home.css`
- Modify: `src/path.css`
- Modify: `src/shell.css`
- Modify: `src/missions.css`
- Modify: `src/progress.css`
- Modify: `src/workspace.css`

**Interfaces:**
- Consumes: existing CSS custom properties and surface class names.
- Produces: improved text sizing, contrast, and hierarchy with no component API changes.

- [ ] **Step 1: Capture visual baselines**

Run the app and capture Home, Path, Missions, Workspace, Practice, and Progress at `1440x1100`, plus Missions, Practice, and Progress at `500x900`. Record mobile search height and page `scrollWidth`/`clientWidth` before editing.

- [ ] **Step 2: Implement token and surface refinements**

Set normal explanatory copy to `var(--text-sm)` (14px) and essential supporting copy to at least `var(--text-xs)` (13px after token adjustment). Increase dark-theme muted and subtle colors until body copy retains readable contrast. Lower blueprint grid line opacity, reduce equal-card emphasis on Home, and hide internal drill identifiers from visual rows while retaining accessible question text.

- [ ] **Step 3: Run the complete automated suite**

Run: `npm.cmd test -- --run`

Expected: 0 failed test files and 0 failed tests.

- [ ] **Step 4: Run the production build**

Run: `npm.cmd run build`

Expected: TypeScript and Vite exit with code 0.

- [ ] **Step 5: Perform browser verification**

Capture the same route and viewport matrix. Confirm Missions search is 44px high at 500px, `document.documentElement.scrollWidth === document.documentElement.clientWidth` on tested mobile routes, Workspace stage labels are not clipped at 1440px, both themes remain readable, and the browser console has no errors.

- [ ] **Step 6: Commit**

```powershell
git add src/tokens.css src/components.css src/home.css src/path.css src/shell.css src/missions.css src/progress.css src/workspace.css
git commit -m "Improve product legibility and hierarchy"
```

### Task 6: Final verification and handoff

**Files:**
- Review: all files changed by Tasks 1-5.

**Interfaces:**
- Consumes: the complete optimized worktree.
- Produces: verified implementation ready for user review.

- [ ] **Step 1: Inspect the final diff**

Run: `git diff HEAD~5 --check` and `git status -sb`.

Expected: no whitespace errors; only intentional plan/spec state remains.

- [ ] **Step 2: Re-run fresh verification**

Run: `npm.cmd test -- --run` followed by `npm.cmd run build` as separate commands.

Expected: both commands exit 0 with no failures.

- [ ] **Step 3: Summarize evidence**

Report changed behavior, test totals, build result, browser viewport checks, commit hashes, and any residual risks. Do not push until the user requests it.
