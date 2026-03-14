import { Platform, DynamicColorIOS } from "react-native";
import {
  NativeTabs,
  Icon,
  Label,
} from "expo-router/unstable-native-tabs";

const tintColor =
  Platform.OS === "ios"
    ? DynamicColorIOS({ dark: "#7DFFA0", light: "#2A6B42" })
    : "#7DFFA0";

export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={tintColor}
      labelStyle={
        Platform.OS === "ios"
          ? {
              color: DynamicColorIOS({ dark: "white", light: "black" }),
            }
          : undefined
      }
    >
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scan">
        <Icon sf={{ default: "viewfinder", selected: "viewfinder" }} />
        <Label>Scan</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
