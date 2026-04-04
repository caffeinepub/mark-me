import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  type AttendanceRecord,
  AttendanceStatus,
  type Worker,
} from "../backend";
import { WorkerAvatar } from "../pages/DashboardPage";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface WorkerDetailsModalProps {
  worker: Worker;
  records: AttendanceRecord[];
  onClose: () => void;
  onDelete?: () => void;
}

function countWeekdays(start: Date, end: Date): number {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// Stable "today" values computed once at module level per render cycle
function getTodayInfo() {
  const d = new Date();
  return {
    month: d.getMonth(),
    year: d.getFullYear(),
    dateStr: d.toISOString().split("T")[0],
    date: d,
  };
}

export default function WorkerDetailsModal({
  worker,
  records,
  onClose,
  onDelete,
}: WorkerDetailsModalProps) {
  const [dailyWage, setDailyWage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const todayInfo = useMemo(() => getTodayInfo(), []);

  const [selectedMonth, setSelectedMonth] = useState(todayInfo.month);
  const [selectedYear, setSelectedYear] = useState(todayInfo.year);

  const isCurrentMonth =
    selectedMonth === todayInfo.month && selectedYear === todayInfo.year;

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const stats = useMemo(() => {
    const joinDate = new Date(`${worker.joiningDate}T00:00:00`);
    const now = new Date();

    // Total working days since joining (all time)
    const totalWorkingDays = countWeekdays(joinDate, now);

    // Filter to selected month/year
    const monthRecords = records.filter((r) => {
      const d = new Date(`${r.date}T00:00:00`);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const presentDays = monthRecords.filter(
      (r) => r.status === AttendanceStatus.present,
    ).length;
    const halfDays = monthRecords.filter(
      (r) => r.status === AttendanceStatus.halfDay,
    ).length;
    const absentDays = monthRecords.filter(
      (r) => r.status === AttendanceStatus.absent,
    ).length;
    const leaveDays = monthRecords.filter(
      (r) => r.status === AttendanceStatus.onLeave,
    ).length;
    const effectivePresentDays = presentDays + halfDays * 0.5;
    return {
      totalWorkingDays,
      presentDays,
      halfDays,
      absentDays,
      leaveDays,
      effectivePresentDays,
    };
  }, [worker, records, selectedMonth, selectedYear]);

  const todayRecord = records.find((r) => r.date === todayInfo.dateStr);
  const wage = Number.parseFloat(dailyWage) || 0;
  const totalWage = stats.effectivePresentDays * wage;

  const statusBadgeProps: Record<
    AttendanceStatus,
    { label: string; cls: string }
  > = {
    [AttendanceStatus.present]: {
      label: "Present",
      cls: "bg-status-present text-status-present-fg",
    },
    [AttendanceStatus.absent]: {
      label: "Absent",
      cls: "bg-status-absent text-status-absent-fg",
    },
    [AttendanceStatus.onLeave]: {
      label: "On Leave",
      cls: "bg-status-leave text-status-leave-fg",
    },
    [AttendanceStatus.halfDay]: {
      label: "Half Day",
      cls: "bg-status-halfday text-status-halfday-fg",
    },
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md" data-ocid="worker.dialog">
          <DialogHeader>
            <DialogTitle className="sr-only">Worker Details</DialogTitle>
          </DialogHeader>

          {/* Profile section */}
          <div className="flex flex-col items-center gap-3 pt-2 pb-4 border-b border-border">
            <WorkerAvatar name={worker.name} photo={worker.photo} size="lg" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">
                {worker.name}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-0.5">
                <Briefcase className="w-3.5 h-3.5" />
                {worker.role}
              </p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
                <Calendar className="w-3 h-3" />
                Joined{" "}
                {new Date(`${worker.joiningDate}T00:00:00`).toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "long", day: "numeric" },
                )}
              </p>
            </div>

            {/* Today's status */}
            {todayRecord ? (
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadgeProps[todayRecord.status].cls}`}
              >
                Today: {statusBadgeProps[todayRecord.status].label}
              </div>
            ) : (
              <Badge variant="outline" className="text-xs">
                Today: Not Marked
              </Badge>
            )}
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between py-2 border-b border-border">
            <button
              type="button"
              onClick={handlePrevMonth}
              data-ocid="worker.pagination_prev"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              data-ocid="worker.pagination_next"
              className={`p-1.5 rounded-md transition-colors ${
                isCurrentMonth
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              aria-label="Next month"
              disabled={isCurrentMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Stats grid — 4 cards for selected month */}
          <div className="grid grid-cols-2 gap-2.5 py-3 border-b border-border">
            <StatCard
              label="Present"
              value={stats.presentDays}
              highlight="text-status-present"
              bg="bg-status-present/10"
              border="border-status-present/20"
            />
            <StatCard
              label="Absent"
              value={stats.absentDays}
              highlight="text-status-absent"
              bg="bg-status-absent/10"
              border="border-status-absent/20"
            />
            <StatCard
              label="On Leave"
              value={stats.leaveDays}
              highlight="text-status-leave"
              bg="bg-status-leave/10"
              border="border-status-leave/20"
            />
            <StatCard
              label="Half Day"
              value={stats.halfDays}
              highlight="text-status-halfday"
              bg="bg-status-halfday/10"
              border="border-status-halfday/20"
            />
          </div>

          {/* Wage calculator */}
          <div className="py-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <DollarSign className="w-4 h-4 text-primary" />
              Wage Calculator
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({MONTH_NAMES[selectedMonth]})
              </span>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="daily-wage"
                className="text-xs text-muted-foreground"
              >
                Daily Wage ($)
              </Label>
              <Input
                id="daily-wage"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter daily wage..."
                value={dailyWage}
                onChange={(e) => setDailyWage(e.target.value)}
                data-ocid="worker.input"
              />
            </div>
            {wage > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm">
                  <span className="font-medium text-foreground">
                    {stats.effectivePresentDays} days
                  </span>
                  <span className="text-muted-foreground mx-1">×</span>
                  <span className="font-medium text-foreground">
                    ${wage.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground mx-1">=</span>
                  <span className="font-bold text-primary">
                    ${totalWage.toFixed(2)}
                  </span>
                </p>
              </motion.div>
            )}
          </div>

          {/* Delete Worker button */}
          {onDelete && (
            <div className="pt-1 border-t border-border">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                data-ocid="worker.delete_button"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-destructive/40 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors duration-150"
              >
                <Trash2 className="w-4 h-4" />
                Delete Worker
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            data-ocid="worker.close_button"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation alert dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-ocid="worker.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{worker.name}</strong>?
              This will remove all their attendance data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="worker.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="worker.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setShowDeleteDialog(false);
                onDelete?.();
                onClose();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StatCard({
  label,
  value,
  highlight,
  bg,
  border,
}: {
  label: string;
  value: number;
  highlight?: string;
  bg?: string;
  border?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center p-3 rounded-lg border ${
        bg ?? "bg-muted/50"
      } ${border ?? "border-border"}`}
    >
      <span className={`text-2xl font-bold ${highlight ?? "text-foreground"}`}>
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground text-center mt-0.5">
        {label}
      </span>
    </div>
  );
}
