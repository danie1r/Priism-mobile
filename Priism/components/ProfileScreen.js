import { StyleSheet, StatusBar, View, RefreshControl } from "react-native";
import {
  Button,
  Text,
  Divider,
  Appbar,
  ActivityIndicator,
  useTheme
} from "react-native-paper";
import Octicons from "@expo/vector-icons/Octicons";
import { getAuth } from "firebase/auth";
import { db } from "./utils/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  documentId,
  get
} from "firebase/firestore";
import React from "react";
import { ScrollView } from "react-native";
import { useIsFocused, useScrollToTop } from '@react-navigation/native';
import PostCard from "./GetPosts";


const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = React.useState("");
  const [myPosts, setMyPosts] = React.useState([]);
  const [myGroups, setMyGroups] = React.useState([]);
  const [groupObj, setGroupObj] = React.useState({});
  const [postExists, setPostExists] = React.useState(true);
  const [subgroups, setSubgroups] = React.useState({});
  const [banned, setBanned] = React.useState([]);

  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = React.useState(false);

  const didMount = React.useRef(true);
  const scrollRef = React.useRef();

  const theme = useTheme();

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    getProfile()
    getPosts();
    setTimeout(() => {
    setRefreshing(false);
    }, 2000);
}, []);

  useScrollToTop(scrollRef);

  async function getProfile() {
    try {
      const auth = getAuth();
      const uid = auth.currentUser.uid;
      // const getUname = query(collection(db, "users"), where("UID", "==", uid));
      const getUname = doc(db, "users", uid);
      const usernameSnapshot = await getDoc(getUname);
      if(usernameSnapshot.exists()){
        setUser(usernameSnapshot.get("username"));
        setMyGroups(usernameSnapshot.get("groups"));
        const tempBanned = usernameSnapshot.get("bannedFrom");
        if (tempBanned != undefined) {
          setBanned(tempBanned);
        } else {
          setBanned(["N/A"]);
        }
      };
    } catch (error) {
      console.error(error);
    }
  }

  async function getGroups() {
    try {
      if (myGroups.length == 0) {return}
      const groupRef = collection(db, 'groups');
      const groupSnap = await getDocs(groupRef);
      let groups = {};
      let hasSubs = '';
      groupSnap.forEach((doc) => {
        if (myGroups.includes(doc.id)) {
          groups[doc.id] = { name : doc.get('name') };
          if (doc.data().hasChildren) {
            hasSubs = doc.id;
          }
        }
      });

      if (hasSubs != '') {
        const subgroupRef = collection(db, 'groups/' + hasSubs + '/subgroup');
        const subgroupSnap = await getDocs(subgroupRef);
        groups[hasSubs]['subgroups'] = {};
        subgroupSnap.forEach((doc) => {
          if (myGroups.includes(doc.id)) {
            groups[hasSubs].subgroups[doc.id] = { name : doc.get('name') };
          }
        });
      }
      setGroupObj(groups);
    }
    catch(err) {
      console.error(err);
    }
  }

  async function getPosts() {
    try {
      const myPostQ = query(
        collection(db, "posts"),
        where("username", "==", user)
      );
      const myPostSnap = await getDocs(myPostQ);
      if (!myPostSnap.empty) {
        let myPostArr = [];
        myPostSnap.forEach((doc) => {
          if (!banned.includes(doc.data().group)){
            const data = doc.data();
            data['id'] = doc.id;
            data.date = data.date.toDate();
            myPostArr.push(data);
          }
        });
        myPostArr.sort((a,b) => b.date - a.date);
        setMyPosts(myPostArr);
        setPostExists(myPostArr.length > 0);
      }
    } catch (err) {
      console.error(err);
    }
  }

  React.useEffect(() => {
    getProfile();
  }, [isFocused]);

  React.useEffect(() => {
    getGroups();
  }, [myGroups]);

  React.useEffect(() => {
    if (didMount.current) {
      didMount.current = false;
    } else {
      getPosts();
    }
  }, [groupObj]);

  const renderGroups = Object.keys(groupObj).map((group) => {
    let renderSubgroups = () => (<></>);
    if (Object.keys(groupObj[group]).includes('subgroups')) {
      renderSubgroups = Object.keys(groupObj[group].subgroups).map((sub) => {
        return (
          <Button
            key={sub}
            mode='text'
            style={[styles.affils, {marginLeft: 20}]}
            onPress={() => navigation.navigate('School', {
              school: groupObj[group].subgroups[sub].name,
              group: sub,
              subsidiary: true
            })}
            textColor={theme.colors.secondary}
          >
            {`• ${groupObj[group].subgroups[sub].name}`}
          </Button>
        );
      })
    }

    
    return (
      <>
        <Button
          key={group}
          mode="text"
          style={styles.affils}
          onPress={() => navigation.navigate("School", {
            school: groupObj[group].name,
            group: group,
            subsidiary: false
          })}
          >
          {`• ${groupObj[group].name}`}
        </Button>
        {renderSubgroups}
      </>
    );
  });

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content title={user} style={styles.headerText} />
        <Appbar.Action
          icon={(props) => <Octicons {...props} name="gear" />}
          onPress={() => navigation.navigate("Settings")}
        />
      </Appbar.Header>
      <View style={styles.container}>
        <ScrollView ref={scrollRef} style={styles.topContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        >
          
          <StatusBar style="auto" />
          <View style={styles.bio}>
            <Text variant="titleMedium">Affiliations</Text>
            {renderGroups}
          </View>
          <Divider style={styles.div} />
          {
            postExists ?
                myPosts.length > 0 ? 
                  myPosts.map((post, index) => {
                    let group = groupObj[post.group];
                    if (post.group.includes('-')) {
                      group = groupObj[post.group.split('-')[0]].subgroups[post.group];
                    }
                    return(
                      <PostCard key={index} postObj={post} group={group} />
                    );
                  }) 
                  : <ActivityIndicator animating={true} />
                : 
                <Text variant="titleMedium">No Posts Made</Text>
          }
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "white",
    width: '100%'
  },
  topContainer: {
    padding: 15,
    width: '100%'
  },
  posttitle: {
    flex: 1,
    flexDirection: "row",
    padding: 20,
  },
  card: {
    flex: 1,
    margin: 2,
    paddingBottom: 5,
    marginBottom: 20,
  },
  bio: {
    marginVertical: 10,
    flexDirection: "column",
    alignItems: "left",
  },
  name: {
    marginBottom: 30,
  },
  affText: {
    marginBottom: 10,
  },
  affils: {
    textAlign: "left",
  },
  div: {
    marginVertical: 10,
  },
  headerText: {
    alignItems: "left",
    marginLeft: -30,
  },
});

export default ProfileScreen;
