import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { beachService } from '@/services/beaches/beachService';
import { BeachDTO } from '@/types/api';
import { surfConditionsService } from '@/services/weather/surfConditionsService';
import { SurfConditionsResponse } from '@/types/surfConditions';
import { SurfConditionsCard } from '@/components/surf/SurfConditionsCard';

export default function BeachConditionsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const navigation = useNavigation();

  const beachId = useMemo(() => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id;
    return Number(raw);
  }, [params.id]);

  const [beach, setBeach] = useState<BeachDTO | null>(null);
  const [conditions, setConditions] = useState<SurfConditionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!Number.isFinite(beachId)) {
        setError('Pico invalido.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        setError(null);
        const beachData = await beachService.getBeachById(beachId);

        const surfData = await surfConditionsService.getSurfConditions({
          lat: beachData.latitude,
          lon: beachData.longitude,
          beach: beachData.nome,
        });

        setBeach(beachData);
        setConditions(surfData);
      } catch (err) {
        console.error('Erro ao carregar condicoes do pico:', err);
        setError('Nao foi possivel carregar as condicoes do pico agora.');
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [beachId]
  );

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  useEffect(() => {
    if (beach?.nome) {
      navigation.setOptions({
        title: `Condicoes - ${beach.nome}`,
      });
    }
  }, [beach?.nome, navigation]);

  if (loading && !conditions) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#1F4A63" />
          <Text style={styles.centerText}>Carregando leitura do mar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !conditions) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData(false)}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
      >
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>Como entender o pico</Text>
          <Text style={styles.headerText}>
            Esta leitura junta onda, vento e balneabilidade em linguagem simples para facilitar sua decisao.
          </Text>
          {beach?.localizacao ? (
            <Text style={styles.headerMeta}>Local: {beach.localizacao}</Text>
          ) : null}
        </View>

        {conditions ? (
          <SurfConditionsCard beachName={beach?.nome} data={conditions} />
        ) : (
          <View style={styles.centerState}>
            <Text style={styles.centerText}>Sem dados para exibir agora.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8FC',
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  headerBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE6EE',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  headerTitle: {
    color: '#18324A',
    fontSize: 20,
    fontWeight: '800',
  },
  headerText: {
    color: '#395872',
    fontSize: 14,
    lineHeight: 20,
  },
  headerMeta: {
    color: '#1F4A63',
    fontSize: 13,
    fontWeight: '700',
  },
  centerState: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  centerText: {
    fontSize: 14,
    color: '#4D6C86',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#9C2E2E',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1F4A63',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
