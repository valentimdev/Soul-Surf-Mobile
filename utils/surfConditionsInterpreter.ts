import {
  BalneabilityStatus,
  LaymanSummary,
  LaymanTone,
  SurfConditionsResponse,
  SurfConditionsTide,
  SurfConditionsTideEvent,
  SurfConditionsTideWindow,
} from '@/types/surfConditions';

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function formatMetric(value: number | null | undefined, unit: string, digits = 1): string {
  if (!isValidNumber(value)) return 'Sem dados';
  return `${value.toFixed(digits)} ${unit}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (!isValidNumber(value)) return 'Sem dados';
  return `${clampPercent(value)}%`;
}

export function toCompass(degrees: number | null | undefined): string {
  if (!isValidNumber(degrees)) return 'Sem direcao';
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
}

export function describeWave(heightMeters: number | null | undefined): string {
  if (!isValidNumber(heightMeters)) return 'Sem leitura de onda agora.';
  if (heightMeters < 0.4) return 'Ondas bem fracas.';
  if (heightMeters < 0.8) return 'Ondas pequenas e mais tranquilas.';
  if (heightMeters <= 2.2) return 'Ondas em faixa boa para a maioria.';
  if (heightMeters <= 3.0) return 'Ondas grandes, exige experiencia.';
  return 'Mar muito grande e exigente.';
}

export function describeWind(speedKmh: number | null | undefined): string {
  if (!isValidNumber(speedKmh)) return 'Sem leitura de vento agora.';
  if (speedKmh <= 14) return 'Vento fraco.';
  if (speedKmh <= 24) return 'Vento moderado.';
  if (speedKmh <= 32) return 'Vento forte.';
  return 'Vento muito forte.';
}

export function describeBalneability(status: BalneabilityStatus | undefined): string {
  switch (status) {
    case 'PROPRIA':
      return 'Agua propria para banho segundo a SEMACE.';
    case 'EM_ALERTA':
      return 'Agua em alerta, entre com cautela.';
    case 'IMPROPRIA':
      return 'Agua impropria, melhor evitar entrar.';
    case 'INDISPONIVEL':
    default:
      return 'Balneabilidade indisponivel no momento.';
  }
}

export function describeTide(tide: SurfConditionsTide | null | undefined): string {
  if (!tide || tide.currentStatus === 'INDISPONIVEL') return 'Sem leitura de mare agora.';
  if (tide.recommendation) return tide.recommendation;

  switch (tide.currentStatus) {
    case 'ENCHENDO':
      return 'Mare enchendo, geralmente uma boa tendencia para beach breaks.';
    case 'SECANDO':
      return 'Mare secando, pode deixar a onda mais irregular.';
    case 'VIRANDO':
      return 'Mare perto da virada, confira no pico.';
    default:
      return 'Sem leitura de mare agora.';
  }
}

export function formatTideEvent(event: SurfConditionsTideEvent | null | undefined): string {
  if (!event) return 'Sem dados';
  const type = event.type === 'ALTA' ? 'Alta' : event.type === 'BAIXA' ? 'Baixa' : 'Mare';
  const time = event.timeLabel ?? formatIsoTime(event.dateTime) ?? '--:--';
  const height = formatMetric(event.heightMeters, 'm', 2);
  return `${type} ${time} (${height})`;
}

export function formatTideWindow(window: SurfConditionsTideWindow | null | undefined): string {
  if (!window?.startsAt || !window?.endsAt) return 'Sem janela';

  const startDate = formatIsoDate(window.startsAt);
  const endDate = formatIsoDate(window.endsAt);
  const startTime = formatIsoTime(window.startsAt);
  const endTime = formatIsoTime(window.endsAt);

  if (!startTime || !endTime) return 'Sem janela';
  if (startDate && endDate && startDate !== endDate) {
    return `${startDate} ${startTime} - ${endDate} ${endTime}`;
  }
  return `${startTime} - ${endTime}`;
}

function formatIsoTime(value: string | null | undefined): string | null {
  const match = value?.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  return `${match[1]}h${match[2]}`;
}

function formatIsoDate(value: string | null | undefined): string | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `${match[3]}/${match[2]}`;
}

function hasGoodTideNow(tide: SurfConditionsTide | undefined): boolean {
  if (!tide || tide.currentStatus !== 'ENCHENDO' || !isValidNumber(tide.fillPercent)) {
    return false;
  }
  return tide.fillPercent >= 35 && tide.fillPercent <= 75;
}

function hasExtremeTide(tide: SurfConditionsTide | undefined): boolean {
  if (!tide || !isValidNumber(tide.fillPercent)) return false;
  return tide.fillPercent <= 15 || tide.fillPercent >= 90;
}

export function buildLaymanSummary(data: SurfConditionsResponse): LaymanSummary {
  const quality = data.surfQuality?.label;
  const balneability = data.balneability?.overallStatus;
  const tide = data.tide;

  if (balneability === 'IMPROPRIA') {
    return {
      tone: 'bad',
      title: 'Melhor evitar entrar hoje',
      message: 'A balneabilidade esta impropria. Mesmo com onda boa, a agua nao esta recomendada.',
    };
  }

  if (quality === 'BOA' && hasGoodTideNow(tide) && balneability === 'PROPRIA') {
    return {
      tone: 'good',
      title: 'Boa para surfar agora',
      message: 'Onda, vento, agua e mare enchendo estao em uma janela favoravel.',
    };
  }

  if (quality === 'BOA' && hasGoodTideNow(tide)) {
    return {
      tone: 'good',
      title: 'Mar bom para surfar',
      message: 'As condicoes estao positivas e a mare enchendo ajuda a formacao das ondas.',
    };
  }

  if (quality === 'BOA' && hasExtremeTide(tide)) {
    return {
      tone: 'attention',
      title: 'Mar bom, mas a mare pede atencao',
      message: 'Onda e vento ajudam, porem a mare esta em extremo e pode mexer na formacao.',
    };
  }

  if (quality === 'BOA' && balneability === 'PROPRIA') {
    return {
      tone: 'good',
      title: 'Bom momento para o pico',
      message: 'Mar com condicoes favoraveis e agua propria para banho.',
    };
  }

  if (quality === 'BOA') {
    return {
      tone: 'good',
      title: 'Mar bom para surfar',
      message: 'As condicoes de onda e vento estao positivas para a sessao.',
    };
  }

  if (quality === 'REGULAR' || balneability === 'EM_ALERTA') {
    return {
      tone: 'attention',
      title: 'Da para entrar com atencao',
      message: 'Vale avaliar no local. Hoje ha sinais de condicao intermediaria.',
    };
  }

  if (quality === 'RUIM') {
    return {
      tone: 'bad',
      title: 'Condicao ruim no momento',
      message: 'Vento, onda ou mare podem estar desfavoraveis para boa sessao.',
    };
  }

  return {
    tone: 'neutral',
    title: 'Sem leitura suficiente',
    message: 'Nao foi possivel montar um parecer completo agora.',
  };
}

export function buildQuickTips(data: SurfConditionsResponse): string[] {
  const tips: string[] = [];
  const waveHeight = data.marine?.waveHeightMeters;
  const wavePeriod = data.marine?.wavePeriodSeconds;
  const windSpeed = data.wind?.windSpeedKmh;
  const balneability = data.balneability?.overallStatus;
  const tide = data.tide;
  const firstWindow = tide?.bestSurfWindows?.[0];
  const activeWindow = tide?.bestSurfWindows?.find((window) => window.activeNow);

  if (balneability === 'IMPROPRIA') {
    tips.push('Evite banho de mar devido ao risco sanitario informado no boletim.');
  } else if (balneability === 'EM_ALERTA') {
    tips.push('Se entrar no mar, redobre cuidado e evite permanecer muito tempo na agua.');
  }

  if (tide?.currentStatus === 'ENCHENDO') {
    tips.push('Mare enchendo: costuma ser a melhor tendencia para beach breaks.');
  } else if (tide?.currentStatus === 'SECANDO') {
    tips.push('Mare secando: confira se a onda nao esta fechando ou perdendo forca.');
  }

  if (activeWindow) {
    tips.push(`Janela boa de mare agora: ${formatTideWindow(activeWindow)}.`);
  } else if (firstWindow) {
    tips.push(`Proxima janela boa de mare: ${formatTideWindow(firstWindow)}.`);
  }

  if (isValidNumber(waveHeight)) {
    if (waveHeight < 0.4) tips.push('Ondas pequenas: boa opcao para treino de base e iniciantes.');
    if (waveHeight > 2.2) tips.push('Ondas grandes: mais indicado para surfistas experientes.');
  }

  if (isValidNumber(wavePeriod)) {
    if (wavePeriod >= 8) tips.push('Periodo de onda bom: tende a formar ondas mais organizadas.');
    if (wavePeriod < 6) tips.push('Periodo curto: mar pode ficar mexido e menos previsivel.');
  }

  if (isValidNumber(windSpeed) && windSpeed > 28) {
    tips.push('Vento forte: a superficie da agua pode ficar muito irregular.');
  }

  if (tips.length === 0) {
    tips.push('Conferir no pico antes de entrar continua sendo a melhor decisao.');
  }

  return tips.slice(0, 4);
}

export function toneColors(tone: LaymanTone): { bg: string; border: string; text: string } {
  switch (tone) {
    case 'good':
      return { bg: '#EAF9EF', border: '#9CD3AE', text: '#1E6F3D' };
    case 'attention':
      return { bg: '#FFF9E8', border: '#EBCD7A', text: '#7A5A00' };
    case 'bad':
      return { bg: '#FDEEEE', border: '#E9A5A5', text: '#8A1F1F' };
    case 'neutral':
    default:
      return { bg: '#EEF3FA', border: '#B8C7DE', text: '#2E4E74' };
  }
}
