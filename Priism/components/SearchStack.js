import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostViewScreen from './PostViewScreen';
import SchoolScreen from './SchoolScreen';
import SearchScreen from './SearchScreen';
import EditPostScreen from './EditPostScreen';
import FeedScreen from './FeedScreen';

const SStack = createNativeStackNavigator();

const SearchStack = ({ navigation }) => {
    return (
        <SStack.Navigator screenOptions={{headerShown:false}}>
            <SStack.Screen name="Search" component={SearchScreen} />
            <SStack.Screen name="School" component={SchoolScreen} />
            <SStack.Screen name="PostView" component={PostViewScreen} />
            <SStack.Screen name="EditPostScreen" component={EditPostScreen} />
            <SStack.Screen name="Feed" component={FeedScreen} />
        </SStack.Navigator>
    );
};

export default SearchStack;