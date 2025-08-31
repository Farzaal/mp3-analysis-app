import { InvoiceStatus } from '../enums/invoice.enum';
import { InvoiceSection } from '../enums/invoice.enum';

export interface InvoiceReport {
  id: number;
  owner_name: string;
  property_name_address: string;
  property_nick_name: string;
  service_type_category_title: string;
  service_type_title: string;
  service_date: string;
  created_at: string;
  vendor_name: string;
  franchise_total: number;
  invoice_status: keyof typeof InvoiceStatus;
  vendor_remaining_balance: number;
}

export interface MaterialItems {
  line_item: string;
  price: number;
  section_id: InvoiceSection;
  description?: string;
  id?: number;
}
