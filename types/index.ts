export type SpotType = 'pico' | 'escolinha' | 'reparo' | 'loja';

export interface MapPin {
    id: string;
    coordinate: [number, number];
    type: SpotType;
    name: string;
    sourceType?: 'beach' | 'poi';
    beachId?: number;
    beachName?: string;
    poiId?: number;
    description?: string;
    imageUrl?: string;
    address?: string;
    instagram?: string;
    whatsapp?: string;
}

export interface SurfSpot extends MapPin {
    type: 'pico';
}

export interface SurfSchool extends MapPin {
    type: 'escolinha';
}

export interface RepairShop extends MapPin {
    type: 'reparo';
}

export interface SurfStore extends MapPin {
    type: 'loja';
}
