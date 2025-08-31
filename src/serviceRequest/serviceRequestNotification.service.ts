import { NotificationsService } from '@/notifications/notifications.service';
import { Injectable } from '@nestjs/common';
import { NotificationAction } from '@/app/contracts/enums/notification.enum';
import { ServiceRequestMasterRepository } from '@/app/repositories/serviceRequest/serviceRequestMaster.repository';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { UserModel } from '@/app/models/user/user.model';
import { emailContent } from '@/app/utils/serviceRequestContent.helper';
import {
  EmailContent,
  ServiceRequestStatus,
} from '@/app/contracts/enums/serviceRequest.enum';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { ServiceRequestStatusDescription } from '@/app/utils/serviceRequestStatus.helper';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServiceRequestNotificationService {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly serviceRequestMasterRepository: ServiceRequestMasterRepository,
    private readonly configService: ConfigService,
  ) {}

  async sendCreateServiceRequestNotification(
    serviceRequestId: number,
    user: JwtPayload,
    franchiseAdmin: UserModel,
    vendors: UserModel[] | null,
  ): Promise<boolean> {
    try {
      let content: string = '';
      const serviceRequestMasterModel: ServiceRequestMasterModel =
        await this.serviceRequestMasterRepository.findOne({
          where: { id: serviceRequestId },
          relations: ['propertyMaster', 'creator', 'owner'],
        });

      if (serviceRequestMasterModel?.is_guest) {
        content = emailContent
          .get(EmailContent.ServiceRequestCreatedByOwner)
          .replace(
            '{{name}}',
            `${serviceRequestMasterModel?.owner?.first_name} ${serviceRequestMasterModel?.owner?.last_name}`,
          )
          .replace(
            '{{address}}',
            serviceRequestMasterModel.propertyMaster.address,
          );
        await this.notificationsService.sendNotification(
          NotificationAction.SERVICE_REQUEST_CREATED,
          { content },
          [serviceRequestMasterModel?.owner?.email],
          [serviceRequestMasterModel?.owner?.contact],
        );
        return true;
      }

      if (
        serviceRequestMasterModel?.creator?.user_type === UserType.Owner &&
        !serviceRequestMasterModel?.is_discrepancy &&
        !serviceRequestMasterModel?.is_guest
      ) {
        content = emailContent
          .get(EmailContent.ServiceRequestCreatedByOwner)
          .replace(
            '{{name}}',
            `${franchiseAdmin?.first_name} ${franchiseAdmin?.last_name}`,
          )
          .replace(
            '{{address}}',
            serviceRequestMasterModel.propertyMaster.address,
          );
        await this.notificationsService.sendNotification(
          NotificationAction.SERVICE_REQUEST_CREATED,
          { content },
          [franchiseAdmin.email],
          [franchiseAdmin.contact],
        );
      } else if (
        serviceRequestMasterModel?.creator?.user_type ===
          UserType.FranchiseAdmin &&
        !serviceRequestMasterModel?.is_discrepancy &&
        !serviceRequestMasterModel?.is_guest
      ) {
        content = emailContent
          .get(EmailContent.ServiceRequestCreatedByFranchiseAdmin)
          .replace(
            '{{name}}',
            `${serviceRequestMasterModel?.owner?.first_name} ${serviceRequestMasterModel?.owner?.last_name}`,
          )
          .replace(
            '{{address}}',
            serviceRequestMasterModel.propertyMaster.address,
          );
        await this.notificationsService.sendNotification(
          NotificationAction.SERVICE_REQUEST_CREATED,
          { content },
          [serviceRequestMasterModel?.owner?.email],
          [serviceRequestMasterModel?.owner?.contact],
        );
      } else if (serviceRequestMasterModel?.is_discrepancy) {
        content = emailContent
          .get(EmailContent.ServiceRequestDiscrepancyReported)
          .replace(
            '{{name}}',
            `${serviceRequestMasterModel?.owner?.first_name} ${serviceRequestMasterModel?.owner?.last_name}`,
          )
          .replace(
            '{{address}}',
            serviceRequestMasterModel.propertyMaster.address,
          );
        await this.notificationsService.sendNotification(
          NotificationAction.SERVICE_REQUEST_DISCREPANCY_CREATED,
          { content },
          [serviceRequestMasterModel?.owner?.email],
          [serviceRequestMasterModel?.owner?.contact],
        );
        content = emailContent
          .get(EmailContent.ServiceRequestDiscrepancyReported)
          .replace(
            '{{name}}',
            `${user?.user_type === UserType.Vendor ? `${vendors[0]?.first_name} ${vendors[0]?.last_name}` : `${franchiseAdmin.first_name} ${franchiseAdmin.last_name}`}`,
          )
          .replace(
            '{{address}}',
            serviceRequestMasterModel.propertyMaster.address,
          );
        await this.notificationsService.sendNotification(
          NotificationAction.SERVICE_REQUEST_DISCREPANCY_CREATED,
          { content },
          [
            user.user_type === UserType.Vendor
              ? franchiseAdmin.email
              : vendors[0].email,
          ],
          [
            user.user_type === UserType.Vendor
              ? franchiseAdmin.contact
              : vendors[0].contact,
          ],
        );
      }

      if (vendors && vendors.length > 0) {
        const vendorsEmails: string[] = vendors.map((vendor) => vendor.email);
        const vendorsContact: string[] = vendors.map(
          (vendor) => vendor.contact,
        );

        content = emailContent
          .get(EmailContent.ServiceRequestVendorAssign)
          .replace(
            '{{name}}',
            `${franchiseAdmin.first_name} ${franchiseAdmin.last_name}`,
          )
          .replace(
            '{{address}}',
            serviceRequestMasterModel.propertyMaster.address,
          );
        await this.notificationsService.sendNotification(
          NotificationAction.SERVICE_REQUEST_CREATED,
          { content },
          vendorsEmails,
          vendorsContact,
        );
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async sendVendorReleaseFromJobNotifications(
    serviceRequest: ServiceRequestMasterModel,
    user: JwtPayload,
    franchiseAdmin: UserModel,
  ): Promise<boolean> {
    try {
      await this.notificationsService.sendNotification(
        NotificationAction.SERVICE_REQUEST_RELEASE_VENDOR,
        {
          content: emailContent
            .get(EmailContent.ServiceRequestVendorReleaseFromJob)
            .replace(
              '{{name}}',
              `${serviceRequest?.vendor?.first_name} ${serviceRequest?.vendor?.last_name}`,
            )
            .replace('{{jobId}}', String(serviceRequest.id)),
        },
        [
          serviceRequest.owner.email,
          user.user_type === UserType.Vendor
            ? franchiseAdmin.email
            : serviceRequest?.vendor?.email,
        ],
        [
          serviceRequest.owner.contact,
          user.user_type === UserType.Vendor
            ? franchiseAdmin.contact
            : serviceRequest?.vendor?.contact,
        ],
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  async sendServiceRequestUpdateStatusNotifications(
    serviceRequest: ServiceRequestMasterModel,
    franchiseAdmin: UserModel,
    user: JwtPayload,
    updatedStatus?: ServiceRequestStatus,
  ) {
    try {
      await Promise.all([
        this.notificationsService.sendNotification(
          NotificationAction.SERVICE_REQUEST_STATUS_UPDATE,
          {
            content: emailContent
              .get(EmailContent.ServiceRequestStatusUpdate)
              .replace(
                '{{name}}',
                `${
                  [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
                    user.user_type,
                  )
                    ? `${franchiseAdmin?.first_name} ${franchiseAdmin?.last_name}`
                    : `${serviceRequest?.vendor?.first_name} ${serviceRequest?.vendor?.last_name}`
                }`,
              )
              .replace('{{jobId}}', String(serviceRequest.id))
              .replace(
                '{{status}}',
                ServiceRequestStatusDescription.get(updatedStatus),
              ),
          },
          [serviceRequest.owner.email],
          [serviceRequest.owner.contact],
        ),
        this.notificationsService.sendNotification(
          NotificationAction.SERVICE_REQUEST_STATUS_UPDATE,
          {
            content: emailContent
              .get(EmailContent.ServiceRequestStatusUpdate)
              .replace(
                '{{name}}',
                `${
                  [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
                    user.user_type,
                  )
                    ? `${franchiseAdmin?.first_name} ${franchiseAdmin?.last_name}`
                    : `${serviceRequest?.vendor?.first_name} ${serviceRequest?.vendor?.last_name}`
                }`,
              )
              .replace('{{jobId}}', String(serviceRequest.id))
              .replace(
                '{{status}}',
                ServiceRequestStatusDescription.get(updatedStatus),
              ),
          },
          [
            [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
              user.user_type,
            )
              ? serviceRequest?.vendor?.email
              : franchiseAdmin?.email,
          ],
          [
            [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
              user.user_type,
            )
              ? serviceRequest?.vendor?.contact
              : franchiseAdmin?.contact,
          ],
        ),
      ]);
      return true;
    } catch (err) {
      return false;
    }
  }

  async sendServiceRequestClaimNotifications(
    serviceRequest: ServiceRequestMasterModel,
    franchiseAdmin: UserModel,
    vendor: UserModel,
    status: ServiceRequestStatus,
  ): Promise<boolean> {
    try {
      if (status === ServiceRequestStatus.Rejected) return;
      await this.notificationsService.sendNotification(
        NotificationAction.SERVICE_REQUEST_CLAIMED,
        {
          content: emailContent
            .get(EmailContent.ServiceRequestClaimByVendor)
            .replace('{{name}}', `${vendor?.first_name} ${vendor?.last_name}`)
            .replace('{{jobId}}', String(serviceRequest.id))
            .replace(
              '{{status}}',
              ServiceRequestStatusDescription.get(serviceRequest.status),
            ),
        },
        [serviceRequest.owner.email, franchiseAdmin.email],
        [serviceRequest.owner.contact, franchiseAdmin.contact],
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  async sendGuestAndDiscrepancyApprovalNotifications(
    serviceRequest: ServiceRequestMasterModel,
    franchiseAdmin: UserModel,
  ): Promise<boolean> {
    try {
      const receivers: string[] = [franchiseAdmin.email];
      const receiversContact: string[] = [franchiseAdmin.contact];
      if (serviceRequest.is_guest) {
        // receivers.push(serviceRequest.guest_email);
        // receiversContact.push(serviceRequest.guest_contact_number);
      }
      await this.notificationsService.sendNotification(
        NotificationAction.SERVICE_REQUEST_APPROVAL,
        {
          content: emailContent
            .get(EmailContent.ServiceRequestApprovedByOwner)
            .replace(
              '{{name}}',
              `${serviceRequest?.owner?.first_name} ${serviceRequest?.owner?.last_name}`,
            )
            .replace(
              '{{type}}',
              `${serviceRequest.is_guest ? 'Guest' : 'Discrepancy'}`,
            )
            .replace('{{address}}', serviceRequest?.propertyMaster?.address)
            .replace('{{jobId}}', String(serviceRequest.id)),
        },
        receivers,
        receiversContact,
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  async sendServiceRequestCancellationNotifications(
    serviceRequest: ServiceRequestMasterModel,
    franchiseAdmin: UserModel,
    vendors: UserModel[],
  ): Promise<boolean> {
    try {
      const vendorsEmails: string[] = vendors.map((vendor) => vendor.email);
      const vendorsContact: string[] = vendors.map((vendor) => vendor.contact);
      const receivers: string[] = [franchiseAdmin.email, ...vendorsEmails];
      const receiversContact: string[] = [
        franchiseAdmin.contact,
        ...vendorsContact,
      ];
      await this.notificationsService.sendNotification(
        NotificationAction.SERVICE_REQUEST_CANCEL,
        {
          content: emailContent
            .get(EmailContent.ServiceRequestCancelByOwner)
            .replace(
              '{{name}}',
              `${serviceRequest?.owner?.first_name} ${serviceRequest?.owner?.last_name}`,
            )
            .replace('{{address}}', serviceRequest?.propertyMaster?.address)
            .replace('{{jobId}}', String(serviceRequest.id)),
        },
        receivers,
        receiversContact,
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  async sendVendorAssignNotifications(
    action: NotificationAction,
    user: UserModel,
    serviceRequestMasterId: number,
  ) {
    try {
      if (!user) return;
      await this.notificationsService.sendNotification(
        action,
        {
          link: `${this.configService.get('PORTAL_FRONTEND_URL')}/login`,
          job_id: serviceRequestMasterId.toString(),
        },
        [user.email],
        [user.contact],
      );
      return true;
    } catch (err) {
      return false;
    }
  }
}
