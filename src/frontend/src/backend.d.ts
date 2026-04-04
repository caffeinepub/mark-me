import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AttendanceRecord {
    status: AttendanceStatus;
    workerId: WorkerId;
    date: DateText;
    timestamp: bigint;
    remarks?: string;
}
export type DateText = string;
export interface UserSettings {
    darkMode: boolean;
}
export type WorkerId = bigint;
export interface Worker {
    id: WorkerId;
    name: string;
    role: string;
    joiningDate: DateText;
    uniqueId: string;
    photo?: string;
}
export interface UserProfile {
    name: string;
}
export enum AttendanceStatus {
    onLeave = "onLeave",
    halfDay = "halfDay",
    present = "present",
    absent = "absent"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createWorker(name: string, joiningDate: DateText, role: string, uniqueId: string, photo: string | null): Promise<Worker>;
    deleteWorker(id: WorkerId): Promise<void>;
    getAllAttendanceRecords(): Promise<Array<AttendanceRecord>>;
    getAllWorkers(): Promise<Array<Worker>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDateAttendance(date: DateText): Promise<Array<AttendanceRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserSettings(): Promise<UserSettings>;
    getWorker(id: WorkerId): Promise<Worker>;
    getWorkerAttendance(id: WorkerId): Promise<Array<AttendanceRecord>>;
    getWorkerMonthlyAttendance(workerId: WorkerId, startDate: DateText, endDate: DateText): Promise<Array<AttendanceRecord>>;
    getWorkerMonthlyPresent(workerId: WorkerId, startDate: DateText, endDate: DateText): Promise<Array<AttendanceRecord>>;
    isCallerAdmin(): Promise<boolean>;
    markAttendance(timestamp: bigint, workerId: WorkerId, status: AttendanceStatus, date: DateText, remarks: string | null): Promise<AttendanceRecord>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveUserSettings(darkMode: boolean): Promise<void>;
    updateWorkerPhoto(id: WorkerId, photo: string | null): Promise<Worker>;
    updateWorkerRoleWithDate(id: WorkerId, role: string, joiningDate: string): Promise<Worker>;
}
