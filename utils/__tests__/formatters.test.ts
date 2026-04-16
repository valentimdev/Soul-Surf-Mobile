import { formatDate, formatDateTime } from '../formatters';

describe('formatDate', () => {
  it('converte corretamente uma string ISO para o formato brasileiro (DD/MM/AAAA)', () => {
    // Usa T12:00:00Z (meio-dia UTC) para evitar que o fuso -03:00 mude o dia
    expect(formatDate('2026-04-15T12:00:00Z')).toBe('15/04/2026');
  });

  it('converte datas no final do ano corretamente', () => {
    expect(formatDate('2026-12-31T12:00:00Z')).toBe('31/12/2026');
  });

  it('retorna string vazia para valor undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('retorna string vazia para string vazia', () => {
    expect(formatDate('')).toBe('');
  });

  it('retorna string vazia para data inválida', () => {
    expect(formatDate('data-invalida')).toBe('');
  });
});

describe('formatDateTime', () => {
  it('formata corretamente uma string ISO com hora para o padrão brasileiro', () => {
    // Usa uma data/hora em UTC e valida apenas o padrão do retorno (DD/MM, HH:mm)
    const result = formatDateTime('2026-04-15T12:30:00Z');
    expect(result).toMatch(/^\d{2}\/\d{2},\s\d{2}:\d{2}$/);
  });

  it('retorna string vazia para valor undefined', () => {
    expect(formatDateTime(undefined)).toBe('');
  });

  it('retorna string vazia para string vazia', () => {
    expect(formatDateTime('')).toBe('');
  });

  it('retorna string vazia para data inválida', () => {
    expect(formatDateTime('nao-e-uma-data')).toBe('');
  });
});
