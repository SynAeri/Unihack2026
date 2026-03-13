import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  ViroARSceneNavigator,
  ViroARScene,
  ViroSphere,
  ViroNode,
  ViroMaterials,
  ViroAmbientLight,
  ViroText,
  ViroQuad,
} from "@reactvision/react-viro";

const GAME_DURATION = 30;
const B = 0.012; // panel border thickness

// Spawn zone dimensions (reference z=-1.6m)
const SPAWN_W = 1.1;   // x: ±0.55 m
const SPAWN_H = 1.3;   // y: -0.6 to 0.7 m
const SPAWN_CY = 0.05; // center y of spawn zone
const SPAWN_Z = -1.6;
const FRAME_T = 0.008; // spawn frame line thickness

ViroMaterials.createMaterials({
  blob:        { diffuseColor: "#7DFFA0", lightingModel: "Phong" },
  blobGlow:    { diffuseColor: "#A5FFD6", lightingModel: "Phong" },
  startBtn:    { diffuseColor: "#7DFFA0", lightingModel: "Constant" },
  panelBg:     { diffuseColor: "#071409", lightingModel: "Constant" },
  borderGreen: { diffuseColor: "#2A6B42", lightingModel: "Constant" },
  borderDim:   { diffuseColor: "#1B2A4A", lightingModel: "Constant" },
  spawnFrame:  { diffuseColor: "#3DFF7A", lightingModel: "Constant" },
});

function randomArPos(): [number, number, number] {
  const x = (Math.random() - 0.5) * SPAWN_W;
  const y = -0.6 + Math.random() * SPAWN_H;
  const z = -(1.3 + Math.random() * 0.8);
  return [x, y, z];
}

type GameState = "idle" | "playing" | "gameover";

interface AppProps {
  gameState: GameState;
  score: number;
  timeLeft: number;
  blobPos: [number, number, number];
  onStart: () => void;
  onTap: () => void;
  onReplay: () => void;
}

function BorderedPanel({ width, height, borderMat = "borderGreen" }: {
  width: number; height: number; borderMat?: string;
}) {
  return (
    <>
      <ViroQuad width={width + B * 2} height={height + B * 2} materials={[borderMat]} position={[0, 0, -0.002]} />
      <ViroQuad width={width} height={height} materials={["panelBg"]} position={[0, 0, -0.001]} />
    </>
  );
}

// 4 corner L-brackets showing the spawn zone boundary
function SpawnZoneBorder() {
  const hw = SPAWN_W / 2;   // half-width
  const hh = SPAWN_H / 2;   // half-height
  const arm = 0.09;          // corner arm length
  const t = FRAME_T;

  const corners: Array<{ x: number; y: number }> = [
    { x: -hw, y:  hh + SPAWN_CY }, // top-left
    { x:  hw, y:  hh + SPAWN_CY }, // top-right
    { x: -hw, y: -hh + SPAWN_CY }, // bottom-left
    { x:  hw, y: -hh + SPAWN_CY }, // bottom-right
  ];

  return (
    <ViroNode position={[0, 0, SPAWN_Z]}>
      {corners.map(({ x, y }, i) => {
        const signX = x < 0 ? 1 : -1;  // arm points inward
        const signY = y > SPAWN_CY ? -1 : 1;
        return (
          <ViroNode key={i} position={[x, y, 0]}>
            {/* Horizontal arm */}
            <ViroQuad
              width={arm}
              height={t}
              materials={["spawnFrame"]}
              position={[(signX * arm) / 2, 0, 0]}
            />
            {/* Vertical arm */}
            <ViroQuad
              width={t}
              height={arm}
              materials={["spawnFrame"]}
              position={[0, (signY * arm) / 2, 0]}
            />
          </ViroNode>
        );
      })}
    </ViroNode>
  );
}

function ARGameScene(props: any) {
  const { gameState, score, timeLeft, blobPos, onStart, onTap, onReplay } =
    props.sceneNavigator.viroAppProps as AppProps;

  const timerColor = timeLeft <= 5 ? "#FF5555" : "#7DFFA0";
  const panelZ = -1.5;

  return (
    <ViroARScene>
      <ViroAmbientLight color="#FFFFFF" intensity={300} />

      {/* ── IDLE: portrait start screen ── */}
      {gameState === "idle" && (
        <ViroNode position={[0, 0.0, panelZ]}>
          <BorderedPanel width={1.0} height={1.1} />

          <ViroText
            text="TAP THE BLOB"
            position={[0, 0.36, 0]}
            scale={[0.17, 0.17, 0.17]}
            style={{ fontFamily: "Arial", fontSize: 52, color: "#7DFFA0", fontWeight: "bold", textAlign: "center" }}
          />

          {/* Divider line */}
          <ViroQuad width={0.7} height={0.004} materials={["borderGreen"]} position={[0, 0.2, 0]} />

          <ViroText
            text="Find & tap the slime"
            position={[0, 0.1, 0]}
            scale={[0.082, 0.082, 0.082]}
            style={{ fontFamily: "Arial", fontSize: 28, color: "#A5FFD6", textAlign: "center" }}
          />

          <ViroText
            text="30 seconds"
            position={[0, -0.1, 0]}
            scale={[0.065, 0.065, 0.065]}
            style={{ fontFamily: "Arial", fontSize: 22, color: "#5BC47A", textAlign: "center" }}
          />

          {/* Start button */}
          <ViroNode position={[0, -0.3, 0.001]} onClick={onStart}>
            <ViroQuad width={0.52 + B * 2} height={0.13 + B * 2} materials={["borderGreen"]} position={[0, 0, -0.001]} />
            <ViroQuad width={0.52} height={0.13} materials={["startBtn"]} />
            <ViroText
              text="START GAME"
              position={[0, 0, 0.001]}
              scale={[0.09, 0.09, 0.09]}
              style={{ fontFamily: "Arial", fontSize: 32, color: "#051a0e", fontWeight: "bold", textAlign: "center" }}
            />
          </ViroNode>
        </ViroNode>
      )}

      {/* ── PLAYING: HUD + spawn border + blob ── */}
      {gameState === "playing" && (
        <>
          {/* Spawn zone corner brackets */}
          <SpawnZoneBorder />

          {/* HUD */}
          <ViroNode position={[0, 0.62, -1.3]}>
            <ViroNode position={[-0.3, 0, 0]}>
              <BorderedPanel width={0.36} height={0.22} />
              <ViroText
                text="SCORE"
                scale={[0.065, 0.065, 0.065]}
                position={[0, 0.062, 0]}
                style={{ fontFamily: "Arial", fontSize: 22, color: "#7DFFA0", textAlign: "center" }}
              />
              <ViroText
                text={`${score}`}
                scale={[0.16, 0.16, 0.16]}
                position={[0, -0.015, 0]}
                style={{ fontFamily: "Arial", fontSize: 52, color: "#7DFFA0", fontWeight: "bold", textAlign: "center" }}
              />
            </ViroNode>

            <ViroNode position={[0.3, 0, 0]}>
              <BorderedPanel width={0.36} height={0.22} borderMat={timeLeft <= 5 ? "borderGreen" : "borderDim"} />
              <ViroText
                text="TIME"
                scale={[0.065, 0.065, 0.065]}
                position={[0, 0.062, 0]}
                style={{ fontFamily: "Arial", fontSize: 22, color: "#A5FFD6", textAlign: "center" }}
              />
              <ViroText
                text={`${timeLeft}`}
                scale={[0.16, 0.16, 0.16]}
                position={[0, -0.015, 0]}
                style={{ fontFamily: "Arial", fontSize: 52, color: timerColor, fontWeight: "bold", textAlign: "center" }}
              />
            </ViroNode>
          </ViroNode>

          {/* Blob */}
          <ViroNode
            position={blobPos}
            key={`${blobPos[0].toFixed(2)}-${blobPos[1].toFixed(2)}-${blobPos[2].toFixed(2)}`}
            onClick={onTap}
          >
            <ViroSphere radius={0.14} materials={["blobGlow"]} opacity={0.2} />
            <ViroSphere radius={0.09} materials={["blob"]} />
            <ViroSphere radius={0.018} materials={["panelBg"]} position={[-0.032, 0.018, 0.082]} />
            <ViroSphere radius={0.018} materials={["panelBg"]} position={[0.032, 0.018, 0.082]} />
          </ViroNode>
        </>
      )}

      {/* ── GAME OVER ── */}
      {gameState === "gameover" && (
        <ViroNode position={[0, 0.0, panelZ]}>
          <BorderedPanel width={1.0} height={1.0} />

          <ViroText
            text="TIME'S UP!"
            position={[0, 0.35, 0]}
            scale={[0.13, 0.13, 0.13]}
            style={{ fontFamily: "Arial", fontSize: 40, color: "#A5FFD6", fontWeight: "600", textAlign: "center" }}
          />

          <ViroQuad width={0.7} height={0.004} materials={["borderGreen"]} position={[0, 0.22, 0]} />

          <ViroText
            text={`${score}`}
            position={[0, 0.06, 0]}
            scale={[0.32, 0.32, 0.32]}
            style={{ fontFamily: "Arial", fontSize: 72, color: "#7DFFA0", fontWeight: "bold", textAlign: "center" }}
          />
          <ViroText
            text="blobs tapped in 30s"
            position={[0, -0.15, 0]}
            scale={[0.08, 0.08, 0.08]}
            style={{ fontFamily: "Arial", fontSize: 28, color: "#5BC47A", textAlign: "center" }}
          />

          <ViroNode position={[0, -0.32, 0.001]} onClick={onReplay}>
            <ViroQuad width={0.52 + B * 2} height={0.13 + B * 2} materials={["borderGreen"]} position={[0, 0, -0.001]} />
            <ViroQuad width={0.52} height={0.13} materials={["startBtn"]} />
            <ViroText
              text="PLAY AGAIN"
              position={[0, 0, 0.001]}
              scale={[0.09, 0.09, 0.09]}
              style={{ fontFamily: "Arial", fontSize: 32, color: "#051a0e", fontWeight: "bold", textAlign: "center" }}
            />
          </ViroNode>
        </ViroNode>
      )}
    </ViroARScene>
  );
}

export default function HomeTab() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [blobPos, setBlobPos] = useState<[number, number, number]>([0, 0, -1.6]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setGameState("gameover");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setBlobPos(randomArPos());
    setGameState("playing");
  };

  const appProps: AppProps = {
    gameState,
    score,
    timeLeft,
    blobPos,
    onStart: startGame,
    onTap: () => {
      setScore((s) => s + 1);
      setBlobPos(randomArPos());
    },
    onReplay: startGame,
  };

  return (
    <View style={styles.root}>
      <ViroARSceneNavigator
        autofocus
        viroAppProps={appProps}
        initialScene={{ scene: ARGameScene as unknown as () => React.JSX.Element }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
});
