import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  CheckSquare,
  ClipboardCheck,
  Clock,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { AttendanceStatus } from "../backend";
import { useAllAttendanceRecords, useWorkers } from "../hooks/useQueries";

type Page = "dashboard" | "attendance" | "marking" | "add-worker";

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
}

type FilterCategory = AttendanceStatus | "unmarked" | "total";

function buildLatestStatusMap(
  records: {
    workerId: bigint;
    date: string;
    status: AttendanceStatus;
    timestamp: bigint;
  }[],
  date: string,
): Map<string, AttendanceStatus> {
  const latestTimestamp = new Map<string, bigint>();
  const latestStatus = new Map<string, AttendanceStatus>();

  for (const r of records) {
    if (r.date !== date) continue;
    const key = r.workerId.toString();
    const prev = latestTimestamp.get(key);
    if (prev === undefined || r.timestamp > prev) {
      latestTimestamp.set(key, r.timestamp);
      latestStatus.set(key, r.status);
    }
  }

  return latestStatus;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { data: workers = [], isLoading: workersLoading } = useWorkers();
  const { data: records = [], isLoading: recordsLoading } =
    useAllAttendanceRecords();
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory | null>(
    null,
  );

  const today = new Date().toISOString().split("T")[0];

  const todayStatusMap = useMemo(
    () => buildLatestStatusMap(records, today),
    [records, today],
  );

  const todayPresent = useMemo(
    () =>
      [...todayStatusMap.values()].filter((s) => s === AttendanceStatus.present)
        .length,
    [todayStatusMap],
  );
  const todayAbsent = useMemo(
    () =>
      [...todayStatusMap.values()].filter((s) => s === AttendanceStatus.absent)
        .length,
    [todayStatusMap],
  );
  const unmarked = Math.max(0, workers.length - todayStatusMap.size);

  const isLoading = workersLoading || recordsLoading;

  const stats = [
    {
      label: "Total Workers",
      value: workers.length,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      filter: "total" as FilterCategory,
    },
    {
      label: "Present Today",
      value: todayPresent,
      icon: CheckSquare,
      color: "text-status-present",
      bg: "bg-status-present/10",
      filter: AttendanceStatus.present as FilterCategory,
    },
    {
      label: "Absent Today",
      value: todayAbsent,
      icon: AlertCircle,
      color: "text-status-absent",
      bg: "bg-status-absent/10",
      filter: AttendanceStatus.absent as FilterCategory,
    },
    {
      label: "Unmarked Today",
      value: unmarked,
      icon: Clock,
      color: "text-status-unmarked-fg",
      bg: "bg-status-unmarked/80",
      filter: "unmarked" as FilterCategory,
    },
  ];

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const filteredWorkers = useMemo(() => {
    if (selectedFilter === null) return [];
    if (selectedFilter === "total") return workers;
    if (selectedFilter === "unmarked") {
      return workers.filter((w) => !todayStatusMap.has(w.id.toString()));
    }
    return workers.filter(
      (w) => todayStatusMap.get(w.id.toString()) === selectedFilter,
    );
  }, [selectedFilter, workers, todayStatusMap]);

  const filterLabel = (() => {
    if (selectedFilter === null) return "";
    if (selectedFilter === "total") return "All Workers";
    if (selectedFilter === "unmarked") return "Unmarked Workers";
    const labelMap: Partial<Record<AttendanceStatus, string>> = {
      [AttendanceStatus.present]: "Present Workers",
      [AttendanceStatus.absent]: "Absent Workers",
    };
    return labelMap[selectedFilter as AttendanceStatus] ?? "Workers";
  })();

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">{dateStr}</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.07 }}
          >
            <Card
              className="shadow-card border-border transition-all duration-150 cursor-pointer hover:shadow-md hover:border-primary/30"
              onClick={() => setSelectedFilter(stat.filter)}
              data-ocid={`dashboard.${stat.filter}.card`}
            >
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg mb-3 ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                {isLoading ? (
                  <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today's summary badges — Present, Absent, Unmarked only */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="shadow-card border-border">
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-3">
              <StatusBadge
                label="Present"
                count={todayPresent}
                color="bg-status-present text-status-present-fg"
                onClick={() => setSelectedFilter(AttendanceStatus.present)}
                data-ocid="dashboard.present.button"
              />
              <StatusBadge
                label="Absent"
                count={todayAbsent}
                color="bg-status-absent text-status-absent-fg"
                onClick={() => setSelectedFilter(AttendanceStatus.absent)}
                data-ocid="dashboard.absent.button"
              />
              <StatusBadge
                label="Unmarked"
                count={unmarked}
                color="bg-status-unmarked text-status-unmarked-fg"
                onClick={() => setSelectedFilter("unmarked")}
                data-ocid="dashboard.unmarked.button"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              onClick={() => onNavigate("marking")}
              data-ocid="dashboard.marking.button"
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Mark Attendance
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate("attendance")}
              data-ocid="dashboard.attendance.button"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Register
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate("add-worker")}
              data-ocid="dashboard.add_worker.button"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Worker
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Workers list */}
      {workers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="shadow-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Workers ({workers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workers.slice(0, 5).map((worker, idx) => {
                  const todayStatus = todayStatusMap.get(worker.id.toString());
                  return (
                    <div
                      key={worker.id.toString()}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      data-ocid={`workers.item.${idx + 1}`}
                    >
                      <div className="flex items-center gap-3">
                        <WorkerAvatar
                          name={worker.name}
                          photo={worker.photo}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {worker.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {worker.role}
                          </p>
                        </div>
                      </div>
                      {todayStatus ? (
                        <StatusChip status={todayStatus} />
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-status-unmarked text-status-unmarked-fg">
                          Unmarked
                        </span>
                      )}
                    </div>
                  );
                })}
                {workers.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{workers.length - 5} more workers
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Workers filter/list dialog */}
      <Dialog
        open={selectedFilter !== null}
        onOpenChange={(open) => !open && setSelectedFilter(null)}
      >
        <DialogContent className="max-w-sm" data-ocid="dashboard.filter.dialog">
          <DialogHeader>
            <DialogTitle>{filterLabel}</DialogTitle>
          </DialogHeader>
          {filteredWorkers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No workers in this category today.
            </p>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="space-y-2 pr-2">
                {filteredWorkers.map((worker, idx) => (
                  <div
                    key={worker.id.toString()}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border border-border"
                    data-ocid={`dashboard.filter.item.${idx + 1}`}
                  >
                    <WorkerAvatar
                      name={worker.name}
                      photo={worker.photo}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {worker.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {worker.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({
  label,
  count,
  color,
  onClick,
  "data-ocid": dataOcid,
}: {
  label: string;
  count: number;
  color: string;
  onClick?: () => void;
  "data-ocid"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid={dataOcid}
      className={`flex flex-col items-center justify-center p-3 rounded-lg ${color} w-full transition-all duration-150 hover:opacity-90 hover:scale-[1.02] cursor-pointer`}
    >
      <span className="text-2xl font-bold">{count}</span>
      <span className="text-xs font-medium mt-0.5">{label}</span>
    </button>
  );
}

function StatusChip({ status }: { status: AttendanceStatus }) {
  const map: Partial<Record<AttendanceStatus, { label: string; cls: string }>> =
    {
      [AttendanceStatus.present]: {
        label: "Present",
        cls: "bg-status-present text-status-present-fg",
      },
      [AttendanceStatus.absent]: {
        label: "Absent",
        cls: "bg-status-absent text-status-absent-fg",
      },
    };
  const entry = map[status];
  if (!entry) return null;
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entry.cls}`}
    >
      {entry.label}
    </span>
  );
}

export function WorkerAvatar({
  name,
  photo,
  size = "md",
}: { name: string; photo?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
  };
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
  ];
  const colorIdx = name.charCodeAt(0) % colors.length;

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses[size]} ${colors[colorIdx]} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
    >
      {initials}
    </div>
  );
}
