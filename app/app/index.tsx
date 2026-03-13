import { View } from "react-native";
import { Button } from "heroui-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button variant="primary">Hello World</Button>
    </View>
  );
}
