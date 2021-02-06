import phantom from 'phantom';

declare module 'phantom' {
    export interface WebPage {
        on(event: string, ...args: any[]): Promise<{ pageId: string }>
    }
}