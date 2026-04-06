# Mark Me

## Current State
Full-stack attendance management app with Motoko backend and React frontend. Features: Attendance Register (week/month grid), Marking Panel (per-worker attendance cards), Dashboard (stats + clickable filters), Add Worker page, Worker Details Modal (with wage calculator using $ sign), and authentication via Internet Identity. Current attendance statuses: Present, Absent, On Leave, Half Day. Attendance register shows all workers regardless of joining date. Dashboard "Total Workers" card is not clickable/interactive. Worker profile popup may not always open (depending on component state). No advance salary tracking. No edit worker feature. Wage calculator uses $ sign.

## Requested Changes (Diff)

### Add
- Advance salary field in the Worker Details Modal (worker profile popup)
- Edit worker particulars button/form in Worker Details Modal: edit name, role, joining date, photo
- `useUpdateWorker` mutation hook in useQueries.ts using existing `updateWorkerRoleWithDate` and `updateWorkerPhoto` backend APIs
- Total Workers clickable card in Dashboard showing full worker list in a dialog

### Modify
- **Remove Half Day and On Leave** attendance status options from: MarkingPage STATUS_OPTIONS array, MarkingPage summary card counts (remove leaveCount and halfDayCount cells), MarkingPage text summary line, AttendancePage period report stats grid (remove On Leave and Half Day cells), AttendancePage period summary bar segments, AttendancePage summary strip
- **Currency**: Replace all `$` signs with `₹` in WorkerDetailsModal wage calculator
- **Worker profile popup**: Ensure popup always opens when worker name/avatar is clicked in AttendancePage — remove any conditional that prevents it from opening
- **Attendance Register filter**: Only show workers whose `joiningDate <= today` (ISO date comparison) in AttendancePage workers list and MarkingPage
- **Dashboard Total Workers card**: Make it clickable, showing a dialog listing all workers (similar to the existing filter dialog pattern)
- **WorkerDetailsModal stats**: Remove "On Leave" and "Half Day" stat cards from the monthly stats grid; keep only Present and Absent
- **AttendancePage StatusCell**: Remove 'L' (leave) and 'HD' (halfday) from legend and cell map (keep only P and A)
- **DashboardPage**: Remove "On Leave" and "Half Day" from stats array and StatusBadge section; keep only Present, Absent, Unmarked (and Total Workers)

### Remove
- Half Day status option everywhere in UI
- On Leave (Leave) status option everywhere in UI
- Dollar sign `$` references in wage calculator UI

## Implementation Plan
1. **useQueries.ts**: Add `useUpdateWorker` mutation using `actor.updateWorkerRoleWithDate` and `actor.updateWorkerPhoto`
2. **WorkerDetailsModal.tsx**:
   - Replace `DollarSign` icon with Indian Rupee icon (use `₹` text)
   - Replace all `$` with `₹` in wage display
   - Remove "On Leave" and "Half Day" stat cards
   - Remove halfDays/leaveDays from stats computation
   - Add advance salary input section (local state, shows calculated advance)
   - Add "Edit Worker" button/section with inline form for name, role, joining date, photo
   - Call `updateWorkerRoleWithDate` and `updateWorkerPhoto` on save
3. **MarkingPage.tsx**:
   - Filter STATUS_OPTIONS to only `present` and `absent`
   - Remove leaveCount, halfDayCount from summary counts
   - Update summary grid from 5 columns to 3 (Present, Absent, Unmarked)
   - Update text summary line to exclude On Leave / Half Day
   - Filter workers to only those with joiningDate <= today
4. **AttendancePage.tsx**:
   - Filter workers list to only joiningDate <= today before rendering grid
   - Remove 'L' and 'HD' from legend
   - Remove leave/halfday from summary strip and period report stats grid and bar
   - Remove onLeave/halfDay segments from proportional bar
5. **DashboardPage.tsx**:
   - Remove "On Leave" and "Half Day" from stats array
   - Remove "Half Day" StatusBadge
   - Make "Total Workers" card clickable, add dialog showing all workers list
   - Update filterLabel map to remove halfDay/onLeave entries
   - Remove halfday/leave from todayLeave/todayHalfDay computations
