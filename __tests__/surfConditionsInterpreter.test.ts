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
  toneColors,
  toCompass,
} from '@/utils/surfConditionsInterpreter';

// ---------------------------------------------------------------------------
// formatMetric
// ---------------------------------------------------------------------------
describe('formatMetric', () => {
  it('formata numero com unidade e 1 casa decimal por padrao', () => {
    expect(formatMetric(2.5, 'm')).toBe('2.5 m');
  });

  it('respeita o numero de casas decimais informado', () => {
    expect(formatMetric(1.234, 'm', 2)).toBe('1.23 m');
  });

  it('retorna "Sem dados" para null', () => {
    expect(formatMetric(null, 'm')).toBe('Sem dados');
  });

  it('retorna "Sem dados" para undefined', () => {
    expect(formatMetric(undefined, 'm')).toBe('Sem dados');
  });

  it('retorna "Sem dados" para Infinity', () => {
    expect(formatMetric(Infinity, 'm')).toBe('Sem dados');
  });
});

// ---------------------------------------------------------------------------
// formatPercent
// ---------------------------------------------------------------------------
describe('formatPercent', () => {
  it('formata numero como porcentagem arredondada', () => {
    expect(formatPercent(54.6)).toBe('55%');
  });

  it('limita ao maximo de 100%', () => {
    expect(formatPercent(150)).toBe('100%');
  });

  it('limita ao minimo de 0%', () => {
    expect(formatPercent(-10)).toBe('0%');
  });

  it('retorna "Sem dados" para null', () => {
    expect(formatPercent(null)).toBe('Sem dados');
  });

  it('retorna "Sem dados" para undefined', () => {
    expect(formatPercent(undefined)).toBe('Sem dados');
  });
});

// ---------------------------------------------------------------------------
// toCompass
// ---------------------------------------------------------------------------
describe('toCompass', () => {
  it('retorna N para 0 graus', () => expect(toCompass(0)).toBe('N'));
  it('retorna NE para 45 graus', () => expect(toCompass(45)).toBe('NE'));
  it('retorna L para 90 graus', () => expect(toCompass(90)).toBe('L'));
  it('retorna SE para 135 graus', () => expect(toCompass(135)).toBe('SE'));
  it('retorna S para 180 graus', () => expect(toCompass(180)).toBe('S'));
  it('retorna SO para 225 graus', () => expect(toCompass(225)).toBe('SO'));
  it('retorna O para 270 graus', () => expect(toCompass(270)).toBe('O'));
  it('retorna NO para 315 graus', () => expect(toCompass(315)).toBe('NO'));
  it('faz wrap corretamente para 360 graus (= N)', () => expect(toCompass(360)).toBe('N'));
  it('faz wrap para valores negativos (-90 = O)', () => expect(toCompass(-90)).toBe('O'));
  it('retorna "Sem direcao" para null', () => expect(toCompass(null)).toBe('Sem direcao'));
  it('retorna "Sem direcao" para undefined', () => expect(toCompass(undefined)).toBe('Sem direcao'));
});

// ---------------------------------------------------------------------------
// describeWave
// ---------------------------------------------------------------------------
describe('describeWave', () => {
  it('descreve ondas bem fracas (< 0.4 m)', () => {
    expect(describeWave(0.3)).toContain('fracas');
  });

  it('descreve ondas pequenas (0.4 – 0.79 m)', () => {
    expect(describeWave(0.6)).toContain('pequenas');
  });

  it('descreve faixa boa para a maioria (0.8 – 2.2 m)', () => {
    expect(describeWave(1.5)).toContain('boa para a maioria');
  });

  it('descreve ondas grandes que exigem experiencia (2.3 – 3.0 m)', () => {
    expect(describeWave(2.8)).toContain('experiencia');
  });

  it('descreve mar muito grande (> 3.0 m)', () => {
    expect(describeWave(4.0)).toContain('muito grande');
  });

  it('retorna mensagem padrao para null', () => {
    expect(describeWave(null)).toContain('Sem leitura');
  });

  it('retorna mensagem padrao para undefined', () => {
    expect(describeWave(undefined)).toContain('Sem leitura');
  });
});

// ---------------------------------------------------------------------------
// describeWind
// ---------------------------------------------------------------------------
describe('describeWind', () => {
  it('descreve vento fraco (<= 14 km/h)', () => {
    expect(describeWind(10)).toContain('fraco');
  });

  it('descreve vento moderado (15 – 24 km/h)', () => {
    expect(describeWind(20)).toContain('moderado');
  });

  it('descreve vento forte (25 – 32 km/h)', () => {
    expect(describeWind(30)).toContain('forte');
  });

  it('descreve vento muito forte (> 32 km/h)', () => {
    expect(describeWind(40)).toContain('muito forte');
  });

  it('retorna mensagem padrao para null', () => {
    expect(describeWind(null)).toContain('Sem leitura');
  });
});

// ---------------------------------------------------------------------------
// describeBalneability
// ---------------------------------------------------------------------------
describe('describeBalneability', () => {
  it('descreve agua propria', () => {
    expect(describeBalneability('PROPRIA')).toContain('propria para banho');
  });

  it('descreve agua em alerta', () => {
    expect(describeBalneability('EM_ALERTA')).toContain('alerta');
  });

  it('descreve agua impropria', () => {
    expect(describeBalneability('IMPROPRIA')).toContain('impropria');
  });

  it('retorna indisponivel para status INDISPONIVEL', () => {
    expect(describeBalneability('INDISPONIVEL')).toContain('indisponivel');
  });

  it('retorna indisponivel para undefined (caso padrao)', () => {
    expect(describeBalneability(undefined)).toContain('indisponivel');
  });
});

// ---------------------------------------------------------------------------
// describeTide
// ---------------------------------------------------------------------------
describe('describeTide', () => {
  it('descreve mare enchendo', () => {
    expect(describeTide({ currentStatus: 'ENCHENDO', currentLabel: 'Enchendo' })).toContain('enchendo');
  });

  it('descreve mare secando', () => {
    expect(describeTide({ currentStatus: 'SECANDO', currentLabel: 'Secando' })).toContain('secando');
  });

  it('descreve mare virando', () => {
    expect(describeTide({ currentStatus: 'VIRANDO', currentLabel: 'Virando' })).toContain('virada');
  });

  it('usa a recommendation do backend quando disponivel', () => {
    expect(describeTide({
      currentStatus: 'ENCHENDO',
      currentLabel: 'Enchendo',
      recommendation: 'Melhor momento do dia para surfar.',
    })).toBe('Melhor momento do dia para surfar.');
  });

  it('retorna "Sem leitura" para status INDISPONIVEL', () => {
    expect(describeTide({ currentStatus: 'INDISPONIVEL', currentLabel: '' })).toContain('Sem leitura');
  });

  it('retorna "Sem leitura" para null', () => {
    expect(describeTide(null)).toContain('Sem leitura');
  });

  it('retorna "Sem leitura" para undefined', () => {
    expect(describeTide(undefined)).toContain('Sem leitura');
  });
});

// ---------------------------------------------------------------------------
// formatTideEvent
// ---------------------------------------------------------------------------
describe('formatTideEvent', () => {
  it('formata evento de mare alta com timeLabel', () => {
    const result = formatTideEvent({ type: 'ALTA', timeLabel: '10h30', heightMeters: 1.8 });
    expect(result).toContain('Alta');
    expect(result).toContain('10h30');
    expect(result).toContain('1.80 m');
  });

  it('formata evento de mare baixa', () => {
    const result = formatTideEvent({ type: 'BAIXA', timeLabel: '16h00', heightMeters: 0.3 });
    expect(result).toContain('Baixa');
  });

  it('usa dateTime para extrair hora quando timeLabel e null', () => {
    const result = formatTideEvent({
      type: 'ALTA',
      timeLabel: null,
      dateTime: '2026-05-13T08:45:00-03:00',
      heightMeters: 2.0,
    });
    expect(result).toContain('08h45');
  });

  it('retorna "Sem dados" para null', () => {
    expect(formatTideEvent(null)).toBe('Sem dados');
  });

  it('retorna "Sem dados" para undefined', () => {
    expect(formatTideEvent(undefined)).toBe('Sem dados');
  });
});

// ---------------------------------------------------------------------------
// formatTideWindow
// ---------------------------------------------------------------------------
describe('formatTideWindow', () => {
  it('formata janela com inicio e fim no mesmo dia como intervalo de horas', () => {
    expect(formatTideWindow({
      startsAt: '2026-05-13T10:17:00-03:00',
      endsAt: '2026-05-13T12:47:00-03:00',
    })).toBe('10h17 - 12h47');
  });

  it('inclui datas quando inicio e fim sao em dias diferentes', () => {
    const result = formatTideWindow({
      startsAt: '2026-05-13T22:00:00-03:00',
      endsAt: '2026-05-14T02:00:00-03:00',
    });
    expect(result).toContain('13/05');
    expect(result).toContain('14/05');
  });

  it('retorna "Sem janela" para objeto nulo', () => {
    expect(formatTideWindow(null)).toBe('Sem janela');
  });

  it('retorna "Sem janela" para objeto sem startsAt', () => {
    expect(formatTideWindow({ endsAt: '2026-05-13T12:00:00Z' })).toBe('Sem janela');
  });
});

// ---------------------------------------------------------------------------
// buildLaymanSummary
// ---------------------------------------------------------------------------
describe('buildLaymanSummary', () => {
  it('prioriza alerta de balneabilidade impropria acima de tudo', () => {
    const summary = buildLaymanSummary({
      surfQuality: { label: 'BOA' },
      balneability: { overallStatus: 'IMPROPRIA' },
    });
    expect(summary.tone).toBe('bad');
    expect(summary.title).toContain('Melhor evitar');
  });

  it('retorna "good" para BOA + mare enchendo em meia mare + agua PROPRIA (cenario ideal)', () => {
    const summary = buildLaymanSummary({
      surfQuality: { label: 'BOA' },
      balneability: { overallStatus: 'PROPRIA' },
      tide: { currentStatus: 'ENCHENDO', currentLabel: 'Enchendo', fillPercent: 55 },
    });
    expect(summary.tone).toBe('good');
    expect(summary.title).toContain('Boa para surfar agora');
  });

  it('retorna "good" para BOA + mare enchendo em meia mare (sem dado de balneabilidade)', () => {
    const summary = buildLaymanSummary({
      surfQuality: { label: 'BOA' },
      tide: { currentStatus: 'ENCHENDO', currentLabel: 'Enchendo', fillPercent: 50 },
    });
    expect(summary.tone).toBe('good');
    expect(summary.title).toContain('Mar bom para surfar');
  });

  it('retorna "attention" para BOA + mare em extremo (fillPercent <= 15)', () => {
    const summary = buildLaymanSummary({
      surfQuality: { label: 'BOA' },
      tide: { currentStatus: 'SECANDO', currentLabel: 'Secando', fillPercent: 10 },
    });
    expect(summary.tone).toBe('attention');
    expect(summary.title).toContain('mare pede atencao');
  });

  it('retorna "attention" para BOA + mare em extremo (fillPercent >= 90)', () => {
    const summary = buildLaymanSummary({
      surfQuality: { label: 'BOA' },
      tide: { currentStatus: 'ENCHENDO', currentLabel: 'Enchendo', fillPercent: 95 },
    });
    expect(summary.tone).toBe('attention');
  });

  it('retorna "good" para BOA + PROPRIA sem dado de mare', () => {
    const summary = buildLaymanSummary({
      surfQuality: { label: 'BOA' },
      balneability: { overallStatus: 'PROPRIA' },
    });
    expect(summary.tone).toBe('good');
    expect(summary.title).toContain('Bom momento');
  });

  it('retorna "good" para qualidade BOA sem outros dados', () => {
    const summary = buildLaymanSummary({
      surfQuality: { label: 'BOA' },
    });
    expect(summary.tone).toBe('good');
    expect(summary.title).toContain('Mar bom para surfar');
  });

  it('retorna "attention" para qualidade REGULAR', () => {
    const summary = buildLaymanSummary({
      surfQuality: { label: 'REGULAR' },
    });
    expect(summary.tone).toBe('attention');
    expect(summary.title).toContain('atencao');
  });

  it('retorna "attention" para balneabilidade EM_ALERTA mesmo com mare ruim', () => {
    const summary = buildLaymanSummary({
      balneability: { overallStatus: 'EM_ALERTA' },
    });
    expect(summary.tone).toBe('attention');
  });

  it('retorna "bad" para qualidade RUIM', () => {
    const summary = buildLaymanSummary({
      surfQuality: { label: 'RUIM' },
    });
    expect(summary.tone).toBe('bad');
    expect(summary.title).toContain('ruim');
  });

  it('retorna "neutral" quando nao ha dados suficientes', () => {
    const summary = buildLaymanSummary({});
    expect(summary.tone).toBe('neutral');
    expect(summary.title).toContain('Sem leitura');
  });
});

// ---------------------------------------------------------------------------
// buildQuickTips
// ---------------------------------------------------------------------------
describe('buildQuickTips', () => {
  it('adiciona tip de balneabilidade impropria', () => {
    const tips = buildQuickTips({
      balneability: { overallStatus: 'IMPROPRIA' },
    });
    expect(tips.join(' ')).toContain('risco sanitario');
  });

  it('adiciona tip de balneabilidade em alerta', () => {
    const tips = buildQuickTips({
      balneability: { overallStatus: 'EM_ALERTA' },
    });
    expect(tips.join(' ')).toContain('redobre cuidado');
  });

  it('adiciona tip de mare enchendo', () => {
    const tips = buildQuickTips({
      tide: { currentStatus: 'ENCHENDO', currentLabel: 'Enchendo' },
    });
    expect(tips.join(' ')).toContain('Mare enchendo');
  });

  it('adiciona tip de mare secando', () => {
    const tips = buildQuickTips({
      tide: { currentStatus: 'SECANDO', currentLabel: 'Secando' },
    });
    expect(tips.join(' ')).toContain('Mare secando');
  });

  it('adiciona tip de janela de mare ativa', () => {
    const tips = buildQuickTips({
      tide: {
        currentStatus: 'ENCHENDO',
        currentLabel: 'Enchendo',
        bestSurfWindows: [
          { startsAt: '2026-05-13T10:00:00-03:00', endsAt: '2026-05-13T12:00:00-03:00', activeNow: true },
        ],
      },
    });
    expect(tips.join(' ')).toContain('Janela boa de mare agora');
  });

  it('adiciona tip de proxima janela quando nenhuma esta ativa', () => {
    const tips = buildQuickTips({
      tide: {
        currentStatus: 'SECANDO',
        currentLabel: 'Secando',
        bestSurfWindows: [
          { startsAt: '2026-05-13T14:00:00-03:00', endsAt: '2026-05-13T16:00:00-03:00', activeNow: false },
        ],
      },
    });
    expect(tips.join(' ')).toContain('Proxima janela');
  });

  it('adiciona tip de onda pequena (< 0.4 m)', () => {
    const tips = buildQuickTips({
      marine: { waveHeightMeters: 0.2, wavePeriodSeconds: 7 },
    });
    expect(tips.join(' ')).toContain('iniciantes');
  });

  it('adiciona tip de onda grande (> 2.2 m)', () => {
    const tips = buildQuickTips({
      marine: { waveHeightMeters: 2.5, wavePeriodSeconds: 7 },
    });
    expect(tips.join(' ')).toContain('experientes');
  });

  it('adiciona tip de bom periodo de onda (>= 8s)', () => {
    const tips = buildQuickTips({
      marine: { waveHeightMeters: 1.0, wavePeriodSeconds: 10 },
    });
    expect(tips.join(' ')).toContain('Periodo de onda bom');
  });

  it('adiciona tip de periodo curto (< 6s)', () => {
    const tips = buildQuickTips({
      marine: { waveHeightMeters: 1.0, wavePeriodSeconds: 5 },
    });
    expect(tips.join(' ')).toContain('Periodo curto');
  });

  it('adiciona tip de vento forte (> 28 km/h)', () => {
    const tips = buildQuickTips({
      wind: { windSpeedKmh: 35 },
    });
    expect(tips.join(' ')).toContain('Vento forte');
  });

  it('retorna tip padrao quando nenhuma condicao se aplica', () => {
    const tips = buildQuickTips({});
    expect(tips).toHaveLength(1);
    expect(tips[0]).toContain('Conferir no pico');
  });

  it('limita o resultado a no maximo 4 dicas', () => {
    const tips = buildQuickTips({
      balneability: { overallStatus: 'EM_ALERTA' },
      tide: {
        currentStatus: 'SECANDO',
        currentLabel: 'Secando',
        bestSurfWindows: [
          { startsAt: '2026-05-13T14:00:00-03:00', endsAt: '2026-05-13T16:00:00-03:00', activeNow: false },
        ],
      },
      marine: { waveHeightMeters: 2.8, wavePeriodSeconds: 9 },
      wind: { windSpeedKmh: 35 },
    });
    expect(tips.length).toBeLessThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// toneColors
// ---------------------------------------------------------------------------
describe('toneColors', () => {
  it('retorna cores verdes para tom "good"', () => {
    const { bg, border, text } = toneColors('good');
    expect(bg).toBe('#EAF9EF');
    expect(border).toBe('#9CD3AE');
    expect(text).toBe('#1E6F3D');
  });

  it('retorna cores amarelas para tom "attention"', () => {
    const { bg } = toneColors('attention');
    expect(bg).toBe('#FFF9E8');
  });

  it('retorna cores vermelhas para tom "bad"', () => {
    const { bg } = toneColors('bad');
    expect(bg).toBe('#FDEEEE');
  });

  it('retorna cores azuis para tom "neutral" (e para qualquer valor desconhecido)', () => {
    const { bg } = toneColors('neutral');
    expect(bg).toBe('#EEF3FA');
  });
});
