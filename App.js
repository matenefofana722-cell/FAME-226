import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, StatusBar, SafeAreaView, TextInput, FlatList } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Camera, CameraType } from 'expo-camera';
import { supabase } from './supabase';
import { Video } from 'expo-av';
export default function App() {
  const [activeTab, setActiveTab] = useState('Live');
  const [isLive, setIsLive] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [chat, setChat] = useState([
    {id: 1, user: 'amelia._', text: 'Yooo London is lit tonight 🔥'},
    {id: 2, user: 'jordan.k', text: 'FAME is taking over!'},
  ]);
  const [message, setMessage] = useState('');
  const [viewers, setViewers] = useState(124);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Supabase Realtime for Live Chat
    const channel = supabase.channel('fame-live')
      .on('broadcast', {event: 'chat'}, (payload) => {
        setChat(prev => [...prev, payload.payload]);
        setViewers(v => v + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel) }
  }, []);

  const sendMessage = async () => {
    if(!message.trim()) return;
    const newMsg = {user: 'You', text: message};
    setChat(prev => [...prev, newMsg]);
    await supabase.channel('fame-live').send({
      type: 'broadcast', event: 'chat', payload: newMsg
    });
    setMessage('');
  };

  // LIVE SCREEN
  if (activeTab === 'Live' && isLive) {
    return (
      <SafeAreaView style={styles.liveContainer}>
        <Camera style={styles.camera} type={CameraType.front} ref={cameraRef}>
          <View style={styles.liveHeader}>
            <View style={styles.liveBadge}><Text style={styles.liveText}>🔴 LIVE</Text><Text style={styles.viewerText}> {viewers}</Text></View>
            <TouchableOpacity onPress={() => setIsLive(false)} style={styles.endBtn}><Text style={styles.endText}>End</Text></TouchableOpacity>
          </View>
          <View style={styles.liveChat}>
            <FlatList data={chat} keyExtractor={i => i.id.toString()} renderItem={({item}) => (
              <View style={styles.chatBubble}><Text style={styles.chatUser}>{item.user}: </Text><Text style={styles.chatText}>{item.text}</Text></View>
            )} />
            <View style={styles.chatInputRow}>
              <TextInput style={styles.chatInput} placeholder="Say something..." placeholderTextColor="#999" value={message} onChangeText={setMessage} />
              <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}><Text style={styles.sendText}>Send</Text></TouchableOpacity>
            </View>
          </View>
        </Camera>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <Text style={styles.logo}>FAME</Text>
        <View style={styles.topButtons}>
          <TouchableOpacity style={[styles.topBtn, activeTab==='Live' && styles.topBtnActive]} onPress={() => setActiveTab('Live')}>
            <Text style={[styles.topBtnText, activeTab==='Live' && styles.topBtnTextActive]}>• 👤 Live</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.topBtn, activeTab==='Chat' && styles.topBtnActive]} onPress={() => setActiveTab('Chat')}>
            <Text style={[styles.topBtnText, activeTab==='Chat' && styles.topBtnTextActive]}>💬 Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.topBtn, activeTab==='Wall' && styles.topBtnActive]} onPress={() => setActiveTab('Wall')}>
            <Text style={[styles.topBtnText, activeTab==='Wall' && styles.topBtnTextActive]}>🏆 Fame Wall</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'Live' && (
        <View style={styles.goLiveSection}>
          <View style={styles.goLiveCard}>
            <Text style={styles.goLiveTitle}>Go Live on FAME 🔴</Text>
            <Text style={styles.goLiveSub}>London is watching — start your fame now</Text>
            <TouchableOpacity style={styles.goLiveBtn} onPress={() => setIsLive(true)}>
              <Text style={styles.goLiveBtnText}>START LIVE</Text>
            </TouchableOpacity>
            <Text style={styles.viewerPreview}>🔥 {viewers} viewers waiting</Text>
          </View>
          
          <Text style={[styles.sectionTitle, {marginTop: 20}]}>Live Now in London</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1,2,3].map(i => (
              <View key={i} style={styles.livePreview}>
                <Image source={{uri: `https://i.pravatar.cc/200?img=${i+10}`}} style={styles.livePreviewImg} />
                <View style={styles.livePreviewBadge}><Text style={styles.livePreviewText}>LIVE • {100+i*23}</Text></View>
                <Text style={styles.livePreviewName}>user_{i}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.feed}>
        <View style={styles.storiesSection}>
          <Text style={styles.sectionTitle}>Stories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stories}>
            <View style={styles.storyItem}><View style={[styles.storyRing, {backgroundColor: '#FFD1D8'}]}><Text style={styles.storyPlus}>+</Text></View><Text style={styles.storyName}>Your Story</Text></View>
            {['amelia._','jordan.k','luxe_d','marc._'].map((n,i) => (
              <View key={i} style={styles.storyItem}><Image source={{uri: `https://i.pravatar.cc/100?img=${i+1}`}} style={styles.storyImg} /><Text style={styles.storyName}>{n}</Text></View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.post}>
  <View style={[styles.postHeader, {justifyContent:'space-between'}]}>
    <Image source={{uri: 'https://i.pravatar.cc/100'}} style={{width:32,height:32,borderRadius:16}} />
    <Text style={{color:'#fff', marginLeft:8}}>amelia._</Text>
    <TouchableOpacity style={{marginLeft:'auto', backgroundColor:'#222', padding:6, borderRadius:6}}><Text style={{color:'#fff'}}>⬇️ Download</Text></TouchableOpacity>
    <TouchableOpacity style={{marginLeft:8, backgroundColor:'red', padding:6, borderRadius:6}}><Text style={{color:'#fff'}}>🗑️</Text></TouchableOpacity>
  </View>
  <Video source={{uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}} style={{width:'100%', height:400}} shouldPlay isLooping resizeMode="cover" />
</View>
      </ScrollView>

      <View style={styles.bottomNav}>
        {['Feed','Explorer','Create','Inbox','Profile'].map((name,i) => (
          <TouchableOpacity key={name} style={styles.navItem} onPress={() => name==='Feed' && setActiveTab('Live')}>
            <Text style={[styles.navIcon, i===0 && styles.navIconActive]}>{i===2 ? '+' : '◍'}</Text>
            <Text style={[styles.navText, i===0 && styles.navTextActive]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 16, backgroundColor: '#000' },
  logo: { fontSize: 42, fontWeight: '900', color: '#D4AF37', textAlign: 'center', letterSpacing: 2 },
  topButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 8 },
  topBtn: { flex: 1, borderWidth: 1, borderColor: '#D4AF37', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  topBtnActive: { backgroundColor: '#D4AF37' },
  topBtnText: { color: '#D4AF37', fontWeight: '600' },
  topBtnTextActive: { color: '#000' },
  goLiveSection: { padding: 16 },
  goLiveCard: { backgroundColor: '#111', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#D4AF37', alignItems: 'center' },
  goLiveTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  goLiveSub: { color: '#999', marginTop: 4 },
  goLiveBtn: { backgroundColor: '#FF0000', borderRadius: 25, paddingHorizontal: 40, paddingVertical: 12, marginTop: 16 },
  goLiveBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  viewerPreview: { color: '#D4AF37', marginTop: 10 },
  sectionTitle: { color: '#D4AF37', fontSize: 16, marginBottom: 10 },
  storiesSection: { padding: 12 },
  stories: { flexDirection: 'row' },
  storyItem: { alignItems: 'center', marginRight: 16 },
  storyRing: { width: 62, height: 62, borderRadius: 31, justifyContent: 'center', alignItems: 'center' },
  storyPlus: { fontSize: 28 },
  storyImg: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#D4AF37' },
  storyName: { color: '#fff', fontSize: 12, marginTop: 4 },
  livePreview: { width: 120, marginRight: 12 },
  livePreviewImg: { width: 120, height: 160, borderRadius: 12 },
  livePreviewBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'red', borderRadius: 6, paddingHorizontal: 6 },
  livePreviewText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  livePreviewName: { color: '#fff', marginTop: 4, fontSize: 12 },
  feed: { flex: 1 },
  post: { backgroundColor: '#0A0A0A', marginBottom: 10 },
  postHeader: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#D4AF37' },
  postUser: { color: '#fff', fontWeight: '700' },
  postLocation: { color: '#999', fontSize: 12 },
  postMedia: { width: '100%', height: 320 },
  bottomNav: { flexDirection: 'row', backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#222', paddingVertical: 10, justifyContent: 'space-around' },
  navItem: { alignItems: 'center' },
  navIcon: { color: '#666', fontSize: 22 },
  navIconActive: { color: '#D4AF37' },
  navText: { color: '#666', fontSize: 11 },
  navTextActive: { color: '#D4AF37' },
  liveContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  liveHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
  liveBadge: { backgroundColor: 'red', flexDirection: 'row', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  liveText: { color: '#fff', fontWeight: '800' },
  viewerText: { color: '#fff' },
  endBtn: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 4 },
  endText: { color: '#000', fontWeight: '700' },
  liveChat: { position: 'absolute', bottom: 20, left: 10, right: 10, height: 300 },
  chatBubble: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 8, marginBottom: 6, flexDirection: 'row' },
  chatUser: { color: '#D4AF37', fontWeight: '700', fontSize: 13 },
  chatText: { color: '#fff', fontSize: 13, flex: 1 },
  chatInputRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 16, color: '#fff', height: 40 },
  sendBtn: { backgroundColor: '#D4AF37', borderRadius: 20, paddingHorizontal: 18, justifyContent: 'center' },
  sendText: { color: '#000', fontWeight: '700' },
});
