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

export interface TransactionResponse{
  statusCode: number;
  message: string;
  response?: Transaction[];
}



