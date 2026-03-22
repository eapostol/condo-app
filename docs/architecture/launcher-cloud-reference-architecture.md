# Condo App Launcher: Multi-Cloud Reference Architecture (AWS Primary, Azure Secondary, GCP Tertiary)

## Document Artifacts

- Markdown: `docs/architecture/launcher-cloud-reference-architecture.md`
- Word: `docs/architecture/launcher-cloud-reference-architecture.docx`
- PDF: `docs/architecture/launcher-cloud-reference-architecture.pdf`

---

## 1) Goal and Constraints

This architecture provides a **pragmatic, solo-developer-friendly path** to:

1. Build and ship an **Electron-based launcher** for local Docker lifecycle operations (setup, launch, shutdown, diagnostics).
2. Run a cloud control plane primarily on **AWS**, with clear service parity to **Azure** and **GCP**.
3. Keep today’s containerized app model while allowing later migration to managed cloud databases, remote callable functions, automation scripts, and richer platform integrations.

### Core principles
- **Ship fast, evolve safely**: Start with minimal managed services, then scale.
- **Portable by contract**: Define provider-neutral APIs and Terraform module boundaries.
- **Secure by default**: Strong auth, least privilege, secret management, audit trails.
- **Operationally observable**: Centralized logs/metrics/traces and actionable alerts.

---

## 2) High-Level Architecture (Diagram-Level Components)

### 2.1 Logical component diagram

```mermaid
flowchart TB
    U[User on Windows / macOS / Linux] --> E[Electron Launcher]

    subgraph LocalMachine[User Workstation]
      E --> D[Docker Engine + Compose]
      D --> C1[condo-app client container]
      D --> C2[condo-app server container]
      D --> C3[mysql container]
      E --> L[Local logs / health checks]
    end

    E -->|HTTPS + JWT| APIGW[Cloud Control API]

    subgraph AWSPrimary[AWS (Primary)]
      APIGW --> LAM[Lambda API Handlers]
      LAM --> DDB[(DynamoDB metadata)]
      LAM --> S3[(S3 config + update manifests)]
      LAM --> SQS[SQS remote task queue]
      SQS --> WKR[Worker Lambda / ECS Worker]
      LAM --> SM[Secrets Manager]
      LAM --> CW[CloudWatch Logs/Metrics]
      AUTH[Cognito] --> APIGW
      ECR[ECR image registry] --> D
    end

    subgraph CI[CI/CD]
      GH[GitHub Actions] --> ECR
      GH --> S3
      GH --> REL[Desktop installers: exe, dmg, appimage]
    end

    subgraph FutureParity[Secondary / Tertiary Clouds]
      AZ[Azure equivalents]
      GCP[GCP equivalents]
    end
```

### 2.2 Runtime responsibility split

- **Electron Launcher (local orchestrator)**
  - Validates Docker prerequisites.
  - Starts/stops local compose services.
  - Streams logs and health checks.
  - Authenticates user/device and pulls cloud-configured runtime settings.
  - Checks updates and applies channel-based rollout rules.

- **Cloud Control Plane (remote coordinator)**
  - Auth + entitlement + machine registration.
  - Runtime config/version manifest delivery.
  - Telemetry ingestion and operational insights.
  - Optional remote callable actions (queued, audited, rate-limited).

- **CI/CD System (artifact supply chain)**
  - Builds/signs images and installers.
  - Publishes immutable artifacts and manifests.
  - Promotes release channels (alpha/beta/stable) with rollback.

---

## 3) AWS-First Deployment Reference

### 3.1 Baseline service choices (Phase 1)

- **API**: API Gateway + Lambda (simple, serverless, low ops burden)
- **Identity**: Cognito (user + device auth)
- **Metadata store**: DynamoDB
- **Artifacts/config**: S3
- **Queue**: SQS (for remote callable jobs)
- **Secrets**: Secrets Manager
- **Observability**: CloudWatch (logs/metrics/alarms)
- **Container registry**: ECR

### 3.2 Why this baseline works for a solo developer

- Minimal cluster management.
- Costs scale with usage.
- Clear path to ECS/Fargate or EKS if traffic/complexity grows.
- Terraform coverage is strong and mature.

### 3.3 When to evolve

- Move API handlers to ECS/Fargate if Lambda limits/workflow complexity become friction.
- Add RDS PostgreSQL only when data model needs relational joins/transactions beyond DynamoDB patterns.
- Add OpenSearch/warehouse only when analytics demand exceeds CloudWatch + basic exports.

---

## 4) Cloud Service Parity Matrix (Portability Plan)

| Capability | AWS (Primary) | Azure (Secondary) | GCP (Tertiary) |
|---|---|---|---|
| Container Registry | ECR | Azure Container Registry | Artifact Registry |
| API Front Door | API Gateway | API Management | API Gateway |
| Serverless compute | Lambda | Azure Functions | Cloud Functions |
| Container compute | ECS Fargate | Container Apps / AKS | Cloud Run / GKE |
| Identity | Cognito | Entra External ID/B2C | Identity Platform |
| NoSQL metadata | DynamoDB | Cosmos DB | Firestore |
| Queue/event | SQS/EventBridge | Service Bus/Event Grid | Pub/Sub/Eventarc |
| Secrets | Secrets Manager | Key Vault | Secret Manager |
| Observability | CloudWatch | Azure Monitor/App Insights | Cloud Logging/Monitoring |
| Object storage | S3 | Blob Storage | Cloud Storage |

**Portability rule:** keep your app contract stable and swap cloud adapters beneath it.

---

## 5) Terraform Module Layout (Concrete)

Create a dedicated infra folder (or repo) with provider-agnostic structure:

```text
infra/
  terraform/
    modules/
      global/
        naming/
        tags/
      network/
      identity/
      api/
      metadata_store/
      queue/
      object_storage/
      observability/
      secrets/
      registry/
      ci_integration/
    providers/
      aws/
        envs/
          dev/
          staging/
          prod/
      azure/
        envs/
          dev/
      gcp/
        envs/
          dev/
    stacks/
      aws-core/
      aws-app-control-plane/
      aws-observability/
      azure-parity-dev/
      gcp-parity-dev/
```

### 5.1 Module responsibilities

- `network`: VPC/VNet, subnets, routing, egress controls.
- `identity`: user pools/app clients/scopes; machine identity records.
- `api`: gateway + routes + auth integration + rate limits.
- `metadata_store`: machine registration, state, version rollout metadata.
- `queue`: remote job queue, DLQ, retry policy.
- `object_storage`: manifests, installers metadata, policy controls.
- `observability`: structured logs, dashboards, alarms, retention policy.
- `secrets`: secret containers and rotation policies.
- `registry`: container image repositories, lifecycle policies.
- `ci_integration`: service users/roles and OIDC trust for GitHub Actions.

### 5.2 Environment strategy (solo-friendly)

- Start with **`dev` + `prod`** only.
- Add `staging` when you have external testers.
- Use separate state backends/workspaces per environment.
- Promote by artifact version, not by rebuilding.

---

## 6) Application Repository Folder Structure (Concrete)

Suggested structure in your current project:

```text
condo-app/
  launcher/
    electron/
      src/
        main/
          lifecycle/        # docker checks/start/stop/status
          auth/             # token handling
          updates/          # channel + update client
          telemetry/        # log/event uploader
        renderer/
          components/
          pages/
      build/
      package.json
    shared-contract/
      api-schema/
        openapi.yaml
      types/
  server/
  client/
  docker/
  infra/
    terraform/
      modules/
      providers/
      stacks/
  scripts/
    local/
      install-prereqs.*
      diagnose.*
    ci/
      build-images.*
      build-launcher.*
      publish-manifest.*
  docs/
    architecture/
    operations/
    runbooks/
```

---

## 7) API Contract (Minimal v1)

Define a stable v1 contract (OpenAPI recommended):

1. `POST /v1/auth/device/register`
2. `GET /v1/runtime/config`
3. `GET /v1/runtime/latest-version?channel=stable`
4. `POST /v1/telemetry/events`
5. `POST /v1/remote-tasks`
6. `GET /v1/remote-tasks/{taskId}`

### Security requirements
- JWT with short-lived access token + refresh flow.
- Device registration bound to user identity.
- Rate limiting per user/device/IP.
- Request tracing ID on all calls.

---

## 8) CI/CD Blueprint

### 8.1 Pipeline stages

1. **Validate**: lint, unit tests, dependency checks.
2. **Build containers**: multi-arch images, scan, push to registry.
3. **Build launcher**: Windows/macOS/Linux installers.
4. **Publish manifests**: channel-specific update metadata in object storage.
5. **Deploy infra/app**: Terraform plan/apply + backend deployment.
6. **Post-deploy checks**: health probes + smoke tests.

### 8.2 Release channels

- `alpha`: personal testing
- `beta`: early adopters/internal testers
- `stable`: all users

Rollback mechanism:
- Keep at least N previous manifests and artifacts.
- Switch channel pointer back to prior known-good version.

---

## 9) Data Strategy (Now vs Later)

### Now (least friction)
- Keep local MySQL in Docker for app runtime.
- Use cloud metadata store only for launcher/control-plane state.

### Later (managed DB migration)
- Move app DB to managed service (RDS/Azure Database/Cloud SQL) when you need:
  - centralized multi-user data,
  - managed backup/HA,
  - reduced local machine constraints.

Migration guardrails:
- Introduce DB abstraction and migration scripts early.
- Keep schema migration tooling deterministic.

---

## 10) Security and Compliance Checklist

- Principle of least privilege for IAM/service principals.
- Separate secrets from config.
- Encrypt at rest and in transit.
- Keep software bill of materials (SBOM) for images/installers.
- Enable audit logs for auth events and remote-task execution.
- Implement signed updates for launcher artifacts.

---

## 11) Solo Developer Implementation Plan (Step-by-Step)

### Week 1: Contract + Foundation
1. Create OpenAPI spec for launcher cloud APIs.
2. Implement local launcher state machine (install checks/start/stop/logs).
3. Add structured telemetry events locally.

### Week 2: AWS MVP Control Plane
4. Provision API Gateway + Lambda + Cognito + DynamoDB + S3 via Terraform.
5. Implement `runtime/config`, `latest-version`, `device/register` endpoints.
6. Wire launcher auth + config retrieval.

### Week 3: Build/Release Automation
7. Add CI jobs for multi-arch Docker image build and push.
8. Add Electron build pipeline for 3 OS targets.
9. Publish update manifests per channel.

### Week 4: Operability + Remote Actions
10. Add CloudWatch dashboards/alarms.
11. Add SQS-backed remote callable tasks with audit logging.
12. Create runbooks for common failures.

### Week 5+: Multi-cloud Parity
13. Replicate minimal control plane in Azure dev.
14. Replicate minimal control plane in GCP dev.
15. Validate provider parity using integration smoke tests against same API contract.

---

## 12) Runbooks You Should Prepare Early

1. **Launcher cannot start Docker**: diagnostic script + remediation flow.
2. **Auth failure**: token expiration, clock skew, identity outage behavior.
3. **Update rollback**: channel pointer revert process.
4. **Remote task stuck**: queue retry and DLQ analysis.
5. **Cloud outage fallback**: local-only mode behavior (degraded but usable).

---

## 13) Definition of Done for Initial Production Readiness

- Launcher works on Windows/macOS/Linux with one-command local runtime control.
- AWS control plane live with auth, config, version manifest, telemetry ingestion.
- CI/CD produces signed artifacts and immutable image tags.
- Observability dashboards + alerts operational.
- Documented rollback and incident runbooks tested once.

---

## 14) Immediate Next Actions (What to do first)

1. Create `launcher/shared-contract/api-schema/openapi.yaml`.
2. Scaffold Terraform modules for AWS baseline (`identity`, `api`, `metadata_store`, `object_storage`, `observability`).
3. Implement first three APIs (`device/register`, `runtime/config`, `latest-version`).
4. Build launcher flows for login, config fetch, Docker start/stop, status screen.
5. Add a CI workflow that builds one preview installer and one dev Docker image.

This is the fastest route to a usable product while preserving clean expansion paths into Azure and GCP.
