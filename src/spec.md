# Mark Me

## Current State
Full-stack attendance management app. Attendance Register shows a grid (workers × dates). Workers can only mark attendance via the Marking tab (not from the register). Dashboard shows total/present/absent/unmarked counts for today using all workers (not just eligible ones). Worker popup already opens on name click. Data is persisted per-Principal in the backend — no data is lost on updates.

## Requested Changes (Diff)

### Add
- Inline Present/Absent toggle buttons in the Attendance Register next to each worker's name (in the sticky left column), for the current day only. Only today's column has interactive buttons; past/future dates remain display-only cells.
- The selected option highlights with its respective color (green for Present, red for Absent). Unselected option is muted.

### Modify
- **Dashboard counts**: `unmarked` should be calculated from `eligibleWorkers` (joiningDate <= today), not all workers, matching the Marking tab logic.
- **Dashboard worker list**: Show eligible workers' today status in the worker list section, using the same `eligibleWorkers` filter.
- **AttendancePage**: The inline buttons use `useMarkAttendance` mutation. Worker name/avatar click still opens the popup.
- **Data persistence note**: Backend already persists all data per-Principal. No code changes needed for persistence — it already works correctly.

### Remove
- Nothing removed.

## Implementation Plan
1. **AttendancePage.tsx**: Add `useMarkAttendance` import. In the sticky left column, below/beside the worker name, add two small inline buttons (P / A) for Present and Absent. Only render these buttons when the date being rendered matches today. Highlight the active status with color. On click, call `markAttendance.mutate`. Keep existing name-click popup behavior.
2. **DashboardPage.tsx**: Filter `workers` to `eligibleWorkers` (joiningDate <= today) before computing `unmarked` and the worker list. This ensures counts match the Marking tab and reality.
