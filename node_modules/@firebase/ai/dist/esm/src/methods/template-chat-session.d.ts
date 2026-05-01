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
import { Content, GenerateContentResult, GenerateContentStreamResult, Part, RequestOptions, SingleRequestOptions, StartTemplateChatParams, TemplateFunctionDeclarationsTool, TemplateRequestInternal } from '../types';
import { ApiSettings } from '../types/internal';
import { ChatSessionBase } from './chat-session-base';
import { TemplateChatSession } from '../public-types';
/**
 * `ChatSession` class for use with server prompt templates that
 * enables sending chat messages and stores history of sent and
 * received messages so far.
 *
 * @beta
 */
export declare class TemplateChatSessionImpl extends ChatSessionBase<StartTemplateChatParams, TemplateRequestInternal, TemplateFunctionDeclarationsTool> implements TemplateChatSession {
    params: StartTemplateChatParams;
    requestOptions?: RequestOptions | undefined;
    constructor(apiSettings: ApiSettings, params: StartTemplateChatParams, requestOptions?: RequestOptions | undefined);
    /**
     * Format the internal state to the body payload for `templateGenerateContent`.
     * @internal
     */
    _formatRequest(incomingContent: Content, tempHistory: Content[]): TemplateRequestInternal;
    /**
     * Calls the specific templateGenerateContent() function needed for
     * this specialized TemplateChatSession.
     * @internal
     */
    _callGenerateContent(formattedRequest: TemplateRequestInternal, singleRequestOptions?: RequestOptions): Promise<GenerateContentResult>;
    /**
     * Calls the specific templateGenerateContentStream() function needed for
     * this specialized TemplateChatSession.
     * @internal
     */
    _callGenerateContentStream(formattedRequest: TemplateRequestInternal, singleRequestOptions?: RequestOptions): Promise<GenerateContentStreamResult>;
    /**
     * Sends a chat message and receives a non-streaming
     * {@link GenerateContentResult}
     */
    sendMessage(request: string | Array<string | Part>, singleRequestOptions?: SingleRequestOptions): Promise<GenerateContentResult>;
    /**
     * Sends a chat message and receives the response as a
     * {@link GenerateContentStreamResult} containing an iterable stream
     * and a response promise.
     */
    sendMessageStream(request: string | Array<string | Part>, singleRequestOptions?: SingleRequestOptions): Promise<GenerateContentStreamResult>;
}
