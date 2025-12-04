# Command Center - AGENTS.md

## Project Overview
Command Center is a **Tauri v2** application (Rust Backend + React/Vite Frontend) designed to orchestrate AI agents for software development. It supports:
1.  **Scaffolding**: Creating new GitHub repos and Codespaces.
2.  **Uplink**: Connecting to existing GitHub repositories.
3.  **Remote/Lightning AI**: Connecting to arbitrary SSH hosts (e.g., Lightning AI Studios) to run agents.

## Architecture

### Backend (`src-tauri`)
-   **Language**: Rust (Edition 2021)
-   **Framework**: Tauri v2
-   **Key Modules**:
    -   `lib.rs`: Main entry point and command exposure.
    -   `scaffold_engine.rs`: Logic for creating new repos/codespaces (uses GitHub API).
    -   `uplink_engine.rs`: Logic for connecting to existing repos (uses GitHub API).
    -   `remote_engine.rs`: Logic for connecting to SSH hosts (uses `ssh2` + `ssh-key`).
    -   `jules.rs`: Client for the AI Agent API (Jules).
    -   `ssh_utils.rs`: Utilities for SSH key generation and connection.
    -   `auth.rs`: Authentication token management (GitHub, Google).

### Frontend (`src`)
-   **Language**: TypeScript + React
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS
-   **State Management**: `JobContext.tsx` (React Context)
-   **Communication**: `services/tauriService.ts` wraps Tauri `invoke` calls.

## Coding Conventions

### Rust
-   Use `cargo check` to verify compilation.
-   Avoid `unwrap()` in production paths; use `Result` and `?` propagation.
-   SSH keys must be generated in-memory using `ed25519-dalek` and `ssh-key`.
-   Do not hardcode secrets.

### TypeScript
-   Use strictly typed interfaces in `types.ts`.
-   Use Lucide React for icons.
-   Ensure `npm run build` passes before committing.

## Setup Instructions

1.  **Backend**:
    ```bash
    cd command-center/src-tauri
    cargo check
    ```
2.  **Frontend**:
    ```bash
    cd command-center
    npm install
    npm run build
    ```

## Feature: Lightning AI / Remote SSH
To connect to a Lightning AI Studio:
1.  Open the Studio in browser.
2.  Use the "Connect locally via SSH" feature to get Host, User, and ensure your key is added.
3.  In Command Center, select "Remote / AI".
4.  Enter the SSH details and the Repo URL (context for the AI).
5.  Paste your **Private Key (PEM)**. *Note: Keys are kept in memory or temporary secure files during connection only.*

## Testing
-   The environment is "Android Ready", meaning logic is verified via `cargo check`.
-   Unit tests are not currently implemented but should be added in `src-tauri/tests`.
