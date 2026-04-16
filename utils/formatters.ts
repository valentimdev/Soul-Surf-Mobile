/**
 * Formata uma string de data ISO para o padrão brasileiro (DD/MM/AAAA).
 * Retorna string vazia para valores inválidos ou nulos.
 */
export function formatDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata uma string de data ISO para o padrão brasileiro com hora (DD/MM HH:mm).
 * Retorna string vazia para valores inválidos ou nulos.
 */
export function formatDateTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
