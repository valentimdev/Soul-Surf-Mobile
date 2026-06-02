export const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';

const BRAZIL_LOCALE = 'pt-BR';

function hasExplicitTimezone(value: string): boolean {
  return /(?:z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);

  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const hour = value('hour');
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    hour === 24 ? 0 : hour,
    value('minute'),
    value('second')
  );

  return asUtc - date.getTime();
}

function zonedDateTimeToDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  const firstOffset = getTimeZoneOffsetMs(new Date(utcGuess), BRAZIL_TIME_ZONE);
  const firstUtc = utcGuess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(new Date(firstUtc), BRAZIL_TIME_ZONE);
  return new Date(utcGuess - secondOffset);
}

export function parseDateInBrazil(value?: string): Date | null {
  if (!value) return null;

  const trimmed = value.trim();
  const naiveMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/
  );

  const date = naiveMatch && !hasExplicitTimezone(trimmed)
    ? zonedDateTimeToDate(
        Number(naiveMatch[1]),
        Number(naiveMatch[2]),
        Number(naiveMatch[3]),
        Number(naiveMatch[4] ?? 0),
        Number(naiveMatch[5] ?? 0),
        Number(naiveMatch[6] ?? 0),
        Number((naiveMatch[7] ?? '0').padEnd(3, '0'))
      )
    : new Date(trimmed);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatWithBrazilTimeZone(value: string | undefined, options: Intl.DateTimeFormatOptions): string {
  const date = parseDateInBrazil(value);
  if (!date) return '';

  return new Intl.DateTimeFormat(BRAZIL_LOCALE, {
    ...options,
    timeZone: BRAZIL_TIME_ZONE,
  }).format(date);
}

/**
 * Formata uma string de data ISO para o padrao brasileiro (DD/MM/AAAA).
 * Retorna string vazia para valores invalidos ou nulos.
 */
export function formatDate(value?: string): string {
  return formatWithBrazilTimeZone(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateShort(value?: string): string {
  return formatWithBrazilTimeZone(value, {
    day: '2-digit',
    month: '2-digit',
  });
}

export function formatTime(value?: string): string {
  return formatWithBrazilTimeZone(value, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata uma string de data ISO para o padrao brasileiro com hora (DD/MM HH:mm).
 * Retorna string vazia para valores invalidos ou nulos.
 */
export function formatDateTime(value?: string): string {
  return formatWithBrazilTimeZone(value, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata uma string de data ISO para o padrao brasileiro com ano e hora.
 * Retorna string vazia para valores invalidos ou nulos.
 */
export function formatDateTimeWithYear(value?: string): string {
  return formatWithBrazilTimeZone(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getBrazilDateKey(value?: string): string {
  const date = parseDateInBrazil(value);
  if (!date) return 'invalid-date';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const partValue = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${partValue('year')}-${partValue('month')}-${partValue('day')}`;
}

export function getBrazilDayDifference(value?: string, now = new Date()): number | null {
  const valueKey = getBrazilDateKey(value);
  if (valueKey === 'invalid-date') return null;

  const nowKey = getBrazilDateKey(now.toISOString());
  const [valueYear, valueMonth, valueDay] = valueKey.split('-').map(Number);
  const [nowYear, nowMonth, nowDay] = nowKey.split('-').map(Number);

  const valueUtc = Date.UTC(valueYear, valueMonth - 1, valueDay);
  const nowUtc = Date.UTC(nowYear, nowMonth - 1, nowDay);
  return Math.round((nowUtc - valueUtc) / 86400000);
}
