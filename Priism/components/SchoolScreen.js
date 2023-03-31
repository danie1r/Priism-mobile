import { View , ScrollView, StyleSheet, Image, Alert } from 'react-native';
import { Button, Text, Divider, Appbar, TextInput, Card } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { db } from "./utils/firebaseConfig";
import { query, collection, doc, getDocs, where, getDoc, arrayUnion, arrayRemove, updateDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { textlogos } from '../images/textlogos/textlogos';
import { logos } from '../images/logos/logos';
import { useTheme } from 'react-native-paper';

const SchoolScreen = ({ navigation, route }) => {
    const [posts, setPosts] = useState([]);
    const [uni, setUni] = useState([]);
    const [groups, setGroups] = useState([]);
    const [groupObj, setGroupObj] = useState({});
    const [access, setAccess] = useState(false);
    const [isUni, setIsUni] = useState(false);
    const [canJoinSub, setCanJoinSub] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const isFocused = useIsFocused();
    const scrollRef = useRef();
    const didMount = useRef(true);
    const theme = useTheme();
    const auth = getAuth();
    const uid = auth.currentUser.uid;

    const adminOverride = Object.keys(route.params).includes('adminOverride') ? route.params.adminOverride : true;

    async function getPosts() {
        try {
            const docRef = query(collection(db, "posts"), where('school', '==', route.params.school));
            const querySnapshot = await getDocs(docRef);
            if(!querySnapshot.empty){
                const PostData = (querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    data['id'] = doc.id;
                    data.date = data.date.toDate();
                    return data;
                }));
                PostData.sort((a,b) => b.date - a.date);
                setPosts(PostData);
            }
        }
        catch(error){
            console.error(error);
        }
    }

    async function getAffil() {
        try {
            const getUname = query(collection(db, "users"), where("UID", "==", uid));
            const usernameSnapshot = await getDocs(getUname);
            usernameSnapshot.forEach((doc) => {
                setGroups(doc.get("groups"));
                if (doc.get('groups').includes(route.params.group)) {
                    setAccess(true);
                }
            });
          } catch (error) {
            console.error(error);
          }
    }

    async function getUni() {
        try {
            const getUname = query(collection(db, "users"), where("UID", "==", uid));
            const usernameSnapshot = await getDocs(getUname);
            let university = []
            usernameSnapshot.forEach((doc) => {
                university.push(doc.get('university'));
                if (doc.get('admin') != null) {
                    setIsAdmin(doc.get('admin').includes(route.params.group));
                }
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

     async function getIsUni() {
        try {
            const uniRef = doc(db, 'groups', route.params.group);
            const uniSnap = await getDoc(uniRef);
            if (!route.params.subsidiary) {
                setIsUni(uniSnap.get('isUniversity'));
                setGroupObj(uniSnap.data());
            } else {
                const subgroupRef = doc(db, `groups/${route.params.group.split('-')[0]}/subgroup`, route.params.group);
                const subgroupSnap = await getDoc(subgroupRef);
                setGroupObj(subgroupSnap.data());
            }
        } catch(err) {
            console.error(err);
        }
     }

    async function joinGroup() {
        try {
            if (!route.params.subsidiary){
                if (!isUni) {
                    const groupRef = doc(db, "groups", route.params.group);
                    await updateDoc(groupRef, {
                        users: arrayUnion(uid)
                    });

                    const usersGroupRef = doc(db, 'users', uid);
                    await updateDoc(usersGroupRef, {
                        groups: arrayUnion(route.params.group)
                    });
                }
            }
            else {
                const uniID = uni[0];
                const subGroupRef = doc(db, 'groups/'+uniID+'/subgroup', route.params.group);
                await updateDoc(subGroupRef, {
                    users: arrayUnion(uid)
                });
                const usersubGroupRef = doc(db, 'users', uid);
                await updateDoc(usersubGroupRef, {
                    groups: arrayUnion(route.params.group)
                });
            }
            setAccess(true);
            setGroups([...groups, route.params.group]);
        }  
        catch (error) {
            console.error(error);
        }
    }

    async function removeGroup() {
        try {
            const auth = getAuth();
            const uid = auth.currentUser.uid;
            if (!route.params.subsidiary){
                const q = query(collection(db, "groups"), where("GID","==", route.params.group));
                const isUniSnapshot = await getDocs(q);
                let isUni = false;
                isUniSnapshot.forEach((doc) => {
                    isUni = doc.get('isUniversity');
                });
                
                if (!isUni) {
                    const groupRef = doc(db, "groups", route.params.group);
                    await updateDoc(groupRef, {
                        users: arrayRemove(uid)
                    });

                    const usersGroupRef = doc(db, 'users', uid);
                    await updateDoc(usersGroupRef, {
                        groups: arrayRemove(route.params.group)
                    });
                }
            }
            else {
                const uniID = uni[0];
                const subGroupRef = doc(db, 'groups/'+uniID+'/subgroup', route.params.group);
                await updateDoc(subGroupRef, {
                    users: arrayRemove(uid)
                });
                const usersubGroupRef = doc(db, 'users', uid);
                await updateDoc(usersubGroupRef, {
                    groups: arrayRemove(route.params.group)
                });
            }
            let groupArr = groups;
            const idx = groups.indexOf(route.params.group);
            if (idx > -1) {
                groupArr.splice(idx, 1);
            }
            setAccess(false);
            setGroups(groupArr);
        }  
        catch (error) {
            console.error(error);
        }
    }
    
    const alertMessage = () => {
        Alert.alert(
            'Do you want to leave this group?','',
            [
                {
                    text: 'OK',
                    onPress: ()=>removeGroup()
                },
                {
                    text: "Cancel"
                }
            ]
        );
    }
    
    useEffect(() => {
        getUni();
        getIsUni();
        getAffil();
        scrollRef.current.scrollTo({
            y: 0
        });
    }, [isFocused]);

    useEffect(() => {
        if (didMount.current) {
            didMount.current = false;
        } else {
            if (route.params.subsidiary && route.params.group.split('-')[0] === uni[0]) {
                setCanJoinSub(true);
            }
        }
    }, [uni]);

    useEffect(() => {
        getPosts();
    }, [groups]);

    let pubPosts = [];
    let privPosts = [];
    let publicPosts = [];
    let privatePosts = [];
    let pubCount = 0;
    let privCount = 0;
    for(let i = 0; i < posts.length; i++) {

        if(posts[i].public && pubCount <= 5) {
            pubPosts.push(posts[i]);
            publicPosts.push(posts[i]);
            pubCount++;
        }
        else if(!posts[i].public && privCount <= 5) {
            privPosts.push(posts[i]);
            privatePosts.push(posts[i]);
            privCount++;
        }
    }

    const renderPublic = publicPosts.map(( item, index ) => {
        if(item.public) {

            let desc = item.body;

            if(desc.length > 50) {
                desc = desc.slice(0, 50) + '...';
            }

            return (
                <View key={index}>
                    <Text style={styles.titles}>
                        {item.title}
                    </Text>
                    <Text>
                        {desc}
                    </Text>
                    {index != publicPosts.length - 1 ? <Divider key={item.title + index} style={styles.divider} /> : <></>}
                </View>
            );
        }
    });

    const renderPrivate = privatePosts.map(( item, index ) => {
        if(!item.public) {

            let desc = item.body;

            if(desc.length > 50) {
                desc = desc.slice(0, 50) + '...';
            }

            return (
                <View key={index}>
                    <Text style={styles.titles}>
                        {item.title}
                    </Text>
                    <Text>
                        {desc}
                    </Text>
                    {index !== privatePosts.length - 1 ? <Divider key={item.title + index} style={styles.divider} /> : <></>}
                </View>
            );
        }
    });

    return (
        <View style={{flex:1}}>
            <Appbar.Header>
                <Appbar.Action 
                    icon={(props) => <Ionicons {...props} name='ios-chevron-back' />}
                    onPress={() => navigation.goBack()}
                />
            </Appbar.Header>
            <View style={styles.container}>
                <ScrollView 
                    ref={scrollRef} 
                    style={styles.scroll} 
                >
                    <View 
                        style={{
                            flexDirection:'row', 
                            alignItems:'center', 
                            justifyContent: 'center',
                            maxWidth: '100%',

                        }}
                    >
                        {
                            Object.keys(textlogos).includes(route.params.group) ?
                                <Image 
                                    source={textlogos[route.params.group].uri}
                                    style={{ 
                                        width: '95%', 
                                        height: undefined,
                                        aspectRatio: textlogos[route.params.group].ratio,
                                        backgroundColor: theme.colors.onPrimary,
                                        marginHorizontal: -10,
                                    }} 
                                />
                                : route.params.group.includes('-') ?
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            maxWidth: '95%'
                                        }}
                                    >
                                        <Image
                                            source={logos[route.params.group.split('-')[0]].uri}
                                            style={{
                                                height: 60,
                                                width: undefined,
                                                aspectRatio: logos[route.params.group.split('-')[0]].ratio,
                                                marginRight: 15,
                                                marginLeft: -20
                                            }}
                                        />
                                        <Text variant='headlineMedium'>{route.params.school}</Text>
                                    </View>
                                    :<Text variant='headlineMedium'>{route.params.school}</Text>
                        }
                    </View>
                    <View style={styles.schoolBio}>
                        <Text style={styles.schoolInfo}>General Info</Text>
                    </View>
                    <View style={{paddingVertical: 10}}>
                        {
                            (!isUni || canJoinSub) && (!isAdmin || !adminOverride) ?
                                groups.includes(route.params.group) ? 
                                    <Button 
                                        mode='outlined'
                                        onPress={alertMessage}
                                        style={{
                                            borderColor: theme.colors.primary,
                                            borderRadius: 5,
                                        }}
                                        labelStyle={{
                                            fontSize: 13
                                        }}
                                        contentStyle={{
                                            marginVertical: -10,
                                            height: 50
                                        }}
                                    >
                                        Leave Group
                                    </Button> 
                                    : 
                                    <Button 
                                        mode='contained'
                                        onPress={joinGroup}
                                        style={{borderRadius : 5}}
                                        labelStyle={{
                                            fontSize: 13
                                        }}
                                        contentStyle={{
                                            marginVertical: -10,
                                            height: 50
                                        }}
                                    >
                                        Join Group
                                    </Button>
                                : <></>
                            }
                    </View>
                    <Divider />
                    <View style={styles.feeds}>
                        <Card 
                            style={styles.feed} 
                            onPress={() => {
                                publicPosts.length !== 0 ?
                                    navigation.navigate('Feed', {
                                        school: route.params.school,
                                        posts: pubPosts,
                                        auth: 'Public',
                                        group: groupObj
                                    })
                                    : null
                            }}
                            mode='outlined'
                        >
                            <Card.Title title='Public' titleStyle={{ fontWeight : '600' }} />
                            <Divider style={styles.bigdivider} />
                            <Card.Content>
                                {publicPosts.length !== 0 ? renderPublic : <Text>There are no posts yet.</Text>}
                            </Card.Content>
                        </Card>
                        <Card 
                            style={styles.feed}
                            onPress={() => {
                                access && privatePosts.length !== 0 ? 
                                    navigation.navigate('Feed', {
                                        school: route.params.school,
                                        posts: privPosts,
                                        auth: 'Private',
                                        group: groupObj
                                    }) 
                                    : null
                            }}
                            mode='outlined'
                        >
                            <Card.Title title='Private' titleStyle={{ fontWeight : '600' }} />
                            <Divider style={styles.bigdivider} />
                            <Card.Content style={access ? null : styles.private}>
                                {access ? 
                                    privatePosts.length !== 0 ? renderPrivate : <Text>There are no posts yet.</Text>
                                    : <Ionicons name='ios-lock-closed' size={60} style={styles.privLock} />
                                }
                            </Card.Content>
                        </Card>
                    </View>
                </ScrollView>
            </View>
        </View>
    );

};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'white',
        width: '100%'
    },
    scroll: {
        padding: 10,
        paddingTop: 0,
        width: '100%'
    },
    schoolBio: {
        paddingVertical: 10
    },
    schoolName: {
        marginBottom: 20
    },
    schoolInfo: {
        marginVertical: 20
    },
    feeds: {
        marginVertical: 20,
    },
    feed: {
        marginBottom: 20
    },
    bigdivider: {
        height: 0.8,
        backgroundColor: 'black',
        marginBottom: 10
    },
    divider: {
        marginHorizontal: -5,
        height: 0.7,
        backgroundColor: 'black',
        marginVertical: 5,
    },
    titles: {
        fontWeight: '500'
    },
    private: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    privLock: {
        marginVertical: 20
    },
    headerBorder: {
        borderBottomColor: 'rgb(219,219,219)',
        borderBottomWidth: 0.5
    },
});

export default SchoolScreen;