import React, {useEffect, useMemo, useState} from 'react';
import {Linking} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
  createNavigationContainerRef,
  LinkingOptions,
  NavigationContainer,
} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import {AppErrorBoundary} from './src/components/system/AppErrorBoundary';
import {AuthProvider, QueryProvider, ThemeProvider} from './src/providers';
import {ToastProvider} from './src/components/ui/ToastProvider';
import {MainStackParamList} from './src/navigation/types';
import {analyticsService} from './src/services/analyticsService';
import {useAuthStore} from './src/store/authStore';
import {
  captureIncomingInviteUrl,
  getPendingInviteIntent,
} from './src/utils/inviteFlow';
import {monitoring} from './src/utils/monitoring';

const navigationRef = createNavigationContainerRef<MainStackParamList>();

const App: React.FC = () => {
  const {isAuthenticated, isLoading} = useAuthStore();
  const [navigationReady, setNavigationReady] = useState(false);

  useEffect(() => {
    try {
      monitoring.initialize();
    } catch (error) {
      console.warn('Monitoring initialization failed:', error);
    }

    try {
      analyticsService.initialize();
      void analyticsService.track('app_opened', {source: 'mobile'}).catch((error) => {
        console.warn('App open analytics failed:', error);
      });
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }, []);

  const linking = useMemo<LinkingOptions<MainStackParamList>>(
    () => ({
      prefixes: ['mychama://', 'https://mychama.app', 'https://www.mychama.app'],
      config: {
        screens: {
          InvitePreview: 'invite/:token',
          JoinViaCode: 'join/code/:code?',
          Payments: 'payments',
          PaymentHistory: 'payments/history',
          PaymentStatus: 'payments/status/:intentId',
          PendingPaymentDetail: 'payments/pending/:intentId',
          Receipt: 'payments/receipt/:intentId',
          MemberLoans: 'loans',
          LoanEligibility: 'loans/eligibility',
          RequestLoan: 'loans/request',
          LoanReviewConfirm: 'loans/request/review',
          LoanSubmissionResult: 'loans/request/result/:applicationId?',
          LoanApplicationDetails: 'loans/applications/:applicationId',
          LoanApplications: 'loans/history',
          LoanDetail: 'loans/active/:loanId',
          RepaymentSchedule: 'loans/active/:loanId/schedule',
          RejectedApplicationState: 'loans/applications/:applicationId/rejected',
        },
      },
      async getInitialURL() {
        const url = await Linking.getInitialURL();
        if (url) {
          const intent = await captureIncomingInviteUrl(url);
          if (intent) {
            await analyticsService.track('invite_link_opened', {
              source: 'deep_link_initial',
              invite_source_type: intent.sourceType,
            });
          }
        }
        return url;
      },
      subscribe(listener) {
        const subscription = Linking.addEventListener('url', ({url}) => {
          void (async () => {
            const intent = await captureIncomingInviteUrl(url);
            if (intent) {
              await analyticsService.track('invite_link_opened', {
                source: 'deep_link_runtime',
                invite_source_type: intent.sourceType,
              });
            }
          })();
          listener(url);
        });

        return () => {
          subscription.remove();
        };
      },
    }),
    []
  );

  useEffect(() => {
    if (isLoading || !isAuthenticated || !navigationReady || !navigationRef.isReady()) {
      return;
    }

    void (async () => {
      try {
        const pendingInvite = await getPendingInviteIntent();
        if (!pendingInvite) {
          return;
        }

        const currentRoute = navigationRef.getCurrentRoute()?.name;
        if (currentRoute === 'InvitePreview' || currentRoute === 'JoinViaCode' || currentRoute === 'JoinSuccess') {
          return;
        }

        if (pendingInvite.intendedRoute === 'InvitePreview' && pendingInvite.token) {
          navigationRef.navigate('InvitePreview', {token: pendingInvite.token});
          return;
        }

        if (pendingInvite.intendedRoute === 'JoinViaCode' && pendingInvite.code) {
          navigationRef.navigate('JoinViaCode', {code: pendingInvite.code});
        }
      } catch (error) {
        console.warn('Pending invite bootstrap failed:', error);
      }
    })();
  }, [isAuthenticated, isLoading, navigationReady]);

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaProvider>
          <ThemeProvider>
            <QueryProvider>
              <ToastProvider>
                <AuthProvider>
                  <NavigationContainer
                    ref={navigationRef}
                    linking={linking}
                    onReady={() => setNavigationReady(true)}
                  >
                    <AppNavigator />
                  </NavigationContainer>
                </AuthProvider>
              </ToastProvider>
            </QueryProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
};

export default App;
