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


export interface AppConfig {
  BTOA: string;
  API: string;
  USER: string;
  PASS: string;
}

export interface StatusPay {
  cantidad_Pagos: number;
  total_Recaudado: number;
  cantidad_Retiros: number;
  total_Retirado: number;
  paypaD_ID: number;
  kiosko: string;
  estado?: string;
  longitude: number;
  latitude: number;
  state:boolean;
}

export interface SP_GET_STATE_PAYPLUS_Data_Result{
  data:any;
  _totalPaypads:number;
  _paypadsActivos:number;
  _paypadsError:number;
  _paypadsApagados:number;
  _paypadsSinDinero:number;
  _paypadFilterPaypad:any;
}

export interface SubscriptionResponse {
  statusCode: number;
  message: string;
  response: PaypadAlert[];
}

export interface PaypadAlert {
  idPayPad: number;
  paypad: string;
  idAlert: number;
  alert: string;
  email: string;
  id: number;
  idUserCreated: number;
  userCreated: string;
  dateCreated: string; 
  idUserUpdated: number;
  userUpdated: string | null;
  dateUpdated: string | null;
}
