import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormSchemaModel } from '@/app/models/schema/formSchema.model';
import { DocumentModel } from '@/app/models/document/document.model';
import { EstimateMasterModel } from '@/app/models/estimate/estimateMaster.model';
import { EstimateDetailModel } from '@/app/models/estimate/estimateDetail.model';
import { EstimateAssetModel } from '@/app/models/estimate/estimateAsset.model';
import { EstimateDetailRejectionModel } from '@/app/models/estimate/estimateDetailRejection.model';
import { FranchiseModel } from '@/app/models/franchise/franchise.model';
import { FranchiseServiceLocationModel } from '@/app/models/franchise/franchiseServiceLocation.model';
import { VendorServiceLocationModel } from '@/app/models/franchise/vendorServiceLocation.model';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import { InvoiceLineItemModel } from '@/app/models/invoice/invoiceLineItem.model';
import { FranchiseLinenConfigModel } from '@/app/models/linen/franchiseLinenConfig.model';
import { MemberShipTierModel } from '@/app/models/membership/membershipTier.model';
import { UserPaymentMethodModel } from '@/app/models/paymentMethod/userPaymentMethod.model';
import { PropertyMasterModel } from '@/app/models/property/propertyMaster.model';
import { PropertyCleaningDetailModel } from '@/app/models/property/propertyCleaningDetail.model';
import { PropertyMaintenanceDetailModel } from '@/app/models/property/propertyMaintainenceDetail.model';
import { PropertyServiceTypeRateModel } from '@/app/models/property/propertyServiceTypeRates.model';
import { ServiceRequestDiscrepancyModel } from '@/app/models/serviceRequest/serviceRequestDiscrepancy.model';
import { ServiceRequestLinenDetailModel } from '@/app/models/serviceRequest/serviceRequestLinenDetail.model';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { ServiceRequestMediaModel } from '@/app/models/serviceRequest/serviceRequestMedia.model';
import { ServiceRequestNoteModel } from '@/app/models/serviceRequest/serviceRequestNote.model';
import { ServiceRequestRecurringDateModel } from '@/app/models/serviceRequest/serviceRequestRecurringDate.model';
import { ServiceRequestVendorStatusModel } from '@/app/models/serviceRequest/serviceRequestVendorStatus.model';
import { FranchiseServiceTypeModel } from '@/app/models/serviceType/franchiseServiceType.model';
import { FranchiseServiceTypeCategoryModel } from '@/app/models/serviceType/franchiseServiceTypeCategory.model';
import { ServiceTypeModel } from '@/app/models/serviceType/serviceType.model';
import { ServiceTypeCategoryModel } from '@/app/models/serviceType/serviceTypeCategory.model';
import { ServiceTypeRequestModel } from '@/app/models/serviceType/serviceTypeRequest.model';
import { VendorServiceTypeModel } from '@/app/models/serviceType/vendorServiceType.model';
import { VendorServiceTypePriorityModel } from '@/app/models/serviceType/vendorServiceTypePriorities.model';
import { UserModel } from '@/app/models/user/user.model';
import { UserDescriptionModel } from '@/app/models/user/userDescription.model';
import { UserMenuItemModel } from '@/app/models/user/userMenuItem.model';
import { UserTokenModel } from '@/app/models/user/userToken.model';
import { DocumentRepository } from '@/app/repositories/document/document.repository';
import { EstimateAssetRepository } from '@/app/repositories/estimate/estimateAsset.repository';
import { EstimateDetailsRepository } from '@/app/repositories/estimate/estimateDetails.repository';
import { EstimateMasterRepository } from '@/app/repositories/estimate/estimateMaster.repository';
import { EstimateDetailRejectionRepository } from '@/app/repositories/estimate/estimateRejection.repository';
import { FormRepository } from '@/app/repositories/form/form.repository';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { FranchiseServiceLocationRepository } from '@/app/repositories/franchise/franchiseServiceLocation.repository';
import { InvoiceLineItemRepository } from '@/app/repositories/invoice/invoiceLineItem.repository';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import { FranchiseLinenConfigRepository } from '@/app/repositories/linen/franchiseLinenConfig.repository';
import { MembershipTierRepository } from '@/app/repositories/membershipTier/membershipTier.repository';
import { PropertyCleaningDetailRepository } from '@/app/repositories/property/propertyCleaningDetail.repository';
import { PropertyMaintenanceDetailRepository } from '@/app/repositories/property/propertyMaintainenceDetail.repository';
import { PropertyMasterRepository } from '@/app/repositories/property/propertyMaster.respository';
import { PropertyServiceTypeRateRepository } from '@/app/repositories/property/propertyServiceTypeRate.repository';
import { ServiceRequestLinenDetailRepository } from '@/app/repositories/serviceRequest/serviceRequestLinenDetail.repository';
import { ServiceRequestMasterRepository } from '@/app/repositories/serviceRequest/serviceRequestMaster.repository';
import { ServiceRequestMediaRepository } from '@/app/repositories/serviceRequest/serviceRequestMedia.repository';
import { ServiceRequestNoteRepository } from '@/app/repositories/serviceRequest/serviceRequestNote.repository';
import { ServiceRequestRecurringDateRepository } from '@/app/repositories/serviceRequest/serviceRequestRecurringDate.repository';
import { ServiceRequestVendorStatusRepository } from '@/app/repositories/serviceRequest/serviceRequestVendorStatus.repository';
import { FranchiseServiceTypeRepository } from '@/app/repositories/serviceType/franchiseServiceType.repository';
import { FranchiseServiceTypeCategoryRepository } from '@/app/repositories/serviceType/franchiseServiceTypeCategory.repository';
import { ServiceTypeRepository } from '@/app/repositories/serviceType/serviceType.respository';
import { ServiceTypeCategoryRepository } from '@/app/repositories/serviceType/serviceTypeCategory.repository';
import { ServiceTypeRequestRepository } from '@/app/repositories/serviceType/serviceTypeRequest.repository';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { UserDescriptionRepository } from '@/app/repositories/user/userDescription.repository';
import { UserPaymentMethodRepository } from '@/app/repositories/user/userPaymentMethod.repository';
import { UserTokenRepository } from '@/app/repositories/user/userToken.repository';
import { VendorServiceLocationRepository } from '@/app/repositories/vendor/vendorServiceLocation.repository';
import { VendorServiceTypeRepository } from '@/app/repositories/vendor/vendorServiceType.repository';
import { VendorServiceTypePriorityRepository } from '@/app/repositories/vendor/vendorServiceTypePriority.repository';
import { BunyanLogger } from '@/app/commons/logger.service';
import { MemberShipTransactionModel } from '@/app/models/membership/membershipTransaction.model';
import { MembershipTransactionRepository } from '@/app/repositories/membershipTier/membershipTransaction.repository';
import { StripeService } from '@/payment/stripe.service';
import { ScheduledNotificationModel } from '@/app/models/notification/scheduledNotification.model';
import { ScheduledNotificationRepository } from '@/app/repositories/notification/scheduledNotification.repository';
import { ServiceRequestRecurringLogRepository } from '@/app/repositories/serviceRequest/serviceRequestRecurringLog.repository';
import { ServiceRequestRecurringLogModel } from '@/app/models/serviceRequest/serviceRequestRecurringLog.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormSchemaModel,
      DocumentModel,
      EstimateMasterModel,
      EstimateDetailModel,
      EstimateAssetModel,
      EstimateDetailRejectionModel,
      FranchiseModel,
      FranchiseServiceLocationModel,
      VendorServiceLocationModel,
      InvoiceMasterModel,
      InvoiceLineItemModel,
      FranchiseLinenConfigModel,
      MemberShipTierModel,
      MemberShipTransactionModel,
      UserPaymentMethodModel,
      PropertyMasterModel,
      PropertyCleaningDetailModel,
      PropertyMaintenanceDetailModel,
      PropertyServiceTypeRateModel,
      ServiceRequestDiscrepancyModel,
      ServiceRequestLinenDetailModel,
      ServiceRequestMasterModel,
      ServiceRequestMediaModel,
      ServiceRequestNoteModel,
      ServiceRequestRecurringDateModel,
      ServiceRequestVendorStatusModel,
      FranchiseServiceTypeModel,
      FranchiseServiceTypeCategoryModel,
      ServiceTypeModel,
      ServiceTypeCategoryModel,
      ServiceTypeRequestModel,
      VendorServiceTypeModel,
      VendorServiceTypePriorityModel,
      UserModel,
      UserDescriptionModel,
      UserMenuItemModel,
      UserTokenModel,
      ScheduledNotificationModel,
      ServiceRequestRecurringLogModel,
    ]),
  ],
  providers: [
    StripeService,
    SchedulerService,
    DocumentRepository,
    EstimateAssetRepository,
    EstimateDetailsRepository,
    EstimateMasterRepository,
    EstimateDetailRejectionRepository,
    FormRepository,
    FranchiseRepository,
    FranchiseServiceLocationRepository,
    InvoiceLineItemRepository,
    InvoiceMasterRepository,
    FranchiseLinenConfigRepository,
    MembershipTierRepository,
    MembershipTransactionRepository,
    PropertyCleaningDetailRepository,
    PropertyMaintenanceDetailRepository,
    PropertyMasterRepository,
    PropertyServiceTypeRateRepository,
    ServiceRequestLinenDetailRepository,
    ServiceRequestMasterRepository,
    ServiceRequestMediaRepository,
    ServiceRequestNoteRepository,
    ServiceRequestRecurringDateRepository,
    ServiceRequestVendorStatusRepository,
    FranchiseServiceTypeRepository,
    FranchiseServiceTypeCategoryRepository,
    ServiceTypeRepository,
    ServiceTypeCategoryRepository,
    ServiceTypeRequestRepository,
    UserRepository,
    UserDescriptionRepository,
    UserPaymentMethodRepository,
    UserTokenRepository,
    VendorServiceLocationRepository,
    VendorServiceTypeRepository,
    VendorServiceTypePriorityRepository,
    ScheduledNotificationRepository,
    ServiceRequestRecurringLogRepository,
    BunyanLogger,
  ],
})
export class SchedulerModule {}
