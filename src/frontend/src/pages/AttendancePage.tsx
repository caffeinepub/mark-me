import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  type AttendanceRecord,
  AttendanceStatus,
  type Worker,
} from "../backend";
import WorkerDetailsModal from "../components/WorkerDetailsModal";
import { useIsMobile } from "../hooks/use-mobile";
import { useAllAttendanceRecords, useWorkers } from "../hooks/useQueries";

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
  const map: Record<AttendanceStatus, { abbr: string; cls: string }> = {
    [AttendanceStatus.present]: {
      abbr: "P",
      cls: "bg-status-present text-status-present-fg",
    },
    [AttendanceStatus.absent]: {
      abbr: "A",
      cls: "bg-status-absent text-status-absent-fg",
    },
    [AttendanceStatus.onLeave]: {
      abbr: "L",
      cls: "bg-status-leave text-status-leave-fg",
    },
    [AttendanceStatus.halfDay]: {
      abbr: "HD",
      cls: "bg-status-halfday text-status-halfday-fg",
    },
  };
  const { abbr, cls } = map[status];
  return (
    <div
      className={`w-8 h-8 rounded-md ${cls} flex items-center justify-center mx-auto`}
    >
      <span className="text-[10px] font-bold">{abbr}</span>
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

  const { data: workers = [], isLoading: workersLoading } = useWorkers();
  const { data: records = [], isLoading: recordsLoading } =
    useAllAttendanceRecords();

  const isLoading = workersLoading || recordsLoading;

  const dates = useMemo(() => {
    if (viewMode === "week") {
      return getWeekDates(referenceDate);
    }
    return getMonthDates(referenceDate.getFullYear(), referenceDate.getMonth());
  }, [referenceDate, viewMode]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    for (const r of records) {
      map.set(`${r.workerId}-${r.date}`, r.status);
    }
    return map;
  }, [records]);

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let halfday = 0;
    for (const d of dates) {
      const dateStr = toISO(d);
      for (const w of workers) {
        const status = attendanceMap.get(`${w.id}-${dateStr}`);
        if (status === AttendanceStatus.present) present++;
        else if (status === AttendanceStatus.absent) absent++;
        else if (status === AttendanceStatus.onLeave) leave++;
        else if (status === AttendanceStatus.halfDay) halfday++;
      }
    }
    return { present, absent, leave, halfday };
  }, [dates, workers, attendanceMap]);

  // Daily attendance report data
  const todayReport = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRecords = records.filter((r) => r.date === todayStr);
    const present = todayRecords.filter(
      (r) => r.status === AttendanceStatus.present,
    ).length;
    const absent = todayRecords.filter(
      (r) => r.status === AttendanceStatus.absent,
    ).length;
    const onLeave = todayRecords.filter(
      (r) => r.status === AttendanceStatus.onLeave,
    ).length;
    const halfDay = todayRecords.filter(
      (r) => r.status === AttendanceStatus.halfDay,
    ).length;
    const totalWorkers = workers.length;
    // Count unique workers marked today
    const markedWorkerIds = new Set(
      todayRecords.map((r) => r.workerId.toString()),
    );
    const totalMarked = markedWorkerIds.size;
    const unmarked = totalWorkers - totalMarked;
    return {
      present,
      absent,
      onLeave,
      halfDay,
      unmarked,
      totalWorkers,
      totalMarked,
      todayStr,
    };
  }, [records, workers]);

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

  const todayDisplayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Attendance Register
          </h1>
          <p className="text-sm text-muted-foreground">
            {viewMode === "week" ? "Weekly" : "Monthly"} view
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="date"
              value={searchDate}
              onChange={(e) => handleSearchDate(e.target.value)}
              className="pl-8 h-9 text-sm w-44"
              data-ocid="attendance.search_input"
            />
          </div>
        </div>
      </div>

      {/* Attendance Grid card */}
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

          {/* Legend */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: "P", cls: "bg-status-present text-status-present-fg" },
              { label: "A", cls: "bg-status-absent text-status-absent-fg" },
              { label: "L", cls: "bg-status-leave text-status-leave-fg" },
              { label: "HD", cls: "bg-status-halfday text-status-halfday-fg" },
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
              P=Present A=Absent L=Leave HD=Half Day
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
          ) : workers.length === 0 ? (
            <div
              className="p-12 text-center"
              data-ocid="attendance.empty_state"
            >
              <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No workers found. Add workers to see the attendance grid.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[400px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 z-10 bg-card text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground min-w-[140px] border-r border-border">
                      Worker
                    </th>
                    {dates.map((d) => (
                      <th
                        key={toISO(d)}
                        className="px-1 py-2 text-center min-w-[42px]"
                      >
                        <div className="text-[10px] font-medium text-muted-foreground">
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
                  {workers.map((worker, idx) => (
                    <tr
                      key={worker.id.toString()}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                      data-ocid={`attendance.item.${idx + 1}`}
                    >
                      <td className="sticky left-0 z-10 bg-card hover:bg-accent/30 px-4 py-2 border-r border-border">
                        <button
                          type="button"
                          onClick={() => setSelectedWorker(worker)}
                          data-ocid="attendance.worker.button"
                          className="text-sm font-medium text-primary hover:underline text-left"
                        >
                          {worker.name}
                        </button>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[110px]">
                          {worker.role}
                        </p>
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

          {/* Summary strip */}
          {!isLoading && workers.length > 0 && (
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
              <span className="text-xs font-semibold text-status-leave">
                ● Leave: {summary.leave}
              </span>
              <span className="text-xs font-semibold text-status-halfday">
                ● Half Day: {summary.halfday}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Attendance Report */}
      {!isLoading && workers.length > 0 && (
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
                  Today's Attendance Report
                </h2>
                <span className="text-xs text-muted-foreground">
                  {todayDisplayStr}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Proportional bar */}
              {todayReport.totalWorkers > 0 && (
                <div
                  className="w-full h-6 rounded-full overflow-hidden flex"
                  role="img"
                  aria-label="Today's attendance distribution"
                >
                  {todayReport.present > 0 && (
                    <div
                      className="bg-status-present h-full transition-all"
                      style={{
                        width: `${(todayReport.present / todayReport.totalWorkers) * 100}%`,
                      }}
                      title={`Present: ${todayReport.present}`}
                    />
                  )}
                  {todayReport.absent > 0 && (
                    <div
                      className="bg-status-absent h-full transition-all"
                      style={{
                        width: `${(todayReport.absent / todayReport.totalWorkers) * 100}%`,
                      }}
                      title={`Absent: ${todayReport.absent}`}
                    />
                  )}
                  {todayReport.onLeave > 0 && (
                    <div
                      className="bg-status-leave h-full transition-all"
                      style={{
                        width: `${(todayReport.onLeave / todayReport.totalWorkers) * 100}%`,
                      }}
                      title={`On Leave: ${todayReport.onLeave}`}
                    />
                  )}
                  {todayReport.halfDay > 0 && (
                    <div
                      className="bg-status-halfday h-full transition-all"
                      style={{
                        width: `${(todayReport.halfDay / todayReport.totalWorkers) * 100}%`,
                      }}
                      title={`Half Day: ${todayReport.halfDay}`}
                    />
                  )}
                  {todayReport.unmarked > 0 && (
                    <div
                      className="bg-status-unmarked h-full transition-all flex-1"
                      title={`Unmarked: ${todayReport.unmarked}`}
                    />
                  )}
                </div>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="flex flex-col items-center p-3 rounded-lg bg-status-present/10 border border-status-present/20">
                  <span className="text-2xl font-bold text-status-present">
                    {todayReport.present}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    Present
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-status-absent/10 border border-status-absent/20">
                  <span className="text-2xl font-bold text-status-absent">
                    {todayReport.absent}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    Absent
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-status-leave/10 border border-status-leave/20">
                  <span className="text-2xl font-bold text-status-leave">
                    {todayReport.onLeave}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    On Leave
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-status-halfday/10 border border-status-halfday/20">
                  <span className="text-2xl font-bold text-status-halfday">
                    {todayReport.halfDay}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    Half Day
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 border border-border col-span-2 sm:col-span-1">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {todayReport.unmarked}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    Unmarked
                  </span>
                </div>
              </div>

              {/* Summary footer */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground border-t border-border">
                <span>
                  Total workers:{" "}
                  <strong className="text-foreground">
                    {todayReport.totalWorkers}
                  </strong>
                </span>
                <span>
                  Marked today:{" "}
                  <strong className="text-foreground">
                    {todayReport.totalMarked}
                  </strong>
                </span>
                <span>
                  Coverage:{" "}
                  <strong className="text-foreground">
                    {todayReport.totalWorkers > 0
                      ? Math.round(
                          (todayReport.totalMarked / todayReport.totalWorkers) *
                            100,
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

      {/* Worker Details Modal */}
      {selectedWorker && (
        <WorkerDetailsModal
          worker={selectedWorker}
          records={(records as AttendanceRecord[]).filter(
            (r) => r.workerId === selectedWorker.id,
          )}
          onClose={() => setSelectedWorker(null)}
        />
      )}
    </div>
  );
}
