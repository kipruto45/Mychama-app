import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useActiveRole, useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { Role, ROLE_DISPLAY_NAMES } from '@/auth/roles';
import { Button } from '@/components/ui/Button';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import { RequireRouteAccess } from '@/rbac';
import { aiService } from '@/services/aiService';
import { borderRadius, colors, spacing, typography } from '@/theme';

type AIChatScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'AIChat'>;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{ label: string; href: string }>;
  followUps?: string[];
}

const GLOBAL_PROMPTS = [
  'What is my KYC status?',
  'How do I complete KYC?',
  'How do I create a chama?',
  'Why was my KYC rejected?',
];

const QUICK_PROMPTS = [
  'Who has not contributed this month?',
  'Which loans need attention first?',
  'Summarize our financial health',
  'What should I act on next?',
];

const ROLE_PROMPTS: Record<Role, string[]> = {
  [Role.SUPERADMIN]: [
    'Which provider issues need attention first?',
    'Summarize platform risk and support pressure',
    'What system trend looks unusual today?',
    'Which operational queue needs intervention?',
  ],
  [Role.ADMIN]: [
    'Which disputes need escalation first?',
    'Summarize the support backlog',
    'What communication failures need follow-up?',
    'Which chama or user looks risky?',
  ],
  [Role.CHAMA_ADMIN]: [
    'What approvals need my action now?',
    'Which members are behind on obligations?',
    'Summarize this chama health',
    'What governance or policy issue needs attention?',
  ],
  [Role.TREASURER]: [
    'Which payments need verification?',
    'Which loans need attention first?',
    'Summarize our financial health',
    'What liquidity risk should I act on?',
  ],
  [Role.SECRETARY]: [
    'Which meetings still need minutes?',
    'Who should receive reminders now?',
    'Summarize attendance trends',
    'What communication task is most urgent?',
  ],
  [Role.AUDITOR]: [
    'Which audit anomalies should I review first?',
    'Summarize compliance risk',
    'Show recent governance concerns',
    'Which finance history needs inspection?',
  ],
  [Role.MEMBER]: [
    'What do I need to pay next?',
    'Summarize my chama activity',
    'When is my next meeting?',
    'What loan action should I take next?',
  ],
};

type BlurViewProps = {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  style?: any;
};

let OptionalBlurView: React.ComponentType<BlurViewProps> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  OptionalBlurView = require('expo-blur').BlurView as React.ComponentType<BlurViewProps>;
} catch {
  OptionalBlurView = null;
}

export const AIChatScreen: React.FC = () => {
  const navigation = useNavigation<AIChatScreenNavigationProp>();
  const flatListRef = useRef<FlatList>(null);
  const {
    activeChamaId,
    availableChamas,
    clearSwitchError,
    isLoading: isLoadingChamaContext,
    isSwitching,
    switchChama,
    switchError,
  } = useActiveChama();
  const activeRole = useActiveRole(activeChamaId || undefined) || Role.MEMBER;
  const canUseAI = useCanPerformAction(Permission.CAN_USE_AI_ASSISTANT, activeChamaId || undefined);
  const canChat = !activeChamaId || canUseAI;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [quickPrompts, setQuickPrompts] = useState<string[]>(ROLE_PROMPTS[Role.MEMBER]);

  const loadChatContext = async () => {
    if (isLoadingChamaContext) {
      return;
    }

    setIsBootstrapping(true);
    setLoadError(null);

    try {
      const scopeChamaId = activeChamaId ? activeChamaId : null;
      const [conversationList, backendSuggestions] = await Promise.all([
        aiService.chatbotListConversations({ chamaId: scopeChamaId }).catch(() => ({
          conversations: [],
          total: 0,
          has_more: false,
        })),
        activeChamaId ? aiService.getRoleSuggestions(activeChamaId).catch(() => []) : Promise.resolve([]),
      ]);

      const latestConversation = (conversationList.conversations || [])[0];
      setConversationId(latestConversation?.id || null);

      const historyResponse = latestConversation
        ? await aiService.chatbotGetHistory({ conversationId: latestConversation.id })
        : { messages: [], total: 0, has_more: false };

      setQuickPrompts(
        activeChamaId
          ? backendSuggestions.length > 0
            ? backendSuggestions.slice(0, 4)
            : ROLE_PROMPTS[activeRole] || QUICK_PROMPTS
          : GLOBAL_PROMPTS
      );

      setMessages(
        historyResponse.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: new Date(message.timestamp),
          actions:
            message.role === 'assistant' && message.tool_payload && typeof message.tool_payload === 'object'
              ? ((message.tool_payload as any).actions as Array<{ label: string; href: string }> | undefined)
              : undefined,
          followUps:
            message.role === 'assistant' && message.tool_payload && typeof message.tool_payload === 'object'
              ? ((message.tool_payload as any).follow_up_suggestions as string[] | undefined)
              : undefined,
        }))
      );
    } catch {
      setLoadError('We could not load the assistant right now.');
      setConversationId(null);
      setQuickPrompts(activeChamaId ? ROLE_PROMPTS[activeRole] || QUICK_PROMPTS : GLOBAL_PROMPTS);
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    void loadChatContext();
  }, [activeChamaId, activeRole, isLoadingChamaContext]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) {
      return;
    }

    if (!canChat) {
      Alert.alert('AI Assistant', 'Your current role does not have access to AI in this workspace.');
      return;
    }

    const trimmedText = text.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setSendError(null);

    try {
      let resolvedConversationId = conversationId;
      if (!resolvedConversationId) {
        const started = await aiService.chatbotStartConversation({
          chamaId: activeChamaId || null,
          title: '',
        });
        resolvedConversationId = started.conversation.id;
        setConversationId(started.conversation.id);
        if (!activeChamaId && started.suggestions?.length) {
          setQuickPrompts(started.suggestions.slice(0, 4));
        }
      }

      const response = await aiService.chatbotSendMessage({
        conversationId: resolvedConversationId,
        message: trimmedText,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: response.message_id || `${Date.now()}-assistant`,
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          actions: response.actions,
          followUps: response.follow_up_suggestions,
        },
      ]);

      if (response.follow_up_suggestions && response.follow_up_suggestions.length > 0) {
        setQuickPrompts(response.follow_up_suggestions.slice(0, 4));
      }
    } catch {
      setSendError('The assistant could not answer right now. Try again in a moment.');
      setInputText(trimmedText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (action: { label: string; href: string }) => {
    const href = String(action.href || '').trim();
    if (!href) return;

    if (href === '/app' || href.startsWith('/app/dashboard')) {
      navigation.navigate('Dashboard');
      return;
    }
    if (href.startsWith('/app/payments')) {
      navigateToWorkspaceTab(navigation as any, 'Payments', {
        chamaId: activeChamaId || undefined,
        entryPoint: 'deep_link',
      });
      return;
    }
    if (href.startsWith('/app/meetings')) {
      navigation.navigate('Meetings');
      return;
    }
    if (href.startsWith('/app/contributions')) {
      navigation.navigate('ContributionHistory', { chamaId: activeChamaId || undefined });
      return;
    }
    if (href.startsWith('/app/loans') || href.startsWith('/app/finance')) {
      navigation.navigate('Finance');
      return;
    }
    if (href.startsWith('/app/issues')) {
      navigation.navigate('SupportIssues', { chamaId: activeChamaId || undefined });
      return;
    }
    if (href.startsWith('/app/kyc')) {
      navigation.navigate('KYC');
      return;
    }

    Alert.alert('Open', `This action is not supported on mobile yet: ${href}`);
  };

  const rateAssistantMessage = async (messageId: string, rating: 'thumbs_up' | 'thumbs_down') => {
    try {
      await aiService.chatbotSendFeedback(messageId, rating);
    } catch {
      // Silent failure: feedback is non-critical UX
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      {item.role === 'assistant' ? (
        <View style={styles.avatarContainer}>
          <Icon name="robot-outline" size={18} color={colors.primary[600]} />
        </View>
      ) : null}
      <View
        style={[
          styles.messageBubble,
          item.role === 'user' ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.role === 'user' ? styles.userText : styles.assistantText,
          ]}
        >
          {item.content}
        </Text>
        {item.role === 'assistant' && item.actions && item.actions.length > 0 ? (
          <View style={styles.actionRow}>
            {item.actions.slice(0, 3).map((action) => (
              <TouchableOpacity
                key={`${item.id}-${action.href}`}
                style={styles.actionChip}
                onPress={() => handleAction(action)}
              >
                <Text style={styles.actionChipText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        {item.role === 'assistant' ? (
          <View style={styles.feedbackRow}>
            <TouchableOpacity onPress={() => rateAssistantMessage(item.id, 'thumbs_up')} style={styles.feedbackButton}>
              <Icon name="thumb-up-outline" size={16} color={colors.neutral[500]} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => rateAssistantMessage(item.id, 'thumbs_down')} style={styles.feedbackButton}>
              <Icon name="thumb-down-outline" size={16} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>
        ) : null}
        <Text
          style={[
            styles.timestamp,
            item.role === 'user' ? styles.userTimestamp : styles.assistantTimestamp,
          ]}
        >
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <RequireRouteAccess route="AIChat" chamaId={activeChamaId || undefined}>
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => navigation.goBack()}>
        {OptionalBlurView ? (
          <OptionalBlurView style={StyleSheet.absoluteFillObject} intensity={28} tint="dark" />
        ) : null}
        <View style={styles.backdropTint} />
      </Pressable>
      <SafeAreaView style={styles.sheet} edges={['left', 'right', 'bottom']}>

        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Icon name="star-four-points-circle-outline" size={22} color={colors.primary[600]} />
            <View>
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={styles.headerSubtitle}>
                {activeChamaId ? `${ROLE_DISPLAY_NAMES[activeRole]} workspace` : 'Personal assistant'}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {conversationId && messages.length > 0 ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  Alert.alert('Clear conversation', 'This will remove the messages in this chat for this chama. Continue?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: () => {
                        if (!conversationId) return;
                        void aiService
                          .chatbotClearConversation(conversationId)
                          .then(() => {
                            setMessages([]);
                          })
                          .catch(() => {
                            Alert.alert('Could not clear chat', 'Please try again.');
                          });
                      },
                    },
                  ]);
                }}
              >
                <Icon name="trash-can-outline" size={20} color={colors.neutral[700]} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
              <Icon name="close" size={22} color={colors.neutral[700]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contextSwitcher}>
          <ChamaContextSwitcher
            chamas={availableChamas}
            activeChamaId={activeChamaId}
            isSwitching={isSwitching}
            onSelectChama={(chamaId) => {
              clearSwitchError();
              void switchChama(chamaId)
                .then(() => {
                  void loadChatContext();
                })
                .catch(() => undefined);
            }}
            helperText={switchError}
          />
        </View>

        {isBootstrapping ? (
          <View style={styles.bootstrapContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.bootstrapText}>Loading assistant...</Text>
          </View>
        ) : activeChamaId && !canUseAI ? (
          <EmptyState
            icon={<Icon name="shield-lock-outline" size={52} color={colors.neutral[400]} />}
            title="AI unavailable here"
            description="This workspace does not allow AI actions for your current role and chama context."
            style={styles.emptyState}
          />
        ) : loadError ? (
          <EmptyState
            icon={<Icon name="robot-confused-outline" size={52} color={colors.neutral[400]} />}
            title="Could not load assistant"
            description={loadError}
            action={<Button title="Retry" onPress={() => void loadChatContext()} />}
            style={styles.emptyState}
          />
        ) : (
          <>
            {sendError ? (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle-outline" size={18} color={colors.error} />
                <Text style={styles.errorBannerText}>{sendError}</Text>
              </View>
            ) : null}

            {messages.length === 0 ? (
              <View style={styles.emptyChatContainer}>
                <EmptyState
                  icon={<Icon name="robot-outline" size={52} color={colors.neutral[400]} />}
                  title="Ask about your chama"
                  description="Use live chama data to review contributions, loan risk, finances, meetings, and next actions."
                />
                <View style={styles.quickPromptsContainer}>
                  <Text style={styles.quickPromptsTitle}>Quick Questions</Text>
                  <View style={styles.quickPrompts}>
                    {quickPrompts.map((prompt) => (
                      <TouchableOpacity
                        key={prompt}
                        style={styles.quickPrompt}
                        onPress={() => sendMessage(prompt)}
                      >
                        <Text style={styles.quickPromptText}>{prompt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                ListFooterComponent={
                  isLoading ? (
                    <View style={styles.loadingContainer}>
                      <View style={styles.avatarContainer}>
                        <Icon name="robot-outline" size={18} color={colors.primary[600]} />
                      </View>
                      <View style={styles.loadingBubble}>
                        <ActivityIndicator size="small" color={colors.primary[500]} />
                        <Text style={styles.loadingText}>Thinking...</Text>
                      </View>
                    </View>
                  ) : null
                }
              />
            )}

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
            >
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder={activeChamaId ? 'Ask your chama assistant...' : 'Ask the assistant...'}
                  placeholderTextColor={colors.neutral[400]}
                  multiline
                  editable={!isLoading && canChat}
                />
                {canChat ? (
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                    ]}
                    onPress={() => sendMessage(inputText)}
                    disabled={!inputText.trim() || isLoading}
                  >
                    <Icon name="send" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </KeyboardAvoidingView>
          </>
        )}
      </SafeAreaView>
    </View>
    </RequireRouteAccess>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTint: {
    flex: 1,
    backgroundColor: 'rgba(12, 18, 30, 0.48)',
  },
  sheet: {
    width: '94%',
    maxWidth: 900,
    minHeight: 520,
    maxHeight: '88%',
    backgroundColor: colors.light.background,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
  },
  contextSwitcher: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
  },
  bootstrapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootstrapText: {
    marginTop: spacing[3],
    color: colors.neutral[600],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  emptyState: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.error}12`,
  },
  errorBannerText: {
    flex: 1,
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  quickPromptsContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  quickPromptsTitle: {
    marginBottom: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  quickPrompts: {
    gap: spacing[2],
  },
  quickPrompt: {
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[50],
  },
  quickPromptText: {
    color: colors.neutral[800],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  messagesList: {
    padding: spacing[4],
    gap: spacing[3],
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    marginRight: spacing[2],
  },
  messageBubble: {
    maxWidth: '82%',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
  },
  userBubble: {
    backgroundColor: colors.primary[500],
  },
  assistantBubble: {
    backgroundColor: colors.light.card,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: colors.neutral[900],
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  actionChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  actionChipText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[800],
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  feedbackButton: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
  },
  timestamp: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.82)',
  },
  assistantTimestamp: {
    color: colors.neutral[500],
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.light.card,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.light.background,
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.light.card,
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    marginLeft: spacing[3],
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
});
