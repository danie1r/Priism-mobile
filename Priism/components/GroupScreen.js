import {
   SafeAreaView,
   StyleSheet,
   StatusBar,
   View,
   ScrollView,
 } from "react-native";
 import { useIsFocused } from "@react-navigation/native";
 import {
   Button,
   Text,
   TextInput,
   Switch,
   useTheme
 } from "react-native-paper";
 import React, { useState, useEffect } from "react";
 import { getAuth, onAuthStateChanged } from "firebase/auth";
 import { auth } from "./utils/firebaseConfig";
 import {
   doc,
   collection,
   query,
   where,
   getDocs,
   getDoc,
   deleteDoc,
   addDoc,
   documentId,
   setDoc,
   updateDoc,
   push,
   arrayUnion
 } from "firebase/firestore";
 import { db } from "./utils/firebaseConfig";
 import { Alert } from "react-native";
 import { getDatabase, ref, set } from "firebase/database";
 import Ionicons from '@expo/vector-icons/Ionicons';
 import { useNavigation } from "@react-navigation/native";

const GroupScreen = () => {
   const [name, setName] = useState("");
   const [uni, setUni] = useState([]);
   const [subsidiary, setSubsidiary] = useState(true);
   const navigation = useNavigation();

   const theme = useTheme();
   
   const auth = getAuth();
   const userid = auth.currentUser.uid;

   async function getUni() {
      try {
          const getUname = query(collection(db, "users"), where("UID", "==", userid));
          const usernameSnapshot = await getDocs(getUname);
          let university = []
          usernameSnapshot.forEach((doc) => {
              university.push(doc.get('university'));
          });

          const getUniName = doc(db, 'groups', university[0]);
          const uniSnapshot = await getDoc(getUniName);
          if (uniSnapshot.exists()) {
              university.push(uniSnapshot.get('name'));
          }
          setUni(university);
      } catch(err) {
          console.log(err);
      }
   };

   useEffect(() => {
      getUni();
   }, []);


   async function createGroup() {
       try {
           const path = subsidiary ? 'groups/'+uni[0]+'/subgroup' : 'groups'
           const docRef = doc(collection(db, path));
           const groupData = {
               GID: docRef.id,
               admin: [userid],
               bannedUsers: [],
               name: name,
               hasChildren: false,
               users: [userid],
               isUniversity: false
           };
           await setDoc(docRef, groupData);
           setName("");

           const userRef = doc(db, "users", userid);
           await updateDoc(userRef, {
             groups: arrayUnion(docRef.id),
             admin: arrayUnion(docRef.id)
           });

           if (subsidiary){
            const docRef2 = doc(db, path, uni[0]+'-'+docRef.id);
            const groupData2 = {
              admin: [userid],
              bannedUsers: [],
              name: name,
              parent: uni[0],
              users: [userid],
              GID: uni[0]+'-'+docRef.id
            }
            
            await setDoc(docRef2, groupData2);
            await deleteDoc(doc(db, path ,docRef.id));
            const userRef2 = doc(db, "users", userid);
            await updateDoc(userRef2, {
             groups: arrayUnion(uni[0]+'-'+docRef.id),
             admin: arrayUnion(uni[0]+'-'+docRef.id)
           });
            const schoolRef2 = doc(db, 'groups', uni[0]);
            const schoolSnap2 = await getDoc(schoolRef2);

            if (schoolSnap2.exists()) {
              if (!schoolSnap2.get('hasChildren')) {
                await updateDoc(schoolRef2, { hasChildren : true });
              }
            }
          }
          alert("Group successfully created.");
          navigation.navigate('School', {
            school: name,
            group: subsidiary ? uni[0] + '-' + docRef.id : docRef.id,
            subsidiary: subsidiary,
            adminOverride: true
          });
          } catch (error) {
           console.error(error);
       }
   }

   return (
      <ScrollView>
        <View style={styles.wrap}>
          <Text variant="headlineMedium" style={{fontSize : 20}}>Create as subsidiary of:</Text>
          <View style={styles.subWrap}>
            <Text variant="headlineSmall" style={{fontSize : 16}}>{uni[1]}</Text>
            <Switch 
              value={subsidiary} 
              onValueChange={() => setSubsidiary(!subsidiary)}
              style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }}
            />
          </View>
          <TextInput
            value={name}
            label="Group Name"
            placeholder="Enter Group Name"
            mode="outlined"
            onChangeText={(nextValue) => setName(nextValue)}
            dense={true}
            style={styles.title}
          />
        </View>
        <View style={styles.buttons}>
          <Button
            mode="contained"
            style={{ marginRight: 10 }}
            disabled={!name}
            onPress={createGroup}
          >
            Create
          </Button>
          <Button 
            mode='text' 
            textColor={theme.colors.secondary}
            onPress={() => navigation.navigate('Home')}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
   );
 };

const styles = StyleSheet.create({
   container: {
     flex: 1,
     flexDirection: "column",
     backgroundColor: "white",
   },
   wrap: {
    paddingHorizontal: 15,
    paddingTop: 15
   },
   subWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
    marginLeft: 20
   },
   title: {
    marginHorizontal: 10,
    marginVertical: 20,
  },
   buttons: {
     flexDirection: "row",
     alignItems: "flex-end",
     marginHorizontal: 20,
     justifyContent: "flex-end",
   },
 });

export default GroupScreen;