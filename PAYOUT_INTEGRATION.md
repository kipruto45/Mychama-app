# Payout Workflow - Integration Guide

## Quick Start

This guide shows how to integrate the complete payout workflow into your MyChama app.

## 1. Navigation Setup

### In Your Main Navigation File

```typescript
// src/navigation/RootNavigator.tsx or similar

import { PayoutStackNavigator } from './PayoutStackNavigator';
import { usePermissions } from '../rbac/usePermissions';

export function RootNavigator() {
  const { hasPermission } = usePermissions();

  return (
    <NavigationContainer>
      <Drawer.Navigator>
        {/* Your existing screens */}

        {/* Payouts - Available to all members */}
        <Drawer.Screen
          name="PayoutsStack"
          component={PayoutStackNavigator}
          options={{
            title: 'Payouts',
            drawerLabel: 'Payouts',
            headerShown: false,
          }}
        />

        {/* Treasurer-Only Review Tab */}
        {hasPermission('view_payout_reviews') && (
          <Drawer.Screen
            name="TreasurerReviewStack"
            component={TreasurerReviewStackNavigator}
            options={{
              title: 'Pending Reviews',
              drawerLabel: '📋 Pending Reviews',
              headerShown: false,
            }}
          />
        )}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
```

### For Approval Queues (Optional Separate Tab)

Create a separate stack for treasurer/chairperson workflows:

```typescript
// src/navigation/TreasurerReviewStackNavigator.tsx

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TreasurerPayoutReviewScreen from '../screens/payouts/TreasurerPayoutReviewScreen';

const Stack = createNativeStackNavigator();

export function TreasurerReviewStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        // Configure stack
      }}
    >
      <Stack.Screen
        name="PendingPayouts"
        component={TreasurerPayoutReviewScreen}
        options={{ title: 'Pending Approvals' }}
      />
    </Stack.Navigator>
  );
}
```

## 2. Provider Setup

Ensure these providers wrap your app:

```typescript
// App.tsx or App.tsx

import { QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}
```

## 3. State Management Setup

The Zustand store is automatically initialized when you use `usePayoutStore`:

```typescript
import { usePayoutStore } from '../store/payoutStore';

// In your component:
const { fetchPayouts, payouts } = usePayoutStore();
```

No additional setup needed - Zustand handles persistence automatically.

## 4. API Service Configuration

Ensure your API client is configured:

```typescript
// src/api/client.ts or similar

import axios from 'axios';
import { API_URL } from '../config/env';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors for auth token
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken(); // Your token retrieval
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 5. Role-Based Access Control

### Setup Role Checks

```typescript
// In screens that require roles

import { useRBACAuth } from '../rbac/useRBACAuth';

function TreasurerPayoutReviewScreen() {
  const { userRole } = useRBACAuth();

  // Check role
  if (!['Treasurer', 'Chairperson', 'Admin'].includes(userRole)) {
    return <UnauthorizedScreen />;
  }

  // ... rest of screen
}
```

### Or use the permission hook

```typescript
import { usePermissions } from '../rbac/usePermissions';

const { hasPermission } = usePermissions();

if (!hasPermission('approve_payout')) {
  return <UnauthorizedScreen />;
}
```

## 6. Theme Configuration

Ensure theme colors are defined:

```typescript
// src/theme/colors.ts

export const emeraldGoldTheme = {
  colors: {
    primary: '#16a34a', // Emerald
    secondary: '#d97706', // Gold
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    // ... other colors
  },
};
```

## 7. Toast Notifications

Setup toast system (if not already done):

```typescript
// src/utils/toast.ts

import Toast from 'react-native-toast-message';

export function showToast(type: 'success' | 'error' | 'info', message: string) {
  Toast.show({
    type,
    text1: message,
    duration: 3000,
    topOffset: 50,
  });
}
```

In your App root:

```typescript
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <>
      {/* Your app */}
      <Toast />
    </>
  );
}
```

## 8. Usage Examples

### Simple List Access

```typescript
import { usePayoutStore } from '../store/payoutStore';

function MyScreen() {
  const { payouts, fetchPayouts } = usePayoutStore();

  useEffect(() => {
    fetchPayouts(chamaId);
  }, []);

  return (
    <FlatList
      data={payouts}
      renderItem={({ item }) => <PayoutCard payout={item} />}
    />
  );
}
```

### Treasurer Review Flow

```typescript
function TreasurerScreen() {
  const { currentPayout, treasurerApprove } = usePayoutStore();

  const handleApprove = async () => {
    try {
      await treasurerApprove(payoutId);
      showToast('success', 'Approved!');
    } catch (err) {
      showToast('error', err.message);
    }
  };

  return (
    <View>
      <PayoutCard payout={currentPayout} />
      <Button onPress={handleApprove} title="Approve" />
    </View>
  );
}
```

### Using React Query Hooks

```typescript
import { useTreasurerApprove, usePayoutDetail } from '../hooks/usePayouts';

function ApprovalScreen({ payoutId }) {
  const { data: payout } = usePayoutDetail(payoutId);
  const { mutate: approve } = useTreasurerApprove();

  return (
    <View>
      <PayoutInfo payout={payout} />
      <Button
        onPress={() => approve(payoutId)}
        title="Approve"
      />
    </View>
  );
}
```

### Combined State Management

```typescript
import { usePayoutStore } from '../store/payoutStore';
import { usePayouts } from '../hooks/usePayouts';

function CombinedExample({ chamaId }) {
  // Zustand for UI state
  const { selectedChamaId, setSelectedChamaId } = usePayoutStore();

  // React Query for server data
  const { data: payouts, isLoading } = usePayouts(chamaId);

  return (
    <View>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <PayoutsList payouts={payouts} />
      )}
    </View>
  );
}
```

## 9. Customization

### Modify Store Persistence

```typescript
// In payoutStore.ts, adjust the persist config:

export const usePayoutStore = create<PayoutStoreState>()(
  persist(
    (set, get) => ({
      // ... store definition
    }),
    {
      name: 'payout-store', // Storage key
      partialize: (state) => ({
        // Only persist these fields
        form: state.form,
        selectedChamaId: state.selectedChamaId,
      }),
      storage: AsyncStorage, // Or your storage solution
    }
  )
);
```

### Adjust React Query Cache

```typescript
// In usePayouts.ts

const staleTime = 60 * 1000; // 1 minute
const gcTime = 10 * 60 * 1000; // 10 minutes
```

### Add More Screens

```typescript
// In PayoutStackNavigator.tsx

<Stack.Screen
  name="CustomScreen"
  component={CustomPayoutScreen}
  options={{ title: 'Custom Payout Screen' }}
/>
```

## 10. Troubleshooting

### Store data not persisting

```typescript
// Clear and reinit:
usePayoutStore.getState().resetForm();
// Then refresh app
```

### Query not refetching

```typescript
import { useInvalidatePayoutQueries } from '../hooks/usePayouts';

const { invalidateLists } = useInvalidatePayoutQueries();

// Manually invalidate when needed:
invalidateLists();
```

### Navigation not working

```typescript
// Check that PayoutStackNavigator is properly registered:
// 1. Screen components exist
// 2. Types match in PayoutStackParamList
// 3. Navigator is included in RootNavigator
```

### Type errors

```typescript
// Regenerate types:
// 1. Check PayoutNavigator.types.ts has all screens
// 2. Verify payoutService.ts has latest response types
// 3. Run TypeScript compiler: tsc --noEmit
```

## 11. Environment Variables

Add to your `.env` file:

```
EXPO_PUBLIC_API_URL=https://api.my-cham-a.app
EXPO_PUBLIC_PAYOUT_POLLING_INTERVAL=5000
EXPO_PUBLIC_PAYOUT_ENABLE_OFFLINE=true
```

## 12. Testing Integration

```typescript
// Example test
import { renderHook } from '@testing-library/react-native';
import { usePayoutStore } from '../store/payoutStore';

describe('Payout Integration', () => {
  it('fetches and displays payouts', async () => {
    const { result } = renderHook(() => usePayoutStore());

    await result.current.fetchPayouts('chama-123');

    expect(result.current.payouts.length).toBeGreaterThan(0);
  });
});
```

## 13. Deployment Checklist

- [ ] All screens imported and registered in navigation
- [ ] API_URL environment variable set
- [ ] Auth token interceptor configured
- [ ] Toast notification system working
- [ ] Theme colors applied
- [ ] RBAC permissions checked
- [ ] React Query cache strategy appropriate
- [ ] Zustand persistence working
- [ ] All types compiled successfully
- [ ] Tested on iOS and Android
- [ ] Error states handled gracefully

## 14. Performance Tips

1. **Lazy Load**: Only show screens user needs
2. **Cache Strategy**: Adjust `staleTime` and `gcTime` based on data frequency
3. **Pagination**: Add pagination for large lists
4. **Debounce**: Debounce search inputs
5. **Memoization**: Wrap components with `React.memo` if needed

## 15. Security Considerations

1. **Auth**: Always include auth token in requests
2. **RBAC**: Check permissions server-side on all mutations
3. **Data**: Don't store sensitive data in Zustand (non-encrypted)
4. **Errors**: Don't show backend errors to users
5. **Validation**: Validate all inputs before submission

## 16. Support

For questions or issues:

1. Check the individual screen READMEs
2. Review the backend API documentation
3. Check test files for usage examples
4. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: 2026-04-25  
**Status**: Production Ready
