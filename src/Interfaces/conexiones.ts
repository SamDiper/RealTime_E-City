export interface Conexion {
  id: number;
  idUserCreated: number;
  userCreated: string | null;
  dateCreated: string;
  idUserUpdated: number;
  userUpdated: string | null;
  dateUpdated: string;
  idPaypad: number;
  paypad: string | null;
  name: string;
  userName: string;
  pwd: string;
  description: string;
  icon: string;
  isEditing?: boolean; // Para control local de edición
}

export interface ConexionesResponse {
  statusCode: number;
  message: string;
  response: Conexion[];
}

export interface ConexionSingleResponse {
  statusCode: number;
  message: string;
  response: Conexion;
}

export interface PaypadGroup {
  paypad: string;
  idPaypad: number;
  conexiones: Conexion[];
}

export interface ConexionDto {
  id: number;
  idUserCreated: number;
  userCreated: string;
  dateCreated: string;
  idUserUpdated: number;
  userUpdated: string;
  dateUpdated: string;
  idPaypad: number;
  paypad: string;
  name: string;
  userName: string;
  pwd: string;
  description: string;
  icon: string;
}