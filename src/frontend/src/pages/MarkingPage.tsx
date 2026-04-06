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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Search,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AttendanceStatus, type Worker } from "../backend";
import WorkerDetailsModal from "../components/WorkerDetailsModal";
import {
  useAllAttendanceRecords,
  useDeleteWorker,
  useMarkAttendance,
  useWorkers,
} from "../hooks/useQueries";
import { cn } from "../lib/utils";
import { WorkerAvatar } from "./DashboardPage";

// Only Present and Absent
const STATUS_OPTIONS: {
  status: AttendanceStatus;
  label: string;
  icon: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  badgeBg: string;
  badgeText: string;
}[] = [
  {
    status: AttendanceStatus.present,
    label: "Present",
    icon: "✓",
    activeBg: "bg-status-present",
    activeText: "text-status-present-fg",
    activeBorder: "border-status-present",
    badgeBg: "bg-status-present",
    badgeText: "text-status-present-fg",
  },
  {
    status: AttendanceStatus.absent,
    label: "Absent",
    icon: "✗",
    activeBg: "bg-status-absent",
    activeText: "text-status-absent-fg",
    activeBorder: "border-status-absent",
    badgeBg: "bg-status-absent",
    badgeText: "text-status-absent-fg",
  },
];

const NOT_MARKED_BADGE = {
  label: "Not Marked",
  icon: "—",
  badgeBg: "bg-status-unmarked",
  badgeText: "text-status-unmarked-fg",
};

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

function WorkerCard({
  worker,
  todayStatus,
  onMark,
  isMutating,
  onDelete,
  onViewProfile,
  isExpanded,
  onToggleExpand,
}: {
  worker: Worker;
  todayStatus: AttendanceStatus | null;
  onMark: (status: AttendanceStatus) => void;
  isMutating: boolean;
  onDelete: () => void;
  onViewProfile: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const groupName = `attendance-${worker.id.toString()}`;

  const currentStatusOption = todayStatus
    ? (STATUS_OPTIONS.find((opt) => opt.status === todayStatus) ?? null)
    : null;

  const badgeLabel = currentStatusOption?.label ?? NOT_MARKED_BADGE.label;
  const badgeIcon = currentStatusOption?.icon ?? NOT_MARKED_BADGE.icon;
  const badgeBg = currentStatusOption?.badgeBg ?? NOT_MARKED_BADGE.badgeBg;
  const badgeText =
    currentStatusOption?.badgeText ?? NOT_MARKED_BADGE.badgeText;

  return (
    <>
      <Card className="shadow-card border-border">
        <CardContent className="p-4">
          {/* Worker info row */}
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={onViewProfile}
              data-ocid="marking.worker_profile.button"
              className="shrink-0 focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
              aria-label={`View profile for ${worker.name}`}
            >
              <WorkerAvatar name={worker.name} photo={worker.photo} size="sm" />
            </button>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={onViewProfile}
                data-ocid="marking.worker_name.button"
                className="text-sm font-semibold text-primary hover:underline text-left block truncate w-full"
              >
                {worker.name}
              </button>
              <p className="text-xs text-muted-foreground truncate">
                {worker.role}
              </p>
            </div>
            {/* Delete button */}
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              data-ocid="marking.delete_button"
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
              aria-label={`Delete ${worker.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mb-2.5" />

          {/* Status badge + toggle row */}
          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span
              className={cn(
                "flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
                badgeBg,
                badgeText,
              )}
            >
              <span aria-hidden="true">{badgeIcon}</span>
              {badgeLabel}
            </span>

            {/* Toggle dropdown button */}
            <button
              type="button"
              onClick={onToggleExpand}
              data-ocid="marking.toggle"
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-muted text-foreground text-xs font-medium hover:bg-accent transition-colors duration-150"
              aria-expanded={isExpanded}
              aria-label={
                isExpanded
                  ? "Collapse attendance options"
                  : "Expand attendance options"
              }
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Collapsible attendance options — only Present and Absent */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="pt-2.5">
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
                        <span
                          className="text-[11px] leading-none"
                          aria-hidden="true"
                        >
                          {opt.icon}
                        </span>
                        <span className="flex-1">{opt.label}</span>
                      </label>
                    );
                  })}
                </fieldset>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-ocid="marking.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{worker.name}</strong>?
              This will remove the worker and all their attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="marking.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="marking.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setShowDeleteDialog(false);
                onDelete();
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

export default function MarkingPage() {
  const [search, setSearch] = useState("");
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const { data: workers = [], isLoading: workersLoading } = useWorkers();
  const { data: records = [], isLoading: recordsLoading } =
    useAllAttendanceRecords();
  const markAttendance = useMarkAttendance();
  const deleteWorker = useDeleteWorker();

  const today = new Date().toISOString().split("T")[0];

  // Only show workers whose joining date is today or in the past
  const eligibleWorkers = useMemo(() => {
    return workers.filter((w) => w.joiningDate <= today);
  }, [workers, today]);

  const todayMap = useMemo(
    () => buildLatestStatusMap(records, today),
    [records, today],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return eligibleWorkers;
    const q = search.toLowerCase();
    return eligibleWorkers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) || w.role.toLowerCase().includes(q),
    );
  }, [eligibleWorkers, search]);

  const isLoading = workersLoading || recordsLoading;

  // Counts — only Present and Absent
  const presentCount = useMemo(
    () =>
      [...todayMap.values()].filter((s) => s === AttendanceStatus.present)
        .length,
    [todayMap],
  );
  const absentCount = useMemo(
    () =>
      [...todayMap.values()].filter((s) => s === AttendanceStatus.absent)
        .length,
    [todayMap],
  );
  const unmarkedCount = Math.max(0, eligibleWorkers.length - todayMap.size);

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

  const handleDelete = (worker: Worker) => {
    deleteWorker.mutate(worker.id, {
      onSuccess: () => {
        toast.success(`${worker.name} has been deleted.`);
      },
      onError: () => {
        toast.error(`Failed to delete ${worker.name}.`);
      },
    });
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

      {/* Attendance Summary Card — Present, Absent, Unmarked only */}
      {!isLoading && eligibleWorkers.length > 0 && (
        <Card
          className="shadow-card border-border"
          data-ocid="marking.summary.card"
        >
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Today's Attendance Count
            </p>
            <div className="grid grid-cols-3 gap-2">
              <AttendanceSummaryCell
                label="Present"
                count={presentCount}
                total={eligibleWorkers.length}
                bg="bg-status-present/15"
                border="border-status-present/30"
                textColor="text-status-present"
              />
              <AttendanceSummaryCell
                label="Absent"
                count={absentCount}
                total={eligibleWorkers.length}
                bg="bg-status-absent/15"
                border="border-status-absent/30"
                textColor="text-status-absent"
              />
              <AttendanceSummaryCell
                label="Unmarked"
                count={unmarkedCount}
                total={eligibleWorkers.length}
                bg="bg-muted/60"
                border="border-border"
                textColor="text-muted-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-2.5 border-t border-border">
              Out of{" "}
              <span className="font-semibold text-foreground">
                {eligibleWorkers.length} workers
              </span>
              {" — "}
              <span className="font-semibold text-status-present">
                {presentCount} Present
              </span>
              {" · "}
              <span className="font-semibold text-status-absent">
                {absentCount} Absent
              </span>
              {" · "}
              <span className="font-semibold">{unmarkedCount} Unmarked</span>
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          data-ocid="marking.loading_state"
        >
          {["mk1", "mk2", "mk3", "mk4", "mk5", "mk6"].map((key) => (
            <Skeleton key={key} className="h-36 rounded-xl" />
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
                onDelete={() => handleDelete(worker)}
                onViewProfile={() => setSelectedWorker(worker)}
                isExpanded={expandedWorkerId === worker.id.toString()}
                onToggleExpand={() =>
                  setExpandedWorkerId((prev) =>
                    prev === worker.id.toString() ? null : worker.id.toString(),
                  )
                }
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Worker Details Modal */}
      {selectedWorker && (
        <WorkerDetailsModal
          worker={selectedWorker}
          records={records.filter((r) => r.workerId === selectedWorker.id)}
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

function AttendanceSummaryCell({
  label,
  count,
  total,
  bg,
  border,
  textColor,
}: {
  label: string;
  count: number;
  total: number;
  bg: string;
  border: string;
  textColor: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      className={`flex flex-col items-center p-2.5 rounded-lg border ${bg} ${border}`}
    >
      <span className={`text-xl font-bold leading-none ${textColor}`}>
        {count}
      </span>
      <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
        {label}
      </span>
      <span className={`text-[10px] font-semibold mt-0.5 ${textColor}`}>
        {pct}%
      </span>
    </div>
  );
}
