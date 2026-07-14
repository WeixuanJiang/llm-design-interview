# AI System Design Gym

AI System Design Gym is an interactive learning environment for practicing production AI, machine learning, LLM, agent, and retrieval-augmented generation system design. It combines structured course material, scenario-based knowledge checks, design exercises, realistic customer missions, and a drag-and-drop AWS architecture lab in one local-first web application.

## Features

- **Learn:** Comprehensive lessons covering RAG, retrieval, evaluation, safety, agents, observability, deployment, inference, fine-tuning, multimodal systems, ML platforms, and cost optimization.
- **Knowledge checks:** Five production-oriented scenario questions per lesson, with full-sequence completion tracking.
- **Practice:** Chapter-aligned design decisions and interview exercises with immediate evaluation and recorded progress.
- **Missions:** 100 fictionalized customer scenarios derived from real-world agent and LLM workloads. Every mission has unique requirements, quantified scale assumptions, architecture stages, a stress event, and review criteria.
- **Build Lab:** A searchable, categorized library of 96 AWS services with mission recommendations and a React Flow drag-and-drop architecture canvas.
- **Progress:** Local learning history, skill signals, completion summaries, and targeted recommendations.
- **Responsive experience:** Desktop and mobile layouts designed for focused reading and repeated practice.

## Mission Workflow

Each mission guides the learner through five stages:

1. Review the use case and clarify its functional and non-functional requirements.
2. Analyze the supplied usage, concurrency, data volume, retention, availability, and recovery assumptions.
3. Build an architecture and record the important design decisions.
4. Respond to a production stress event with an evidence-backed mitigation.
5. Review the result, feedback, and trade-offs before revising the design.

The original Enterprise RAG workspace remains available alongside the 100 customer missions.

## Technology

- React 19 and TypeScript
- Vite 6
- React Flow (`@xyflow/react`)
- Zod validation
- Vitest and Testing Library
- Lucide icons
- Browser `localStorage` for attempt and learning-state persistence

## Getting Started

Requirements: Node.js 20 or later and npm.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The application uses hash navigation, including `/#learn`, `/#missions`, `/#practice`, and `/#progress`.

## Validation

```bash
npm test
npm run build
```

The current suite covers catalog integrity, unique mission specifications, AWS service-library coverage, state management, validation, and end-to-end application interactions.

## Project Structure

```text
src/
  components/   Application views, mission workflow, and architecture builder
  data/         Course, mission, catalog, and AWS service definitions
  domain/       Attempt state, graph contracts, scoring, persistence, and validation
  test/         Shared test setup
```

## Current Architecture

The application is intentionally frontend-first and local-first. Authenticated accounts, shared progress, server-side attempt storage, analytics, and an AI evaluation gateway are natural backend extensions. Domain state and mission schemas are kept separate from React components so they can move into shared packages or services later.
