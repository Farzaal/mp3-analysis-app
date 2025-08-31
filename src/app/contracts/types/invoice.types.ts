import { InvoiceLineItemComputationType } from '@/app/contracts/enums/invoiceLineItem.enum';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import { CreateInvoiceLineItemDto } from '@/invoice/invoice.dto';

export interface IAugmentedInvoiceLineItem {
  title: string;
  amount: number;
  is_vendor_line_item: boolean;
  is_readonly: boolean;
  computation_type: InvoiceLineItemComputationType;
}

export type InvoiceHandlerResponse = {
  invoice_master: InvoiceMasterModel;
  line_items: Partial<CreateInvoiceLineItemDto>[];
  has_prev_line_items?: boolean;
};
