# Payout Workflow - Frontend Implementation

## Overview

The Payout Workflow frontend implements a complete React Native + Expo application for managing multi-level payout approvals, eligibility checks, and payment processing for chama groups.

**Status**: ✅ Complete - All screens, state management, and API integration implemented

## Architecture

### Technology Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development and deployment framework
- **Zustand** - Global state management with persistence
- **React Query** - Server state management and caching
- **React Hook Form** - Form validation and management
- **Zod** - Schema validation
- **React Navigation** - Screen navigation and routing
- **Custom Theme System** - Emerald/Gold color scheme with dark mode

### Directory Structure

```
src/
  screens/payouts/
    ├── PayoutsListScreen.tsx          # Main list view with filtering
    ├── TreasurerPayoutReviewScreen.tsx # Treasurer approval screen
    ├── ChairpersonPayoutApprovalScreen.tsx # Chairperson final approval
    ├── MemberPayoutDetailScreen.tsx   # Member view of status
    └── RotationQueueScreen.tsx        # Rotation queue visualization
  
  store/
    └── payoutStore.ts                # Zustand store with actions
  
  services/
    └── payoutService.ts              # API integration layer
  
  hooks/
    └── usePayouts.ts                 # React Query hooks for all operations
  
  navigation/
    └── PayoutNavigator.types.ts      # Navigation types and constants
```

## State Management

### Zustand Store (`payoutStore.ts`)

Global state for payout workflow with persistence layer.

**State**:
```typescript
{
  // List state
  payouts: PayoutDetailResponse[]
  isLoadingPayouts: boolean
  payoutsError: string | null
  
  // Detail state
  currentPayout: PayoutDetailResponse | null
  isLoadingDetail: boolean
  detailError: string | null
  
  // Form state
  form: PayoutFormState
  isSubmitting: boolean
  formError: string | null
  
  // UI state
  selectedChamaId: string | null
  activeTab: 'pending' | 'completed' | 'rejected'
}
```

**Key Actions**:
- `fetchPayouts(chamaId?, filters?)` - Fetch payouts list
- `fetchPayoutDetail(payoutId)` - Fetch single payout
- `triggerPayout(data)` - Create new payout
- `treasurerApprove/Reject(payoutId, reason?)` - Treasurer actions
- `chairpersonApprove/Reject(payoutId, reason?)` - Chairperson actions
- `setPayoutMethod(payoutId, method)` - Update payment method
- `flagOnHold/releaseFromHold(payoutId, reason?)` - Hold management
- `retryPayment(payoutId)` - Retry failed payment

**Persistence**: Form state, selected chama, and active tab persist across app restarts.

### React Query Hooks (`usePayouts.ts`)

Server state management with automatic caching and refetching.

**Query Hooks**:
```typescript
// Data fetching
usePayouts(chamaId?, filters?)         // List with filtering
usePayoutDetail(payoutId)              // Single payout detail
useRotation(chamaId)                   // Rotation information

// Mutations
useTriggerPayout()                     // Create payout
useSendToTreasurerReview()             // Send for treasurer review
useTreasurerApprove/Reject()           // Treasurer actions
useChairpersonApprove/Reject()         // Chairperson actions
useSetPayoutMethod()                   // Update method
useFlagOnHold/useReleaseFromHold()    // Hold management
useRetryPayment()                      // Retry payment
```

**Cache Strategy**:
- `staleTime`: 10-60 seconds (background refetch trigger)
- `gcTime`: 5 minutes (how long cache persists)
- Automatic invalidation on mutations

## Screens

### 1. **PayoutsListScreen**
Main entry point showing all payouts with filtering and search.

**Features**:
- Search by member name, phone, or chama
- Tab filtering: Pending, Completed, Rejected
- Pull-to-refresh
- Status indicators and badges
- On-hold indicators
- Navigation to detail screens

**Usage**:
```typescript
navigation.navigate('PayoutsList')
```

### 2. **TreasurerPayoutReviewScreen**
Treasurer reviews and approves/rejects payouts.

**Features**:
- Display member information
- Show payout amount and method
- Display eligibility status with detailed checks
- Approve to send to chairperson
- Reject with reason
- Flag on hold with reason
- On-hold status handling

**Props**:
```typescript
route.params: { payoutId: string }
```

**Key Actions**:
- "Approve Payout" → Sends to chairperson
- "Reject Payout" → Modal with reason input
- "Flag on Hold" → Hold reason prompt

### 3. **ChairpersonPayoutApprovalScreen**
Chairperson gives final approval before payment processing.

**Features**:
- Display workflow status (treasurer → chairperson → payment)
- Show member and payout details
- Display treasurer's review notes
- Eligibility summary
- Approve to process payment
- Reject with reason

**Props**:
```typescript
route.params: { payoutId: string }
```

**Key Actions**:
- "Approve & Process" → Initiates payment
- "Reject Payout" → Modal with reason

### 4. **MemberPayoutDetailScreen**
Members view their payout status with timeline.

**Features**:
- Display payout amount prominently
- Current status badge with icon
- Timeline showing workflow progress:
  - Payout Created
  - Eligibility Verified
  - Treasurer Approval
  - Chairperson Approval
  - Payment Processing
- Payment details (account, M-Pesa, wallet)
- Receipt view for successful payouts
- Retry payment for failed payouts
- Hold status indication

**Props**:
```typescript
route.params: { payoutId: string }
```

**Status Colors**:
- ✓ Success (Green)
- ✗ Failed (Red)
- ⏳ Processing (Amber)
- ◌ Pending (Gray)

### 5. **RotationQueueScreen**
Displays member rotation queue and statistics.

**Features**:
- Current rotation cycle
- Total members and completed payouts
- Member queue with position indicators
- Status for each member (Completed, In Progress, Pending)
- Rotation statistics (completed, pending, failed)
- Progress bar showing cycle completion
- About rotation information

**Props**:
```typescript
route.params: { chamaId: string }
```

**Member Status Indicators**:
- Completed (Green checkmark)
- In Progress (Amber)
- Pending (Gray)

## API Service Layer (`payoutService.ts`)

Domain-specific service providing type-safe API integration.

**Methods**:
```typescript
// List and detail
listPayouts(chamaId?, filters?)       // GET /payouts/
getPayoutDetail(payoutId)             // GET /payouts/{id}/

// Creation and workflow
triggerPayout(data)                   // POST /payouts/trigger_payout/
sendToTreasurerReview(payoutId)       // POST /payouts/{id}/send_to_review/

// Approvals
treasurerApprove(payoutId)            // POST /payouts/{id}/treasurer_approve/
treasurerReject(payoutId, reason)     // POST /payouts/{id}/treasurer_reject/
chairpersonApprove(payoutId)          // POST /payouts/{id}/chairperson_approve/
chairpersonReject(payoutId, reason)   // POST /payouts/{id}/chairperson_reject/

// Payment and hold management
setPayoutMethod(payoutId, method)     // POST /payouts/{id}/set_payout_method/
flagOnHold(payoutId, reason)          // POST /payouts/{id}/flag_hold/
releaseFromHold(payoutId, notes?)     // POST /payouts/{id}/release_hold/
retryPayment(payoutId)                // POST /payouts/{id}/retry_payment/

// Rotation
getRotation(chamaId)                  // GET /rotations/{chamaId}/
```

**Error Handling**:
- Uses `ApiError.fromError()` pattern
- Safe error extraction (no PII in error messages)
- Type-safe error responses
- Automatic toast notifications

## Type Definitions

### PayoutStatus
```typescript
'triggered' | 'rotation_check' | 'eligibility_check' | 'ineligible' |
'awaiting_treasurer_review' | 'treasury_rejected' | 'awaiting_chair_approval' |
'chair_rejected' | 'approved' | 'processing' | 'success' | 'failed' | 'hold' | 'cancelled'
```

### PayoutMethod
```typescript
'bank_transfer' | 'mpesa' | 'wallet'
```

### EligibilityStatus
```typescript
'eligible' | 'pending_penalties' | 'active_disputes' | 'overdue_loans' |
'inactive_member' | 'insufficient_funds' | 'multiple_issues'
```

## Integration Examples

### Fetching and Displaying Payouts

```typescript
import { usePayoutStore } from '../store/payoutStore';

function MyComponent() {
  const { payouts, isLoadingPayouts, fetchPayouts } = usePayoutStore();

  useEffect(() => {
    fetchPayouts('chama-123');
  }, []);

  if (isLoadingPayouts) return <LoadingSpinner />;

  return (
    <FlatList
      data={payouts}
      renderItem={({ item }) => (
        <PayoutCard payout={item} />
      )}
    />
  );
}
```

### Using React Query Hooks

```typescript
import { useTreasurerApprove } from '../hooks/usePayouts';

function ApprovalButton({ payoutId }) {
  const { mutate, isPending } = useTreasurerApprove();

  const handleApprove = () => {
    mutate(payoutId);
  };

  return <Button loading={isPending} onPress={handleApprove} />;
}
```

### Combined Store and Query Usage

```typescript
function PayoutDetail() {
  const { currentPayout, fetchPayoutDetail } = usePayoutStore();
  const { data: rotationData } = useRotation(currentPayout?.chama_id);

  useEffect(() => {
    fetchPayoutDetail('payout-123');
  }, []);

  return (
    <>
      <AmountCard amount={currentPayout?.amount} />
      <RotationInfo rotation={rotationData} />
    </>
  );
}
```

## Styling and Theme

All screens use the custom theme system:

```typescript
import { useTheme } from '../theme';

const theme = useTheme();

// Theme colors available:
theme.colors.primary        // Primary action color
theme.colors.success        // Success/green
theme.colors.error          // Error/red
theme.colors.warning        // Warning/amber
theme.colors.text           // Primary text
theme.colors.textSecondary  // Secondary text
theme.colors.background     // Background
theme.colors.card           // Card background
theme.colors.border         // Borders
```

## Form Validation

Screens use React Hook Form + Zod for validation:

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  reason: z.string().min(10).max(500),
});

const { control, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

## Error Handling

All operations include error handling with user feedback:

```typescript
try {
  await treasurerApprove(payoutId);
  showToast('success', 'Payout approved');
} catch (error) {
  showToast('error', error.message || 'Failed to approve');
}
```

## Performance Considerations

1. **Lazy Loading**: Screens load data on-demand
2. **Caching**: React Query caches responses
3. **Pagination**: List screens support pagination (ready for implementation)
4. **Debouncing**: Search input debounced
5. **Memoization**: Components wrapped with React.memo where appropriate
6. **State Persistence**: Zustand persists form state

## Testing

### Unit Testing Screens

```typescript
import { render } from '@testing-library/react-native';
import PayoutsListScreen from './PayoutsListScreen';

describe('PayoutsListScreen', () => {
  it('renders payouts list', async () => {
    const { getByText } = render(<PayoutsListScreen />);
    expect(getByText('Payouts')).toBeTruthy();
  });
});
```

### Mocking API Calls

```typescript
jest.mock('../services/payoutService');
import { payoutService } from '../services/payoutService';

payoutService.listPayouts.mockResolvedValue({
  results: [mockPayout],
});
```

## Deployment Checklist

- [ ] All screens tested on iOS and Android
- [ ] Error states handled gracefully
- [ ] Loading states shown during API calls
- [ ] Offline handling implemented
- [ ] Theme colors verified against design
- [ ] Accessibility labels added
- [ ] Performance tested with large datasets
- [ ] Redux/Zustand store persists correctly
- [ ] React Query cache strategy verified
- [ ] Error messages are user-friendly

## Future Enhancements

1. **Pagination**: Add pagination to payouts list
2. **Filtering**: Add date range and amount filtering
3. **Bulk Actions**: Approve/reject multiple payouts
4. **Offline Support**: Cache data for offline access
5. **Animations**: Add transitions between states
6. **Export**: PDF or CSV export of payouts
7. **Analytics**: Track approval metrics
8. **Push Notifications**: Notify on status changes
9. **QR Code**: Generate payout QR codes
10. **Audit Trail**: Display full action history

## Troubleshooting

### Store not persisting
- Check Zustand configuration in `payoutStore.ts`
- Verify localStorage is available
- Clear app cache and retry

### Queries not refetching
- Check React Query configuration
- Invalidate cache manually: `useInvalidatePayoutQueries()`
- Verify network connectivity

### Styles not applying
- Check theme provider wraps all screens
- Verify color theme is loaded
- Clear cache and rebuild app

### Type errors
- Ensure all imports are from correct paths
- Regenerate types from backend schema
- Check TypeScript compilation errors

## Support

For issues or questions:
1. Check this documentation first
2. Review backend API documentation
3. Check related tests for usage examples
4. Contact the development team

## Version History

- **v1.0.0** (2026-04-25) - Initial implementation
  - All core screens implemented
  - State management with Zustand
  - React Query integration
  - Form validation
  - Error handling
  - Theme system integration
