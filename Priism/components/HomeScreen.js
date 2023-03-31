import {
  StyleSheet,
  StatusBar,
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import {
  Appbar,
  TextInput,
  Dialog,
  List,
  Portal,
  ActivityIndicator,
  Text,
} from "react-native-paper";
import { useIsFocused, useScrollToTop } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "./utils/firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  getDoc,
  query,
  documentId,
  where
} from "firebase/firestore";
import { async } from "@firebase/util";
import PostCard from "./GetPosts";

const HomeScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [postExists, setPostExists] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [top, setTop] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [displayPosts, setDisplayPosts] = useState([]);
  const [showSort, setShowSort] = useState(false);
  const [sort, setSort] = useState("newest");
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [banned, setBanned] = useState([]);
  const [fetchedUser, setFetchedUser] = useState();
  const isFocused = useIsFocused();
  const scrollRef = useRef();
  const didMount = useRef(true);

    useScrollToTop(scrollRef);
    
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        getPosts();
        setSort('newest');
        setTimeout(() => {
        setRefreshing(false);
        }, 2000);
    }, []);


  useEffect(() => {
    async function getUserGroups() {
      try {
        const getUserInfo = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(getUserInfo);
        if (userSnap.exists()) {
          const tempBanned = userSnap.get("bannedFrom");
          setMyGroups(userSnap.get('groups'));
          const getGroupInfo = collection(db, "groups");
          const groupSnap = await getDocs(getGroupInfo);
          let allgroups = {};
          let hasSubs = [];
          groupSnap.forEach((doc) => {
              allgroups[doc.id] = doc.data();
              if (doc.data().hasChildren) {
                hasSubs.push(doc.id);
              }
          });

          for (let i = 0; i < hasSubs.length; i++) {
              const getSubgroupInfo = collection(db, `groups/${hasSubs[i]}/subgroup`);
              const subgroupSnap = await getDocs(getSubgroupInfo);
              subgroupSnap.forEach((doc) => {
                  allgroups[doc.id] = doc.data();
              });
          }
          setGroups(allgroups);
          if (tempBanned != undefined) {
            setBanned(tempBanned);
          } else {
            setBanned(["N/A"]);
          }
          setFetchedUser(true);
        }

      } catch (e) {
        alert(e);
      }
    }
    getUserGroups();
    setSearch('');
  }, [isFocused]);

  async function getPosts() {
    try {
      const docRef = collection(db, "posts");
      const querySnapshot = await getDocs(docRef);
      if (!querySnapshot.empty) {
        let postArr = [];
        querySnapshot.forEach((doc) => {
          if (!banned.includes(doc.data().group)) {
            if (
              doc.data().public == true ||
              (myGroups.length > 0 && myGroups.includes(doc.data().group))
            ) {
              const data = doc.data();
              data["id"] = doc.id;
              data.date = data.date.toDate();
              postArr.push(data);
            }
          }
        });
        setPostExists(postArr.length > 0);
        if (postExists) {
            postArr.sort((a, b) => b.date - a.date);
            postArr.sort((a, b) => b.date - a.date);
        }
        setPosts(postArr);
        setDisplayPosts(postArr);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const onChangeSearch = (query) => {
    setSearch(query);
    const res = posts.filter((item) => {
      const tempTitle = item.title.toLowerCase();
      const tempBody = item.body.toLowerCase();
      return (
        tempTitle.includes(query.toLowerCase()) ||
        tempBody.includes(query.toLowerCase())
      );
    });
    setDisplayPosts(res);
  };

  useEffect(() => {
    if (didMount.current) {
      didMount.current = false;
    } else {
      getPosts();
    }
  }, [banned, isFocused]);

  function handleSort(sortby) {
    if (sortby === sort) {
      return;
    } else {
      let sortPost = displayPosts;
      if (sortby === "newest") {
        sortPost.sort((a, b) => b.date - a.date);
      } else if (sortby === "oldest") {
        sortPost.sort((a, b) => a.date - b.date);
      } else if (sortby === "upvote") {
        sortPost.sort((a, b) => b.upvotes - a.upvotes);
      } else {
        sortPost.sort((a, b) => a.upvotes - b.upvotes);
      }
      setSort(sortby);
      setDisplayPosts(sortPost);
      setTimeout(() => {
      }, 500);
      setShowSort(!showSort);
    }
  }

  const loadedPosts = displayPosts.map((post, index) => {
    return(
        <PostCard key={index} postObj={post} group={groups[post.group]} />
    );
  });

  return (
    <View style={{ flex: 1}}>
      <Appbar.Header
        style={
          top == 0 || showSearch
            ? styles.header
            : [styles.header, styles.headerBorder]
        }
      >
        <Appbar.Content title="Priism" style={styles.headerText} />
        <Appbar.Action
          icon={() => <Ionicons name="ios-search" size="20" />}
          onPress={() => {
            setShowSearch(!showSearch);
            setSearch('');
            onChangeSearch('');
        }}
          animated={false}
          style={{ marginRight: -5 }}
        />
        <Appbar.Action
          icon={() => <MaterialCommunityIcons name="sort-variant" size="20" />}
          animated={false}
          onPress={() => setShowSort(!showSort)}
        />
      </Appbar.Header>
      <View style={styles.container}>
        <Portal>
          <Dialog
            visible={showSort}
            onDismiss={() => setShowSort(false)}
            style={styles.sortDialog}
          >
            <Dialog.Content style={styles.sortContent}>
              <List.Section style={styles.sortList}>
                <List.Item
                  title="Newest"
                  left={() => (
                    <MaterialCommunityIcons name="sort-variant" size="20" />
                  )}
                  onPress={() => handleSort("newest")}
                />
                <List.Item
                  title="Oldest"
                  left={() => (
                    <MaterialCommunityIcons
                      name="sort-reverse-variant"
                      size="20"
                    />
                  )}
                  onPress={() => handleSort("oldest")}
                />
                <List.Item
                  title="Upvotes"
                  left={() => (
                    <MaterialCommunityIcons name="arrow-up" size="20" />
                  )}
                  onPress={() => handleSort("upvote")}
                />
                <List.Item
                  title="Upvotes"
                  left={() => (
                    <MaterialCommunityIcons name="arrow-down" size="20" />
                  )}
                  onPress={() => handleSort("downvote")}
                />
              </List.Section>
            </Dialog.Content>
          </Dialog>
        </Portal>
        {showSearch && (
          <View
            style={
              top == 0
                ? { width: "100%" }
                : [styles.headerBorder, { width: "100%" }]
            }
          >
            <TextInput
              placeholder="Search..."
              value={search}
              onChangeText={onChangeSearch}
              label="Search"
              mode="outlined"
              autoFocus={true}
              left={
                <TextInput.Icon
                  icon={(props) => (
                    <Ionicons {...props} name="ios-search" size="20" />
                  )}
                  style={{ marginTop: 15 }}
                />
              }
              style={styles.searchBar}
            />
          </View>
        )}
        <ScrollView
          ref={scrollRef}
          style={styles.topContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScroll={(e) => setTop(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle="16"
        >
          <StatusBar style="auto" />
          {postExists ? (
            posts.length > 0 ? (
              loadedPosts
            ) : (
              <ActivityIndicator animating={true} />
            )
          ) : (
            <Text variant="titleMedium">No Posts Made</Text>
          )}
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
  },
  topContainer: {
    width: "100%",
    padding: 15,
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
  headerText: {
    alignItems: "left",
    marginLeft: -30,
  },
  headerBorder: {
    borderBottomColor: "rgb(219,219,219)",
    borderBottomWidth: 0.5,
  },
  header: {
    height: 45,
  },
  searchBar: {
    marginLeft: 20,
    marginRight: 20,
    height: 40,
    backgroundColor: "rgb(255,255,255)",
    marginBottom: 10,
    width: "90%",
  },
  sortDialog: {
    width: "37%",
    marginTop: -320,
    borderRadius: 10,
    paddingVertical: -30,
    marginLeft: 235,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  sortContent: {
    backgroundColor: "transparent",
    paddingHorizontal: 10,
  },
  sortList: {
    backgroundColor: "transparent",
    marginVertical: -20,
  },
});

export default HomeScreen;
