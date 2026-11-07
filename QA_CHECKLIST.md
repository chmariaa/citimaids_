# QA Routine Checklist (Laravel + React)

A checklist for our team to follow every day and after every pull request. Copy a section, tick the boxes as you go, and don't skip steps even when you are in a hurry.

> **Note:** The commands below use the convenience scripts added to our project (`composer test`, `npm run test`, `npm run lint`, `npm run test:e2e`). If running directly, the binary commands are shown in the table.

## 1. Quick Command Reference

| What it checks | Location | Command | Direct Binary Fallback |
| :--- | :--- | :--- | :--- |
| **Laravel backend tests** | `citimaids-api` | `composer test` | `php artisan test` |
| **PHP code style check** | `citimaids-api` | `composer lint` | `vendor/bin/pint --test` |
| **PHP code style autofix** | `citimaids-api` | `composer lint:fix` | `vendor/bin/pint` |
| **PHP static analysis** | `citimaids-api` | `composer phpstan` | `vendor/bin/phpstan analyse` |
| **PHP dependency security** | `citimaids-api` | `composer audit` | `composer audit` |
| **React component tests** | `citimaids-frontend` | `npm run test` | `npx vitest run` |
| **React test watch mode** | `citimaids-frontend` | `npm run test:watch` | `npx vitest` |
| **End-to-end browser tests** | `citimaids-frontend` | `npm run test:e2e` | `npx playwright test` |
| **Playwright UI mode** | `citimaids-frontend` | `npm run test:e2e:ui` | `npx playwright test --ui` |
| **React/JS linter** | `citimaids-frontend` | `npm run lint` | `npx eslint .` |
| **Code format check** | `citimaids-frontend` | `npm run format:check` | `npx prettier --check "src/**/*.{js,jsx,css}"` |
| **Code format autofix** | `citimaids-frontend` | `npm run format` | `npx prettier --write "src/**/*.{js,jsx,css}"` |
| **JS dependency security** | `citimaids-frontend` | `npm run audit` | `npm audit --audit-level=high` |

*Green means pass. Red means something is broken and must be fixed before moving on.*

---

## 2. Daily Routine (Every Coding Session)

### Before you start
- [ ] Pull the latest code: `git pull origin main`
- [ ] Switch to a feature branch (never code directly on `main`): `git checkout -b feature/your-name-feature`
- [ ] Install any new dependencies: `cd citimaids-api && composer install`, `cd ../citimaids-frontend && npm install`
- [ ] Run backend tests to ensure clean state: `composer test` (inside `citimaids-api`)
- [ ] Run frontend tests to ensure clean state: `npm run test` (inside `citimaids-frontend`)
- [ ] If something is already red, alert the team before starting new work

### While coding
- [ ] Write a small test for each feature or bugfix right after you build it
- [ ] Watch for red underlines from ESLint in your editor and fix them as you go
- [ ] Use the in-memory SQLite testing database; never test against the development MySQL database

### Before every commit
- [ ] Run the tests for the area you changed
- [ ] Run the linters: `composer lint` and `npm run lint` / `npm run format:check`
- [ ] Click through the feature yourself in the browser
- [ ] Commit only when everything is green
- [ ] Write a clear commit message explaining what changed and why

### End of the day
- [ ] Push your branch to GitHub: `git push -u origin feature/your-name-feature`
- [ ] Note any unfinished work or known bugs in a GitHub Issue or team chat

---

## 3. Pull Request Checklist

### Author: before opening the pull request
- [ ] Branch is up to date with `main` (merge or rebase `main` into your branch)
- [ ] Full backend suite passes: `composer test`
- [ ] Full frontend suite passes: `npm run test`
- [ ] Linters pass: `composer lint` and `npm run format:check`
- [ ] You added or updated tests for the new behavior
- [ ] No leftover debug code (`dd()`, `dump()`, `console.log`) and no secrets/keys committed
- [ ] Pull request description details what changed and includes screenshots for UI changes

### Author: after opening the pull request
- [ ] Wait for GitHub Actions CI to finish (look for the green check or red X)
- [ ] If red, open the failed job log, fix the issue locally, and push again
- [ ] Request a review from at least one teammate

### Reviewer
- [ ] GitHub Actions CI is green
- [ ] The code is readable and satisfies the issue description
- [ ] Tests exist for new behavior, including edge cases
- [ ] Check security: inputs validated, routes protected, no credentials exposed
- [ ] Pull the branch and test locally if it involves core flows
- [ ] Leave constructive comments, then approve or request changes

### After merging
- [ ] Delete the merged feature branch
- [ ] Pull latest `main` locally: `git pull origin main`
- [ ] Run `composer test` and `npm run test` on `main` to confirm clean integration
- [ ] Close the related GitHub Issue

**Team rule:** Never merge a pull request while GitHub Actions is red.

---

## 4. Weekly Routine
- [ ] Run the full end-to-end tests: `npm run test:e2e` (inside `citimaids-frontend`)
- [ ] Run the dependency security audits: `composer audit` and `npm run audit`
- [ ] Review open bugs in GitHub Issues and prioritize fixes
- [ ] Identify untested endpoints or components and add coverage

---

## 5. Before a Demo, Defense, or Deployment
### Automated checks
- [ ] All backend tests pass (`composer test`)
- [ ] All frontend component tests pass (`npm run test`)
- [ ] All Playwright browser E2E tests pass (`npm run test:e2e`)
- [ ] Accessibility audit in Playwright passes with 0 critical violations
- [ ] Code styles pass (`composer lint` and `npm run format:check`)
- [ ] Production build succeeds without errors: `npm run build` (inside `citimaids-frontend`)
