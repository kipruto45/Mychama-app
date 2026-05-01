# 06. Frontend Code Structure

## Recommended Structure

```txt
src/
  api/
    client.ts
    interceptors.ts
    queryKeys.ts
  assets/
    images/
    icons/
    fonts/
  components/
    common/
    forms/
    feedback/
    charts/
    navigation/
  constants/
    routes.ts
    enums.ts
    config.ts
  features/
    auth/
      screens/
      hooks/
      services/
      types/
      validators/
    profile/
      screens/
      hooks/
      services/
      types/
    chamas/
      screens/
      hooks/
      services/
      types/
    payments/
      screens/
      hooks/
      services/
      types/
    finance/
      screens/
      hooks/
      services/
      types/
    meetings/
      screens/
      hooks/
      services/
      types/
    notifications/
      screens/
      hooks/
      services/
      types/
    ai/
      screens/
      hooks/
      services/
      types/
    settings/
      screens/
      hooks/
      services/
      types/
  hooks/
    useDebounce.ts
    usePagination.ts
    useNetworkStatus.ts
  navigation/
    AppNavigator.tsx
    AuthNavigator.tsx
    MainTabs.tsx
    types.ts
  store/
    authStore.ts
    appStore.ts
    uiStore.ts
  theme/
    colors.ts
    spacing.ts
    typography.ts
    shadows.ts
    index.ts
  types/
    api.ts
    domain.ts
    navigation.ts
  utils/
    format.ts
    validation.ts
    error.ts
    storage.ts
```

## How This Maps to Current App

Current app already has:
- `screens`, `services`, `store`, `theme`, `navigation`, `utils`

Recommended transition:
1. Keep current modules working as-is.
2. Introduce `features/` for new work first.
3. Move old screens/services gradually by feature.
4. Keep shared UI in `components/common`.
5. Keep API client concerns centralized in `api/`.

## State Management Boundaries

- `authStore`: auth/session/user identity
- `appStore`: selected chama, global counters, app-level context
- `uiStore`: modal states, temporary selections, in-progress actions
- React Query: server state and caching

## Service Layer Boundaries

- Keep transport logic in `api/client.ts`
- Keep endpoint wrappers in feature `services`
- Keep data transformation in feature `hooks`
- Keep screen components focused on presentation and interaction

## MVP Delivery Sequence

1. Auth foundation and protected navigation
2. Dashboard + chama list/detail
3. Contributions and payment history
4. Meetings and notifications
5. Finance insights and AI assistant
6. Role-based governance controls

## Quality Baseline

- typed request/response models
- consistent loading/error components
- idempotency keys on payment-sensitive flows
- pagination for list endpoints
- route guards for role-based actions

