export interface StatusPayChart {
  cantidaD_TRANSACCIONES: number;
  totaL_RECAUDADO: number;
  fechA_TRANSACCION: Date;
  paypaD_ID: number;
}
export interface StatusWithdrawalChart {
  cantidaD_RETIROS: number;
  totaL_RETIRADO: number;
  fechA_TRANSACCION: Date;
  paypaD_ID: number;
}

export interface StatusPaypadChart{
  statE_PAY:StatusPayChart[];
  withdrawal:StatusWithdrawalChart[];
}

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
export interface Transaction {
  document: string;
  reference: string;
  product: string;
  totalAmount: number;    
  realAmount: number;      
  incomeAmount: number;    
  returnAmount: number;    
  description: string;    
  idStateTransaction: number;
  stateTransaction: string;
  idTypeTransaction: number;
  typeTransaction: string;
  idTypePayment: number;
  typePayment: string;
  idPayPad: number;
  payPad: string;
  id: number;
  idUserCreated: number | null;
  userCreated: string | null;
  dateCreated: string;    
  idUserUpdated: number | null;
  userUpdated: string | null;
  dateUpdated: string;     
}