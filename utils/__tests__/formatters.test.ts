import {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatDateTimeWithYear,
  formatTime,
  getBrazilDateKey,
  getBrazilDayDifference,
} from '../formatters';

describe('formatDate', () => {
  it('converte uma string ISO UTC para a data no fuso brasileiro', () => {
    expect(formatDate('2026-04-15T03:00:00Z')).toBe('15/04/2026');
  });

  it('aplica a virada de dia do Brasil para valores UTC', () => {
    expect(formatDate('2026-04-15T02:59:00Z')).toBe('14/04/2026');
  });

  it('trata LocalDateTime sem offset como horario brasileiro', () => {
    expect(formatDateTimeWithYear('2026-04-15T12:30:00')).toBe('15/04/2026, 12:30');
  });

  it('retorna string vazia para valor undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('retorna string vazia para string vazia', () => {
    expect(formatDate('')).toBe('');
  });

  it('retorna string vazia para data invalida', () => {
    expect(formatDate('data-invalida')).toBe('');
  });
});

describe('formatDateTime', () => {
  it('formata data e hora no fuso brasileiro', () => {
    expect(formatDateTime('2026-04-15T12:30:00Z')).toBe('15/04, 09:30');
  });

  it('retorna string vazia para valor undefined', () => {
    expect(formatDateTime(undefined)).toBe('');
  });

  it('retorna string vazia para string vazia', () => {
    expect(formatDateTime('')).toBe('');
  });

  it('retorna string vazia para data invalida', () => {
    expect(formatDateTime('nao-e-uma-data')).toBe('');
  });
});

describe('formatDateTimeWithYear', () => {
  it('formata data completa e hora no fuso brasileiro', () => {
    expect(formatDateTimeWithYear('2026-04-15T12:30:00Z')).toBe('15/04/2026, 09:30');
  });

  it('retorna string vazia para valor undefined', () => {
    expect(formatDateTimeWithYear(undefined)).toBe('');
  });

  it('retorna string vazia para string vazia', () => {
    expect(formatDateTimeWithYear('')).toBe('');
  });

  it('retorna string vazia para data invalida', () => {
    expect(formatDateTimeWithYear('nao-e-uma-data')).toBe('');
  });
});

describe('formatTime e datas curtas', () => {
  it('formata somente hora no Brasil', () => {
    expect(formatTime('2026-04-15T12:30:00Z')).toBe('09:30');
  });

  it('formata somente dia e mes no Brasil', () => {
    expect(formatDateShort('2026-04-15T02:59:00Z')).toBe('14/04');
  });
});

describe('getBrazilDateKey e getBrazilDayDifference', () => {
  it('gera chave de data pelo calendario brasileiro', () => {
    expect(getBrazilDateKey('2026-04-15T02:59:00Z')).toBe('2026-04-14');
  });

  it('calcula diferenca de dias pelo calendario brasileiro', () => {
    const now = new Date('2026-04-16T03:30:00Z');
    expect(getBrazilDayDifference('2026-04-15T03:30:00Z', now)).toBe(1);
  });
});
