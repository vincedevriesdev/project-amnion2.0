# Contributing to Project Amnion 2.0

Bedankt voor je interesse in het bijdragen aan **Project Amnion 2.0**! Samen bouwen we een modern, privacygericht en transparant VPN-platform.

---

## 🛠️ Ontwikkelomgeving Opzetten

1. Clone de repository:
   ```bash
   git clone https://github.com/project-amnion/project-amnion.git
   cd project-amnion
   ```

2. Backend starten in dev-modus:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. Dashboard starten in dev-modus:
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```

---

## 📐 Code Conventies

- **Backend**: Gebruik TypeScript, Fastify plugins, en volg het **Domain-Driven Module** patroon in `src/modules/<feature>/`.
- **Frontend**: Gebruik Vue 3 Composition API (`<script setup lang="ts">`), Pinia stores, en utility-first CSS.
- **Commits**: Gebruik duidelijke commit-berichten (bijv. `feat(protocols): add ShadowTLS support`, `fix(auth): sanitize session cookies`).
