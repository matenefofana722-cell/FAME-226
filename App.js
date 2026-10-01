import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (!error) setPosts(data);
    setLoading(false);
  };

  useEffect(() => { loadPosts(); }, []);

  const uploadVideo = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
      });
      if (res.canceled) return;

      setUploading(true);
      const uri = res.assets[0].uri;
      const fileName = `fame_${Date.now()}.mp4`;

      const fileData = await fetch(uri);
      const blob = await fileData.blob();

      const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, blob, {
        contentType: 'video/mp4',
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('videos').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('posts').insert({
        video_url: data.publicUrl,
        username: 'FAME User',
        caption: 'My FAME video 🔥',
        likes: 0
      });
      if (dbError) throw dbError;

      Alert.alert('Done', 'Video uploaded to FAME!');
      loadPosts();
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#fff" /><Text style={s.loading}>Loading FAME...</Text></View>;

  return (
    <View style={s.container}>
      <Text style={s.header}>FAME</Text>

      <TouchableOpacity style={s.btn} onPress={uploadVideo} disabled={uploading}>
        <Text style={s.btnText}>{uploading? 'UPLOADING...' : '+ UPLOAD'}</Text>
      </TouchableOpacity>

      <FlatList
        data={posts}
        keyExtractor={item => item.id.toString()}
        onRefresh={loadPosts}
        refreshing={loading}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Video source={{ uri: item.video_url }} style={s.video} useNativeControls resizeMode="cover" isLooping />
            <View style={s.info}>
              <Text style={s.user}>@{item.username}</Text>
              <Text style={s.caption}>{item.caption}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No videos yet. Be first to upload!</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 50 },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center', letterSpacing: 3, marginBottom: 10 },
  loading: { color: '#fff', marginTop: 10 },
  btn: { backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 30, alignItems: 'center' },
  btnText: { fontWeight: '900', fontSize: 16 },
  card: { marginBottom: 20, backgroundColor: '#111' },
  video: { width: '100%', height: 500, backgroundColor: '#222' },
  info: { padding: 12 },
  user: { color: '#fff', fontWeight: 'bold' },
  caption: { color: '#aaa', marginTop: 4 },
  empty: { color: '#666', textAlign: 'center', marginTop: 100 }
});
