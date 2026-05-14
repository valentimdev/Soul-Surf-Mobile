import {
  buildLaymanSummary,
  buildQuickTips,
  describeBalneability,
  describeTide,
  formatTideWindow,
  describeWave,
  describeWind,
  toCompass,
} from '@/utils/surfConditionsInterpreter';

describe('surfConditionsInterpreter', () => {
  it('prioriza alerta de balneabilidade impropria no resumo', () => {
    const summary = buildLaymanSummary({
      surfQuality: { label: 'BOA' },
      balneability: { overallStatus: 'IMPROPRIA' },
    });

    expect(summary.tone).toBe('bad');
    expect(summary.title).toContain('Melhor evitar');
  });

  it('retorna resumo positivo quando mar e balneabilidade estao bons', () => {
    const summary = buildLaymanSummary({
      surfQuality: { label: 'BOA' },
      balneability: { overallStatus: 'PROPRIA' },
    });

    expect(summary.tone).toBe('good');
  });

  it('converte graus para rosa dos ventos simplificada', () => {
    expect(toCompass(0)).toBe('N');
    expect(toCompass(90)).toBe('L');
    expect(toCompass(225)).toBe('SO');
  });

  it('gera dicas rapidas com base em onda, periodo, vento e balneabilidade', () => {
    const tips = buildQuickTips({
      marine: { waveHeightMeters: 2.5, wavePeriodSeconds: 9 },
      wind: { windSpeedKmh: 30 },
      balneability: { overallStatus: 'EM_ALERTA' },
    });

    expect(tips.length).toBeGreaterThan(0);
    expect(tips.join(' ')).toContain('Vento forte');
  });

  it('traduz estados de leitura basica para texto leigo', () => {
    expect(describeWave(0.3)).toContain('fracas');
    expect(describeWind(10)).toContain('fraco');
    expect(describeBalneability('PROPRIA')).toContain('propria');
  });

  it('usa mare enchendo em meia mare para resumo bom de surf', () => {
    const summary = buildLaymanSummary({
      surfQuality: { label: 'BOA' },
      balneability: { overallStatus: 'PROPRIA' },
      tide: {
        currentStatus: 'ENCHENDO',
        currentLabel: 'Mar enchendo',
        fillPercent: 55,
      },
    });

    expect(summary.title).toContain('Boa para surfar');
    expect(summary.tone).toBe('good');
  });

  it('formata janela de mare e descreve tendencia', () => {
    expect(formatTideWindow({
      startsAt: '2026-05-13T10:17:00-03:00',
      endsAt: '2026-05-13T12:47:00-03:00',
    })).toBe('10h17 - 12h47');

    expect(describeTide({
      currentStatus: 'SECANDO',
      currentLabel: 'Mar secando',
    })).toContain('secando');
  });
});
