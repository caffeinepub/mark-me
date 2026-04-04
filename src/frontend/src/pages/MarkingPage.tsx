import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, Search } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AttendanceStatus, type Worker } from "../backend";
import {
  useAllAttendanceRecords,
  useMarkAttendance,
  useWorkers,
} from "../hooks/useQueries";
import { cn } from "../lib/utils";
import { WorkerAvatar } from "./DashboardPage";

const STATUS_OPTIONS: {
  status: AttendanceStatus;
  label: string;
  icon: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
}[] = [
  {
    status: AttendanceStatus.present,
    label: "Present",
    icon: "✓",
    activeBg: "bg-status-present",
    activeText: "text-status-present-fg",
    activeBorder: "border-status-present",
  },
  {
    status: AttendanceStatus.absent,
    label: "Absent",
    icon: "✗",
    activeBg: "bg-status-absent",
    activeText: "text-status-absent-fg",
    activeBorder: "border-status-absent",
  },
  {
    status: AttendanceStatus.onLeave,
    label: "On Leave",
    icon: "○",
    activeBg: "bg-status-leave",
    activeText: "text-status-leave-fg",
    activeBorder: "border-status-leave",
  },
  {
    status: AttendanceStatus.halfDay,
    label: "Half Day",
    icon: "◑",
    activeBg: "bg-status-halfday",
    activeText: "text-status-halfday-fg",
    activeBorder: "border-status-halfday",
  },
];

function WorkerCard({
  worker,
  todayStatus,
  onMark,
  isMutating,
}: {
  worker: Worker;
  todayStatus: AttendanceStatus | null;
  onMark: (status: AttendanceStatus) => void;
  isMutating: boolean;
}) {
  const groupName = `attendance-${worker.id.toString()}`;

  return (
    <Card className="shadow-card border-border">
      <CardContent className="p-4">
        {/* Worker info row */}
        <div className="flex items-center gap-3 mb-3">
          <WorkerAvatar name={worker.name} photo={worker.photo} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {worker.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {worker.role}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-2.5" />

        {/* Radio-style single-select status list */}
        <fieldset
          disabled={isMutating}
          className="border-0 p-0 m-0 flex flex-col gap-1.5"
        >
          <legend className="sr-only">
            Attendance status for {worker.name}
          </legend>
          {STATUS_OPTIONS.map((opt) => {
            const isActive = todayStatus === opt.status;
            const inputId = `${groupName}-${opt.status}`;
            return (
              <label
                key={opt.status}
                htmlFor={inputId}
                data-ocid={`marking.${opt.status}.button`}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer select-none",
                  isActive
                    ? cn(
                        opt.activeBg,
                        opt.activeText,
                        opt.activeBorder,
                        "shadow-sm",
                      )
                    : "bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                  isMutating && "opacity-60 cursor-not-allowed",
                )}
              >
                {/* Hidden real radio input */}
                <input
                  type="radio"
                  id={inputId}
                  name={groupName}
                  value={opt.status}
                  checked={isActive}
                  onChange={() => onMark(opt.status)}
                  disabled={isMutating}
                  className="sr-only"
                />

                {/* Visual radio circle */}
                <span
                  className={cn(
                    "shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150",
                    isActive
                      ? "border-current bg-white/25"
                      : "border-muted-foreground/40 bg-transparent",
                  )}
                  aria-hidden="true"
                >
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-current" />
                  )}
                </span>

                {/* Status icon */}
                <span className="text-[11px] leading-none" aria-hidden="true">
                  {opt.icon}
                </span>

                {/* Status label */}
                <span className="flex-1">{opt.label}</span>
              </label>
            );
          })}
        </fieldset>
      </CardContent>
    </Card>
  );
}

export default function MarkingPage() {
  const [search, setSearch] = useState("");
  const { data: workers = [], isLoading: workersLoading } = useWorkers();
  const { data: records = [], isLoading: recordsLoading } =
    useAllAttendanceRecords();
  const markAttendance = useMarkAttendance();

  const today = new Date().toISOString().split("T")[0];

  const todayMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    for (const r of records) {
      if (r.date === today) {
        map.set(r.workerId.toString(), r.status);
      }
    }
    return map;
  }, [records, today]);

  const filtered = useMemo(() => {
    if (!search.trim()) return workers;
    const q = search.toLowerCase();
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) || w.role.toLowerCase().includes(q),
    );
  }, [workers, search]);

  const isLoading = workersLoading || recordsLoading;

  const handleMark = (worker: Worker, status: AttendanceStatus) => {
    const currentStatus = todayMap.get(worker.id.toString());
    if (currentStatus === status) return;
    markAttendance.mutate(
      { workerId: worker.id, status, date: today },
      {
        onSuccess: () => {
          const labels: Record<AttendanceStatus, string> = {
            [AttendanceStatus.present]: "Present",
            [AttendanceStatus.absent]: "Absent",
            [AttendanceStatus.onLeave]: "On Leave",
            [AttendanceStatus.halfDay]: "Half Day",
          };
          toast.success(`${worker.name} marked as ${labels[status]}`);
        },
        onError: () => {
          toast.error(`Failed to mark attendance for ${worker.name}`);
        },
      },
    );
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Marking Section
          </h1>
          <p className="text-sm text-muted-foreground">{todayStr}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search workers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 w-full sm:w-52"
            data-ocid="marking.search_input"
          />
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 flex-wrap text-xs">
        <span className="px-2.5 py-1 rounded-full bg-status-present/15 text-status-present font-semibold">
          ✓{" "}
          {
            [...todayMap.values()].filter((s) => s === AttendanceStatus.present)
              .length
          }{" "}
          Present
        </span>
        <span className="px-2.5 py-1 rounded-full bg-status-absent/15 text-status-absent font-semibold">
          ✗{" "}
          {
            [...todayMap.values()].filter((s) => s === AttendanceStatus.absent)
              .length
          }{" "}
          Absent
        </span>
        <span className="px-2.5 py-1 rounded-full bg-status-leave/15 text-status-leave font-semibold">
          ○{" "}
          {
            [...todayMap.values()].filter((s) => s === AttendanceStatus.onLeave)
              .length
          }{" "}
          On Leave
        </span>
        <span className="px-2.5 py-1 rounded-full bg-status-halfday/15 text-status-halfday font-semibold">
          ◑{" "}
          {
            [...todayMap.values()].filter((s) => s === AttendanceStatus.halfDay)
              .length
          }{" "}
          Half Day
        </span>
        <span className="px-2.5 py-1 rounded-full bg-status-unmarked/80 text-status-unmarked-fg font-semibold">
          — {workers.length - todayMap.size} Unmarked
        </span>
      </div>

      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          data-ocid="marking.loading_state"
        >
          {["mk1", "mk2", "mk3", "mk4", "mk5", "mk6"].map((key) => (
            <Skeleton key={key} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center" data-ocid="marking.empty_state">
          <ClipboardCheck className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {workers.length === 0
              ? "No workers yet. Add workers to start marking attendance."
              : "No workers match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((worker, idx) => (
            <motion.div
              key={worker.id.toString()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              data-ocid={`marking.item.${idx + 1}`}
            >
              <WorkerCard
                worker={worker}
                todayStatus={todayMap.get(worker.id.toString()) ?? null}
                onMark={(status) => handleMark(worker, status)}
                isMutating={markAttendance.isPending}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
