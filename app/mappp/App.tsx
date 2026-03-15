// import MapboxGL from '@rnmapbox/maps';
// import React from 'react';
// import { StyleSheet, View } from 'react-native';

// MapboxGL.setAccessToken('YOUR_PUBLIC_TOKEN_HERE'); // pk.ey... token

// const App = () => {
//   return (
//     <View style={styles.container}>
//       <MapboxGL.MapView
//         style={styles.map}
//         zoomEnabled={true}
//         styleURL="mapbox://styles/mapbox/streets-v12"
//         rotateEnabled={true}>
//         <MapboxGL.Camera
//           zoomLevel={15}
//           centerCoordinate={[10.181667, 36.806389]}
//           pitch={60}
//           animationMode={'flyTo'}
//           animationDuration={6000}
//         />
//         <MapboxGL.PointAnnotation
//           id="marker"
//           coordinate={[10.181667, 36.806389]}>
//           <View />
//         </MapboxGL.PointAnnotation>
//       </MapboxGL.MapView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     flex: 1,
//   },
// });

// export default App;


// import MapLibreGL from '@maplibre/maplibre-react-native';
// import React from 'react';
// import { StyleSheet, View } from 'react-native';

// MapLibreGL.setAccessToken(null); // no token needed for open source tiles

// const App = () => {
//   return (
//     <View style={styles.container}>
//       <MapLibreGL.MapView
//         style={styles.map}
//         zoomEnabled={true}
//         styleURL="https://demotiles.maplibre.org/style.json"
//         rotateEnabled={true}>
//         <MapLibreGL.Camera
//           zoomLevel={15}
//           centerCoordinate={[10.181667, 36.806389]}
//           pitch={60}
//           animationMode={'flyTo'}
//           animationDuration={6000}
//         />
//         <MapLibreGL.PointAnnotation
//           id="marker"
//           coordinate={[10.181667, 36.806389]}>
//           <View />
//         </MapLibreGL.PointAnnotation>
//       </MapLibreGL.MapView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     flex: 1,
//   },
// });

// export default App;





import MapLibreGL, { Camera, MapView, PointAnnotation } from '@maplibre/maplibre-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

MapLibreGL.setAccessToken(null);

const App = () => {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        zoomEnabled={true}
        mapStyle="https://demotiles.maplibre.org/style.json"
        rotateEnabled={true}>
        <Camera
          zoomLevel={15}
          centerCoordinate={[10.181667, 36.806389]}
          pitch={60}
          animationMode={'flyTo'}
          animationDuration={6000}
        />
        <PointAnnotation
          id="marker"
          coordinate={[10.181667, 36.806389]}>
          <View />
        </PointAnnotation>
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default App;