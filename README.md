# lambda-site-template

```bash
npx cap add android
npx cap add ios
```

## Tests

Tests run locally only, never in GitHub Actions, including through package lifecycle scripts, composite actions or build helpers. Keep the local commands below functional. Actions may build and deploy without running tests; remove obsolete required test checks rather than adding passing placeholders.

```bash
# one-time for browser tests
npx playwright install chromium

# run all tests
npm test

# run suites individually
npm run test:unit
npm run test:e2e
npm run test:browser
```

## Develop for Android

```bash
npm run build:frontend
npx cap sync android
npx cap run android
```

## Develop for iOS

```bash
npm run build:frontend
npx cap sync ios
npx cap run ios
```
