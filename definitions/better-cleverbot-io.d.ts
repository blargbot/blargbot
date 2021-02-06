declare module 'better-cleverbot-io' {
    export interface CleverbotOptions {
        user: string,
        key: string,
        nick: string
    }

    export default class CleverbotIO {
        constructor(options: CleverbotOptions);

        create(): Promise<string>
        ask(question: string): Promise<string>;
    }


}