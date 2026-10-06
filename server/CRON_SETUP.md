# Background Jobs & CRON Setup

To support background notifications (e.g., SLA Overdue Alerts), this project implements scheduled jobs without enforcing a heavy dependency like BullMQ or Redis, keeping the architecture clean and lightweight for the current requirements.

## Implementing the SLA Cron Job

The service function is located at:
`src/services/slaService.ts -> checkSLAAndNotify()`

### Local / Simple Deployments (e.g., node-cron)
If you want to run this in a single-instance node application, you can use a package like `node-cron`.

1. Install `node-cron`:
   ```bash
   npm install node-cron
   npm install @types/node-cron --save-dev
   ```

2. Inside `src/index.ts`, start the cron job:
   ```typescript
   import cron from 'node-cron';
   import { checkSLAAndNotify } from './services/slaService';

   // Run every hour at minute 0
   cron.schedule('0 * * * *', () => {
     console.log('Running SLA Check Job...');
     checkSLAAndNotify();
   });
   ```

### Cloud Native (Serverless / Kubernetes)
If deploying to AWS, GCP, or a Kubernetes cluster where multiple instances of the server may run concurrently:

Do **NOT** use `node-cron` inside `index.ts`, as this would cause the job to run concurrently on every container, leading to duplicate notifications.

Instead:
1. Expose an internal API endpoint (e.g., `POST /api/internal/jobs/sla-check`).
2. Secure this endpoint with an API key or internal network policy.
3. Call `checkSLAAndNotify()` inside this route.
4. Use a centralized scheduler to trigger the endpoint:
   - **AWS**: EventBridge rules targeting the endpoint via an API destination or Lambda.
   - **GCP**: Cloud Scheduler triggering the endpoint.
   - **Kubernetes**: CronJob resource running `curl -X POST http://backend/api/internal/jobs/sla-check`.

This approach ensures the SLA checks run exactly once per schedule, preventing duplicate spam.
