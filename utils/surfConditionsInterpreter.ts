import {
  BalneabilityStatus,
  LaymanSummary,
  LaymanTone,
  SurfConditionsResponse,
} from '@/types/surfConditions';

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatMetric(value: number | null | undefined, unit: string, digits = 1): string {
  if (!isValidNumber(value)) return 'Sem dados';
  return `${value.toFixed(digits)} ${unit}`;
}

export function toCompass(degrees: number | null | undefined): string {
  if (!isValidNumber(degrees)) return 'Sem direção';
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
  if (heightMeters <= 3.0) return 'Ondas grandes, exige experiência.';
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

export function buildLaymanSummary(data: SurfConditionsResponse): LaymanSummary {
  const quality = data.surfQuality?.label;
  const balneability = data.balneability?.overallStatus;

  if (balneability === 'IMPROPRIA') {
    return {
      tone: 'bad',
      title: 'Melhor evitar entrar hoje',
      message: 'A balneabilidade esta impropria. Mesmo com onda boa, a agua nao esta recomendada.',
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
      message: 'Vento, onda ou maré podem estar desfavoraveis para boa sessao.',
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

  if (balneability === 'IMPROPRIA') {
    tips.push('Evite banho de mar devido ao risco sanitario informado no boletim.');
  } else if (balneability === 'EM_ALERTA') {
    tips.push('Se entrar no mar, redobre cuidado e evite permanecer muito tempo na agua.');
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
