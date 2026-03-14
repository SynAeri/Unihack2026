// import { View } from "react-native";

// export default function ScanTab() {
//   return <View className="flex-1 bg-background" />;
// }


import { useCameraDevice } from 'react-native-vision-camera';
import RNVisionCamera from 'react-native-vision-camera';
import { useFrameProcessor } from 'react-native-vision-camera';
import { DetectedObject, detectObjects, FrameProcessorConfig } from 'vision-camera-realtime-object-detection';
import { View } from 'react-native';
import { CameraReticle } from '@/components/scan/CameraReticle';

const Camera = RNVisionCamera.Camera;

export default function ScanTab() {
  const device = useCameraDevice('back');

  const frameProcessorConfig: FrameProcessorConfig = {
    modelFile: '1.tflite', // your model file name
    scoreThreshold: 0.5,
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const detectedObjects: DetectedObject[] = detectObjects(frame, frameProcessorConfig);
    // Handle detectedObjects (e.g., store in state, show overlay, etc.)
  }, []);

  return (
    <View className="flex-1 bg-background">
      {device && (
        <>
          <Camera
            device={device}
            isActive={true}
            frameProcessorFps={5}
            frameProcessor={frameProcessor}
            style={{ flex: 1 }}
          />
          <View className="absolute inset-0 flex items-center justify-center">
            <CameraReticle />
          </View>
        </>
      )}
    </View>
  );
}
