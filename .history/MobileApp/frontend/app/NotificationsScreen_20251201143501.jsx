import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiMobile from '../app/apiMobile';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.log('Pas de userId en storage');
        return;
      }

      // 1) Récupérer toutes les notifications de ce livreur
      const resAll = await apiMobile.get(`/mobile/notifications/user/${userId}`);
      const notifs = resAll.data || [];

      // 2) Récupérer le nombre de non lues
      const resUnread = await apiMobile.get(`/mobile/notifications/non-lues/${userId}`);
      const unread = resUnread.data || []; // selon ton DTO ça peut être une liste ou juste un nombre

      setNotifications(notifs);
      setUnreadCount(Array.isArray(unread) ? unread.length : unread);
    } catch (e) {
      console.log('Erreur chargement notifications', e?.response?.data || e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (notifId) => {
    try {
      await apiMobile.put(`/mobile/notifications/${notifId}/lire`);
      // mettre à jour le state local sans recharger tout
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId ? { ...n, lue: true } : n
        )
      );
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    } catch (e) {
      console.log('Erreur markAsRead', e?.response?.data || e);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.notificationCard}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={item.type === 'ALERTE' ? 'alert-circle' : 'cube'}
          size={20}
          color={item.type === 'ALERTE' ? '#f59e0b' : '#2563eb'}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.titre || 'Notification'}</Text>
        <Text style={styles.message}>
          {item.message || 'Vous avez une nouvelle notification'}
        </Text>
        <Text style={styles.time}>
          {item.dateEnvoi ? new Date(item.dateEnvoi).toLocaleString() : ''}
        </Text>
      </View>
      {!item.lue && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Ionicons name="notifications" size={24} color="white" />
        <Text style={styles.headerTitle}>Notifications</Text>
        
      </View>

      {/* Liste des notifications */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <View style={styles.list}>
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#6b7280', marginTop: 20 }}>
                Aucune notification.
              </Text>
            }
          />
        </View>
      )}
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
  
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
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
