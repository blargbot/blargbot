import 'phantom';

declare module 'phantom' {
    export interface WebPage {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        on(event: string, ...args: any[]): Promise<{ pageId: string; }>;
    }
}
