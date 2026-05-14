import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useAppAlert } from '@/components/AppAlert';
import { SurfConditionsResponse } from '@/types/surfConditions';
import {
  buildLaymanSummary,
  buildQuickTips,
  describeBalneability,
  describeTide,
  describeWave,
  describeWind,
  formatMetric,
  formatPercent,
  formatTideEvent,
  formatTideWindow,
  toCompass,
  toneColors,
} from '@/utils/surfConditionsInterpreter';

function MetricTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHelper}>{helper}</Text>
    </View>
  );
}

export function SurfConditionsCard({
  beachName,
  data,
}: {
  beachName?: string;
  data: SurfConditionsResponse;
}) {
  const { showAlert } = useAppAlert();
  const summary = useMemo(() => buildLaymanSummary(data), [data]);
  const colors = useMemo(() => toneColors(summary.tone), [summary.tone]);
  const quickTips = useMemo(() => buildQuickTips(data), [data]);
  const tideWindows = data.tide?.bestSurfWindows?.slice(0, 3) ?? [];

  const waveHeight = formatMetric(data.marine?.waveHeightMeters, 'm');
  const wavePeriod = formatMetric(data.marine?.wavePeriodSeconds, 's', 0);
  const windSpeed = formatMetric(data.wind?.windSpeedKmh, 'km/h');
  const waterTemp = formatMetric(data.marine?.seaSurfaceTemperatureC, 'C');
  const windDirection = toCompass(data.wind?.windDirectionDegrees);
  const tideLabel = data.tide?.currentLabel ?? 'Mare indisponivel';
  const tideHeight = formatMetric(data.tide?.currentHeightMeters, 'm');
  const tidePercent = formatPercent(data.tide?.fillPercent);

  const balneabilityStatus = data.balneability?.overallStatus ?? 'INDISPONIVEL';
  const balneabilityText = describeBalneability(balneabilityStatus);

  const reportUrl = data.balneability?.reportUrl?.trim();
  const hasReportUrl = Boolean(reportUrl);

  const openReport = async () => {
    if (!reportUrl) return;
    try {
      await Linking.openURL(reportUrl);
    } catch {
      showAlert('Nao foi possivel abrir o boletim', 'Tente novamente em alguns instantes.');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        Leitura simples do pico
        {beachName ? ` - ${beachName}` : ''}
      </Text>

      <View style={[styles.summaryBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>{summary.title}</Text>
        <Text style={styles.summaryText}>{summary.message}</Text>
      </View>

      <View style={styles.metricsRow}>
        <MetricTile
          label="Onda"
          value={`${waveHeight} / ${wavePeriod}`}
          helper={describeWave(data.marine?.waveHeightMeters)}
        />
        <MetricTile
          label="Vento"
          value={`${windSpeed} (${windDirection})`}
          helper={describeWind(data.wind?.windSpeedKmh)}
        />
      </View>

      <View style={styles.metricsRow}>
        <MetricTile
          label="Agua"
          value={waterTemp}
          helper="Temperatura da superficie do mar."
        />
        <MetricTile
          label="Mare"
          value={`${tideLabel} (${tidePercent})`}
          helper={`${tideHeight}. ${describeTide(data.tide)}`}
        />
      </View>

      <View style={styles.metricsRow}>
        <MetricTile
          label="Balneabilidade"
          value={balneabilityStatus}
          helper={balneabilityText}
        />
        <MetricTile
          label="Proxima virada"
          value={data.tide?.nextTurnLabel ?? 'Sem dados'}
          helper={data.tide?.nextEvent ? formatTideEvent(data.tide.nextEvent) : 'Sem horario de mare.'}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dicas rapidas</Text>
        {quickTips.map((tip) => (
          <Text key={tip} style={styles.tipItem}>
            {`\u2022 ${tip}`}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Melhores janelas de mare</Text>
        {tideWindows.length > 0 ? (
          tideWindows.map((window) => (
            <View key={`${window.startsAt}-${window.endsAt}`} style={styles.windowRow}>
              <View style={[styles.windowDot, window.activeNow && styles.windowDotActive]} />
              <View style={styles.windowBody}>
                <Text style={styles.windowTime}>{formatTideWindow(window)}</Text>
                <Text style={styles.windowText}>{window.reason ?? 'Mare enchendo em faixa favoravel.'}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.metaText}>
            Sem janela diurna favoravel encontrada na tabua carregada.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.reportHeader}>
          <Text style={styles.sectionTitle}>Boletim SEMACE</Text>
          {hasReportUrl ? (
            <TouchableOpacity onPress={openReport} style={styles.reportButton}>
              <Ionicons name="open-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.metaText}>
          {data.balneability?.period
            ? `Periodo analisado: ${data.balneability.period}`
            : 'Periodo do boletim nao informado.'}
        </Text>
        <Text style={styles.metaText}>
          {data.balneability?.observation ?? 'Sem observacoes extras para este pico.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDE6EE',
    padding: 14,
    gap: 12,
  },
  title: {
    fontSize: 20,
    color: '#18324A',
    fontWeight: '800',
  },
  summaryBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  summaryText: {
    fontSize: 14,
    color: '#2F465B',
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DFE6EE',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#F9FBFD',
  },
  metricLabel: {
    fontSize: 12,
    color: '#58718A',
    fontWeight: '700',
  },
  metricValue: {
    marginTop: 3,
    fontSize: 16,
    color: '#18324A',
    fontWeight: '800',
  },
  metricHelper: {
    marginTop: 4,
    fontSize: 12,
    color: '#4B6278',
    lineHeight: 16,
  },
  section: {
    borderTopWidth: 1,
    borderColor: '#E7EDF3',
    paddingTop: 10,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#18324A',
    fontWeight: '800',
  },
  tipItem: {
    fontSize: 13,
    color: '#314C64',
    lineHeight: 19,
  },
  metaText: {
    fontSize: 13,
    color: '#4A6279',
    lineHeight: 18,
  },
  windowRow: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
  },
  windowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8DA5B8',
    marginTop: 6,
  },
  windowDotActive: {
    backgroundColor: '#1E6F3D',
  },
  windowBody: {
    flex: 1,
    minWidth: 0,
  },
  windowTime: {
    fontSize: 13,
    color: '#18324A',
    fontWeight: '800',
  },
  windowText: {
    marginTop: 2,
    fontSize: 12,
    color: '#4A6279',
    lineHeight: 17,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  reportButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    backgroundColor: '#18324A',
    borderRadius: 17,
  },
});
