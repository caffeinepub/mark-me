# Mark Me

## Current State
Marking tab shows worker cards with always-visible radio-style status list. Worker names open details modal. Toggle button is purple. No delete worker feature.

## Requested Changes (Diff)

### Add
- Collapsible attendance options per worker card — hidden by default, toggle to expand/collapse.
- When collapsed, show current attendance status highlighted with its respective color.
- Delete worker feature: clicking a worker name/card triggers a confirmation dialog before deleting.

### Modify
- Dropdown toggle button color: theme foreground/muted (NOT purple/primary).
- Status display box color: uses respective attendance status color when collapsed.

### Remove
- Always-visible radio list (replaced by collapsible section)

## Implementation Plan
1. Update WorkerCard in MarkingPage.tsx: add isExpanded state, collapsible radio section, status badge when collapsed.
2. Style toggle button with muted/foreground theme colors (bg-muted, text-foreground, border-border).
3. Add delete icon + AlertDialog confirmation per worker card.
4. Wire useDeleteWorker hook in MarkingPage, pass onDelete handler to WorkerCard.
