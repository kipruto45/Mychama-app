const DEFAULT_CONFIGURATION = {
  reachabilityUrl: 'https://clients3.google.com/generate_204',
  reachabilityMethod: 'HEAD',
  reachabilityHeaders: {},
  reachabilityTest: response => Promise.resolve(response.status === 204),
  reachabilityShortTimeout: 5 * 1000,
  // 5s
  reachabilityLongTimeout: 60 * 1000,
  // 60s
  reachabilityRequestTimeout: 15 * 1000,
  // 15s
  reachabilityShouldRun: () => true,
  shouldFetchWiFiSSID: false,
  useNativeReachability: true
};
export default DEFAULT_CONFIGURATION;
//# sourceMappingURL=defaultConfiguration.js.map