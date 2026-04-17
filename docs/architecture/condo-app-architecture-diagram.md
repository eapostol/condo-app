# Condo App One-Page Architecture Diagram

Back to the overview: [condo-app-technical-stack.md](./condo-app-technical-stack.md)

## System Diagram

```mermaid
flowchart TB
    User[User in Browser]
    LauncherUser[Desktop User]

    subgraph DesktopBundle[Desktop Runtime]
      Launcher[Electron Launcher]
      ComposeDesktop[docker-compose.desktop.yml]
    end

    subgraph DevRuntime[Developer Runtime]
      Vite[Vite Dev Server :3000]
      ComposeDev[docker-compose.dev.yml]
    end

    subgraph WebApp[Client]
      ReactApp[React 18 + React Router]
      Tailwind[Tailwind CSS v4]
      Pdf[jsPDF Export]
    end

    subgraph ApiLayer[Server]
      Express[Express API]
      Auth[JWT Auth + Passport OAuth]
      Docs[Swagger UI]
      Reports[Reporting Service]
    end

    subgraph DataLayer[Data]
      Mongo[(MongoDB via Mongoose)]
      MySQL[(MySQL via mysql2)]
    end

    subgraph Automation[Packaging and Release]
      Scripts[scripts/desktop/*.mjs]
      Forge[Electron Forge]
    end

    User --> ReactApp
    LauncherUser --> Launcher

    ReactApp --> Tailwind
    ReactApp --> Pdf
    ReactApp -->|/api| Vite
    Vite -->|proxy| Express

    Launcher --> ComposeDesktop
    ComposeDesktop --> Express
    ComposeDesktop --> ReactApp
    ComposeDesktop --> Mongo
    ComposeDesktop --> MySQL

    ComposeDev --> Vite
    ComposeDev --> Express
    ComposeDev --> Mongo
    ComposeDev --> MySQL

    Express --> Auth
    Express --> Docs
    Express --> Reports
    Express --> Mongo
    Reports --> MySQL
    Reports -. optional provider .-> Mongo

    Scripts --> Forge
    Scripts --> ComposeDesktop
    Forge --> Launcher
```

## Reading Notes

- The primary product surface is the React web app.
- The API server is the integration point for auth, condo routes, and report generation.
- MongoDB holds core application entities, while MySQL is the default reporting backend.
- The Electron launcher is a local orchestration layer, not a separate business backend.
- Docker Compose is the main runtime boundary tying the web client, API server, and databases together.

## Related Documents

- Overview: [condo-app-technical-stack.md](./condo-app-technical-stack.md)
- Folder walkthrough: [condo-app-stack-by-folder.md](./condo-app-stack-by-folder.md)
