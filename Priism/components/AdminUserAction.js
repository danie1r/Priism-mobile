import React from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./utils/firebaseConfig";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  Button,
  ScrollView,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  List,
  Divider,
  Appbar,
  Searchbar,
  ActivityIndicator,
  TextInput
} from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { getAuth } from "firebase/auth";

class User {
  constructor(email, university, verified) {
    this.email = email;
    this.university = university;
    this.verified = verified;
  }
}

const AdminUserAction = ({ navigation, route }) => {
  const [users, setUsers] = React.useState([]);
  const [displayUser, setDisplayUser] = React.useState([]);
  const [queryText, setQueryText] = React.useState("");
  const [isSubgroup, setIsSubgroup] = React.useState(false);
  const [affiliation, setAffiliation] = React.useState("");
  const [userLoaded, setUserLoaded] = React.useState(false);
  
  React.useEffect(() => {
    async function userRequest() {
      const subgroupCheck = route.params.groupId.split("-");
      if (subgroupCheck.length > 1) {
        setIsSubgroup(true);
        setAffiliation(subgroupCheck[0]);
      }

      const userQ = query(
        collection(db, "users"),
        where("groups", "array-contains", route.params.groupId)
      );

      const docSnap = await getDocs(userQ);
      if (docSnap.size > 0) {
        console.log("We have members");
      }
      docSnap.forEach((doc) => {
        if (doc.id != getAuth().currentUser.uid) {
          var obj = {
            id: doc.id,
            email: doc.data().email,
          };
          setUsers((users) => [...users, obj]);
          setDisplayUser((displayUser) => [...displayUser, obj]);
        }
      });
      setUserLoaded(true);
    }
    userRequest();
  }, []);

  const onChangeSearch = (query) => {
    setQueryText(query);
    const res = users.filter((item) => {
      return item.email.includes(query);
    });
    setDisplayUser(res);
  };

  function banUser(item, index) {
    displayUser.map(async (item, i) => {
      if (index == i) {
        if (isSubgroup) {
          const docRef = doc(
            db,
            "groups/" + affiliation + "/subgroup",
            route.params.groupId
          );
          await updateDoc(docRef, {
            bannedUsers: arrayUnion(item.id),
          });
        } else {
          const docRef = doc(db, "groups", route.params.groupId);
          await updateDoc(docRef, {
            bannedUsers: arrayUnion(item.id),
          });
          // alert("Banned email: " + item.email);
        }
        const userRef = doc(db, "users", item.id);
        await updateDoc(userRef, {
          bannedFrom: arrayUnion(route.params.groupId),
        });
      }
    });
  }

  const loadedUsers = displayUser.map((item, index) => {
    return (
      <List.Accordion
        key={item.id}
        title={item.email}
        titleStyle={styles.userItem}
      >
        <List.Item
          title="Ban"
          left={(props) => (
            <MaterialCommunityIcons {...props} name="cancel" size="15" />
          )}
          titleStyle={styles.itemText}
          onPress={() => banUser(item, index)}
        />
      </List.Accordion>
    );
  });

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Action
          icon={(props) => <Ionicons {...props} name="ios-chevron-back" />}
          onPress={() => navigation.navigate("AdminPage")}
        />
        <Appbar.Content title="Manage Users" style={styles.headerText} />
      </Appbar.Header>
      <View style={styles.container}>
        <View>
          <TextInput
            placeholder="Search Users..."
            onChangeText={onChangeSearch}
            value={queryText}
            label='Search Users'
            mode='outlined'
            autoFocus={true}
            left={<TextInput.Icon icon={(props) => <Ionicons {...props} name="ios-search" size='20' />} style={{marginTop:15}}/>}
            style={styles.searchBar}
          />
          <ScrollView>
            <List.Section title="User List" titleStyle={{ fontWeight: "bold" }}>
              {userLoaded ? (
                displayUser.length > 0 ? (
                  loadedUsers
                ) : (
                  <Text style={{marginLeft: 15}}>No Users In Group</Text>
                )
              ) : (
                <ActivityIndicator animating={true} />
              )}
            </List.Section>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerText: {
    alignItems: "left",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  userItem: {
    fontSize: 15,
  },
  itemText: {
    fontSize: 13,
  },
  searchBar: {
    marginLeft: 20,
    marginRight: 20,
    height: 40,
    backgroundColor: 'rgb(255,255,255)',
    marginBottom: 10,
  },
});
export default AdminUserAction;
