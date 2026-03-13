import { Platform, DynamicColorIOS } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";

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
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon
          sf={{ default: "map", selected: "map.fill" }}
          md="explore"
        />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scan">
        <NativeTabs.Trigger.Icon
          sf={{ default: "viewfinder", selected: "viewfinder" }}
          md="qr_code_scanner"
        />
        <NativeTabs.Trigger.Label>Scan</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
