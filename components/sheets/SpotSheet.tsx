import { Colors } from '@/constants/theme';
import { WeatherDTO, weatherService } from '@/services/weather/weatherService';
import { SurfSpot } from '@/types';
import { MapPin, Thermometer, Waves } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface SpotSheetProps {
  spot: SurfSpot;
}

export default function SpotSheet({ spot }: SpotSheetProps) {
  const [weather, setWeather] = useState<WeatherDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    weatherService
      .getCurrentWeather(spot.coordinate[1], spot.coordinate[0])
      .then((data) => {
        if (active) setWeather(data);
      })
      .catch((error) => {
        console.error('Erro ao carregar clima do spot:', error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.label}>Pico de Surf</Text>
      <Text style={styles.name}>{spot.name}</Text>

      {spot.imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: spot.imageUrl }} style={styles.image} resizeMode="cover" />
        </View>
      )}

      <View style={styles.conditionsCard}>
        <View style={styles.conditionsHeader}>
          <Waves size={18} color={Colors.light.text} />
          <Text style={styles.conditionsTitle}>Condicoes Atuais</Text>
        </View>

        {loading ? (
          <View style={styles.weatherState}>
            <ActivityIndicator size="small" color={Colors.light.icon} />
            <Text style={styles.weatherText}>Carregando clima...</Text>
          </View>
        ) : weather ? (
          <View style={styles.weatherState}>
            <View style={styles.weatherLine}>
              <Thermometer size={16} color={Colors.light.icon} />
              <Text style={styles.weatherText}>{Math.round(weather.temp)} C</Text>
            </View>
            <Text style={styles.weatherText}>{weather.windSpeed} km/h | Vento: {weather.windDirection}°</Text>
          </View>
        ) : (
          <Text style={styles.weatherText}>Sem dados de clima disponiveis.</Text>
        )}
      </View>

      <View style={styles.coordsRow}>
        <MapPin size={14} color={Colors.light.icon} />
        <Text style={styles.coordsText}>
          Lat: {spot.coordinate[1].toFixed(4)}, Lng: {spot.coordinate[0].toFixed(4)}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: Colors.light.icon,
    fontWeight: '500',
    marginBottom: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  conditionsCard: {
    backgroundColor: '#f0eadd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  conditionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  conditionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  weatherState: {
    gap: 8,
  },
  weatherLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherText: {
    fontSize: 14,
    color: '#6B7280',
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  coordsText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
