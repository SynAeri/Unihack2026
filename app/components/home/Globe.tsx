import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import { LinearGradient } from "expo-linear-gradient";
import { Asset } from "expo-asset";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  Group,
  Box3,
  Vector3,
  MeshStandardMaterial,
  DoubleSide,
  Mesh,
  Object3D,
} from "three";
import { GrainyBackground } from "@/components/ui/GrainyBackground";

// GLTFLoader reads navigator.userAgent for browser detection — undefined in RN.
if (typeof navigator !== "undefined" && navigator.userAgent === undefined) {
  (navigator as any).userAgent = "";
}

const SLIME_GLB = require("../../assets/images/slime.glb");

const slimeMat = new MeshStandardMaterial({
  color: 0x7dffa0,
  roughness: 0.3,
  metalness: 0.1,
  transparent: true,
  opacity: 0.88,
  side: DoubleSide,
});

function loadArrayBuffer(uri: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", uri, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = () =>
      xhr.status === 200 || xhr.status === 0
        ? resolve(xhr.response)
        : reject(new Error(`HTTP ${xhr.status}`));
    xhr.onerror = () => reject(new Error("XHR failed"));
    xhr.send();
  });
}

/**
 * Rewrite a GLB, removing all images / textures / samplers and the
 * material references that point to them. This avoids the browser-only
 * texture-loading codepath (URL.createObjectURL, DOM Image, etc.)
 * that Three.js GLTFLoader relies on — none of which exist in RN.
 */
function stripGlbTextures(glb: ArrayBuffer): ArrayBuffer {
  const view = new DataView(glb);
  if (view.getUint32(0, true) !== 0x46546c67) return glb;

  const jsonLen = view.getUint32(12, true);
  const json = JSON.parse(
    new TextDecoder().decode(new Uint8Array(glb, 20, jsonLen))
  );

  delete json.images;
  delete json.textures;
  delete json.samplers;
  if (json.materials) {
    for (const mat of json.materials) {
      if (mat.pbrMetallicRoughness) {
        delete mat.pbrMetallicRoughness.baseColorTexture;
        delete mat.pbrMetallicRoughness.metallicRoughnessTexture;
      }
      delete mat.normalTexture;
      delete mat.occlusionTexture;
      delete mat.emissiveTexture;
    }
  }

  const newJsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const paddedJsonLen = (newJsonBytes.length + 3) & ~3;

  const binOffset = 20 + jsonLen;
  let binData: Uint8Array | null = null;
  if (binOffset + 8 <= glb.byteLength) {
    const binLen = view.getUint32(binOffset, true);
    binData = new Uint8Array(glb, binOffset + 8, binLen);
  }
  const paddedBinLen = binData ? (binData.length + 3) & ~3 : 0;

  const totalLen = 12 + 8 + paddedJsonLen + (binData ? 8 + paddedBinLen : 0);
  const out = new ArrayBuffer(totalLen);
  const dv = new DataView(out);
  const bytes = new Uint8Array(out);

  dv.setUint32(0, 0x46546c67, true); // glTF
  dv.setUint32(4, 2, true);          // version
  dv.setUint32(8, totalLen, true);    // total length

  dv.setUint32(12, paddedJsonLen, true);
  dv.setUint32(16, 0x4e4f534a, true); // JSON
  bytes.set(newJsonBytes, 20);
  for (let i = newJsonBytes.length; i < paddedJsonLen; i++) bytes[20 + i] = 0x20;

  if (binData) {
    const bs = 20 + paddedJsonLen;
    dv.setUint32(bs, paddedBinLen, true);
    dv.setUint32(bs + 4, 0x004e4942, true); // BIN
    bytes.set(binData, bs + 8);
  }

  return out;
}

function SlimeModel() {
  const groupRef = useRef<Group>(null);
  const [model, setModel] = useState<Object3D | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(SLIME_GLB);
        await asset.downloadAsync();
        const uri = asset.localUri ?? asset.uri;
        if (!uri || cancelled) return;

        const rawBuffer = await loadArrayBuffer(uri);
        const buffer = stripGlbTextures(rawBuffer);
        const loader = new GLTFLoader();
        loader.parse(
          buffer,
          "./",
          (gltf) => {
            if (cancelled) return;
            const s = gltf.scene;
            s.traverse((child) => {
              if ((child as Mesh).isMesh) (child as Mesh).material = slimeMat;
            });
            const box = new Box3().setFromObject(s);
            const size = new Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            s.scale.setScalar(1.2 / maxDim);
            setModel(s);
          },
          (err) => console.warn("GLB parse error:", err)
        );
      } catch (e) {
        console.warn("GLB load error:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.002;
  });

  if (!model) return null;

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

export function Globe({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.container, style]}>
      <GrainyBackground
        colors={["#070B14", "#0a0f1c", "#121b2e", "#1B2A4A", "#070B14"]}
        intensity={0.2}
        style={StyleSheet.absoluteFill}
      />
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ alpha: true }}
        style={styles.canvas}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[2, 3, 4]} intensity={1.5} />
        <SlimeModel />
      </Canvas>
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
  canvas: {
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
