Frontend (React + Bootstrap)

Quick start

1. Install deps

```bash
cd frontend
npm install
```

2. Run dev server

```bash
npm run dev
```

The app expects the backend at `http://localhost:5000/api`.

Pages implemented
- `/login` — Admin login, posts to `/api/auth/login`, stores JWT in `localStorage`.
- `/students` — Protected students list with Add / Edit / Delete operations wired to `/api/students`.

Notes
- Axios instance is in `src/services/api.js` and automatically attaches the JWT from `localStorage`.
- Students CRUD wrappers are in `src/services/students.js`.
- Protected routes use `src/components/PrivateRoute.jsx`.
- Where to extend: add Results and Upload modules (API wrappers + pages) and link from the Students page.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
