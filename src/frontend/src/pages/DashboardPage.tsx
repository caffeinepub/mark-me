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
  CalendarCheck,
  CheckSquare,
  ClipboardCheck,
  Clock,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { AttendanceStatus } from "../backend";
import { useAllAttendanceRecords, useWorkers } from "../hooks/useQueries";

type Page = "dashboard" | "attendance" | "marking" | "add-worker";

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
}

type FilterCategory = AttendanceStatus | "unmarked";

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { data: workers = [], isLoading: workersLoading } = useWorkers();
  const { data: records = [], isLoading: recordsLoading } =
    useAllAttendanceRecords();
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory | null>(
    null,
  );

  const today = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r) => r.date === today);
  const todayPresent = todayRecords.filter(
    (r) => r.status === AttendanceStatus.present,
  ).length;
  const todayAbsent = todayRecords.filter(
    (r) => r.status === AttendanceStatus.absent,
  ).length;
  const todayLeave = todayRecords.filter(
    (r) => r.status === AttendanceStatus.onLeave,
  ).length;
  const todayHalfDay = todayRecords.filter(
    (r) => r.status === AttendanceStatus.halfDay,
  ).length;
  const unmarked = workers.length - todayRecords.length;

  const isLoading = workersLoading || recordsLoading;

  const stats = [
    {
      label: "Total Workers",
      value: workers.length,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      filter: null as FilterCategory | null,
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
      label: "On Leave",
      value: todayLeave,
      icon: CalendarCheck,
      color: "text-status-leave",
      bg: "bg-status-leave/10",
      filter: AttendanceStatus.onLeave as FilterCategory,
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

  // Compute the filtered workers list for the dialog
  const filteredWorkers = (() => {
    if (selectedFilter === null) return [];
    if (selectedFilter === "unmarked") {
      const markedIds = new Set(todayRecords.map((r) => r.workerId.toString()));
      return workers.filter((w) => !markedIds.has(w.id.toString()));
    }
    const matchingRecords = todayRecords.filter(
      (r) => r.status === selectedFilter,
    );
    const matchingIds = new Set(
      matchingRecords.map((r) => r.workerId.toString()),
    );
    return workers.filter((w) => matchingIds.has(w.id.toString()));
  })();

  const filterLabel = (() => {
    if (selectedFilter === null) return "";
    if (selectedFilter === "unmarked") return "Unmarked Workers";
    const labelMap: Record<AttendanceStatus, string> = {
      [AttendanceStatus.present]: "Present Workers",
      [AttendanceStatus.absent]: "Absent Workers",
      [AttendanceStatus.onLeave]: "On Leave Workers",
      [AttendanceStatus.halfDay]: "Half Day Workers",
    };
    return labelMap[selectedFilter];
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.07 }}
          >
            <Card
              className={`shadow-card border-border transition-all duration-150 ${
                stat.filter
                  ? "cursor-pointer hover:shadow-md hover:border-primary/30"
                  : ""
              }`}
              onClick={() => stat.filter && setSelectedFilter(stat.filter)}
              data-ocid={
                stat.filter
                  ? `dashboard.${stat.filter}.card`
                  : "dashboard.total.card"
              }
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

      {/* Today's summary badges */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="shadow-card border-border">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                label="On Leave"
                count={todayLeave}
                color="bg-status-leave text-status-leave-fg"
                onClick={() => setSelectedFilter(AttendanceStatus.onLeave)}
                data-ocid="dashboard.leave.button"
              />
              <StatusBadge
                label="Half Day"
                count={todayHalfDay}
                color="bg-status-halfday text-status-halfday-fg"
                onClick={() => setSelectedFilter(AttendanceStatus.halfDay)}
                data-ocid="dashboard.halfday.button"
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
                  const todayStatus = todayRecords.find(
                    (r) => r.workerId === worker.id,
                  )?.status;
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

      {/* Worker filter dialog */}
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
  const map: Record<AttendanceStatus, { label: string; cls: string }> = {
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
  const { label, cls } = map[status];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
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
