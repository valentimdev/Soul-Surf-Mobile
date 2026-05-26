import { Colors } from '@/constants/theme';
import { WeatherDTO, weatherService } from '@/services/weather/weatherService';
import { MapPin } from '@/types';
import { toCompass } from '@/utils/surfConditionsInterpreter';
import {
  Instagram,
  MapPin as MapPinIcon,
  MessageCircle,
  Thermometer,
  Waves,
  Phone,
  Info
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
      // Garante que só existam números e tenta montar a URL
      const cleanNumber = pin.whatsapp.replace(/\D/g, '');
      if (cleanNumber) {
        Linking.openURL(`https://wa.me/${cleanNumber}`);
      }
    }
  };

  const renderEstablishmentLayout = () => {
    return (
      <View style={styles.poiContainer}>
        {pin.description ? (
          <View style={styles.poiDescriptionBox}>
            <Info size={16} color="#2A4B7C" style={styles.poiIcon} />
            <Text style={styles.poiDescriptionText}>{pin.description}</Text>
          </View>
        ) : null}

        {(pin.whatsapp || pin.instagram) ? (
          <View style={styles.poiContactSection}>
            <Text style={styles.poiContactTitle}>Contatos e Redes</Text>
            <View style={styles.poiContactRow}>
              {pin.whatsapp && (
                <TouchableOpacity style={[styles.poiButton, styles.poiButtonWhatsApp]} onPress={openWhatsApp}>
                  <Phone size={16} color="#FFF" />
                  <Text style={styles.poiButtonText}>WhatsApp</Text>
                </TouchableOpacity>
              )}
              {pin.instagram && (
                <TouchableOpacity style={[styles.poiButton, styles.poiButtonInstagram]} onPress={openInstagram}>
                  <Instagram size={16} color="#FFF" />
                  <Text style={styles.poiButtonText}>Instagram</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      <View style={styles.headerBlock}>
        <Text style={styles.label}>{TYPE_LABELS[pin.type]}</Text>
        <Text style={styles.name}>{pin.name}</Text>
        {pin.beachName && pin.sourceType === 'poi' ? (
          <View style={styles.relatedBeachBadge}>
            <MapPinIcon size={12} color="#5C9DB8" />
            <Text style={styles.relatedBeachText}>Perto da {pin.beachName}</Text>
          </View>
        ) : null}
      </View>

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
            <Waves size={18} color="#2A4B7C" />
            <Text style={styles.conditionsTitle}>Condicoes Atuais</Text>
          </View>

          {weatherLoading ? (
            <View style={styles.weatherState}>
              <ActivityIndicator size="small" color="#2A4B7C" />
              <Text style={styles.weatherStateText}>Carregando clima...</Text>
            </View>
          ) : weather ? (
            <View style={styles.conditionRow}>
              <View style={styles.conditionItem}>
                <View style={styles.conditionIconRow}>
                  <Thermometer size={14} color="#6B7280" />
                  <Text style={styles.conditionLabel}>Temperatura</Text>
                </View>
                <Text style={styles.conditionValue}>{Math.round(weather.temp)} C</Text>
              </View>

              <View style={styles.conditionItem}>
                <View style={styles.conditionIconRow}>
                  <Waves size={14} color="#6B7280" />
                  <Text style={styles.conditionLabel}>Vento</Text>
                </View>
                <Text style={styles.conditionValue}>
                  {weather.windSpeed} km/h {toCompass(weather.windDirection)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.weatherState}>
              <Text style={styles.weatherStateText}>Sem dados de clima disponiveis.</Text>
            </View>
          )}
        </View>
      )}

      {isEstablishment ? renderEstablishmentLayout() : (
        pin.description ? (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>Sobre a Praia</Text>
            <Text style={styles.descriptionText}>{pin.description}</Text>
          </View>
        ) : null
      )}

      {pin.address && (
        <View style={styles.addressRow}>
          <MapPinIcon size={16} color="#8BA1AA" />
          <Text style={styles.addressText}>{pin.address}</Text>
        </View>
      )}

      {onOpenBeachDetails && pin.beachId ? (
        <TouchableOpacity style={styles.beachDetailsButton} onPress={() => onOpenBeachDetails(pin)}>
          <Text style={styles.beachDetailsButtonText}>Abrir mural da praia</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 6,
  },
  headerBlock: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#8BA1AA',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F4A63',
    marginBottom: 6,
  },
  relatedBeachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F1F4',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  relatedBeachText: {
    fontSize: 12,
    color: '#2A4B7C',
    fontWeight: '600',
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E7E2D3',
    elevation: 2,
    shadowColor: '#1F4A63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#E8E5D4',
  },
  conditionsCard: {
    backgroundColor: '#F4FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#8AB7C3',
  },
  conditionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  conditionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F4A63',
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
    marginBottom: 4,
  },
  conditionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  conditionValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A4B7C',
  },
  weatherState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  weatherStateText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Estilos Específicos dos POIs (Estabelecimentos)
  poiContainer: {
    marginBottom: 20,
  },
  poiDescriptionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FBFB',
    borderWidth: 1,
    borderColor: '#D0E1E7',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  poiIcon: {
    marginTop: 2,
  },
  poiDescriptionText: {
    flex: 1,
    fontSize: 14,
    color: '#4B647A',
    lineHeight: 20,
  },
  poiContactSection: {
    gap: 10,
  },
  poiContactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8BA1AA',
    textTransform: 'uppercase',
  },
  poiContactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  poiButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  poiButtonWhatsApp: {
    backgroundColor: '#25D366', // Verde oficial do WhatsApp
  },
  poiButtonInstagram: {
    backgroundColor: '#E1306C', // Rosa base do Instagram
  },
  poiButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    backgroundColor: '#F3F1EA',
    padding: 12,
    borderRadius: 12,
  },
  addressText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },
  descriptionCard: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F4A63',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B647A',
    lineHeight: 21,
  },
  beachDetailsButton: {
    borderRadius: 999,
    backgroundColor: '#2A4B7C',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#1F4A63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  beachDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});