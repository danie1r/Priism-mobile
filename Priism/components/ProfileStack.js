import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostViewScreen from './PostViewScreen';
import ProfileScreen from './ProfileScreen';
import SchoolScreen from './SchoolScreen';
import SettingsScreen from './SettingsScreen';
import EditPostScreen from './EditPostScreen';
import FeedScreen from './FeedScreen';

import Admin from './Admin';
import AdminUserAction from './AdminUserAction';

const ProfStack = createNativeStackNavigator();

const ProfileStack = ({ navigation }) => {
    return (
        <ProfStack.Navigator initialRouteName='Profile' screenOptions={{headerShown:false}}>
            <ProfStack.Screen name="Profile" component={ProfileScreen} />
            <ProfStack.Screen name="Settings" component={SettingsScreen} />
            <ProfStack.Screen name="PostView" component={PostViewScreen} />
            <ProfStack.Screen name="School" component={SchoolScreen} />
            <ProfStack.Screen name="EditPostScreen" component={EditPostScreen} />
            <ProfStack.Screen name="Feed" component={FeedScreen} />
            <ProfStack.Screen name="AdminPage" component={Admin} />
            <ProfStack.Screen name="AdminUserAction" component={AdminUserAction} />
        </ProfStack.Navigator>
    );
};

export default ProfileStack;