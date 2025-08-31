import { JwtPayload } from '../types/jwtPayload.type';

export interface IProcessPaymentParams {
  customerId: string;
  paymentMethodId: string;
  amount: number;
}

export interface IProcessGuestConciergePaymentParams {
  paymentMethodId: string;
  amount: number;
  franchiseId: number;
  guestEmail?: string;
  guestName?: string;
  guestId?: number;
}

export interface IPaymentLogParams {
  owner_id: number;
  invoice_master_id: number;
  payment_method_id: number;
  payment_info: object;
}

export interface IPayParams {
  user: JwtPayload;
  amount: number;
  payment_method_id?: number | null;
  metadata?: object;
  invoice_id?: number;
  owner_id?: number;
}
