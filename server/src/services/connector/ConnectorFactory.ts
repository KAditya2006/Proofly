import { IIntegration } from '../../models/Integration';
import { BaseConnector } from './BaseConnector';
import { DemoConnector } from './DemoConnector';
// import { ERPConnector } from './ERPConnector'; 
// import { HRMSConnector } from './HRMSConnector';

export class ConnectorFactory {
  static getConnector(integration: IIntegration): BaseConnector {
    // In a real application, you would instantiate the specific connector based on 
    // integration.type or a specific identifier.
    // For this implementation, we will use the DemoConnector for all.
    
    switch (integration.type) {
      case 'ERP':
      case 'HRMS':
      case 'FINANCE':
        return new DemoConnector(integration);
      default:
        return new DemoConnector(integration);
    }
  }
}
