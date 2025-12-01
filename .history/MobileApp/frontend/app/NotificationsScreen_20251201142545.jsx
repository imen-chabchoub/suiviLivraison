import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Ionicons name="notifications" size={24} color="white" />
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>2</Text>
        </View>
      </View>

      {/* Liste des notifications */}
      <View style={styles.list}>
        {/* Notification 1 */}
        <View style={styles.notificationCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="cube" size={20} color="#2563eb" />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>Nouvelle mission</Text>
            <Text style={styles.message}>Vous avez une nouvelle livraison assignée</Text>
            <Text style={styles.time}>Il y a 3j</Text>
          </View>
          <View style={styles.dot} />
        </View>

        {/* Notification 2 */}
        <View style={styles.notificationCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={20} color="#f59e0b" />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>Rappel</Text>
            <Text style={styles.message}>
              N’oubliez pas de mettre à jour le statut de PKG001236
            </Text>
            <Text style={styles.time}>Il y a 3j</Text>
          </View>
          <View style={styles.dot} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: 'white', marginLeft: 8 },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  list: { paddingHorizontal: 16, paddingTop: 16 },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  message: { fontSize: 14, color: '#4b5563', marginTop: 2 },
  time: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginTop: 8,
  },
});