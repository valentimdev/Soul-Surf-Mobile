import { filterMarkers, simulateClustering, MapMarker } from './marker-utils';

describe('Marker Utils', () => {
  const mockMarkers: MapMarker[] = [
    { id: '1', name: 'Praia do Futuro', type: 'pico', coordinates: [-38.48, -3.73] },
    { id: '2', name: 'Pico das Almas', type: 'pico', coordinates: [-38.52, -3.68] },
    { id: '3', name: 'Soul Surf Shop', type: 'loja', coordinates: [-38.51, -3.72] },
    { id: '4', name: 'Escolinha Mar', type: 'escolinha', coordinates: [-38.49, -3.74] },
    { id: '5', name: 'Reparos Surf', type: 'reparo', coordinates: [-38.50, -3.71] },
    { id: '6', name: 'Pico do Meio', type: 'pico', coordinates: [-38.47, -3.72] },
  ];

  describe('filterMarkers', () => {
    it('deve retornar todos os marcadores se nenhum filtro for selecionado', () => {
      const filtered = filterMarkers(mockMarkers, []);
      expect(filtered.length).toBe(6);
    });

    it('deve filtrar apenas picos', () => {
      const filtered = filterMarkers(mockMarkers, ['pico']);
      expect(filtered.every(m => m.type === 'pico')).toBe(true);
      expect(filtered.length).toBe(3);
    });

    it('deve filtrar picos e lojas', () => {
      const filtered = filterMarkers(mockMarkers, ['pico', 'loja']);
      expect(filtered.length).toBe(4);
      expect(filtered.some(m => m.type === 'pico')).toBe(true);
      expect(filtered.some(m => m.type === 'loja')).toBe(true);
      expect(filtered.some(m => m.type === 'escolinha')).toBe(false);
    });

    it('deve retornar vazio se nenhum marcador corresponder ao filtro', () => {
      const filtered = filterMarkers(mockMarkers.slice(0, 2), ['loja']);
      expect(filtered.length).toBe(0);
    });
  });

  describe('simulateClustering', () => {
    it('deve mostrar marcadores individuais em zoom alto', () => {
      const result = simulateClustering(mockMarkers, 16);
      expect(result.length).toBe(6);
      expect(result[0]).toHaveProperty('name');
    });

    it('deve agrupar marcadores em zoom baixo se houver muitos', () => {
      const result = simulateClustering(mockMarkers, 10);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('count', 6);
    });

    it('nao deve agrupar se houver poucos marcadores', () => {
      const fewMarkers = mockMarkers.slice(0, 3);
      const result = simulateClustering(fewMarkers, 10);
      expect(result.length).toBe(3);
      expect(result[0]).toHaveProperty('name');
    });
  });
});
