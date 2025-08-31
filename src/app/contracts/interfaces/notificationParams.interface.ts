import { NotificationType } from '../enums/notification.enum';

export interface NotificationParams {
  type: NotificationType;
  template: string;
  subject: string;
  options: string[];
}
