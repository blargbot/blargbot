declare module 'better-cleverbot-io' {
    export interface CleverbotOptions {
        readonly user: string;
        readonly key: string;
        readonly nick: string;
    }

    export default class CleverbotIO {
        public constructor(options: CleverbotOptions);

        public create(): Promise<string>
        public ask(question: string): Promise<string>;
    }


}
