# Development Workflow

## Approach

Build incrementally using `IMPLEMENTATION_PLAN.md`. Context files define what to
build, how to build it, and current state. Implement against the plan — do not
infer or invent behavior not in scope.

## Scoping Rules
- Work on one phase at a time. Prefer small verifiable increments.
- Do not combine unrelated system boundaries in one step.
- A "step" is one logical change: one new component, one DB fix, one toggle.

## When To Split Work
Split if a step combines:
- UI changes and backend logic changes
- State management changes and data model changes
- Multiple independent features (e.g., conditional logic + auto-save)
- Behavior not clearly defined in the implementation plan

If a change cannot be verified end to end quickly, split it.

## Handling Missing Requirements
- Do not invent product behavior not defined in context files or the plan.
- If ambiguous, resolve by reading the relevant source file before implementing.
- If genuinely missing from both source and plan, flag it as a question —
  do not guess.

## Protected Foundation Components
Do not modify `components/ui/*` (shadcn generated files) or third-party
library internals unless explicitly instructed. Feature logic goes in
app-level components and field type implementations.

## Ponytail Discipline
Every commit should answer "yes" to at least one:
- Does this remove code?
- Does this replace a dependency with a native API?
- Does this fix a bug at the root cause?
- Can this be one line?

Mark intentional simplifications with `// ponytail: X; upgrade when Y.`
comments.

## Keeping Docs In Sync
Update relevant context file whenever implementation changes the system:
- Architecture or boundaries
- Storage model decisions
- Code conventions
- Feature scope

## Before Moving To The Next Phase
1. Current phase works end to end within defined scope.
2. No invariant from `architecture-context.md` was violated.
3. `npm run build` passes.
4. `npm run lint` passes.
5. Manual smoke test: create → edit → save → publish → submit → verify stats.
