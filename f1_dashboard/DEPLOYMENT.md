# Deploy Grid / Finish on Vercel

The app is a static React/Vite site. The prepared public data is included in the repository, so deployment needs no database, API key, Python runtime, or environment variables.

## Import the GitHub repository

1. In Vercel, choose **Add New → Project**.
2. Import the GitHub repository containing this dashboard.
3. If this repository contains only this app, keep **Root Directory** at the repository root (`./`). If you publish the whole course workspace instead, select `f1_dashboard`.
4. Use **Vite** as the framework, **npm ci** for installation, **npm run build** as the build command, and **dist** as the output directory. The supplied `vercel.json` already declares these values.
5. Use **Node.js 24.x**, as declared in `package.json` and `.nvmrc`.
6. Select **Deploy**. Open the deployed root URL to begin with the audience-prediction introduction.

Subsequent pushes to the production branch can trigger Vercel's Git integration automatically.

## Files that must be committed

Commit `src/`, `public/` (including all six JSON files in `public/data/`), `index.html`, `package.json`, `package-lock.json`, TypeScript/Vite configuration, and `vercel.json`. The repository also includes the local launchers, tests, and source notes.

The `.gitignore` excludes generated builds, dependencies, local environment files, and the large `artifacts/` archive/screenshots. Vercel generates `dist/` itself.

## Check after deployment

- The root page loads the starting grid and the prediction interaction.
- **Reveal the history** shows 53.6% and 134/250.
- All four analytical chapters load their local JSON data.
- The race starts at the grid in Present mode; checkpoints reveal only the selected observations.
- Reloading a chapter/checkpoint URL preserves the intended view.

If the interface loads but the data does not, verify that `public/data/*.json` was committed. If Vercel cannot find `package.json`, correct the Root Directory setting. If it reports a Node engine mismatch, select 24.x and redeploy.

## Local development and data preparation

Use `npm ci`, `npm test`, and `npm run build` with Node 24. The existing Python launcher runs the built app locally.

`npm run prepare:data` regenerates the frozen snapshot from the sibling `f1_dashboard_plan/` inputs in the complete original project pack. It is an optional data-reproduction task, not part of the Vercel build. The prepared JSON files already in `public/data/` are sufficient to build and host this repository independently.

Official references: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [build configuration](https://vercel.com/docs/builds/configure-a-build), [supported Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
