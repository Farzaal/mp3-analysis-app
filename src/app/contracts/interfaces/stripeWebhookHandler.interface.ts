export interface StripeWebhookHandler {
  run(event: any): Promise<boolean>;
}
