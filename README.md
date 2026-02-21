# lambda-site-template

```bash
npx cap add android
npx cap add ios
```

## Tests

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
