declare module 'blargbot-api' {
    export interface ClintOptions {
        readonly image: string;
    }

    export interface ColorOptions {
        readonly color: readonly string[];
    }

    export interface DeleteOptions {
        readonly text: string;
    }

    export interface LinusOptions {
        readonly image: string;
    }

    export interface PCCheckOptions {
        readonly text: string;
    }

    export interface ShitOptions {
        readonly text: string;
        readonly plural: boolean;
    }

    export interface SonicSaysOptions {
        readonly text: string;
    }

    export interface TheSearchOptions {
        readonly text: string;
    }

    export interface CommandMap {
        'clint': ClintOptions;
        'color': ColorOptions;
        'delete': DeleteOptions;
        'linus': LinusOptions;
        'pccheck': PCCheckOptions;
        'shit': ShitOptions;
        'sonicsays': SonicSaysOptions;
        'thesearch': TheSearchOptions;
    }
}
