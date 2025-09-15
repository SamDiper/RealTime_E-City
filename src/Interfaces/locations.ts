export interface PayPad{
username: string;
  pwd: string | null;
  description: string;
  longitude: string;
  latitude: string;
  idCurrency: number;
  currency: string;
  status: number;
  idOffice: number;
  office: string;
  id: number;
  idUserCreated: number;
  userCreated: string;
  dateCreated: string;
  idUserUpdated: number;
  userUpdated: string | null;
  dateUpdated: string | null;
}

export interface PayPadResponse{
  statusCode: number;
  message: string;
  response?: PayPad[];
}