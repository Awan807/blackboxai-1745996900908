import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert } from 'react-native';
import DatabaseService from '../services/DatabaseService';
import * as XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import moment from 'moment';

const Reports = () => {
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allStudents = await DatabaseService.getAllStudents();
      const allAttendance = await DatabaseService.getAllAttendance();
      setStudents(allStudents);
      setAttendanceRecords(allAttendance);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const generateClassAttendanceSheet = () => {
    // Create a map of dates and students attendance
    const datesSet = new Set(attendanceRecords.map(r => r.date));
    const dates = Array.from(datesSet).sort();

    const data = [];
    // Header row
    const header = ['Student Name', 'Student ID', ...dates];
    data.push(header);

    students.forEach(student => {
      const row = [student.name, student.studentId];
      dates.forEach(date => {
        const record = attendanceRecords.find(r => r.studentId === student.studentId && r.date === date);
        row.push(record ? record.status : 'Absent');
      });
      data.push(row);
    });

    return data;
  };

  const generateIndividualAttendance = (studentId) => {
    const records = attendanceRecords.filter(r => r.studentId === studentId);
    const data = [['Date', 'Status']];
    records.forEach(r => {
      data.push([r.date, r.status]);
    });
    return data;
  };

  const exportToExcel = async (data, filename) => {
    try {
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

      const path = RNFS.DocumentDirectoryPath + `/${filename}.xlsx`;
      await RNFS.writeFile(path, wbout, 'ascii');
      Alert.alert('Success', `Excel file saved to ${path}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to export Excel');
    }
  };

  const exportToPDF = async (data, filename) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 12;
      const margin = 30;
      const lineHeight = fontSize + 5;
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      let y = height - margin;

      data.forEach((row, rowIndex) => {
        let x = margin;
        row.forEach(cell => {
          page.drawText(cell.toString(), { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
          x += 100;
        });
        y -= lineHeight;
        if (y < margin) {
          y = height - margin;
          pdfDoc.addPage();
        }
      });

      const pdfBytes = await pdfDoc.save();
      const path = RNFS.DocumentDirectoryPath + `/${filename}.pdf`;
      await RNFS.writeFile(path, pdfBytes, 'base64');
      Alert.alert('Success', `PDF file saved to ${path}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to export PDF');
    }
  };

  const renderStudent = ({ item }) => (
    <View style={styles.studentItem}>
      <Text style={styles.studentName}>{item.name} (ID: {item.studentId})</Text>
      <View style={styles.buttonsRow}>
        <Button
          title="Export Individual Excel"
          onPress={() => exportToExcel(generateIndividualAttendance(item.studentId), `Attendance_${item.studentId}`)}
        />
        <Button
          title="Export Individual PDF"
          onPress={() => exportToPDF(generateIndividualAttendance(item.studentId), `Attendance_${item.studentId}`)}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Reports</Text>
      <Button
        title="Export Class Attendance Excel"
        onPress={() => exportToExcel(generateClassAttendanceSheet(), 'ClassAttendance')}
      />
      <Button
        title="Export Class Attendance PDF"
        onPress={() => exportToPDF(generateClassAttendanceSheet(), 'ClassAttendance')}
      />
      <Text style={styles.subtitle}>Individual Student Reports</Text>
      <FlatList
        data={students}
        keyExtractor={(item) => item.studentId}
        renderItem={renderStudent}
        ListEmptyComponent={<Text>No students registered yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, marginTop: 20, marginBottom: 10 },
  studentItem: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10 },
  studentName: { fontSize: 16, fontWeight: 'bold' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
});

export default Reports;
