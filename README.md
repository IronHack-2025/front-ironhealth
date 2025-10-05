# .

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Testing

This project uses Vitest for unit/component testing and Playwright for E2E. A sample Playwright E2E test is available at `__test__/login.e2e.js`.

Quick E2E run (Playwright):

1. Install Playwright:

```sh
npm install --save-dev @playwright/test
npx playwright install
```

2. Start dev server:

```sh
npm run dev
```

3. Run the login test:

```sh
npx playwright test __test__/login.e2e.js
```

Adjust the test URL or selectors in `__test__/login.e2e.js` if your app uses different markup or runs on another port.
