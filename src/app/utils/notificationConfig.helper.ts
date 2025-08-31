import { NotificationAction } from '../contracts/enums/notification.enum';
import { NotificationParams } from '../contracts/interfaces/notificationParams.interface';
import { NotificationConfig } from './notificationsConfig';
import { BunyanLogger } from '../commons/logger.service';

export type NotificationBodyParams = Record<string, object | string | string[]>;

export function getNotificationConfig(
  action: NotificationAction,
  params: NotificationBodyParams,
  receiver: string[],
): NotificationParams | undefined {
  const logger = new BunyanLogger();

  // Log receiver length for debugging
  logger.log(
    `[NOTIFICATION_CONFIG] Action: ${action}, Receiver length: ${
      receiver?.length || 0
    }`,
  );

  const config = NotificationConfig.get(action);

  if (!config) {
    return undefined;
  }

  // if (config.type === NotificationType.Single && receiver.length !== 1) {
  //   throw new Error(
  //     `Invalid receiver list: 'single' type notifications require exactly one recipient.`,
  //   );
  // }

  // if (
  //   (config.type === NotificationType.Multi ||
  //     config.type === NotificationType.Bulk) &&
  //   receiver.length < 1
  // ) {
  //   throw new Error(
  //     `Invalid receiver list: '${config.type}' type notifications require multiple recipients.`,
  //   );
  // }

  return { ...config, ...params };
}
