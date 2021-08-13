declare module 'wolken' {
    export class Handler {
        public constructor(key: string, keyType?: string, userAgent?: string);

        public getTags(hidden?: boolean): Promise<string[]>;
        public getTypes(hidden?: boolean): Promise<string[]>;
        public getInfo(): Promise<unknown>;
        public getRandom(options: WolkeTypeQueryOptions): Promise<WolkeResult>;
        public getRandom(options: WolkeTagQueryOptions): Promise<WolkeResult>;
    }

    interface WolkeResult {
        url: string;
    }

    interface WolkeQueryOptionsBase {
        type?: string;
        tags?: string[];
        allowNSFW?: boolean | string;
        hidden?: boolean;
        fileType?: string;
    }

    interface WolkeTypeQueryOptions extends WolkeQueryOptionsBase {
        type: string;
    }

    interface WolkeTagQueryOptions extends WolkeQueryOptionsBase {
        tags: string[];
    }

    export default Handler;
}
