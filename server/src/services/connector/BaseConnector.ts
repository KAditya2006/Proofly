import { IIntegration } from '../../models/Integration';

export interface ConnectorResult {
  success: boolean;
  message?: string;
  data?: any;
}

export abstract class BaseConnector {
  protected integration: IIntegration;

  constructor(integration: IIntegration) {
    this.integration = integration;
  }

  /**
   * Initialize connection, verify credentials, etc.
   */
  abstract connect(): Promise<ConnectorResult>;

  /**
   * Clean up resources
   */
  abstract disconnect(): Promise<ConnectorResult>;

  /**
   * Ping the external system to verify health
   */
  abstract healthCheck(): Promise<ConnectorResult>;

  /**
   * Pull data from the external system based on mapping rules and constraints
   */
  abstract pull(startDate?: Date, endDate?: Date): Promise<ConnectorResult>;

  /**
   * Push data to the external system
   */
  abstract push(data: any): Promise<ConnectorResult>;
}
