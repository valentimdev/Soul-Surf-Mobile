export type MarkerType = 'pico' | 'loja' | 'escolinha' | 'reparo';

export interface MapMarker {
  id: string;
  name: string;
  type: MarkerType;
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Filtra os marcadores com base nos tipos selecionados.
 * Se nenhum tipo for selecionado (ou todos), retorna todos os marcadores.
 * @param markers Lista completa de marcadores
 * @param selectedTypes Tipos selecionados para exibicao
 */
export function filterMarkers(markers: MapMarker[], selectedTypes: MarkerType[]): MapMarker[] {
  if (selectedTypes.length === 0) return markers;
  return markers.filter(marker => selectedTypes.includes(marker.type));
}

/**
 * Agrupa marcadores em clusters com base na proximidade (simplificado para lógica de unidade).
 * No MapLibre, o clustering é geralmente nativo via GeoJSON source, 
 * mas para testes unitários, podemos simular uma lógica de agrupamento simples.
 */
export function simulateClustering(markers: MapMarker[], zoomLevel: number): (MapMarker | { id: string, count: number, coordinates: [number, number] })[] {
  // Se o zoom for alto o suficiente, mostramos marcadores individuais
  if (zoomLevel > 15) return markers;

  // Lógica simplificada: se houver muitos marcadores, agrupamos todos em um cluster
  // (Apenas para fins de demonstração de teste unitário conforme solicitado)
  if (markers.length > 5) {
    const avgLon = markers.reduce((sum, m) => sum + m.coordinates[0], 0) / markers.length;
    const avgLat = markers.reduce((sum, m) => sum + m.coordinates[1], 0) / markers.length;
    
    return [{
      id: 'cluster-1',
      count: markers.length,
      coordinates: [avgLon, avgLat]
    }];
  }

  return markers;
}
