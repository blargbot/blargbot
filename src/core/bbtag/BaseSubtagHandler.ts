import { Client as ErisClient } from 'eris';
import { Cluster } from '../../cluster';
import { SubtagArgumentKind, SubtagType } from '../../utils';
import { BBSubtagCall } from './types';
import { RuntimeContext } from './RuntimeContext';

export { argBuilder as arg } from './ArgumentFactory';
export { SubtagType as Type } from '../../utils';

export interface SubtagArgument {
    content: Array<string | SubtagArgument>;
    types: SubtagArgumentType[];
    kind: SubtagArgumentKind;
    multiple: boolean;
}

export type SubtagArgumentType =
    | 'any'
    | 'transparent'
    | 'string'
    | 'number'
    | 'boolean'
    | 'array'
    | 'user'
    | 'channel'
    | 'role'
    | 'time'


export interface SubtagHandlerOptions {
    aliases?: string[];
    category: SubtagType;
    args?: SubtagArgument[];
    desc?: string;
    exampleCode?: string | null;
    exampleIn?: string | null;
    exampleOut?: string | null;
    deprecated?: boolean;
    staff?: boolean;
    acceptsArrays?: boolean;
}

type ArgumentCondition = (subtag: BBSubtagCall, context: RuntimeContext) => boolean | Promise<boolean>;

type ArgumentFilter = number | string | ArgumentCondition;

export abstract class BaseSubtagHandler implements Required<SubtagHandlerOptions>{
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #handlers: Array<{ condition: ArgumentCondition, handler: string }>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #default?: string;
    public readonly aliases: string[];
    public readonly category: SubtagType;
    public readonly isTag: true;
    public readonly args: SubtagArgument[];
    public readonly desc: string;
    public readonly exampleCode: string | null;
    public readonly exampleIn: string | null;
    public readonly exampleOut: string | null;
    public readonly deprecated: boolean;
    public readonly staff: boolean;
    public readonly acceptsArrays: boolean;

    public get logger(): CatLogger { return this.cluster.logger; }
    public get discord(): ErisClient { return this.cluster.discord; }

    protected constructor(
        public readonly cluster: Cluster,
        public readonly name: string,
        options: SubtagHandlerOptions
    ) {
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.isTag = true;
        this.args = options.args ?? [];
        this.desc = options.desc ?? '';
        this.exampleCode = options.exampleCode ?? null;
        this.exampleIn = options.exampleIn ?? null;
        this.exampleOut = options.exampleOut ?? null;
        this.deprecated = options.deprecated ?? false;
        this.staff = options.staff ?? false;
        this.acceptsArrays = options.acceptsArrays ?? false;
        this.#handlers = [];
    }

    public async execute(subtag: BBSubtagCall, context: RuntimeContext): Promise<string> {
        let invoke: unknown = this[this.#default as keyof this];
        for (const { condition, handler } of this.#handlers) {
            if (condition(subtag, context)) {
                invoke = this[handler as keyof this];
                break;
            }
        }
        if (typeof invoke === 'function')
            return await (<BaseSubtagHandler['execute']>invoke)(subtag, context);

        throw new Error('Unhandled call');
    }

    protected whenArgs(filter: ArgumentFilter, handler: string & keyof this): this {
        this.#handlers.push({ condition: parseFilter(filter), handler });
        return this;
    }

    protected default(handler: string & keyof this): this {
        this.#default = handler;
        return this;
    }

    public notEnoughArguments(): string {
        return '`Not enough arguments`';
    }
}

function parseFilter(filter: ArgumentFilter): () => (Promise<boolean> | boolean) {
    switch (typeof filter) {
        default:
            return () => { throw new Error('WIP'); };
    }
}