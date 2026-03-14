import React, { useCallback, useRef } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { GLView } from "expo-gl";
import { LinearGradient } from "expo-linear-gradient";
import { Asset } from "expo-asset";
import {
  Scene,
  PerspectiveCamera,
  Mesh,
  Group,
  SphereGeometry,
  MeshBasicMaterial,
  Box3,
  Vector3,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GrainyBackground } from "@/components/ui/GrainyBackground";

const SLIME_GLB = require("../../assets/images/Meshy_AI_Green_Jelly_Slime_0314055224_texture.glb");

function loadArrayBuffer(uri: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", uri, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 0) {
        resolve(xhr.response as ArrayBuffer);
      } else {
        reject(new Error(`GLB fetch failed: HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("GLB XHR network error"));
    xhr.send();
  });
}

export function Globe({ style }: { style?: ViewStyle }) {
  const rafRef = useRef<number | null>(null);

  const onContextCreate = useCallback((gl: any) => {
    const renderer = new WebGLRenderer({
      canvas: {
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: gl.drawingBufferHeight,
      } as any,
      context: gl,
    });
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

    scene.add(new AmbientLight(0xffffff, 1.0));
    const dirLight = new DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 3, 4);
    scene.add(dirLight);

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
        if (!uri) {
          console.warn("Slime GLB: no URI after download");
          return;
        }
        console.log("Slime GLB URI:", uri);
        const buffer = await loadArrayBuffer(uri);
        console.log("Slime GLB buffer size:", buffer.byteLength);
        const loader = new GLTFLoader();
        const { scene: glbScene } = await new Promise<any>((resolve, reject) => {
          loader.parse(buffer, "", resolve, reject);
        });
        slimeGroup.remove(placeholder);
        placeholder.geometry.dispose();
        (placeholder.material as MeshBasicMaterial).dispose();

        const box = new Box3().setFromObject(glbScene);
        const size = new Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        glbScene.scale.setScalar(1.2 / maxDim);
        slimeGroup.add(glbScene);
        console.log("Slime GLB loaded successfully");
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
