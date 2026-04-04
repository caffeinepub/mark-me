import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
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
    // add more fields if needed
  };

  module WorkerId {
    public func compare(id1 : WorkerId, id2 : WorkerId) : Order.Order {
      Nat.compare(id1, id2);
    };
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

  // State Variables
  var idCount = 0;
  let workers = Map.empty<WorkerId, Worker>();
  let attendanceRecords = Map.empty<Nat, AttendanceRecord>();
  let userSettings = Map.empty<Principal, UserSettings>();
  var attendanceRecordCount = 0;
  let userProfiles = Map.empty<Principal, UserProfile>();

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

  // Worker Management

  public query ({ caller }) func getWorker(id : WorkerId) : async Worker {
    switch (workers.get(id)) {
      case (?worker) { worker };
      case (null) { Runtime.trap("Worker not found") };
    };
  };

  public query ({ caller }) func getAllWorkers() : async [Worker] {
    workers.values().toArray();
  };

  public shared ({ caller }) func createWorker(name : Text, joiningDate : DateText, role : Text, uniqueId : Text, photo : ?Text) : async Worker {
    let id = idCount;
    let worker : Worker = {
      name;
      id;
      joiningDate;
      role;
      photo;
      uniqueId;
    };
    workers.add(id, worker);
    idCount += 1;
    worker;
  };

  public shared ({ caller }) func updateWorkerRoleWithDate(id : WorkerId, role : Text, joiningDate : Text) : async Worker {
    let existingWorker = switch (workers.get(id)) {
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
    workers.add(id, updatedWorker);
    updatedWorker;
  };

  public shared ({ caller }) func updateWorkerPhoto(id : WorkerId, photo : ?Text) : async Worker {
    let existingWorker = switch (workers.get(id)) {
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
    workers.add(id, updatedWorker);
    updatedWorker;
  };

  public shared ({ caller }) func deleteWorker(id : WorkerId) : async () {
    if (not canEditWorker({ caller }, id)) { Runtime.trap("Not authorized") };
    if (not workers.containsKey(id)) { Runtime.trap("Worker doesn't exist") };
    workers.remove(id);
  };

  // Attendance record Management

  public query ({ caller }) func getAllAttendanceRecords() : async [AttendanceRecord] {
    attendanceRecords.values().toArray();
  };

  public query ({ caller }) func getWorkerAttendance(id : WorkerId) : async [AttendanceRecord] {
    attendanceRecords.values().toArray().filter(func(attendanceRecord) { attendanceRecord.workerId == id });
  };

  public shared ({ caller }) func markAttendance(timestamp : Nat, workerId : WorkerId, status : AttendanceStatus, date : DateText, remarks : ?Text) : async AttendanceRecord {
    ignore switch (workers.get(workerId)) {
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
    attendanceRecords.add(attendanceRecordCount, attendanceRecord);
    attendanceRecordCount += 1;
    attendanceRecord;
  };

  public query ({ caller }) func getWorkerMonthlyAttendance(workerId : WorkerId, startDate : DateText, endDate : DateText) : async [AttendanceRecord] {
    attendanceRecords.values().toArray().filter(
      func(attendanceRecord) {
        attendanceRecord.workerId == workerId and attendanceRecord.date >= startDate and attendanceRecord.date <= endDate
      }
    );
  };

  public query ({ caller }) func getWorkerMonthlyPresent(workerId : WorkerId, startDate : DateText, endDate : DateText) : async [AttendanceRecord] {
    attendanceRecords.values().toArray().filter(func(attendanceRecord) { attendanceRecord.workerId == workerId and attendanceRecord.status == #present and attendanceRecord.date >= startDate and attendanceRecord.date <= endDate });
  };

  public query ({ caller }) func getDateAttendance(date : DateText) : async [AttendanceRecord] {
    attendanceRecords.values().toArray().filter(func(attendanceRecord) { attendanceRecord.date == date });
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
    // if caller == Principal.fromText(adminId) { return true };
    switch (userProfiles.get(caller)) {
      case (?profile) { true };
      case (null) { false };
    };
  };
};
