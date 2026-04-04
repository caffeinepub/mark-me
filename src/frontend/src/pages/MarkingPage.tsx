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

const STATUS_BUTTONS: {
  status: AttendanceStatus;
  label: string;
  cls: string;
  activeCls: string;
}[] = [
  {
    status: AttendanceStatus.present,
    label: "Present",
    cls: "border-status-present/40 text-status-present hover:bg-status-present hover:text-status-present-fg",
    activeCls: "bg-status-present text-status-present-fg border-status-present",
  },
  {
    status: AttendanceStatus.absent,
    label: "Absent",
    cls: "border-status-absent/40 text-status-absent hover:bg-status-absent hover:text-status-absent-fg",
    activeCls: "bg-status-absent text-status-absent-fg border-status-absent",
  },
  {
    status: AttendanceStatus.onLeave,
    label: "On Leave",
    cls: "border-status-leave/40 text-status-leave hover:bg-status-leave hover:text-status-leave-fg",
    activeCls: "bg-status-leave text-status-leave-fg border-status-leave",
  },
  {
    status: AttendanceStatus.halfDay,
    label: "Half Day",
    cls: "border-status-halfday/40 text-status-halfday hover:bg-status-halfday hover:text-status-halfday-fg",
    activeCls: "bg-status-halfday text-status-halfday-fg border-status-halfday",
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
  return (
    <Card className="shadow-card border-border">
      <CardContent className="p-4">
        <div className="flex flex-col items-center gap-2 mb-4">
          <WorkerAvatar name={worker.name} photo={worker.photo} size="md" />
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground truncate max-w-[140px]">
              {worker.name}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
              {worker.role}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {STATUS_BUTTONS.map((btn) => (
            <button
              type="button"
              key={btn.status}
              onClick={() => onMark(btn.status)}
              disabled={isMutating}
              data-ocid={`marking.${btn.status}.button`}
              className={cn(
                "px-2 py-1.5 rounded-md text-xs font-semibold border transition-all duration-150",
                todayStatus === btn.status ? btn.activeCls : btn.cls,
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
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
    if (currentStatus === status) return; // already marked with same status, do nothing
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
            <Skeleton key={key} className="h-44 rounded-xl" />
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
