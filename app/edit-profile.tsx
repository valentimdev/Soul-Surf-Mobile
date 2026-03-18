import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

export default function EditProfileScreen() {
  const params = useLocalSearchParams();
  const [username, setUsername] = useState((params.currentUsername as string) || '');
  const [bio, setBio] = useState((params.currentBio as string) || '');
  const [profileImg, setProfileImg] = useState<any>(null);
  const [coverImg, setCoverImg] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (type: 'profile' | 'cover') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 7],
      quality: 0.6,
    });

    if (!result.canceled) {
      if (type === 'profile') setProfileImg(result.assets[0]);
      else setCoverImg(result.assets[0]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const formData = new FormData();

    if (profileImg) {
      formData.append('fotoPerfil', { uri: profileImg.uri, name: 'p.jpg', type: 'image/jpeg' } as any);
    }
    if (coverImg) {
      formData.append('fotoCapa', { uri: coverImg.uri, name: 'c.jpg', type: 'image/jpeg' } as any);
    }

    try {
      await api.put('/users/me/upload', formData, {
        params: { username, bio }, // Envia na URL conforme o Swagger (Query Params)
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert("Sucesso", "Perfil atualizado!");
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Editar Perfil', headerShown: true }} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* Preview da Capa */}
        <TouchableOpacity onPress={() => pickImage('cover')}>
           <Image
            source={{ uri: coverImg?.uri || params.currentCover as string || 'https://via.placeholder.com/800x400' }}
            style={styles.coverPreview}
          />
          <View style={styles.overlay}><Text style={styles.overlayText}>Trocar Capa</Text></View>
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={() => pickImage('profile')}>
            <Image
              source={{ uri: profileImg?.uri || params.currentAvatar as string || 'https://via.placeholder.com/150' }}
              style={styles.avatarPreview}
            />
            <View style={styles.avatarOverlay}><Ionicons name="camera" size={20} color="#FFF" /></View>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={bio}
          onChangeText={setBio}
          multiline
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Salvar Alterações</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4EB' },
  coverPreview: { width: '100%', height: 150, borderRadius: 12 },
  overlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 5 },
  overlayText: { color: '#FFF', fontSize: 12 },
  avatarContainer: { alignItems: 'center', marginTop: -40, marginBottom: 20 },
  avatarPreview: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#F6F4EB' },
  avatarOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#5C9DB8', padding: 6, borderRadius: 20 },
  label: { fontWeight: 'bold', color: '#1F4A63', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2DEC3' },
  saveBtn: { backgroundColor: '#1F4A63', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' }
});