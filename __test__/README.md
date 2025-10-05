This folder contains an end-to-end Playwright test for the login flow.

Setup:
1. Install Playwright and its browsers:
   npm install --save-dev @playwright/test
   npx playwright install

2. Start the dev server (Vite):
   npm run dev

3. Run the test:
   npx playwright test __test__/login.e2e.js

Notes:
- The test navigates to http://localhost:5173 by default. Adjust the URL in the test if your dev server runs on a different port.
- Selectors assume the login form uses input[type="email"] and input[type="password"] and a button[type="submit"]. Update selectors in `login.e2e.js` if your markup differs.
