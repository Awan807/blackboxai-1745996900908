import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet } from 'react-native';
import DatabaseService from '../services/DatabaseService';

const AdminPanel = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStudents();
    });
    return unsubscribe;
  }, [navigation]);

  const loadStudents = async () => {
    try {
      const allStudents = await DatabaseService.getAllStudents();
      setStudents(allStudents);
    } catch (error) {
      Alert.alert('Error', 'Failed to load students');
    }
  };

  const addStudent = async () => {
    if (!name.trim() || !studentId.trim()) {
      Alert.alert('Validation', 'Please enter both name and student ID');
      return;
    }
    try {
      const exists = await DatabaseService.getStudentById(studentId.trim());
      if (exists) {
        Alert.alert('Duplicate', 'Student ID already exists');
        return;
      }
      await DatabaseService.addStudent({ name: name.trim(), studentId: studentId.trim() });
      setName('');
      setStudentId('');
      loadStudents();
      Alert.alert('Success', 'Student added. Please register fingerprint in Attendance Scanner.');
    } catch (error) {
      Alert.alert('Error', 'Failed to add student');
    }
  };

  const renderStudent = ({ item }) => (
    <View style={styles.studentItem}>
      <Text style={styles.studentText}>{item.name} (ID: {item.studentId})</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register New Student</Text>
      <TextInput
        style={styles.input}
        placeholder="Student Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Student ID"
        value={studentId}
        onChangeText={setStudentId}
      />
      <Button title="Add Student" onPress={addStudent} />
      <Text style={styles.title}>Registered Students</Text>
      <FlatList
        data={students}
        keyExtractor={(item) => item.studentId}
        renderItem={renderStudent}
        ListEmptyComponent={<Text>No students registered yet.</Text>}
      />
      <View style={{ marginTop: 20 }}>
        <Button title="Go to Attendance Scanner" onPress={() => navigation.navigate('AttendanceScanner')} />
        <Button title="View Reports" onPress={() => navigation.navigate('Reports')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 5, borderRadius: 5 },
  studentItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  studentText: { fontSize: 16 },
});

export default AdminPanel;
