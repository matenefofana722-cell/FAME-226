import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

export default function App() {
  const posts = [1,2,3];

  return (
    <View style={s.c}>
      <Text style={s.logo}>FAME</Text>
      <ScrollView>
        {posts.map((p,i)=>(
          <View key={i} style={s.post}>
            <View style={s.v} />
            <View style={s.a}>
              <TouchableOpacity style={[s.btn,{backgroundColor:'red'}]}>
                <Text style={{fontWeight:'900',color:'white'}}>HEAT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn,{backgroundColor:'blue'}]}>
                <Text style={{fontWeight:'900',color:'white'}}>BOOST</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s=StyleSheet.create({
  c:{flex:1,backgroundColor:'black',paddingTop:40},
  logo:{color:'white',fontSize:28,fontWeight:'900',padding:15},
  post:{margin:10,borderWidth:1,borderColor:'gray',borderRadius:20,overflow:'hidden'},
  v:{height:420,backgroundColor:'black'},
  a:{flexDirection:'row',gap:10,padding:12},
  btn:{paddingHorizontal:18,paddingVertical:11,borderRadius:30}
});
