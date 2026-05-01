import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('App failed to render:', error);
  }

  private handleReload = () => {
    this.setState({ error: null });

    const browserLocation = (globalThis as { location?: { reload: () => void } }).location;
    if (browserLocation?.reload) {
      browserLocation.reload();
    }
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Unable to load MyChama</Text>
        <Text style={styles.message}>
          {this.state.error.message || 'An unexpected startup error occurred.'}
        </Text>
        <Pressable onPress={this.handleReload} style={styles.button}>
          <Text style={styles.buttonText}>Reload App</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 360,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
