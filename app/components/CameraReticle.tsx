import { View } from "react-native";

interface CameraReticleProps {
  size?: number;
}

export function CameraReticle({ size = 240 }: CameraReticleProps) {
  const cornerLength = 32;
  const bw = 3;
  const r = 14;
  const color = "rgba(125, 255, 160, 0.6)";

  const corner = {
    position: "absolute" as const,
    width: cornerLength,
    height: cornerLength,
    borderColor: color,
  };

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          corner,
          {
            top: 0,
            left: 0,
            borderTopWidth: bw,
            borderLeftWidth: bw,
            borderTopLeftRadius: r,
          },
        ]}
      />
      <View
        style={[
          corner,
          {
            top: 0,
            right: 0,
            borderTopWidth: bw,
            borderRightWidth: bw,
            borderTopRightRadius: r,
          },
        ]}
      />
      <View
        style={[
          corner,
          {
            bottom: 0,
            left: 0,
            borderBottomWidth: bw,
            borderLeftWidth: bw,
            borderBottomLeftRadius: r,
          },
        ]}
      />
      <View
        style={[
          corner,
          {
            bottom: 0,
            right: 0,
            borderBottomWidth: bw,
            borderRightWidth: bw,
            borderBottomRightRadius: r,
          },
        ]}
      />
    </View>
  );
}
