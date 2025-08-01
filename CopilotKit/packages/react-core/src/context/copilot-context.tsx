import {
  CopilotCloudConfig,
  FunctionCallHandler,
  CopilotErrorHandler,
  CopilotKitError,
} from "@copilotkit/shared";
import {
  ActionRenderProps,
  CatchAllActionRenderProps,
  FrontendAction,
} from "../types/frontend-action";
import React from "react";
import { TreeNodeId, Tree } from "../hooks/use-tree";
import { DocumentPointer } from "../types";
import { CopilotChatSuggestionConfiguration } from "../types/chat-suggestion-configuration";
import { CoAgentStateRender, CoAgentStateRenderProps } from "../types/coagent-action";
import { CoagentState } from "../types/coagent-state";
import {
  CopilotRuntimeClient,
  ExtensionsInput,
  ForwardedParametersInput,
} from "@copilotkit/runtime-client-gql";
import { Agent } from "@copilotkit/runtime-client-gql";
import {
  LangGraphInterruptAction,
  LangGraphInterruptActionSetter,
} from "../types/interrupt-action";
import { SuggestionItem } from "../utils/suggestions";

/**
 * Interface for the configuration of the Copilot API.
 */
export interface CopilotApiConfig {
  /**
   * The public API key for Copilot Cloud.
   */
  publicApiKey?: string;

  /**
   * The configuration for Copilot Cloud.
   */
  cloud?: CopilotCloudConfig;

  /**
   * The endpoint for the chat API.
   */
  chatApiEndpoint: string;

  /**
   * The endpoint for the Copilot transcribe audio service.
   */
  transcribeAudioUrl?: string;

  /**
   * The endpoint for the Copilot text to speech service.
   */
  textToSpeechUrl?: string;

  /**
   * additional headers to be sent with the request
   * @default {}
   * @example
   * ```
   * {
   *   'Authorization': 'Bearer your_token_here'
   * }
   * ```
   */
  headers: Record<string, string>;

  /**
   * Custom properties to be sent with the request
   * @default {}
   * @example
   * ```
   * {
   *   'user_id': 'user_id'
   * }
   * ```
   */
  properties?: Record<string, any>;

  /**
   * Indicates whether the user agent should send or receive cookies from the other domain
   * in the case of cross-origin requests.
   */
  credentials?: RequestCredentials;

  /**
   * Optional configuration for connecting to Model Context Protocol (MCP) servers.
   * This is typically derived from the CopilotKitProps and used internally.
   * @experimental
   */
  mcpServers?: Array<{ endpoint: string; apiKey?: string }>;
}

export type InChatRenderFunction<TProps = ActionRenderProps<any> | CatchAllActionRenderProps<any>> =
  (props: TProps) => string | JSX.Element;
export type CoagentInChatRenderFunction = (
  props: CoAgentStateRenderProps<any>,
) => string | JSX.Element | undefined | null;

export interface ChatComponentsCache {
  actions: Record<string, InChatRenderFunction | string>;
  coAgentStateRenders: Record<string, CoagentInChatRenderFunction | string>;
}

export interface AgentSession {
  agentName: string;
  threadId?: string;
  nodeName?: string;
}

export interface AuthState {
  status: "authenticated" | "unauthenticated";
  authHeaders: Record<string, string>;
  userId?: string;
  metadata?: Record<string, any>;
}

export type ActionName = string;
export type ContextTree = Tree;

export interface CopilotContextParams {
  // function-calling
  actions: Record<string, FrontendAction<any>>;
  setAction: (id: string, action: FrontendAction<any>) => void;
  removeAction: (id: string) => void;

  // coagent actions
  coAgentStateRenders: Record<string, CoAgentStateRender<any>>;
  setCoAgentStateRender: (id: string, stateRender: CoAgentStateRender<any>) => void;
  removeCoAgentStateRender: (id: string) => void;

  chatComponentsCache: React.RefObject<ChatComponentsCache>;

  getFunctionCallHandler: (
    customEntryPoints?: Record<string, FrontendAction<any>>,
  ) => FunctionCallHandler;

  // text context
  addContext: (context: string, parentId?: string, categories?: string[]) => TreeNodeId;
  removeContext: (id: TreeNodeId) => void;
  getAllContext: () => Tree;
  getContextString: (documents: DocumentPointer[], categories: string[]) => string;

  // document context
  addDocumentContext: (documentPointer: DocumentPointer, categories?: string[]) => TreeNodeId;
  removeDocumentContext: (documentId: string) => void;
  getDocumentsContext: (categories: string[]) => DocumentPointer[];

  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

  chatSuggestionConfiguration: { [key: string]: CopilotChatSuggestionConfiguration };
  addChatSuggestionConfiguration: (
    id: string,
    suggestion: CopilotChatSuggestionConfiguration,
  ) => void;
  removeChatSuggestionConfiguration: (id: string) => void;

  chatInstructions: string;
  setChatInstructions: React.Dispatch<React.SetStateAction<string>>;

  additionalInstructions?: string[];
  setAdditionalInstructions: React.Dispatch<React.SetStateAction<string[]>>;

  // api endpoints
  copilotApiConfig: CopilotApiConfig;

  showDevConsole: boolean;

  // agents
  coagentStates: Record<string, CoagentState>;
  setCoagentStates: React.Dispatch<React.SetStateAction<Record<string, CoagentState>>>;
  coagentStatesRef: React.RefObject<Record<string, CoagentState>>;
  setCoagentStatesWithRef: (
    value:
      | Record<string, CoagentState>
      | ((prev: Record<string, CoagentState>) => Record<string, CoagentState>),
  ) => void;

  agentSession: AgentSession | null;
  setAgentSession: React.Dispatch<React.SetStateAction<AgentSession | null>>;

  agentLock: string | null;

  threadId: string;
  setThreadId: React.Dispatch<React.SetStateAction<string>>;

  runId: string | null;
  setRunId: React.Dispatch<React.SetStateAction<string | null>>;

  // The chat abort controller can be used to stop generation globally,
  // i.e. when using `stop()` from `useChat`
  chatAbortControllerRef: React.MutableRefObject<AbortController | null>;

  // runtime
  runtimeClient: CopilotRuntimeClient;

  /**
   * The forwarded parameters to use for the task.
   */
  forwardedParameters?: Partial<Pick<ForwardedParametersInput, "temperature">>;
  availableAgents: Agent[];

  /**
   * The auth states for the CopilotKit.
   */
  authStates_c?: Record<ActionName, AuthState>;
  setAuthStates_c?: React.Dispatch<React.SetStateAction<Record<ActionName, AuthState>>>;

  /**
   * The auth config for the CopilotKit.
   */
  authConfig_c?: {
    SignInComponent: React.ComponentType<{
      onSignInComplete: (authState: AuthState) => void;
    }>;
  };

  extensions: ExtensionsInput;
  setExtensions: React.Dispatch<React.SetStateAction<ExtensionsInput>>;
  langGraphInterruptAction: LangGraphInterruptAction | null;
  setLangGraphInterruptAction: LangGraphInterruptActionSetter;
  removeLangGraphInterruptAction: () => void;

  /**
   * Optional trace handler for comprehensive debugging and observability.
   */
  onError?: CopilotErrorHandler;

  // banner error state
  bannerError: CopilotKitError | null;
  setBannerError: React.Dispatch<React.SetStateAction<CopilotKitError | null>>;
}

const emptyCopilotContext: CopilotContextParams = {
  actions: {},
  setAction: () => {},
  removeAction: () => {},

  coAgentStateRenders: {},
  setCoAgentStateRender: () => {},
  removeCoAgentStateRender: () => {},

  chatComponentsCache: { current: { actions: {}, coAgentStateRenders: {} } },
  getContextString: (documents: DocumentPointer[], categories: string[]) =>
    returnAndThrowInDebug(""),
  addContext: () => "",
  removeContext: () => {},
  getAllContext: () => [],

  getFunctionCallHandler: () => returnAndThrowInDebug(async () => {}),

  isLoading: false,
  setIsLoading: () => returnAndThrowInDebug(false),

  chatInstructions: "",
  setChatInstructions: () => returnAndThrowInDebug(""),

  additionalInstructions: [],
  setAdditionalInstructions: () => returnAndThrowInDebug([]),

  getDocumentsContext: (categories: string[]) => returnAndThrowInDebug([]),
  addDocumentContext: () => returnAndThrowInDebug(""),
  removeDocumentContext: () => {},
  runtimeClient: {} as any,

  copilotApiConfig: new (class implements CopilotApiConfig {
    get chatApiEndpoint(): string {
      throw new Error("Remember to wrap your app in a `<CopilotKit> {...} </CopilotKit>` !!!");
    }

    get headers(): Record<string, string> {
      return {};
    }
    get body(): Record<string, any> {
      return {};
    }
  })(),

  chatSuggestionConfiguration: {},
  addChatSuggestionConfiguration: () => {},
  removeChatSuggestionConfiguration: () => {},
  showDevConsole: false,
  coagentStates: {},
  setCoagentStates: () => {},
  coagentStatesRef: { current: {} },
  setCoagentStatesWithRef: () => {},
  agentSession: null,
  setAgentSession: () => {},
  forwardedParameters: {},
  agentLock: null,
  threadId: "",
  setThreadId: () => {},
  runId: null,
  setRunId: () => {},
  chatAbortControllerRef: { current: null },
  availableAgents: [],
  extensions: {},
  setExtensions: () => {},
  langGraphInterruptAction: null,
  setLangGraphInterruptAction: () => null,
  removeLangGraphInterruptAction: () => null,
  onError: undefined,
  bannerError: null,
  setBannerError: () => {},
};

export const CopilotContext = React.createContext<CopilotContextParams>(emptyCopilotContext);

export function useCopilotContext(): CopilotContextParams {
  const context = React.useContext(CopilotContext);
  if (context === emptyCopilotContext) {
    throw new Error("Remember to wrap your app in a `<CopilotKit> {...} </CopilotKit>` !!!");
  }
  return context;
}

function returnAndThrowInDebug<T>(_value: T): T {
  throw new Error("Remember to wrap your app in a `<CopilotKit> {...} </CopilotKit>` !!!");
}
