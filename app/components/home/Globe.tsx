import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ViewStyle, Image as RNImage, Platform, PanResponder } from "react-native";
import { Canvas } from "@react-three/fiber/native";
import { LinearGradient } from "expo-linear-gradient";
import { Asset } from "expo-asset";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Box3, Vector3, Object3D, TextureLoader, Texture, FileLoader, LoaderUtils } from "three";
import { fromByteArray } from "base64-js";
import { Buffer } from "buffer";
import { GrainyBackground } from "@/components/ui/GrainyBackground";

// ---------------------------------------------------------------------------
// Polyfills — apply to OUR copy of three (the same one GLTFLoader imports).
// R3F's native entry patches its own bundled copy, which GLTFLoader can't see
// due to Metro resolving two separate three instances.
// ---------------------------------------------------------------------------

if (typeof navigator !== "undefined" && navigator.userAgent === undefined) {
  (navigator as any).userAgent = "";
}

const getFS = () => {
  try { return require("expo-file-system/legacy"); }
  catch { return require("expo-file-system"); }
};
const fs = getFS();

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function getAsset(input: any): Promise<string> {
  if (typeof input === "string") {
    if (input.startsWith("file:")) return input;
    if (input.startsWith("data:")) {
      const [header, data] = input.split(";base64,");
      const [, type] = header.split("/");
      const uri = fs.cacheDirectory + uuidv4() + `.${type}`;
      await fs.writeAsStringAsync(uri, data, { encoding: fs.EncodingType.Base64 });
      return uri;
    }
  }
  const asset = await Asset.fromModule(input).downloadAsync();
  let uri = asset.localUri || asset.uri;
  if (!uri.includes(":")) {
    const file = `${fs.cacheDirectory}ExponentAsset-${asset.hash}.${asset.type}`;
    await fs.copyAsync({ from: uri, to: file });
    uri = file;
  }
  return uri;
}

if (Platform.OS !== "web") {
  // Blob / createObjectURL polyfill
  try {
    const blob = new Blob([new ArrayBuffer(4)]);
    const url = URL.createObjectURL(blob);
    URL.revokeObjectURL(url);
  } catch {
    const BlobMM = require("react-native/Libraries/Blob/BlobManager.js");
    const BlobManager = BlobMM.default ?? BlobMM;
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = function (blob: any) {
      if (blob.data._base64) return `data:${blob.type};base64,${blob.data._base64}`;
      return origCreate(blob);
    };
    const origParts = BlobManager.createFromParts;
    BlobManager.createFromParts = function (parts: any[], options: any) {
      parts = parts.map((p) =>
        p instanceof ArrayBuffer || ArrayBuffer.isView(p)
          ? fromByteArray(new Uint8Array(p as ArrayBuffer))
          : p
      );
      const blob = origParts(parts, options);
      blob.data._base64 = "";
      for (const part of parts) blob.data._base64 += part?.data?._base64 ?? part;
      return blob;
    };
  }

  const origExtract = LoaderUtils.extractUrlBase.bind(LoaderUtils);
  LoaderUtils.extractUrlBase = (url: any) =>
    typeof url === "string" ? origExtract(url) : "./";

  // TextureLoader — use RN Image instead of DOM img
  (TextureLoader.prototype as any).load = function (
    url: any, onLoad?: any, _onProgress?: any, onError?: any
  ) {
    if (this.path && typeof url === "string") url = this.path + url;
    const texture = new Texture();
    getAsset(url)
      .then(async (uri) => {
        const { width, height } = await new Promise<{ width: number; height: number }>(
          (res, rej) => RNImage.getSize(uri, (w, h) => res({ width: w, height: h }), rej)
        );
        texture.image = { data: { localUri: uri }, width, height } as any;
        texture.flipY = true;
        texture.needsUpdate = true;
        (texture as any).isDataTexture = true;
        onLoad?.(texture);
      })
      .catch(onError);
    return texture;
  };

  // FileLoader — use expo-file-system
  (FileLoader.prototype as any).load = function (
    url: any, onLoad?: any, _onProgress?: any, onError?: any
  ) {
    if (this.path && typeof url === "string") url = this.path + url;
    this.manager.itemStart(url);
    getAsset(url)
      .then(async (uri) => {
        const b64 = await fs.readAsStringAsync(uri, { encoding: fs.EncodingType.Base64 });
        onLoad?.(Buffer.from(b64, "base64").buffer);
      })
      .catch((e: any) => { onError?.(e); this.manager.itemError(url); })
      .finally(() => this.manager.itemEnd(url));
  };
}

// ---------------------------------------------------------------------------

const SLIME_GLB = require("../../assets/images/slime.glb");

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

const ROTATION_SENSITIVITY = 0.005;

function SlimeModel({ rotationX, rotationY }: { rotationX: number; rotationY: number }) {
  const [model, setModel] = useState<Object3D | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(SLIME_GLB);
        await asset.downloadAsync();
        const uri = asset.localUri ?? asset.uri;
        if (!uri || cancelled) return;

        const buffer = await loadArrayBuffer(uri);
        const loader = new GLTFLoader();
        loader.parse(
          buffer,
          "./",
          (gltf) => {
            if (cancelled) return;
            const s = gltf.scene;
            const box = new Box3().setFromObject(s);
            const size = new Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            s.scale.setScalar(2.4 / maxDim);
            setModel(s);
          },
          (err) => console.warn("GLB parse error:", err)
        );
      } catch (e) {
        console.warn("GLB load error:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!model) return null;
  return (
    <group rotation={[rotationX, rotationY, 0]}>
      <primitive object={model} />
    </group>
  );
}

export function Globe({ style }: { style?: ViewStyle }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, g) => {
        lastPos.current = { x: g.moveX, y: g.moveY };
      },
      onPanResponderMove: (_, g) => {
        const dx = g.moveX - lastPos.current.x;
        const dy = g.moveY - lastPos.current.y;
        lastPos.current = { x: g.moveX, y: g.moveY };
        setRotation((r) => ({
          x: r.x + dy * ROTATION_SENSITIVITY,
          y: r.y + dx * ROTATION_SENSITIVITY,
        }));
      },
    })
  ).current;

  return (
    <View style={[styles.container, style]}>
      <GrainyBackground
        colors={["#070B14", "#0a0f1c", "#121b2e", "#1B2A4A", "#070B14"]}
        intensity={0.2}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          gl={{ alpha: true }}
          style={styles.canvasFill}
        >
          <ambientLight intensity={1.0} />
          <directionalLight position={[2, 3, 4]} intensity={1.5} />
          <SlimeModel rotationX={rotation.x} rotationY={rotation.y} />
        </Canvas>
      </View>
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
  canvasFill: {
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
