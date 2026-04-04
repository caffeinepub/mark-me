import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Calendar, DollarSign, TrendingUp, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  type AttendanceRecord,
  AttendanceStatus,
  type Worker,
} from "../backend";
import { WorkerAvatar } from "../pages/DashboardPage";

interface WorkerDetailsModalProps {
  worker: Worker;
  records: AttendanceRecord[];
  onClose: () => void;
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

export default function WorkerDetailsModal({
  worker,
  records,
  onClose,
}: WorkerDetailsModalProps) {
  const [dailyWage, setDailyWage] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const stats = useMemo(() => {
    const joinDate = new Date(`${worker.joiningDate}T00:00:00`);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Total working days since joining (all time)
    const totalWorkingDays = countWeekdays(joinDate, now);

    // Filter to current month only for present/absent/halfday counts
    const monthRecords = records.filter((r) => {
      const d = new Date(`${r.date}T00:00:00`);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
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
    const effectivePresentDays = presentDays + halfDays * 0.5;
    return {
      totalWorkingDays,
      presentDays,
      halfDays,
      absentDays,
      effectivePresentDays,
    };
  }, [worker, records]);

  const todayRecord = records.find((r) => r.date === today);
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-ocid="worker.dialog">
        <DialogHeader>
          <DialogTitle className="sr-only">Worker Details</DialogTitle>
        </DialogHeader>

        {/* Profile section */}
        <div className="flex flex-col items-center gap-3 pt-2 pb-4 border-b border-border">
          <WorkerAvatar name={worker.name} photo={worker.photo} size="lg" />
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">{worker.name}</h2>
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

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 py-4 border-b border-border">
          <StatCard label="Working Days" value={stats.totalWorkingDays} />
          <StatCard
            label="Present (This Month)"
            value={stats.presentDays}
            highlight="text-status-present"
          />
          <StatCard
            label="Absent (This Month)"
            value={stats.absentDays}
            highlight="text-status-absent"
          />
        </div>

        {/* Wage calculator */}
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <DollarSign className="w-4 h-4 text-primary" />
            Wage Calculator
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
  );
}

function StatCard({
  label,
  value,
  highlight,
}: { label: string; value: number; highlight?: string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
      <span className={`text-2xl font-bold ${highlight ?? "text-foreground"}`}>
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground text-center mt-0.5">
        {label}
      </span>
    </div>
  );
}
