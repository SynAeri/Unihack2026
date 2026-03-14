import React, { useCallback, useRef } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { GLView } from "expo-gl";
import { LinearGradient } from "expo-linear-gradient";
import { Asset } from "expo-asset";
import { Renderer } from "expo-three";
import {
  Scene,
  PerspectiveCamera,
  Mesh,
  Group,
  SphereGeometry,
  MeshBasicMaterial,
  Box3,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GrainyBackground } from "@/components/ui/GrainyBackground";

const SLIME_GLB = require("@/assets/images/Meshy_AI_Green_Jelly_Slime_0314055224_texture.glb");

export function Globe({ style }: { style?: ViewStyle }) {
  const rafRef = useRef<number | null>(null);

  const onContextCreate = useCallback((gl: any) => {
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new Scene();

    const camera = new PerspectiveCamera(
      50,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);

    const slimeGroup = new Group();
    scene.add(slimeGroup);

    const placeholder = new Mesh(
      new SphereGeometry(0.5, 32, 32),
      new MeshBasicMaterial({ color: 0x7dffa0 })
    );
    slimeGroup.add(placeholder);

    (async () => {
      try {
        const asset = Asset.fromModule(SLIME_GLB);
        await asset.downloadAsync();
        const uri = asset.localUri ?? asset.uri;
        if (!uri) return;
        const dir = uri.substring(0, uri.lastIndexOf("/") + 1);
        const loader = new GLTFLoader();
        loader.setResourcePath(dir);
        const { scene: glbScene } = await new Promise<any>((resolve, reject) => {
          loader.load(uri, resolve, undefined, reject);
        });
        slimeGroup.remove(placeholder);
        const box = new Box3().setFromObject(glbScene);
        const size = new Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        glbScene.scale.setScalar(1.2 / maxDim);
        slimeGroup.add(glbScene);
      } catch (e) {
        console.warn("Slime GLB load failed:", e);
      }
    })();

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      slimeGroup.rotation.y += 0.002;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  }, []);

  return (
    <View style={[styles.container, style]}>
      <GrainyBackground
        colors={["#070B14", "#0a0f1c", "#121b2e", "#1B2A4A", "#070B14"]}
        intensity={0.2}
        style={StyleSheet.absoluteFill}
      />
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
      <LinearGradient
        colors={["transparent", "rgba(7,11,20,0.4)", "#070B14"]}
        style={styles.shadowGradient}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  glView: {
    flex: 1,
  },
  shadowGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
  },
});
