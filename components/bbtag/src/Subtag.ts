import { metrics } from '@blargbot/core/Metrics.js';
import type { Database } from '@blargbot/database';
import type { IFormattable } from '@blargbot/formatting';
import { hasValue } from '@blargbot/guards';
import type { Logger } from '@blargbot/logger';
import { Timer } from '@blargbot/timer';

import type { BBTagContext } from './BBTagContext.js';
import type { BBTagEngine } from './BBTagEngine.js';
import type { BBTagUtilities, BBTagValueConverter, SubtagDescriptor } from './BBTagUtilities.js';
import type { SubtagCall } from './language/index.js';
import type { SubtagOptions, SubtagSignature } from './types.js';
import type { BBTagArrayTools, BBTagJsonTools, BBTagOperators, SubtagType } from './utils/index.js';

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

    public static id(name: string, ...aliases: string[]): (type: new (...args: never) => Subtag) => void {
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

    public static factory<Args extends readonly unknown[]>(...args: { [P in keyof Args]: (engine: BBTagEngine) => Args[P] }): (type: new (...args: Args) => Subtag) => void
    public static factory(...args: ReadonlyArray<(engine: BBTagEngine) => unknown>): (type: new (...args: readonly unknown[]) => Subtag) => void {
        return type => {
            Object.defineProperty(type, factoryKey, {
                configurable: false,
                enumerable: false,
                writable: false,
                value: (engine: BBTagEngine) => new type(...args.map(x => x(engine)))
            });
        };
    }

    public static converter(): (engine: BBTagEngine) => BBTagValueConverter {
        return e => e.dependencies.converter;
    }

    public static store(): (engine: BBTagEngine) => Database;
    public static store<T extends keyof Database>(type: T): (engine: BBTagEngine) => Database[T];
    public static store<T extends keyof Database>(type?: T): (engine: BBTagEngine) => Database[T] | Database {
        if (type === undefined)
            return e => e.dependencies.database;
        return e => e.dependencies.database[type];
    }

    public static util(): (engine: BBTagEngine) => BBTagUtilities {
        return e => e.dependencies.util;
    }

    public static logger(): (engine: BBTagEngine) => Logger {
        return e => e.dependencies.logger;
    }

    public static arrayTools(): (engine: BBTagEngine) => BBTagArrayTools {
        return e => e.dependencies.arrayTools;
    }
    public static jsonTools(): (engine: BBTagEngine) => BBTagJsonTools {
        return e => e.dependencies.jsonTools;
    }

    public static operators(): (engine: BBTagEngine) => BBTagOperators;
    public static operators<T extends keyof BBTagOperators>(method: T): (engine: BBTagEngine) => BBTagOperators[T];
    public static operators<T extends keyof BBTagOperators>(type?: T): (engine: BBTagEngine) => BBTagOperators[T] | BBTagOperators {
        if (type === undefined)
            return e => e.dependencies.operators;
        return e => e.dependencies.operators[type];
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

    public async * execute(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined> {
        const timer = new Timer().start();
        try {
            yield* this.executeCore(context, subtagName, subtag);
        } finally {
            timer.end();
            metrics.subtagLatency.labels(this.name).observe(timer.elapsed);
            metrics.subtagCounter.labels(this.name).inc();
            const debugPerf = context.data.subtags[this.name] ??= [];
            debugPerf.push(timer.elapsed);
        }
    }

    protected abstract executeCore(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined>;
}
