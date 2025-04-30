import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = "StudentAttendance.db";
const database_version = "1.0";
const database_displayname = "Student Attendance Database";
const database_size = 200000;

let db;

const DatabaseService = {
  initDB: async () => {
    if (db) {
      return db;
    }
    db = await SQLite.openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size
    );
    // Create tables if not exist
    await db.executeSql(
      `CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        studentId TEXT UNIQUE NOT NULL,
        fingerprintHash TEXT
      );`
    );
    await db.executeSql(
      `CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        UNIQUE(studentId, date)
      );`
    );
    return db;
  },

  addStudent: async ({ name, studentId, fingerprintHash = null }) => {
    const db = await DatabaseService.initDB();
    const query = `INSERT INTO students (name, studentId, fingerprintHash) VALUES (?, ?, ?)`;
    await db.executeSql(query, [name, studentId, fingerprintHash]);
  },

  getAllStudents: async () => {
    const db = await DatabaseService.initDB();
    const [results] = await db.executeSql(`SELECT * FROM students ORDER BY name ASC`);
    let students = [];
    for (let i = 0; i < results.rows.length; i++) {
      students.push(results.rows.item(i));
    }
    return students;
  },

  getStudentById: async (studentId) => {
    const db = await DatabaseService.initDB();
    const [results] = await db.executeSql(`SELECT * FROM students WHERE studentId = ?`, [studentId]);
    if (results.rows.length > 0) {
      return results.rows.item(0);
    }
    return null;
  },

  updateFingerprintHash: async (studentId, fingerprintHash) => {
    const db = await DatabaseService.initDB();
    await db.executeSql(`UPDATE students SET fingerprintHash = ? WHERE studentId = ?`, [fingerprintHash, studentId]);
  },

  markAttendance: async (studentId, date, status) => {
    const db = await DatabaseService.initDB();
    const query = `INSERT OR REPLACE INTO attendance (studentId, date, status) VALUES (?, ?, ?)`;
    await db.executeSql(query, [studentId, date, status]);
  },

  getAttendanceByDate: async (date) => {
    const db = await DatabaseService.initDB();
    const [results] = await db.executeSql(`SELECT * FROM attendance WHERE date = ?`, [date]);
    let records = [];
    for (let i = 0; i < results.rows.length; i++) {
      records.push(results.rows.item(i));
    }
    return records;
  },

  getAttendanceByStudent: async (studentId) => {
    const db = await DatabaseService.initDB();
    const [results] = await db.executeSql(`SELECT * FROM attendance WHERE studentId = ? ORDER BY date DESC`, [studentId]);
    let records = [];
    for (let i = 0; i < results.rows.length; i++) {
      records.push(results.rows.item(i));
    }
    return records;
  },

  getAllAttendance: async () => {
    const db = await DatabaseService.initDB();
    const [results] = await db.executeSql(`SELECT * FROM attendance ORDER BY date DESC`);
    let records = [];
    for (let i = 0; i < results.rows.length; i++) {
      records.push(results.rows.item(i));
    }
    return records;
  }
};

export default DatabaseService;
