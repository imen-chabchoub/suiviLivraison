import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DeliveryCard({ delivery, onStart, onMap, onScan }) {
  const { code, client, address, phone, status } = delivery;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.status}>{status}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={18} color="#6b7280" />
        <Text style={styles.infoText}>{address}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={18} color="#6b7280" />
        <Text style={styles.infoText}>{client}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="call-outline" size={18} color="#6b7280" />
        <Text style={styles.infoText}>{phone}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onStart}>
          <Text style={styles.btnText}>Démarrer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={onMap}>
          <Ionicons name="map-outline" size={18} color="#374151" />
          <Text style={styles.btnTextSecondary}>Carte</Text>
        </TouchableOpacity>

      <TouchableOpacity
  style={styles.btnSecondary}
  onPress={() => navigation.navigate('Scanner')}
>
  <Ionicons name="qr-code-outline" size={18} color="#374151" />
  <Text style={styles.btnTextSecondary}>Scanner</Text>
</TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  code: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  status: { backgroundColor: '#fef3c7', color: '#d97706', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  infoText: { fontSize: 14, color: '#4b5563', flex: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnPrimary: { backgroundColor: '#1f2937', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, flex: 1 },
  btnSecondary: { backgroundColor: '#f3f4f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1 },
  btnText: { color: 'white', fontWeight: '600', textAlign: 'center', fontSize: 14 },
  btnTextSecondary: { color: '#374151', fontWeight: '600', fontSize: 14 },
});