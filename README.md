# FDNY Study — Fire POC

Flashcard + quiz prototype for the Fire project. Pick a book, choose flashcards or a multiple-choice quiz. Content is representative mock data, not real extracted text — there's no AI backend or content ingestion wired up yet.

## Deploy to Netlify

**Easiest path (drag and drop):**
1. Unzip this folder locally.
2. Open a terminal in the folder and run:
   ```
   npm install
   npm run build
   ```
3. Go to https://app.netlify.com/drop and drag in the generated `dist` folder.

**Git-based path (recommended for ongoing updates):**
1. Push this folder to a new GitHub repo.
2. In Netlify: **Add new site → Import an existing project**, connect the repo.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Netlify will pick up `netlify.toml` automatically for these settings.

## Local development

```
npm install
npm run dev
```
