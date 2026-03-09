import { StyleSheet } from 'react-native';
import { MapView, Camera } from '@maplibre/maplibre-react-native';

export default function HomeScreen() {
  return (
    <MapView
      style={styles.map}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      <Camera
        zoomLevel={12}
        centerCoordinate={[-38.5016, -3.7172]}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});