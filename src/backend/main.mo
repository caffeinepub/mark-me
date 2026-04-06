import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  // Attendance Status
  type AttendanceStatus = {
    #present;
    #absent;
    #onLeave;
    #halfDay;
  };

  // User Types
  type WorkerId = Nat;
  type DateText = Text;
  type UserId = Text;

  // User Profile
  public type UserProfile = {
    name : Text;
  };

  type AttendanceRecord = {
    timestamp : Nat;
    workerId : WorkerId;
    status : AttendanceStatus;
    date : DateText;
    remarks : ?Text;
  };

  type Worker = {
    id : WorkerId;
    name : Text;
    joiningDate : DateText;
    role : Text;
    photo : ?Text;
    uniqueId : Text;
  };

  public type UserSettings = {
    darkMode : Bool;
  };

  // 1. Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // 2. Storage for blob upload
  include MixinStorage();

  // Preserved from previous version for upgrade compatibility (M0169).
  // These old flat variables are kept with original names/types so the
  // upgrade checker accepts the new version. They are not used.
  var idCount : Nat = 0;
  let workers = Map.empty<WorkerId, Worker>();
  let attendanceRecords = Map.empty<Nat, AttendanceRecord>();
  var attendanceRecordCount : Nat = 0;

  // State Variables — per-user isolation
  // Each principal gets its own sub-map of workers and attendance records
  let userWorkers = Map.empty<Principal, Map.Map<WorkerId, Worker>>();
  let userAttendance = Map.empty<Principal, Map.Map<Nat, AttendanceRecord>>();
  let userWorkerIdCount = Map.empty<Principal, Nat>();
  let userAttendanceCount = Map.empty<Principal, Nat>();

  let userSettings = Map.empty<Principal, UserSettings>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Helper: get or create the worker sub-map for a principal
  func getWorkerMap(p : Principal) : Map.Map<WorkerId, Worker> {
    switch (userWorkers.get(p)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<WorkerId, Worker>();
        userWorkers.add(p, m);
        m;
      };
    };
  };

  // Helper: get or create the attendance sub-map for a principal
  func getAttendanceMap(p : Principal) : Map.Map<Nat, AttendanceRecord> {
    switch (userAttendance.get(p)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, AttendanceRecord>();
        userAttendance.add(p, m);
        m;
      };
    };
  };

  // Helper: get and increment worker ID counter for a principal
  func nextWorkerId(p : Principal) : Nat {
    let current = switch (userWorkerIdCount.get(p)) {
      case (?n) { n };
      case (null) { 0 };
    };
    userWorkerIdCount.add(p, current + 1);
    current;
  };

  // Helper: get and increment attendance record counter for a principal
  func nextAttendanceId(p : Principal) : Nat {
    let current = switch (userAttendanceCount.get(p)) {
      case (?n) { n };
      case (null) { 0 };
    };
    userAttendanceCount.add(p, current + 1);
    current;
  };

  // User Profile Management

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // Worker Management — all scoped to caller

  public query ({ caller }) func getWorker(id : WorkerId) : async Worker {
    let wMap = switch (userWorkers.get(caller)) {
      case (?m) { m };
      case (null) { Runtime.trap("Worker not found") };
    };
    switch (wMap.get(id)) {
      case (?worker) { worker };
      case (null) { Runtime.trap("Worker not found") };
    };
  };

  public query ({ caller }) func getAllWorkers() : async [Worker] {
    switch (userWorkers.get(caller)) {
      case (?m) { m.values().toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func createWorker(name : Text, joiningDate : DateText, role : Text, uniqueId : Text, photo : ?Text) : async Worker {
    let id = nextWorkerId(caller);
    let worker : Worker = {
      name;
      id;
      joiningDate;
      role;
      photo;
      uniqueId;
    };
    let wMap = getWorkerMap(caller);
    wMap.add(id, worker);
    worker;
  };

  public shared ({ caller }) func updateWorkerRoleWithDate(id : WorkerId, role : Text, joiningDate : Text) : async Worker {
    let wMap = switch (userWorkers.get(caller)) {
      case (?m) { m };
      case (null) { Runtime.trap("Worker not found") };
    };
    let existingWorker = switch (wMap.get(id)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?worker) { worker };
    };
    let updatedWorker = {
      id = id;
      name = existingWorker.name;
      joiningDate;
      role;
      photo = existingWorker.photo;
      uniqueId = existingWorker.uniqueId;
    };
    wMap.add(id, updatedWorker);
    updatedWorker;
  };

  public shared ({ caller }) func updateWorkerPhoto(id : WorkerId, photo : ?Text) : async Worker {
    let wMap = switch (userWorkers.get(caller)) {
      case (?m) { m };
      case (null) { Runtime.trap("Worker not found") };
    };
    let existingWorker = switch (wMap.get(id)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?worker) { worker };
    };
    let updatedWorker = {
      id = id;
      name = existingWorker.name;
      joiningDate = existingWorker.joiningDate;
      role = existingWorker.role;
      photo;
      uniqueId = existingWorker.uniqueId;
    };
    wMap.add(id, updatedWorker);
    updatedWorker;
  };

  public shared ({ caller }) func deleteWorker(id : WorkerId) : async () {
    let wMap = switch (userWorkers.get(caller)) {
      case (?m) { m };
      case (null) { Runtime.trap("Worker not found") };
    };
    if (not wMap.containsKey(id)) { Runtime.trap("Worker doesn't exist") };
    wMap.remove(id);
  };

  // Attendance record Management — all scoped to caller

  public query ({ caller }) func getAllAttendanceRecords() : async [AttendanceRecord] {
    switch (userAttendance.get(caller)) {
      case (?m) { m.values().toArray() };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getWorkerAttendance(id : WorkerId) : async [AttendanceRecord] {
    switch (userAttendance.get(caller)) {
      case (?m) {
        m.values().toArray().filter(func(r) { r.workerId == id });
      };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func markAttendance(timestamp : Nat, workerId : WorkerId, status : AttendanceStatus, date : DateText, remarks : ?Text) : async AttendanceRecord {
    // Verify worker belongs to caller
    let wMap = switch (userWorkers.get(caller)) {
      case (?m) { m };
      case (null) { Runtime.trap("Worker does not exist.") };
    };
    ignore switch (wMap.get(workerId)) {
      case (null) { Runtime.trap("Worker does not exist.") };
      case (_) {};
    };
    let attendanceRecord : AttendanceRecord = {
      timestamp;
      workerId;
      status;
      date;
      remarks;
    };
    let aMap = getAttendanceMap(caller);
    let recId = nextAttendanceId(caller);
    aMap.add(recId, attendanceRecord);
    attendanceRecord;
  };

  public query ({ caller }) func getWorkerMonthlyAttendance(workerId : WorkerId, startDate : DateText, endDate : DateText) : async [AttendanceRecord] {
    switch (userAttendance.get(caller)) {
      case (?m) {
        m.values().toArray().filter(
          func(r) {
            r.workerId == workerId and r.date >= startDate and r.date <= endDate
          }
        );
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getWorkerMonthlyPresent(workerId : WorkerId, startDate : DateText, endDate : DateText) : async [AttendanceRecord] {
    switch (userAttendance.get(caller)) {
      case (?m) {
        m.values().toArray().filter(
          func(r) {
            r.workerId == workerId and r.status == #present and r.date >= startDate and r.date <= endDate
          }
        );
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getDateAttendance(date : DateText) : async [AttendanceRecord] {
    switch (userAttendance.get(caller)) {
      case (?m) {
        m.values().toArray().filter(func(r) { r.date == date });
      };
      case (null) { [] };
    };
  };

  // User Methods

  public shared ({ caller }) func saveUserSettings(darkMode : Bool) : async () {
    let settings : UserSettings = {
      darkMode;
    };
    userSettings.add(caller, settings);
  };

  public query ({ caller }) func getUserSettings() : async UserSettings {
    switch (userSettings.get(caller)) {
      case (?settings) { settings };
      case (null) { { darkMode = false } };
    };
  };

  // Attributes

  func canEditWorker({ caller } : { caller : Principal }, id : WorkerId) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) { true };
      case (null) { false };
    };
  };
};
