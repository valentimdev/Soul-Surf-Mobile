export interface UserDTO {
  id: number;
  username: string;
  email?: string;
  fotoPerfil: string;
  fotoCapa: string;
  bio: string;
  seguidoresCount: number;
  seguindoCount: number;
  admin: boolean;
  banned: boolean;
  following: boolean;
}

export interface BeachDTO {
  id: number;
  nome: string;
  descricao: string;
  localizacao: string;
  caminhoFoto: string;
  nivelExperiencia: string;
  latitude: number;
  longitude: number;
}

export interface PostDTO {
  id: number;
  descricao: string;
  caminhoFoto: string;
  data: string;
  usuario: UserDTO;
  publico: boolean;
  beach: BeachDTO;
  likesCount: number;
  commentsCount: number;
  likedByCurrentUser: boolean;
}

export interface CommentDTO {
  id: number;
  texto: string;
  data: string;
  usuario: UserDTO;
  parentId: number;
}

export interface MessageResponse {
  message: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  empty: boolean;
}
