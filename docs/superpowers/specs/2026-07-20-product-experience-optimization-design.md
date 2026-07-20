# Product experience optimization

## Objective

Make AI System Design Gym easier to understand and operate without changing its core visual identity or local-first architecture. The optimized experience should keep one primary task in focus, use one consistent learning vocabulary, remain legible in dark mode, and work cleanly at desktop and mobile widths.

## Scope

This pass covers five related improvements:

1. Fix the mobile Missions filter layout defect.
2. Standardize learner-facing terminology and navigation labels.
3. Reduce duplicated status information in Missions, Workspace, and Progress.
4. Improve body-text legibility and hierarchy across the product.
5. Make first-use and next-action states more focused.

The pass does not add a backend, new mission engines, new learning content, or a new visual brand.

## Chosen approach

Use a focused refinement of the existing component and token system. Preserve the current dark engineering-workbench identity, page routes, local storage contracts, and core workflows. Prefer targeted structural changes over a broad redesign.

Alternatives considered:

- A CSS-only polish would be fast but would leave terminology and duplicated progress models unresolved.
- A full information-architecture rewrite would provide more separation but is too disruptive for the current product maturity and would risk existing workflow behavior.
- The chosen balanced pass fixes the clear responsive defect, simplifies hierarchy, and preserves tested interactions.

## Experience design

### Shared language

Use the following learner-facing vocabulary consistently:

- Primary navigation: Home, Path, Practice, Missions, Progress.
- Learning loop: Learn, Practice, Build, Stress-test, Revise.
- Content hierarchy: Stage, Chapter, Lesson, Drill.

Avoid using Training and Practice for the same destination. Avoid calling chapters modules in learner-facing progress summaries. Internal identifiers such as drill IDs remain available to code and tests but are not displayed unless they help the learner.

### Missions

- Keep the catalogue as a browsing surface and make the Enterprise RAG implementation status explicit.
- Describe the library honestly as one interactive mission plus reference cases.
- Keep mode selection, search, and filters visually subordinate to the selected mission.
- On mobile, reset the search field's flex basis so it remains a standard 44-pixel control rather than expanding vertically.
- Preserve hash-backed catalogue state, saved notes, and the existing workspace entry flow.

### Workspace

- Keep the five-stage stepper as the single primary progress model.
- Reduce the design-loop status row to concise supporting context instead of four competing chips.
- Keep the stage checklist near the current task because it explains the gate.
- Remove or shorten duplicated revision hints and prevent stage labels from truncating at desktop widths.
- Preserve validation, storage, hash synchronization, and screen-reader status announcements.

### Progress

- At zero evidence, lead with one next action and a compact preview of the full route.
- Avoid repeating the same first-lesson call to action in both the journey and empty profile.
- Keep the complete evidence-weighted journey available after progress exists.
- Preserve deterministic scoring and the existing navigation callbacks.

### Home and Path

- Keep the Home next-action card dominant and lower the contrast of decorative blueprint lines.
- Present the learning path as supporting orientation rather than four equal competing calls to action.
- On Path, emphasize the current lesson or drill and reduce internal metadata noise.
- Preserve all existing completion and drill-review behavior.

### Typography and accessibility

- Raise essential supporting text to at least 13 pixels and normal explanatory text to at least 14 pixels.
- Keep 11-12 pixel text only for short, nonessential metadata.
- Increase dark-theme muted-text contrast where necessary.
- Preserve visible focus, 44-pixel mobile targets, reduced-motion behavior, semantic headings, and accessible names.

## Component and data boundaries

- `App.tsx` remains the route and progress coordinator.
- `AppShell` owns navigation terminology only; it does not gain workflow logic.
- Page components continue to receive state and navigation through existing props.
- CSS remains split by surface, with shared type and color changes expressed through `tokens.css` and `components.css`.
- No local-storage key or persisted attempt shape changes are required.

## Error and edge behavior

- Mobile layouts must work at 375, 500, and 720 CSS pixels without horizontal overflow or vertically stretched controls.
- Long mission and stage titles must wrap or receive sufficient width rather than being clipped.
- Empty progress, partially completed learning, saved mission, and completed mission states must retain a clear next action.
- Theme switching must preserve contrast in both light and dark modes.

## Testing strategy

- Add regression coverage for standardized navigation labels and simplified first-use progress actions.
- Keep existing component and workflow tests green.
- Run the complete Vitest suite and production build.
- Validate Home, Path, Missions, Workspace, Practice, and Progress visually at 1440x1100 and at least Missions, Practice, and Progress at 500x900.
- Check browser console output and confirm no horizontal overflow at the mobile viewport.

## Success criteria

- The mobile Missions search control renders at normal control height.
- Learner-facing terminology is consistent across navigation, Home, Path, Practice, Workspace, and Progress.
- Workspace has one dominant progress model and no truncated stage labels at 1440 pixels.
- Zero-progress users see one primary next action rather than duplicate calls to action.
- Supporting text is readable without weakening the compact workbench character.
- All automated tests and the production build pass.
