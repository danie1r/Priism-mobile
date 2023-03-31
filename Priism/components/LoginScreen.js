import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  StyleSheet,
  Touchable,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { TextInput, useTheme, Text, Divider } from "react-native-paper";
import { auth } from "./utils/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./utils/firebaseConfig";

const LoginScreen = () => {
  const [userInput, setUserInput] = useState();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [isUsername, setIsUsername] = useState();
  const [verifiedBefore, setVerifiedBefore] = useState(false);

  const navigation = useNavigation();
  const theme = useTheme();
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        navigation.replace("BottomNav");
      }
    });
  }, []);

  useEffect(() => {
    const handleUsernameLogin = async () => {
      if (isUsername == true) {
        const usernameExists = query(
          collection(db, "users"),
          where("username", "==", userInput)
        );
        const usernameSnapshot = await getDocs(usernameExists);
        if (!usernameSnapshot.empty) {
          usernameSnapshot.forEach((doc) => {
            setEmail(doc.get("email"));
          });
        } else {
          navigation.replace("LoginScreen");
          alert("Username Does not Exist");
        }
      }
    };
    handleUsernameLogin();
  }, [isUsername]);

  useEffect(() => {
    async function login() {
      if (email != undefined) {
        try {
          await signInWithEmailAndPassword(auth, email, password).then(
            async (authUser) => {
              if (authUser.user.emailVerified) {
                navigation.replace("BottomNav");
              } else {
                Alert.alert(
                  "Email Not Verified",
                  "You must verify your email to continue",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        auth.signOut().then(() => {
                          navigation.replace("LoginScreen");
                        });
                      },
                    },
                  ]
                );
              }
            }
          );
        } catch (error) {
          navigation.replace("LoginScreen");
          alert(error.message);
        }
      }
    }
    login();
  }, [email]);

  const handleConvert = async () => {
    // console.log(email);
    if (!userInput.includes("@")) {
      setIsUsername(true);
    } else {
      setIsUsername(false);
      setEmail(userInput);
    }
  };

  const switchToSignUpPage = () => {
    navigation.replace("SignUp");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.onPrimary }]}
      behavior="padding"
    >
      <View style={styles.inputContainer}>
        <View style={styles.logoWrap}>
          <Text variant="displaySmall">Priism</Text>
        </View>
        <TextInput
          label="Username or Email"
          placeholder="Enter Username or Email"
          mode="outlined"
          value={userInput}
          onChangeText={(text) => setUserInput(text)}
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          label="Password"
          placeholder="Enter Password"
          mode="outlined"
          value={password}
          onChangeText={(text) => setPassword(text)}
          style={styles.input}
          secureTextEntry={secure}
          right={
            <TextInput.Icon
              icon={secure ? "eye" : "eye-off"}
              onPress={() => setSecure(!secure)}
              style={{ marginTop: 14 }}
            />
          }
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleConvert}
          style={[
            styles.button,
            styles.buttonText,
            {
              backgroundColor:
                !userInput || !password
                  ? "rgb(149,171,253)"
                  : theme.colors.primary,
            },
          ]}
          disabled={!userInput || !password}
        >
          <Text variant="bodySmall" style={styles.buttonText}>
            Log In
          </Text>
        </TouchableOpacity>
        <View style={styles.section}>
          <View
            style={{ flex: 1, height: 1, backgroundColor: "rgb(219,219,219)" }}
          />
          <Text style={styles.sectionText}>OR</Text>
          <View
            style={{ flex: 1, height: 1, backgroundColor: "rgb(219,219,219)" }}
          />
        </View>
        <View style={styles.signupWrap}>
          <Text style={{ color: "rgb(147,147,147)" }}>
            Don't have an account?
          </Text>
          <Text
            style={{ color: theme.colors.secondary }}
            onPress={switchToSignUpPage}
          >
            {" "}
            Sign Up
          </Text>
          <Text style={{ color: "rgb(147,147,147)" }}>.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  inputContainer: {
    width: "90%",
  },
  input: {
    backgroundColor: "white",
    marginTop: 5,
    height: 40,
  },
  buttonContainer: {
    width: "90%",
    justifyContent: "center",
    alignItem: "center",
    marginTop: 50,
  },
  button: {
    width: "100%",
    padding: 0,
    borderRadius: 5,
    alignItems: "center",
    height: 40,
    justifyContent: "center",
  },
  buttonOutline: {
    backgroundColor: "white",
    marginTop: 5,
    borderColor: "#7FEEFF",
    borderWidth: 2,
  },
  buttonOutlineText: {
    color: "#7FEEFF",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    marginVertical: 50,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    justifyContent: "center",
  },
  sectionText: {
    color: "rgb(147,147,147)",
    fontSize: 12,
    fontWeight: "500",
    marginHorizontal: 15,
  },
  signupWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
