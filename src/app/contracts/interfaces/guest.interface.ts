export interface IGuestPayload {
  full_name?: string;
  email?: string;
  contact?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  guest_consent?: boolean;
  order_info?: Array<{
    service_type_id: number;
    qty: number;
    start_date: string;
  }>;
  is_guest_concierge?: boolean;
}
