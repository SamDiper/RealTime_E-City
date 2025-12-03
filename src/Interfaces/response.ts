export interface Response {

  statusCode: number;
  message: string;
  data?:any;
  isSuccess: boolean;

}

export interface Resumen {
  approve: number;
  dateEnd: string;
  dateStart: string;
  decline: number;
  incomeAmount: number;
  returnAmount: number;
  totalAmount: number;
  totalCard: number;
  totalCash: number;
}