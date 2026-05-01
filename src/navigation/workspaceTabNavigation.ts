type AnyNavigation = {
  navigate: (name: string, params?: any) => void;
  getParent?: () => AnyNavigation | undefined;
};

const getRootNavigation = (navigation: AnyNavigation): AnyNavigation => {
  let current: AnyNavigation = navigation;
  while (current.getParent) {
    const parent = current.getParent();
    if (!parent) {
      break;
    }
    current = parent;
  }
  return current;
};

export const navigateToWorkspaceTab = (
  navigation: AnyNavigation,
  tab: 'Dashboard' | 'Chamas' | 'Payments' | 'Meetings' | 'More',
  params?: any
) => {
  const root = getRootNavigation(navigation);
  root.navigate(tab, params);
};

