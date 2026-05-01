/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Content, FunctionCall, FunctionDeclarationsTool, FunctionResponsePart, GenerateContentResponse, GenerateContentResult, GenerateContentStreamResult, Part, RequestOptions, SingleRequestOptions, StartChatParams, StartTemplateChatParams, TemplateFunctionDeclarationsTool } from '../types';
import { ApiSettings } from '../types/internal';
/**
 * Base class for various `ChatSession` classes that enables sending chat
 * messages and stores history of sent and received messages so far.
 *
 * @public
 */
export declare abstract class ChatSessionBase<ParamsType extends StartChatParams | StartTemplateChatParams, RequestType, FunctionDeclarationsToolType extends FunctionDeclarationsTool | TemplateFunctionDeclarationsTool> {
    params?: ParamsType | undefined;
    requestOptions?: RequestOptions | undefined;
    protected _apiSettings: ApiSettings;
    protected _history: Content[];
    /**
     * Ensures sequential execution of chat messages to maintain history order.
     * Each call waits for the previous one to settle before proceeding.
     * @internal
     */
    protected _sendPromise: Promise<void>;
    constructor(apiSettings: ApiSettings, params?: ParamsType | undefined, requestOptions?: RequestOptions | undefined);
    /**
     * Gets the chat history so far. Blocked prompts are not added to history.
     * Neither blocked candidates nor the prompts that generated them are added
     * to history.
     */
    getHistory(): Promise<Content[]>;
    /**
     * Format Content into a request for `generateContent` or
     * `generateContentStream` (or their template versions).
     * @internal
     */
    abstract _formatRequest(incomingContent: Content, tempHistory: Content[]): RequestType;
    /**
     * Type-specific generate content calls (inherited classes may implement this
     * to call basic `generateContent()` or the template version)
     * @internal
     */
    abstract _callGenerateContent(formattedRequest: RequestType, singleRequestOptions?: RequestOptions): Promise<GenerateContentResult>;
    /**
     * Type-specific generate content stream calls (inherited classes may implement this
     * to call basic `generateContentStream()` or the template version)
     * @internal
     */
    abstract _callGenerateContentStream(formattedRequest: RequestType, singleRequestOptions?: RequestOptions): Promise<GenerateContentStreamResult>;
    /**
     * Sends a chat message and receives a non-streaming
     * {@link GenerateContentResult}
     * @internal
     */
    _sendMessage(request: string | Array<string | Part>, singleRequestOptions?: SingleRequestOptions): Promise<GenerateContentResult>;
    /**
     * Sends a chat message and receives the response as a
     * {@link GenerateContentStreamResult} containing an iterable stream
     * and a response promise.
     * @internal
     */
    _sendMessageStream(request: string | Array<string | Part>, singleRequestOptions?: SingleRequestOptions): Promise<GenerateContentStreamResult>;
    /**
     * Get function calls that the SDK has references to actually call.
     * This is all-or-nothing. If the model is requesting multiple
     * function calls, all of them must have references in order for
     * automatic function calling to work.
     *
     * @internal
     */
    _getCallableFunctionCalls(response?: GenerateContentResponse): FunctionCall[] | undefined;
    /**
     * Call user-defined functions if requested by the model, and return
     * the response that should be sent to the model.
     * @internal
     */
    _callFunctionsAsNeeded(functionCalls: FunctionCall[]): Promise<FunctionResponsePart[]>;
}
