# React + TypeScript + Vite

## Rotas autenticadas

As páginas da conta usam URLs próprias sob `/dashboard`, para que voltar/avançar do navegador acompanhe a navegação interna:

- `/dashboard` — visão geral
- `/dashboard/statement` — extrato
- `/dashboard/cards` — cartões
- `/dashboard/pix` — Pix
- `/dashboard/bills` — contas
- `/dashboard/pay` — pagamento da conta selecionada
- `/dashboard/invoice` e `/dashboard/invoices` — simulação e histórico de faturas
- `/dashboard/profile` e `/dashboard/settings` — perfil e ajustes
- `/dashboard/transfers/:id` — detalhes de transferência

O servidor de produção deve entregar o `index.html` da aplicação para essas rotas, assim como faz para `/dashboard`.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
