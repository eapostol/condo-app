# Condo App Launcher Cloud Implementation Plan

## Goal
Build and deploy the condo-app launcher architecture so it can run on AWS first, while remaining portable to Azure and Google Cloud.

## Recommended implementation steps

1. Document the launcher workflow.
   - Map the Electron launcher states for setup, start, monitor, update, and shutdown.
   - Define the backend API contract that the launcher will call.

2. Keep Docker as the packaging baseline.
   - Standardize Docker images, tags, and compose profiles.
   - Produce multi-architecture images for amd64 and arm64.

3. Create an AWS-first backend foundation.
   - Use Amazon ECR for images.
   - Use S3 for version manifests and downloadable assets.
   - Use API Gateway and Lambda for launcher control APIs.
   - Use Cognito for authentication.
   - Use DynamoDB for launcher and machine state.

4. Add observability and secrets management.
   - Send structured application logs to CloudWatch.
   - Store secrets in AWS Secrets Manager.
   - Set alarms for failed deployments, unhealthy workers, and auth failures.

5. Set up CI/CD.
   - Build and scan Docker images.
   - Build Electron installers for Windows, macOS, and Linux.
   - Publish artifacts to versioned release channels such as alpha, beta, and stable.

6. Introduce remote operations in a controlled way.
   - Queue remote tasks such as restart, refresh config, collect diagnostics, and stop services.
   - Use SQS workers for asynchronous execution and audit each action.

7. Abstract infrastructure for Azure and GCP.
   - Use Terraform modules with provider-specific implementations.
   - Keep a shared service contract so AWS, Azure, and GCP remain aligned.

8. Expand to managed cloud services only when needed.
   - Add managed relational databases when reporting or tenant needs outgrow local containers.
   - Add scheduled jobs, remote callable functions, and provider-native automation gradually.

## Cloud service mapping

| Capability | AWS | Azure | Google Cloud |
| --- | --- | --- | --- |
| Container registry | ECR | Azure Container Registry | Artifact Registry |
| Serverless API | API Gateway + Lambda | API Management + Azure Functions | API Gateway + Cloud Functions |
| Container runtime | ECS Fargate | Azure Container Apps | Cloud Run |
| Identity | Cognito | Microsoft Entra External ID | Identity Platform |
| NoSQL state store | DynamoDB | Cosmos DB | Firestore |
| Queue/eventing | SQS + EventBridge | Service Bus + Event Grid | Pub/Sub + Eventarc |
| Secrets | Secrets Manager | Key Vault | Secret Manager |
| Observability | CloudWatch | Azure Monitor | Cloud Logging |

## Delivery phases

- Phase 1: local launcher orchestration plus cloud auth, config, and updates.
- Phase 2: remote callable actions, machine registration, and diagnostics uploads.
- Phase 3: managed databases, scheduled maintenance, and tenant-aware automation.
- Phase 4: multi-region resilience and optional multi-cloud failover.
