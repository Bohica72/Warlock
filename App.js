import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { initialiseData } from "./src/utils/DataLoader";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
	useEffect(() => {
		initialiseData();
	}, []); // ← empty array means "run once on startup, never again"

	return (
		<SafeAreaProvider>
			<NavigationContainer>
				<RootNavigator />
			</NavigationContainer>
		</SafeAreaProvider>
	);
}
