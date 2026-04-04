import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AttendanceRecord, AttendanceStatus, Worker } from "../backend";
import { useActor } from "./useActor";

export function useWorkers() {
  const { actor, isFetching } = useActor();
  return useQuery<Worker[]>({
    queryKey: ["workers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWorkers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllAttendanceRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAttendanceRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDateAttendance(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "date", date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDateAttendance(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useWorkerAttendance(workerId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "worker", workerId?.toString()],
    queryFn: async () => {
      if (!actor || workerId === null) return [];
      return actor.getWorkerAttendance(workerId);
    },
    enabled: !!actor && !isFetching && workerId !== null,
  });
}

export function useUserSettings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      if (!actor) return { darkMode: false };
      return actor.getUserSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workerId,
      status,
      date,
    }: {
      workerId: bigint;
      status: AttendanceStatus;
      date: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.markAttendance(
        BigInt(Date.now()),
        workerId,
        status,
        date,
        null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useCreateWorker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      joiningDate,
      role,
      photo,
    }: {
      name: string;
      joiningDate: string;
      role: string;
      photo: string | null;
    }) => {
      if (!actor) throw new Error("No actor");
      const uniqueId = `worker_${Date.now()}`;
      return actor.createWorker(name, joiningDate, role, uniqueId, photo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}

export function useDeleteWorker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workerId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteWorker(workerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useSaveUserSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (darkMode: boolean) => {
      if (!actor) throw new Error("No actor");
      return actor.saveUserSettings(darkMode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
  });
}

export function useCallerUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      return actor.saveCallerUserProfile({ name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}
