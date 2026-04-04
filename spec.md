# Mark Me

## Current State
- Full-stack attendance management app with Motoko backend and React frontend
- AttendancePage: auto-switches between weekly (mobile) and monthly (desktop) view based on screen size
- MarkingPage: worker cards with 4 status buttons; clicking any marks attendance (including re-clicking same status, creating duplicate records)
- DashboardPage: shows today's summary stats
- WorkerDetailsModal: shows total present days from ALL records (not scoped to current month)
- No explicit daily attendance report section
- No view-toggle control on the AttendancePage (view is determined solely by isMobile)

## Requested Changes (Diff)

### Add
- Daily Attendance Report panel on AttendancePage: analyze current attendance state for today (present, absent, on leave, half day, unmarked) across all workers and display a clear summary card
- Monthly view toggle button next to the week prev/next navigation controls so user can manually switch between weekly and monthly view regardless of device
- Monthly present count reset in WorkerDetailsModal: the "Present" stat shown in the worker details should reflect only the current calendar month, not all-time

### Modify
- Marking logic: at a time, only ONE status can be selected per worker per day. If the user clicks the already-active status, it should be a no-op (or deselect). If they click a different status, it replaces the previous one. Backend already supports overwriting by date — frontend needs to prevent duplicate submissions and show the correct active state
- AttendancePage view control: decouple view mode (week/month) from isMobile. Add a "Week" / "Month" toggle button. Default to weekly on mobile, monthly on desktop, but allow manual override

### Remove
- Nothing removed

## Implementation Plan
1. **AttendancePage**
   - Add `viewMode` state ('week' | 'month'), defaulting to isMobile ? 'week' : 'month'
   - Add toggle buttons (Week / Month) next to the navigation arrows
   - Compute dates based on viewMode instead of isMobile
   - Add a "Today's Attendance Report" card below the grid showing present/absent/leave/halfday/unmarked counts for today

2. **MarkingPage**
   - In handleMark: if the worker already has todayStatus === clicked status, do nothing (no re-mark)
   - This enforces single-select: only one status active at a time

3. **WorkerDetailsModal**
   - Scope presentDays, halfDays, absentDays counts to current calendar month only (filter records by current month/year)
   - Show month label next to the stat so user knows it's monthly
   - Keep totalWorkingDays since joining unchanged
