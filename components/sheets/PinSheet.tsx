import { Colors } from '@/constants/theme';
import { WeatherDTO, weatherService } from '@/services/weather/weatherService';
import { MapPin } from '@/types';
import {
  Instagram,
  MapPin as MapPinIcon,
  MessageCircle,
  Thermometer,
  Waves,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PinSheetProps {
  pin: MapPin;
  onOpenBeachDetails?: (pin: MapPin) => void;
}

const TYPE_LABELS: Record<MapPin['type'], string> = {
  pico: 'Pico de Surf',
  escolinha: 'Escola de Surf',
  reparo: 'Reparo de Pranchas',
  loja: 'Surf Shop',
};

export default function PinSheet({ pin, onOpenBeachDetails }: PinSheetProps) {
  const isSpot = pin.type === 'pico';
  const isEstablishment = !isSpot;
  const [longitude, latitude] = pin.coordinate;

  const [weather, setWeather] = useState<WeatherDTO | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (!isSpot) return;

    let active = true;
    setWeatherLoading(true);

    weatherService
      .getCurrentWeather(latitude, longitude)
      .then((data) => {
        if (active) setWeather(data);
      })
      .catch((error) => {
        console.error('Erro ao carregar clima da praia:', error);
        if (active) setWeather(null);
      })
      .finally(() => {
        if (active) setWeatherLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isSpot, latitude, longitude]);

  const openInstagram = () => {
    if (pin.instagram) {
      Linking.openURL(`https://instagram.com/${pin.instagram}`);
    }
  };

  const openWhatsApp = () => {
    if (pin.whatsapp) {
      Linking.openURL(`https://wa.me/${pin.whatsapp}`);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Text style={styles.label}>{TYPE_LABELS[pin.type]}</Text>
      <Text style={styles.name}>{pin.name}</Text>
      {pin.beachName && pin.sourceType === 'poi' ? (
        <Text style={styles.relatedBeach}>Praia: {pin.beachName}</Text>
      ) : null}

      {pin.imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: pin.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      {isSpot && (
        <View style={styles.conditionsCard}>
          <View style={styles.conditionsHeader}>
            <Waves size={18} color={Colors.light.text} />
            <Text style={styles.conditionsTitle}>Condicoes Atuais</Text>
          </View>

          {weatherLoading ? (
            <View style={styles.weatherState}>
              <ActivityIndicator size="small" color={Colors.light.icon} />
              <Text style={styles.weatherStateText}>Carregando clima...</Text>
            </View>
          ) : weather ? (
            <View style={styles.conditionRow}>
              <View style={styles.conditionItem}>
                <View style={styles.conditionIconRow}>
                  <Thermometer size={14} color={Colors.light.icon} />
                  <Text style={styles.conditionLabel}>Temperatura</Text>
                </View>
                <Text style={styles.conditionValue}>{Math.round(weather.temp)} C</Text>
              </View>

              <View style={styles.conditionItem}>
                <View style={styles.conditionIconRow}>
                  <Waves size={14} color={Colors.light.icon} />
                  <Text style={styles.conditionLabel}>Vento</Text>
                </View>
                <Text style={styles.conditionValue}>{weather.windSpeed} km/h | {weather.windDirection}°</Text>
              </View>
            </View>
          ) : (
            <View style={styles.weatherState}>
              <Text style={styles.weatherStateText}>Sem dados de clima disponiveis.</Text>
            </View>
          )}
        </View>
      )}

      {isEstablishment && (pin.instagram || pin.whatsapp) && (
        <View style={styles.contactSection}>
          {pin.instagram && (
            <TouchableOpacity style={styles.contactLink} onPress={openInstagram}>
              <Instagram size={16} color={Colors.light.icon} />
              <Text style={styles.contactLinkText}>@{pin.instagram}</Text>
            </TouchableOpacity>
          )}
          {pin.whatsapp && (
            <TouchableOpacity style={styles.contactLink} onPress={openWhatsApp}>
              <MessageCircle size={16} color={Colors.light.icon} />
              <Text style={styles.contactLinkText}>{pin.whatsapp}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {pin.address && (
        <View style={styles.addressRow}>
          <MapPinIcon size={14} color={Colors.light.icon} />
          <Text style={styles.addressText}>{pin.address}</Text>
        </View>
      )}

      {pin.description ? (
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>Descricao</Text>
          <Text style={styles.descriptionText}>{pin.description}</Text>
        </View>
      ) : null}

      {onOpenBeachDetails && pin.beachId ? (
        <TouchableOpacity style={styles.beachDetailsButton} onPress={() => onOpenBeachDetails(pin)}>
          <Text style={styles.beachDetailsButtonText}>Abrir detalhes da praia</Text>
        </TouchableOpacity>
      ) : null}
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
  relatedBeach: {
    fontSize: 13,
    color: Colors.light.icon,
    fontWeight: '600',
    marginBottom: 10,
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
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  conditionItem: {
    flex: 1,
  },
  conditionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  conditionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  conditionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  weatherState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  weatherStateText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  contactSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
    gap: 10,
  },
  contactLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactLinkText: {
    fontSize: 14,
    color: Colors.light.icon,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  addressText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  descriptionCard: {
    backgroundColor: '#F7F7F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  beachDetailsButton: {
    borderRadius: 12,
    backgroundColor: Colors.light.text,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  beachDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
