import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type AttendanceRecord,
  AttendanceStatus,
  type Worker,
} from "../backend";
import WorkerDetailsModal from "../components/WorkerDetailsModal";
import { useIsMobile } from "../hooks/use-mobile";
import {
  useAllAttendanceRecords,
  useDeleteWorker,
  useMarkAttendance,
  useWorkers,
} from "../hooks/useQueries";
import { cn } from "../lib/utils";
import { WorkerAvatar } from "./DashboardPage";

function getWeekDates(referenceDate: Date): Date[] {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

function getMonthDates(year: number, month: number): Date[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from(
    { length: daysInMonth },
    (_, i) => new Date(year, month, i + 1),
  );
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

type CellStatus = AttendanceStatus | null;

function buildAttendanceMap(
  records: {
    workerId: bigint;
    date: string;
    status: AttendanceStatus;
    timestamp: bigint;
  }[],
): Map<string, AttendanceStatus> {
  const latestTimestamp = new Map<string, bigint>();
  const result = new Map<string, AttendanceStatus>();

  for (const r of records) {
    const key = `${r.workerId}-${r.date}`;
    const prev = latestTimestamp.get(key);
    if (prev === undefined || r.timestamp > prev) {
      latestTimestamp.set(key, r.timestamp);
      result.set(key, r.status);
    }
  }

  return result;
}

function StatusCell({ status }: { status: CellStatus }) {
  if (!status) {
    return (
      <div className="w-8 h-8 rounded-md bg-status-unmarked flex items-center justify-center mx-auto">
        <span className="text-[10px] font-semibold text-status-unmarked-fg">
          —
        </span>
      </div>
    );
  }
  // Only show Present and Absent with distinct colors; other statuses show as unmarked
  const map: Partial<Record<AttendanceStatus, { abbr: string; cls: string }>> =
    {
      [AttendanceStatus.present]: {
        abbr: "P",
        cls: "bg-status-present text-status-present-fg",
      },
      [AttendanceStatus.absent]: {
        abbr: "A",
        cls: "bg-status-absent text-status-absent-fg",
      },
    };
  const entry = map[status];
  if (!entry) {
    return (
      <div className="w-8 h-8 rounded-md bg-status-unmarked flex items-center justify-center mx-auto">
        <span className="text-[10px] font-semibold text-status-unmarked-fg">
          —
        </span>
      </div>
    );
  }
  return (
    <div
      className={`w-8 h-8 rounded-md ${entry.cls} flex items-center justify-center mx-auto`}
    >
      <span className="text-[10px] font-bold">{entry.abbr}</span>
    </div>
  );
}

export default function AttendancePage() {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"week" | "month">(
    isMobile ? "week" : "month",
  );
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [searchDate, setSearchDate] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const [istTime, setIstTime] = useState(() => {
    return new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  });

  useEffect(() => {
    const tick = () => {
      setIstTime(
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
    };
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: workers = [], isLoading: workersLoading } = useWorkers();
  const { data: records = [], isLoading: recordsLoading } =
    useAllAttendanceRecords();
  const deleteWorker = useDeleteWorker();
  const markAttendance = useMarkAttendance();

  const isLoading = workersLoading || recordsLoading;

  const today = new Date().toISOString().split("T")[0];

  // Only show workers whose joining date is today or in the past
  const eligibleWorkers = useMemo(() => {
    return workers.filter((w) => w.joiningDate <= today);
  }, [workers, today]);

  const dates = useMemo(() => {
    if (viewMode === "week") {
      return getWeekDates(referenceDate);
    }
    return getMonthDates(referenceDate.getFullYear(), referenceDate.getMonth());
  }, [referenceDate, viewMode]);

  const attendanceMap = useMemo(() => buildAttendanceMap(records), [records]);

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    for (const d of dates) {
      const dateStr = toISO(d);
      for (const w of eligibleWorkers) {
        const status = attendanceMap.get(`${w.id}-${dateStr}`);
        if (status === AttendanceStatus.present) present++;
        else if (status === AttendanceStatus.absent) absent++;
      }
    }
    return { present, absent };
  }, [dates, eligibleWorkers, attendanceMap]);

  const periodReport = useMemo(() => {
    let present = 0;
    let absent = 0;

    for (const d of dates) {
      const dateStr = toISO(d);
      for (const w of eligibleWorkers) {
        const status = attendanceMap.get(`${w.id}-${dateStr}`);
        if (status === AttendanceStatus.present) present++;
        else if (status === AttendanceStatus.absent) absent++;
      }
    }

    const totalSlots = eligibleWorkers.length * dates.length;
    const marked = present + absent;
    const totalWorkers = eligibleWorkers.length;

    const todayStr = new Date().toISOString().split("T")[0];
    const markedTodayCount = eligibleWorkers.filter((w) =>
      attendanceMap.has(`${w.id}-${todayStr}`),
    ).length;
    const todayUnmarked = Math.max(
      0,
      eligibleWorkers.length - markedTodayCount,
    );

    return {
      present,
      absent,
      unmarked: todayUnmarked,
      totalSlots,
      marked,
      totalWorkers,
    };
  }, [dates, eligibleWorkers, attendanceMap]);

  const handlePrev = () => {
    const d = new Date(referenceDate);
    if (viewMode === "week") {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setReferenceDate(d);
  };

  const handleNext = () => {
    const d = new Date(referenceDate);
    if (viewMode === "week") {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setReferenceDate(d);
  };

  const handleSearchDate = (val: string) => {
    setSearchDate(val);
    if (val) {
      setReferenceDate(new Date(`${val}T00:00:00`));
    }
  };

  const periodLabel =
    viewMode === "week"
      ? (() => {
          const start = dates[0];
          const end = dates[dates.length - 1];
          return `${start.getDate()} ${MONTH_NAMES[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
        })()
      : `${MONTH_NAMES[referenceDate.getMonth()]} ${referenceDate.getFullYear()}`;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Attendance Register
          </h1>
          <p className="text-sm text-muted-foreground">
            {viewMode === "week"
              ? "Weekly view — navigate with the arrows"
              : "Monthly view — full month at a glance"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {istTime} IST
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="date"
            value={searchDate}
            onChange={(e) => handleSearchDate(e.target.value)}
            className="pl-8 h-9 w-full sm:w-44"
            data-ocid="attendance.search_input"
          />
        </div>
      </div>

      <Card className="shadow-card border-border overflow-hidden">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4 flex-wrap">
          {/* Navigation + Week/Month toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="h-8 w-8"
              data-ocid="attendance.pagination_prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground min-w-40 text-center">
              {periodLabel}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-8 w-8"
              data-ocid="attendance.pagination_next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 ml-1">
              <Button
                size="sm"
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
                className="h-8 px-3 text-xs"
                data-ocid="attendance.week.toggle"
              >
                Week
              </Button>
              <Button
                size="sm"
                variant={viewMode === "month" ? "default" : "outline"}
                onClick={() => setViewMode("month")}
                className="h-8 px-3 text-xs"
                data-ocid="attendance.month.toggle"
              >
                Month
              </Button>
            </div>
          </div>

          {/* Legend — only P and A */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: "P", cls: "bg-status-present text-status-present-fg" },
              { label: "A", cls: "bg-status-absent text-status-absent-fg" },
              { label: "–", cls: "bg-status-unmarked text-status-unmarked-fg" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div
                  className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${item.cls}`}
                >
                  {item.label}
                </div>
              </div>
            ))}
            <span className="text-[10px] text-muted-foreground">
              P=Present A=Absent
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3" data-ocid="attendance.loading_state">
              {["s1", "s2", "s3", "s4", "s5"].map((key) => (
                <Skeleton key={key} className="h-10 w-full" />
              ))}
            </div>
          ) : eligibleWorkers.length === 0 ? (
            <div
              className="p-12 text-center"
              data-ocid="attendance.empty_state"
            >
              <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {workers.length === 0
                  ? "No workers found. Add workers to see the attendance grid."
                  : "No workers have joined yet. Workers appear here on their joining date."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[400px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 z-10 bg-card text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground min-w-[160px] border-r border-border">
                      Worker
                    </th>
                    {dates.map((d) => (
                      <th
                        key={toISO(d)}
                        className="px-1 py-2 text-center min-w-[42px]"
                      >
                        <div className="text-[9px] font-medium text-muted-foreground">
                          {DAY_ABBR[d.getDay()]}
                        </div>
                        <div className="text-xs font-bold text-foreground">
                          {d.getDate()}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eligibleWorkers.map((worker, idx) => (
                    <tr
                      key={worker.id.toString()}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                      data-ocid={`attendance.item.${idx + 1}`}
                    >
                      <td className="sticky left-0 z-10 bg-card hover:bg-accent/30 px-3 py-2 border-r border-border">
                        <div className="flex items-center gap-1.5">
                          <WorkerAvatar
                            name={worker.name}
                            photo={worker.photo}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedWorker(worker)}
                              data-ocid="attendance.worker.button"
                              className="text-sm font-medium text-primary hover:underline text-left block truncate max-w-[90px]"
                            >
                              {worker.name}
                            </button>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[90px]">
                              {worker.role}
                            </p>
                            {/* Inline attendance quick-mark buttons — only for today */}
                            <div className="flex items-center gap-1 mt-1">
                              {[
                                {
                                  status: AttendanceStatus.present,
                                  label: "P",
                                  activeBg: "bg-status-present",
                                  activeText: "text-status-present-fg",
                                },
                                {
                                  status: AttendanceStatus.absent,
                                  label: "A",
                                  activeBg: "bg-status-absent",
                                  activeText: "text-status-absent-fg",
                                },
                              ].map((opt) => {
                                const todayAttendanceStatus =
                                  attendanceMap.get(`${worker.id}-${today}`) ??
                                  null;
                                const isActive =
                                  todayAttendanceStatus === opt.status;
                                return (
                                  <button
                                    key={opt.status}
                                    type="button"
                                    onClick={() => {
                                      if (isActive) return;
                                      markAttendance.mutate(
                                        {
                                          workerId: worker.id,
                                          status: opt.status,
                                          date: today,
                                        },
                                        {
                                          onSuccess: () =>
                                            toast.success(
                                              `${worker.name} marked ${
                                                opt.label === "P"
                                                  ? "Present"
                                                  : "Absent"
                                              }`,
                                            ),
                                          onError: () =>
                                            toast.error(
                                              "Failed to mark attendance",
                                            ),
                                        },
                                      );
                                    }}
                                    disabled={markAttendance.isPending}
                                    className={cn(
                                      "text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors duration-150",
                                      isActive
                                        ? cn(opt.activeBg, opt.activeText)
                                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                                    )}
                                    title={
                                      opt.label === "P"
                                        ? "Mark Present"
                                        : "Mark Absent"
                                    }
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      {dates.map((d) => {
                        const dateStr = toISO(d);
                        const status =
                          attendanceMap.get(`${worker.id}-${dateStr}`) ?? null;
                        return (
                          <td key={dateStr} className="px-1 py-2 text-center">
                            <StatusCell status={status} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary strip — Present and Absent only */}
          {!isLoading && eligibleWorkers.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-3 border-t border-border bg-muted/40 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground">
                Period Summary:
              </span>
              <span className="text-xs font-semibold text-status-present">
                ● Present: {summary.present}
              </span>
              <span className="text-xs font-semibold text-status-absent">
                ● Absent: {summary.absent}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Period Attendance Summary */}
      {!isLoading && eligibleWorkers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          data-ocid="attendance.report.card"
        >
          <Card className="shadow-card border-border overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h2 className="text-base font-bold text-foreground">
                  Period Attendance Summary
                </h2>
                <span className="text-xs text-muted-foreground">
                  {periodLabel}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Proportional bar — Present and Absent only */}
              {periodReport.totalSlots > 0 && (
                <div
                  className="w-full h-6 rounded-full overflow-hidden flex"
                  role="img"
                  aria-label="Period attendance distribution"
                >
                  {periodReport.present > 0 && (
                    <div
                      className="bg-status-present h-full transition-all"
                      style={{
                        width: `${
                          (periodReport.present / periodReport.totalSlots) * 100
                        }%`,
                      }}
                      title={`Present: ${periodReport.present}`}
                    />
                  )}
                  {periodReport.absent > 0 && (
                    <div
                      className="bg-status-absent h-full transition-all"
                      style={{
                        width: `${
                          (periodReport.absent / periodReport.totalSlots) * 100
                        }%`,
                      }}
                      title={`Absent: ${periodReport.absent}`}
                    />
                  )}
                  {periodReport.unmarked > 0 && (
                    <div
                      className="bg-status-unmarked h-full transition-all flex-1"
                      title={`Unmarked today: ${periodReport.unmarked}`}
                    />
                  )}
                </div>
              )}

              {/* Stats grid — Present, Absent, Unmarked Today */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-3 rounded-lg bg-status-present/10 border border-status-present/20">
                  <span className="text-2xl font-bold text-status-present">
                    {periodReport.present}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    Present
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-status-absent/10 border border-status-absent/20">
                  <span className="text-2xl font-bold text-status-absent">
                    {periodReport.absent}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    Absent
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {periodReport.unmarked}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    Unmarked Today
                  </span>
                </div>
              </div>

              {/* Summary footer */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground border-t border-border">
                <span>
                  Workers:{" "}
                  <strong className="text-foreground">
                    {periodReport.totalWorkers}
                  </strong>
                </span>
                <span>
                  Total slots:{" "}
                  <strong className="text-foreground">
                    {periodReport.totalSlots}
                  </strong>
                </span>
                <span>
                  Marked:{" "}
                  <strong className="text-foreground">
                    {periodReport.marked}
                  </strong>
                </span>
                <span>
                  Coverage:{" "}
                  <strong className="text-foreground">
                    {periodReport.totalSlots > 0
                      ? Math.round(
                          (periodReport.marked / periodReport.totalSlots) * 100,
                        )
                      : 0}
                    %
                  </strong>
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Worker Details Modal — always opens on click */}
      {selectedWorker && (
        <WorkerDetailsModal
          worker={selectedWorker}
          records={(records as AttendanceRecord[]).filter(
            (r) => r.workerId === selectedWorker.id,
          )}
          onClose={() => setSelectedWorker(null)}
          onDelete={() => {
            deleteWorker.mutate(selectedWorker.id, {
              onSuccess: () => {
                toast.success(`${selectedWorker.name} has been deleted.`);
                setSelectedWorker(null);
              },
              onError: () => {
                toast.error(`Failed to delete ${selectedWorker.name}.`);
              },
            });
          }}
        />
      )}
    </div>
  );
}
