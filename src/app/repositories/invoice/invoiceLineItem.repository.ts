import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { InvoiceLineItemModel } from '@/app/models/invoice/invoiceLineItem.model';

@Injectable()
export class InvoiceLineItemRepository extends PostgresRepository<InvoiceLineItemModel> {
  constructor(dataSource: DataSource) {
    super(InvoiceLineItemModel, dataSource);
  }
}
