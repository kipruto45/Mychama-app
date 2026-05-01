import { useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
}

const initialState: NetworkState = {
  isConnected: null,
  isInternetReachable: null,
  type: null,
};

export const useNetworkState = () => {
  const [networkState, setNetworkState] = useState<NetworkState>(initialState);

  const handleNetworkChange = useCallback((state: NetInfoState) => {
    setNetworkState({
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    });
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);
    return () => unsubscribe();
  }, [handleNetworkChange]);

  const isOnline = networkState.isConnected && networkState.isInternetReachable;
  const isOffline = networkState.isConnected === false || networkState.isInternetReachable === false;

  return {
    ...networkState,
    isOnline,
    isOffline,
  };
};

export default useNetworkState;
