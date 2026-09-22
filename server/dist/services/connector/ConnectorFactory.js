"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorFactory = void 0;
const DemoConnector_1 = require("./DemoConnector");
// import { ERPConnector } from './ERPConnector'; 
// import { HRMSConnector } from './HRMSConnector';
class ConnectorFactory {
    static getConnector(integration) {
        // In a real application, you would instantiate the specific connector based on 
        // integration.type or a specific identifier.
        // For this implementation, we will use the DemoConnector for all.
        switch (integration.type) {
            case 'ERP':
            case 'HRMS':
            case 'FINANCE':
                return new DemoConnector_1.DemoConnector(integration);
            default:
                return new DemoConnector_1.DemoConnector(integration);
        }
    }
}
exports.ConnectorFactory = ConnectorFactory;
