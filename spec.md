# Mark Me - Attendance Management App

## Current State
- AttendancePage.tsx: Attendance grid with week/month toggle. "Today's Attendance Report" card uses hardcoded today's date data only — it does NOT pull from the currently selected period (week/month view).
- WorkerDetailsModal.tsx: Shows a worker details dialog with stats scoped only to current calendar month. No delete option. Stats show: total working days (all time), present this month, absent this month.
- MarkingPage.tsx: Worker cards with collapsible attendance options. Expand/collapse state is per-card and independent — multiple cards can be open simultaneously.
- No worker report by selected month exists — only current month stats in modal.

## Requested Changes (Diff)

### Add
- **Today's Attendance Report pulls from period summary**: The report card should dynamically analyze data from the currently selected period (the week or month shown in the grid above), not just today. Rename it to "Period Attendance Report" or show it as "Attendance Summary" for the selected period.
- **Worker monthly report on click**: When a worker name is clicked (in attendance grid OR marking tab), show a detailed report modal with days of Present, Leave, Absent, Half Day — filterable by month (default to current month, with prev/next month navigation).
- **Delete worker with confirmation from worker modal**: The WorkerDetailsModal (accessed by clicking a worker name) must include a delete button with a confirmation dialog (AlertDialog). On confirm, delete the worker and close the modal.
- **Auto-collapse other worker option panels in Marking tab**: When a worker card's attendance options are expanded and another worker's toggle is clicked, the first worker's panel must collapse automatically. Only one panel can be expanded at a time (accordion behavior).

### Modify
- **WorkerDetailsModal**: 
  - Add month selector (prev/next arrows + month/year label) so the user can browse any month's data.
  - Show 4 stat cards: Present, Absent, Leave, Half Day — all for selected month.
  - Add a Delete Worker button with AlertDialog confirmation.
  - Pass `onDelete` callback and `allRecords` (or all worker records) into modal.
- **AttendancePage**: 
  - Change "Today's Attendance Report" to analyze data from the currently displayed period (dates array), not just today's date.
  - Update the report title to reflect the selected period (e.g. "Weekly Summary" or "Monthly Summary").
- **MarkingPage (WorkerCard)**:
  - Move expanded state out of individual WorkerCard components into MarkingPage parent.
  - Pass `isExpanded` and `onToggle` as props to WorkerCard.
  - When `onToggle(workerId)` is called, set only that worker as expanded (all others collapse).

### Remove
- Nothing removed

## Implementation Plan
1. **WorkerDetailsModal.tsx**: 
   - Add `selectedMonth`/`selectedYear` state (default: current month/year).
   - Add month navigation UI (ChevronLeft, ChevronRight, month label).
   - Recompute stats for the selected month (present, absent, leave, halfDay).
   - Add a Delete button that opens an inline AlertDialog confirmation.
   - Accept `onDelete?: () => void` prop and wire the delete confirmation to it.
2. **AttendancePage.tsx**: 
   - Change `todayReport` useMemo to use the `dates` array from the current period view instead of filtering by today's date.
   - Update the report title and date label to show the selected period.
   - Pass `onDelete` to WorkerDetailsModal so deleting from modal is supported.
3. **MarkingPage.tsx**:
   - Add `expandedWorkerId` state in MarkingPage (string | null).
   - Pass `isExpanded={expandedWorkerId === worker.id.toString()}` and `onToggle={() => setExpandedWorkerId(...)}` to WorkerCard.
   - WorkerCard no longer owns its own expand state; remove local `isExpanded` state.
4. **Wire delete in AttendancePage**: Import `useDeleteWorker`, pass `onDelete` to WorkerDetailsModal, handle success/error toasts.
