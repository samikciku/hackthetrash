import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import ReportScreen from "./src/screens/ReportScreen";
import MapScreen from "./src/screens/MapScreen";
import SuccessScreen from "./src/screens/SuccessScreen";

export type RootStackParamList = {
  Home: undefined;
  Report: undefined;
  Map: { lat?: number; lng?: number; id?: string } | undefined;
  Success: { lat: number; lng: number; id?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#16A34A" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" }
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "HackTheTrash" }} />
        <Stack.Screen name="Report" component={ReportScreen} options={{ title: "Report Trash" }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ title: "Trash Map" }} />
        <Stack.Screen name="Success" component={SuccessScreen} options={{ title: "Submitted" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
