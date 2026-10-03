import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, StatusBar, SafeAreaView, TextInput, FlatList } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Camera, CameraType } from 'expo-camera';
import { supabase } from './supabase';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [activeTab, setActiveTab] = useState('Feed');
  const [isLive, setIsLive] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [chat, setChat] = useState([
    {id: 1, user: 'amelia._', text: 'Yooo London is lit tonight 🔥'},
    {id: 2, user: 'jordan.k', text: 'FAME is taking over!'},
  ]);
  const [message, setMessage] = useState('');
  const [viewers, setViewers] = useState(124);
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    fetchPosts();
    const channel = supabase.channel('fame-live')
     .on('broadcast', {event: 'chat'}, (payload) => {
        setChat(prev => [...prev, payload.payload]);
        setViewers(v => v + 1);
      }).subscribe();
    return () => { supabase.removeChannel(channel) }
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase.from('posts').select('*').order('created_at', {ascending: false});
    if(!error && data) setPosts(data);
  };

  const sendMessage = async () => {
    if(!message.trim()) return;
    const newMsg = {user: 'You', text: message, id: Date.now()};
    setChat(prev => [...prev, newMsg]);
    await supabase.channel('fame-live').send({
      type: 'broadcast', event: 'chat', payload: newMsg
    });
    setMessage('');
  };

  const pickAndPost = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
    });
    if(result.canceled) return;
    setUploading(true);
    try {
      const file = result.assets[0];
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const fileName = Date.now()+'_fame.mp4';
      const { error: upError } = await supabase.storage.from('videos').upload(fileName, blob, {contentType: 'video/mp4'});
      if(upError) throw upError;
      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);
      const { error: dbError } = await supabase.from('posts').insert([{video_url: urlData.publicUrl, caption, user_name: 'matenefofana'}]);
      if(dbError) throw dbError;
      setCaption('');
      fetchPosts();
      setActiveTab('Feed');
      alert('Posted to FAME! 🔥');
    } catch(e) { alert(e.message) }
    setUploading(false);
  };

  if (activeTab === 'Live' && isLive) {
    return (
      <SafeAreaView style={styles.liveContainer}>
        <Camera style={styles.camera} type={CameraType.front} ref={cameraRef}>
          <View style={styles.liveHeader}>
            <View style={styles.liveBadge}><Text style={styles.liveText}>🔴 LIVE</Text></View>
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
          <TouchableOpacity style={[styles.topBtn, activeTab==='Live' && styles.topBtnActive]} onPress={() => setActiveTab('Live')}><Text style={[styles.topBtnText, activeTab==='Live' && styles.topBtnTextActive]}>Live</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.topBtn, activeTab==='Chat' && styles.topBtnActive]} onPress={() => setActiveTab('Chat')}><Text style={[styles.topBtnText, activeTab==='Chat' && styles.topBtnTextActive]}>Chat</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.topBtn, activeTab==='Wall' && styles.topBtnActive]} onPress={() => setActiveTab('Explorer')}><Text style={[styles.topBtnText, activeTab==='Explorer' && styles.topBtnTextActive]}>Wall</Text></TouchableOpacity>
        </View>
      </View>

      {activeTab === 'Live' && (
        <View style={styles.goLiveSection}>
          <View style={styles.goLiveCard}>
            <Text style={styles.goLiveTitle}>Go Live on FAME 🔴</Text>
            <Text style={styles.goLiveSub}>London is watching - start your fame now</Text>
            <TouchableOpacity style={styles.goLiveBtn} onPress={() => setIsLive(true)}><Text style={styles.goLiveBtnText}>START LIVE</Text></TouchableOpacity>
            <Text style={styles.viewerPreview}>🔥 {viewers} viewers waiting</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.feed}>
        {activeTab === 'Feed' && (
          <>
            <View style={styles.storiesSection}>
              <Text style={styles.sectionTitle}>Stories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stories}>
                <View style={styles.storyItem}><View style={[styles.storyRing, {backgroundColor:'#D4AF37'}]}><Text style={styles.storyPlus}>+</Text></View><Text style={styles.storyName}>Your Story</Text></View>
                {['amelia._','jordan.k','luxe_d','marc._'].map((n,i) => (
                  <View key={i} style={styles.storyItem}><Image source={{uri: `https://i.pravatar.cc/100?img=${i+10}`}} style={styles.storyImg} /><Text style={styles.storyName}>{n}</Text></View>
                ))}
              </ScrollView>
            </View>
            {posts.length===0 && <Text style={{color:'#666', textAlign:'center', marginTop:30}}>No posts yet - Create first! 🔥</Text>}
            {posts.map((p,i) => (
              <View key={i} style={styles.post}>
                <View style={[styles.postHeader, {justifyContent:'space-between'}]}>
                  <View style={{flexDirection:'row', alignItems:'center'}}><Image source={{uri: 'https://i.pravatar.cc/100'}} style={{width:32,height:32,borderRadius:16}} /><Text style={{color:'#fff', marginLeft:8}}>{p.user_name || 'fame_user'}</Text></View>
                </View>
                <Video source={{uri: p.video_url}} style={styles.postMedia} shouldPlay={false} isLooping resizeMode="cover" useNativeControls />
                <View style={{flexDirection:'row', padding:10, gap:15}}><Text style={{color:'#fff'}}>❤️ {p.likes || 0}</Text><Text style={{color:'#fff'}}>💬 {p.comments || 0}</Text></View>
                {p.caption? <Text style={{color:'#fff', paddingHorizontal:12, paddingBottom:10}}>{p.caption}</Text> : null}
              </View>
            ))}
          </>
        )}

        {activeTab === 'Explorer' && (
          <View style={{flexDirection:'row', flexWrap:'wrap'}}>
            {posts.map((p,i) => (
              <View key={i} style={{width:'33.3%', height:150, padding:1}}><Image source={{uri: p.video_url}} style={{width:'100%', height:'100%', backgroundColor:'#222'}} /></View>
            ))}
            {posts.length===0 && <Text style={{color:'#666', textAlign:'center', width:'100%', marginTop:50}}>Explorer empty - post videos!</Text>}
          </View>
        )}

        {activeTab === 'Create' && (
          <View style={{padding:20, alignItems:'center'}}>
            <Text style={styles.goLiveTitle}>Create FAME</Text>
            <TextInput style={[styles.chatInput, {width:'100%', marginTop:15, backgroundColor:'#111'}]} placeholder="Write a caption..." placeholderTextColor="#666" value={caption} onChangeText={setCaption} multiline />
            <TouchableOpacity style={[styles.goLiveBtn, {marginTop:20, backgroundColor:'#D4AF37', width:'100%'}]} onPress={pickAndPost} disabled={uploading}>
              <Text style={[styles.goLiveBtnText, {color:'#000'}]}>{uploading? 'POSTING...' : 'Pick Video & POST 🔥'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Profile' && (
          <View style={{padding:10}}>
            <View style={{alignItems:'center', padding:20}}><Image source={{uri:'https://i.pravatar.cc/200?img=5'}} style={{width:80,height:80,borderRadius:40, borderWidth:2, borderColor:'#D4AF37'}} /><Text style={{color:'#fff', fontSize:20, fontWeight:'800', marginTop:10}}>Matene F.</Text><Text style={{color:'#999'}}>8.7K followers • {posts.length} posts</Text></View>
            <View style={{flexDirection:'row', flexWrap:'wrap'}}>
              {posts.filter(p=>p.user_name==='matenefofana').map((p,i) => (
                <View key={i} style={{width:'33.3%', height:150, padding:1}}><Video source={{uri: p.video_url}} style={{width:'100%', height:'100%'}} shouldPlay={false} resizeMode="cover" /></View>
              ))}
            </View>
            <Text style={{color:'#D4AF37', textAlign:'center', marginTop:20}}>Profile Grid - like IG 🔥 {posts.length} videos</Text>
          </View>
        )}

        {activeTab === 'Inbox' && (
          <View style={{padding:20}}><Text style={styles.sectionTitle}>Inbox</Text><Text style={{color:'#666'}}>Messages coming soon</Text></View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        {['Feed','Explorer','Create','Inbox','Profile'].map((name,i) => (
          <TouchableOpacity key={name} style={styles.navItem} onPress={() => setActiveTab(name)}>
            <Text style={[styles.navIcon, activeTab===name && styles.navIconActive]}>{i===2? '+' : '●'}</Text>
            <Text style={[styles.navText, activeTab===name && styles.navTextActive]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 16, backgroundColor: '#000' },
  logo: { fontSize: 42, fontWeight: '900', color: '#D4AF37', textAlign: 'center' },
  topButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap:8 },
  topBtn: { flex: 1, borderWidth: 1, borderColor: '#D4AF37', borderRadius: 10, padding: 10, alignItems:'center' },
  topBtnActive: { backgroundColor: '#D4AF37' },
  topBtnText: { color: '#D4AF37', fontWeight: '600' },
  topBtnTextActive: { color: '#000' },
  goLiveSection: { padding: 16 },
  goLiveCard: { backgroundColor: '#111', borderRadius: 16, padding: 20, borderWidth:1, borderColor:'#222' },
  goLiveTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  goLiveSub: { color: '#999', marginTop: 4 },
  goLiveBtn: { backgroundColor: '#FF0000', borderRadius: 25, paddingHorizontal: 40, paddingVertical:12, marginTop:15, alignItems:'center' },
  goLiveBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  viewerPreview: { color: '#D4AF37', marginTop: 10 },
  sectionTitle: { color: '#D4AF37', fontSize: 16, marginBottom: 10 },
  storiesSection: { padding: 12 },
  stories: { flexDirection: 'row' },
  storyItem: { alignItems: 'center', marginRight: 16 },
  storyRing: { width: 62, height: 62, borderRadius: 31, justifyContent: 'center', alignItems:'center', backgroundColor:'#222' },
  storyPlus: { fontSize: 28, color:'#000' },
  storyImg: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#D4AF37' },
  storyName: { color: '#fff', fontSize: 12, marginTop: 4 },
  feed: { flex: 1 },
  post: { backgroundColor: '#0A0A0A', marginBottom: 10 },
  postHeader: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  postMedia: { width: '100%', height: 320 },
  bottomNav: { flexDirection: 'row', backgroundColor: '#000', borderTopWidth: 1, borderTopColor:'#222', paddingVertical:8 },
  navItem: { flex:1, alignItems: 'center' },
  navIcon: { color: '#666', fontSize: 22 },
  navIconActive: { color: '#D4AF37' },
  navText: { color: '#666', fontSize: 11 },
  navTextActive: { color: '#D4AF37' },
  liveContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  liveHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop:40 },
  liveBadge: { backgroundColor: 'red', flexDirection: 'row', borderRadius: 8, padding:6 },
  liveText: { color: '#fff', fontWeight: '800' },
  endBtn: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 16, paddingVertical:6 },
  endText: { color: '#000', fontWeight: '700' },
  liveChat: { position: 'absolute', bottom: 20, left: 10, right: 10, height: 300 },
  chatBubble: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 8, marginBottom:6, flexDirection:'row' },
  chatUser: { color: '#D4AF37', fontWeight: '700', fontSize: 13 },
  chatText: { color: '#fff', fontSize: 13, flex: 1 },
  chatInputRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal:15, paddingVertical:10, color:'#fff' },
  sendBtn: { backgroundColor: '#D4AF37', borderRadius: 20, paddingHorizontal: 18, justifyContent:'center' },
  sendText: { color: '#000', fontWeight: '700' },
});
