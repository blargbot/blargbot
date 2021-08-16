import 'twemoji';

declare module 'twemoji' {
    export function replace(text: string, callback: (match: string) => string): string;
}
