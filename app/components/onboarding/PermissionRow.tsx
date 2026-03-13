import { View, Text } from "react-native";
import { Button, Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";

interface PermissionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  granted: boolean;
  onRequest: () => void;
}

export function PermissionRow({
  icon,
  title,
  description,
  granted,
  onRequest,
}: PermissionRowProps) {
  return (
    <Card variant="secondary" className="flex-row items-center gap-4">
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: granted
            ? "rgba(125,255,160,0.15)"
            : "rgba(148,163,184,0.1)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={icon}
          size={24}
          color={granted ? "#7DFFA0" : "#94A3B8"}
        />
      </View>
      <View className="flex-1">
        <Text className="text-foreground text-base font-semibold">
          {title}
        </Text>
        <Text className="text-muted text-sm">{description}</Text>
      </View>
      <View style={{ width: 88, minWidth: 88, alignItems: "flex-end" }}>
        {granted ? (
          <Ionicons name="checkmark-circle" size={24} color="#7DFFA0" />
        ) : (
          <Button size="sm" variant="secondary" onPress={onRequest}>
            <Button.Label>Grant</Button.Label>
          </Button>
        )}
      </View>
    </Card>
  );
}
