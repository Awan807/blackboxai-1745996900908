import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, FlatList } from 'react-native';
import BiometricService from '../services/BiometricService';
import DatabaseService from '../services/DatabaseService';
import moment from 'moment';

const AttendanceScanner = () => {
  const [students, setStudents] = useState([]);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [todayDate, setTodayDate] = useState(moment().format('YYYY-MM-DD'));

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const allStudents = await DatabaseService.getAllStudents();
      setStudents(allStudents);
      setAttendanceMarked(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load students');
    }
  };

  const markAbsentForNonScanned = async (scannedStudentIds) => {
    const absentStudents = students.filter(s => !scannedStudentIds.includes(s.studentId));
    for (const student of absentStudents) {
      await DatabaseService.markAttendance(student.studentId, todayDate, 'Absent');
    }
  };

  const handleScanFingerprint = async () => {
    try {
      const sensorAvailable = await BiometricService.isSensorAvailable();
      if (!sensorAvailable) {
        Alert.alert('Error', 'Fingerprint sensor not available');
        return;
      }
      await BiometricService.authenticate();

      // For demo, we simulate fingerprint hash by using studentId input
      // In real app, fingerprint hash should be obtained securely from biometric API
      // Here, we prompt user to enter student ID to simulate fingerprint match
      Alert.prompt(
        'Fingerprint Scan',
        'Enter Student ID to simulate fingerprint match',
        async (studentId) => {
          if (!studentId) {
            Alert.alert('Error', 'Student ID is required');
            return;
          }
          const student = await DatabaseService.getStudentById(studentId.trim());
          if (!student) {
            Alert.alert('Error', 'Student not found or fingerprint not registered');
            return;
          }
          // Check if attendance already marked today
          const attendanceRecords = await DatabaseService.getAttendanceByStudent(studentId.trim());
          const todayRecord = attendanceRecords.find(r => r.date === todayDate);
          if (todayRecord && todayRecord.status === 'Present') {
            Alert.alert('Info', 'Attendance already marked for today');
            return;
          }
          await DatabaseService.markAttendance(studentId.trim(), todayDate, 'Present');
          Alert.alert('Success', `Attendance marked for ${student.name}`);
          setAttendanceMarked(true);
        }
      );
    } catch (error) {
      Alert.alert('Authentication Failed', error.message || 'Fingerprint authentication failed');
    } finally {
      BiometricService.release();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Scanner</Text>
      <Button title="Scan Fingerprint to Mark Attendance" onPress={handleScanFingerprint} />
      {attendanceMarked && (
        <Button
          title="Mark Absent for Non-Scanned Students"
          onPress={async () => {
            const attendanceToday = await DatabaseService.getAttendanceByDate(todayDate);
            const scannedIds = attendanceToday.filter(r => r.status === 'Present').map(r => r.studentId);
            await markAbsentForNonScanned(scannedIds);
            Alert.alert('Success', 'Absent marked for non-scanned students');
            setAttendanceMarked(false);
          }}
          color="red"
        />
      )}
      <Text style={styles.note}>* After scanning all students, press the red button to mark absences.</Text>
      <Text style={styles.subtitle}>Registered Students:</Text>
      <FlatList
        data={students}
        keyExtractor={(item) => item.studentId}
        renderItem={({ item }) => (
          <Text style={styles.studentItem}>{item.name} (ID: {item.studentId})</Text>
        )}
        ListEmptyComponent={<Text>No students registered yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, marginTop: 20, marginBottom: 5 },
  studentItem: { fontSize: 16, paddingVertical: 2 },
  note: { marginTop: 10, fontStyle: 'italic', color: 'gray' },
});

export default AttendanceScanner;
