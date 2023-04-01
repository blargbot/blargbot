import type { IFormattable } from '@blargbot/formatting';
import { hasValue } from '@blargbot/guards';

import type { BBTagCall } from './BBTagCall.js';
import type { BBTagScript } from './BBTagScript.js';
import type { BBTagRuntimeError } from './errors/index.js';
import type { ISubtag } from './ISubtag.js';
import type { BBTagLogger, ChannelService, DeferredExecutionService, DumpService, FetchService, GuildService, LockService, MessageService, ModLogService, RoleService, StaffService, SubtagDescriptor, TimezoneProvider, UserService, WarningService } from './services/index.js';
import type { SubtagOptions, SubtagSignature } from './types.js';
import type { BBTagArrayTools, BBTagJsonTools, BBTagOperators, BBTagValueConverter } from './utils/index.js';
import type { SubtagType } from './utils/subtagType.js';

const factoryKey: unique symbol = Symbol();

export abstract class Subtag implements SubtagOptions<IFormattable<string>>, ISubtag {
    public readonly category: SubtagType;
    public readonly description: IFormattable<string> | undefined;
    public readonly deprecated: string | boolean;
    public readonly staff: boolean;
    public readonly signatures: ReadonlyArray<SubtagSignature<IFormattable<string>>>;
    public readonly hidden: boolean;

    public get id(): string {
        throw new Error('You must set a name, or use the Subtag.id(name, ...aliases) decorator');
    }

    public get names(): string[] {
        throw new Error('You must set a name, or use the Subtag.id(name, ...aliases) decorator');
    }

    public static id(name: string, ...aliases: string[]): (type: new (...args: never) => Subtag) => void {
        return type => {
            Object.defineProperties(type.prototype, {
                id: {
                    configurable: false,
                    writable: false,
                    value: name
                },
                names: {
                    configurable: false,
                    writable: false,
                    value: [name, ...aliases]
                }
            });
        };
    }

    public static ctorArgs<Args extends readonly SubtagCtorArgDescriptor[]>(...args: Args): (type: new (...args: ToSubtagCtorArgs<Args>) => Subtag) => void
    public static ctorArgs(...args: readonly SubtagCtorArgDescriptor[]): (type: new (...args: readonly unknown[]) => Subtag) => void {
        const argFactories = args.map<SubtagCtorArgFactory<unknown>>(a => typeof a === 'string' ? e => e[a] : a);

        return type => {
            Object.defineProperty(type, factoryKey, {
                configurable: false,
                enumerable: false,
                writable: false,
                value: (runner: InjectionContext) => new type(...argFactories.map(x => x(runner)))
            });
        };
    }

    public static createInstance<T extends Subtag>(type: abstract new (...args: never) => T, context: InjectionContext): T
    public static createInstance<T extends Subtag>(type: { new(...args: never): T;[factoryKey]?: (args: InjectionContext) => T; }, context: InjectionContext): T {
        if (type[factoryKey] === undefined)
            throw new Error('No factory has been set!');
        return type[factoryKey](context);
    }

    public static getDescriptor(this: void, type: new (...args: never) => Subtag): SubtagDescriptor;
    public static getDescriptor(this: void, type: { prototype: Subtag; }): SubtagDescriptor {
        return {
            names: type.prototype.names,
            id: type.prototype.id
        };
    }

    public constructor(options: SubtagOptions<IFormattable<string>>) {
        const aliases = this.names;
        Object.defineProperty(this, 'aliases', {
            value: [
                ...aliases,
                ...options.signatures.map(s => s.subtagName)
                    .filter(hasValue)
            ]
        });
        this.category = options.category;
        this.description = options.description;
        this.deprecated = options.deprecated ?? false;
        this.staff = options.staff ?? false;
        this.hidden = options.hidden ?? false;
        this.signatures = options.signatures;
    }

    public abstract execute(context: BBTagScript, subtagName: string, subtag: BBTagCall): Awaitable<string>;

    protected async bulkLookup<T>(
        source: string,
        lookup: (value: string) => Awaitable<T | undefined>,
        error: new (term: string) => BBTagRuntimeError,
        arrayTools: BBTagArrayTools,
        converter: BBTagValueConverter
    ): Promise<T[] | undefined> {
        if (source === '')
            return undefined;
        const items = arrayTools.deserialize(source)?.v ?? [source];
        return await Promise.all(items.map(async input => {
            const asString = converter.string(input);
            const element = await lookup(asString);
            if (element === undefined)
                throw new error(asString);
            return element;
        }));
    }
}

type SubtagCtorArgFactory<T> = (context: InjectionContext) => T
type SubtagCtorArgDescriptor = keyof InjectionContext | SubtagCtorArgFactory<unknown>;
type ToSubtagCtorArgs<T extends readonly SubtagCtorArgDescriptor[]> = {
    [P in keyof T]:
    | T[P] extends keyof InjectionContext ? InjectionContext[T[P]] : never
    | T[P] extends SubtagCtorArgFactory<infer R> ? R : never
}

export interface InjectionContext {
    readonly messages: MessageService;
    readonly converter: BBTagValueConverter;
    readonly operators: BBTagOperators;
    readonly arrayTools: BBTagArrayTools;
    readonly jsonTools: BBTagJsonTools;
    readonly lock: LockService;
    readonly users: UserService;
    readonly roles: RoleService;
    readonly channels: ChannelService;
    readonly guild: GuildService;
    readonly timezones: TimezoneProvider;
    readonly warnings: WarningService;
    readonly modLog: ModLogService;
    readonly dump: DumpService;
    readonly defer: DeferredExecutionService;
    readonly staff: StaffService;
    readonly logger: BBTagLogger;
    readonly fetch: FetchService;
}
