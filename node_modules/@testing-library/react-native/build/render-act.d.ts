import type { ReactTestRenderer, TestRendererOptions } from 'react-test-renderer';
export declare function renderWithAct(component: React.ReactElement, options?: Partial<TestRendererOptions>): ReactTestRenderer;
export declare function renderWithAsyncAct(component: React.ReactElement, options?: Partial<TestRendererOptions>): Promise<ReactTestRenderer>;
