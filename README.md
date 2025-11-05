# Customs Verification App

This project uses Vite, React, TypeScript, shadcn-ui, Tailwind CSS, and Firebase (Auth, Firestore, Storage).

Development

```sh
npm install
npm run dev
```

Genkit setup

1) Install deps (already added):

```sh
npm i --save genkit @genkit-ai/googleai
```

2) Set API key (PowerShell example):

```powershell
$env:GOOGLE_GENAI_API_KEY = "<your API key>"
```

3) Optional test (Node only):

```ts
import { helloFlow } from './src/integrations/genkit/client';
helloFlow('Chris').then(console.log);
```
