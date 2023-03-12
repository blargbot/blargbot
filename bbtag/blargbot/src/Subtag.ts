import type { SubtagCall } from '@bbtag/language';
import type { IFormattable } from '@blargbot/formatting';
import { hasValue } from '@blargbot/guards';

import type { BBTagContext } from './BBTagContext.js';
import type { BBTagEngine } from './BBTagEngine.js';
import type { InjectionContext } from './InjectionContext.js';
import type { SubtagDescriptor } from './services/SubtagDescriptor.js';
import type { SubtagOptions, SubtagSignature } from './types.js';
import type { SubtagType } from './utils/subtagType.js';

const factoryKey: unique symbol = Symbol();

export abstract class Subtag implements SubtagOptions<IFormattable<string>> {
    public readonly category: SubtagType;
    public readonly description: IFormattable<string> | undefined;
    public readonly deprecated: string | boolean;
    public readonly staff: boolean;
    public readonly signatures: ReadonlyArray<SubtagSignature<IFormattable<string>>>;
    public readonly hidden: boolean;

    public get name(): string {
        throw new Error('You must set a name, or use the Subtag.id(name, ...aliases) decorator');
    }

    public get aliases(): string[] {
        throw new Error('You must set a name, or use the Subtag.id(name, ...aliases) decorator');
    }

    public static names(name: string, ...aliases: string[]): (type: new (...args: never) => Subtag) => void {
        return type => {
            Object.defineProperties(type.prototype, {
                name: {
                    configurable: false,
                    writable: false,
                    value: name
                },
                aliases: {
                    configurable: false,
                    writable: false,
                    value: aliases
                }
            });
        };
    }

    public static ctorArgs<Args extends readonly SubtagCtorArgDescriptor[]>(...args: Args): (type: new (...args: ToSubtagCtorArgs<Args>) => Subtag) => void
    public static ctorArgs(...args: readonly SubtagCtorArgDescriptor[]): (type: new (...args: readonly unknown[]) => Subtag) => void {
        const argFactories = args.map<SubtagCtorArgFactory<unknown>>(a => typeof a === 'string' ? e => e.dependencies[a] : a);

        return type => {
            Object.defineProperty(type, factoryKey, {
                configurable: false,
                enumerable: false,
                writable: false,
                value: (engine: BBTagEngine) => new type(...argFactories.map(x => x(engine)))
            });
        };
    }

    public static getDescriptor<T extends Subtag>(this: void, type: new (...args: never) => T): SubtagDescriptor<T>;
    public static getDescriptor(this: void, type: new (...args: never) => Subtag): SubtagDescriptor;
    public static getDescriptor(this: void, type: {
        new(...args: readonly unknown[]): Subtag;
        [factoryKey]?: (engine: BBTagEngine) => Subtag;
        prototype: Subtag;
    }): SubtagDescriptor {
        if (type[factoryKey] === undefined)
            throw new Error('No factory has been set!');

        return {
            createInstance: type[factoryKey],
            aliases: type.prototype.aliases,
            name: type.prototype.name
        };
    }

    public constructor(options: SubtagOptions<IFormattable<string>>) {
        const aliases = this.aliases;
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

    public abstract execute(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined>;
}

type SubtagCtorArgFactory<T> = (engine: BBTagEngine) => T
type SubtagCtorArgDescriptor = keyof InjectionContext | SubtagCtorArgFactory<unknown>;
type ToSubtagCtorArgs<T extends readonly SubtagCtorArgDescriptor[]> = {
    [P in keyof T]:
    | T[P] extends keyof InjectionContext ? BBTagEngine['dependencies'][T[P]] : never
    | T[P] extends SubtagCtorArgFactory<infer R> ? R : never
}
