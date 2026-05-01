const DEFAULT_CONFIGURATION = {
  reachabilityUrl: '/',
  reachabilityMethod: "HEAD",
  reachabilityHeaders: {},
  reachabilityTest: response => Promise.resolve(response.status === 200),
  reachabilityShortTimeout: 5 * 1000,
  // 5s
  reachabilityLongTimeout: 60 * 1000,
  // 60s
  reachabilityRequestTimeout: 15 * 1000,
  // 15s
  reachabilityShouldRun: () => true,
  shouldFetchWiFiSSID: true,
  useNativeReachability: true
};
export default DEFAULT_CONFIGURATION;
//# sourceMappingURL=defaultConfiguration.web.js.map