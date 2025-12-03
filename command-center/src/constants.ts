import { GeneratorRecipe, ContextTemplate } from './types';

export const GENERATOR_RECIPES: GeneratorRecipe[] = [
  {
    id: 'rust-tauri',
    name: 'Tauri Rust App',
    iconName: 'AppWindow',
    description: 'Secure, native-feeling desktop app with a Rust backend and React frontend.',
    defaultContext: '# Role: Rust Expert\nBuild a Tauri v2 application. Ensure strictly typed events between Rust and TS.',
  },
  {
    id: 'nextjs-full',
    name: 'Next.js SaaS',
    iconName: 'Globe',
    description: 'Full stack React framework with API routes and Tailwind pre-configured.',
    defaultContext: '# Role: React Architect\nCreate a scalable Next.js 14 app directory structure. Use Server Actions.',
  },
  {
    id: 'python-fastapi',
    name: 'FastAPI Microservice',
    iconName: 'Server',
    description: 'High performance API with automatic docs and Pydantic validation.',
    defaultContext: '# Role: Python Backend\nSetup a FastAPI service with Docker compose and Poetry for dependency management.',
  },
  {
    id: 'deno-fresh',
    name: 'Deno Fresh',
    iconName: 'Coffee',
    description: 'The next-gen web framework. No build step, edge-ready.',
    defaultContext: '# Role: Deno Developer\nScaffold a Fresh project. Use Deno KV for persistence.',
  }
];

export const CONTEXT_TEMPLATES: ContextTemplate[] = [
  { label: 'Rust Expert', content: '\n\n# Standards\n- Use strict types\n- Prefer `unwrap_or_else` over `unwrap`\n- Add doc comments to public structs' },
  { label: 'React Strict', content: '\n\n# Standards\n- Use Functional Components\n- No `any` types\n- Use Zod for validation' },
  { label: 'Security Audit', content: '\n\n# Security\n- Validate all inputs\n- Sanitize SQL queries\n- Check generic permissions' },
  { label: 'CI/CD Ops', content: '\n\n# CI/CD\n- Create GitHub Action for testing\n- Cache dependencies\n- Lint on PR' },
];