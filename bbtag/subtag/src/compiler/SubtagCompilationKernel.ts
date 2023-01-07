import type { BBTagScript, InterruptableProcess, SubtagCallEvaluator } from '@bbtag/engine';
import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError, UnknownSubtagError } from '@bbtag/engine';

import type { SubtagParameterDetails, SubtagParameterType } from '../parameter/SubtagParameter.js';
import { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagCompilationItem } from './SubtagCompilationItem.js';

export class SubtagCompilationKernel {
    readonly #nameMap: Map<string, SubtagBinderAggregator>;

    public constructor() {
        this.#nameMap = new Map();
    }

    public add<P extends readonly SubtagParameterDetails[]>(item: SubtagCompilationItem<P>): void
    public add(item: SubtagCompilationItem): void {
        const factory = new SubtagBinderFactory(item);
        for (const name of item.names) {
            const lname = name.toLowerCase();
            let binders = this.#nameMap.get(lname);
            if (binders === undefined)
                this.#nameMap.set(lname, binders = new SubtagBinderAggregator());
            binders.add(factory);
        }
    }

    public compile(): SubtagCallEvaluator['execute'] {
        const binderMap = new Map([...this.#nameMap].map(([name, binders]) => [name, binders.compile()] as const));
        function* namesFor(name: string): Generator<string> {
            name = name.toLowerCase();
            yield name;
            const dotIndex = name.lastIndexOf('.');
            if (dotIndex !== -1)
                yield `${name.slice(0, dotIndex)}.*`;
        }
        return async function* (name, call, script) {
            const args = call.args.map((t, i) => new SubtagArgument(script, i, t));
            for (const n of namesFor(name)) {
                const binder = binderMap.get(n);
                if (binder !== undefined) {
                    const details = yield* binder(name, args, script);
                    return yield* details.implementation(script, ...details.args);
                }
            }

            throw new UnknownSubtagError(name);
        };
    }
}

class SubtagBinderAggregator {
    readonly #factories: SubtagBinderFactory[];
    #minArgs: number;
    #maxArgs: number;

    public constructor() {
        this.#factories = [];
        this.#minArgs = Infinity;
        this.#maxArgs = -Infinity;
    }

    public add<P extends readonly SubtagParameterDetails[]>(factory: SubtagBinderFactory<P>): void
    public add(factory: SubtagBinderFactory): void {
        this.#factories.push(factory);
        if (this.#minArgs > factory.minArgs)
            this.#minArgs = factory.minArgs;
        if (this.#maxArgs < factory.maxArgs)
            this.#maxArgs = factory.maxArgs;
    }

    public compile(): SubtagArgumentBinder {
        const lookup = new Map<number, SubtagArgumentBinder[]>();
        const tests = [] as Array<(argCount: number) => SubtagArgumentBinder | undefined>;
        const minArgs = this.#minArgs;
        const maxArgs = this.#maxArgs;
        for (const factory of this.#factories) {
            const binders = factory.createBinders();
            if (typeof binders === 'function')
                tests.push(binders);
            else for (const { argCount, binder } of binders) {
                let binders = lookup.get(argCount);
                if (binders === undefined)
                    lookup.set(argCount, binders = []);
                binders.push(binder);
            }
        }

        function findBinders(argCount: number): SubtagArgumentBinder[] {
            let binders = lookup.get(argCount);
            if (binders === undefined)
                lookup.set(argCount, binders = tests.map(t => t(argCount)).filter(hasValue));
            return binders;
        }

        return async function* findAndBindImplementation(name, args, script) {
            if (args.length < minArgs)
                throw new NotEnoughArgumentsError(minArgs, args.length);
            if (args.length > maxArgs)
                throw new TooManyArgumentsError(maxArgs, args.length);

            let firstError: BBTagRuntimeError | undefined;
            for (const binder of findBinders(args.length)) {
                try {
                    return yield* binder(name, args, script);
                } catch (err) {
                    if (!(err instanceof BBTagRuntimeError))
                        throw err;
                    firstError ??= err;
                }
            }
            if (firstError !== undefined)
                throw firstError;
            throw new Error(`No binding available to handle ${name} with ${args.length} arguments`);
        };
    }
}

function hasValue<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined;
}

class SubtagBinderFactory<P extends readonly SubtagParameterDetails[] = readonly SubtagParameterDetails[]> {
    readonly #implementation: SubtagCompilationItem<P>['implementation'];
    readonly #parameters: SubtagCompilationItem<P>['parameters'];
    public readonly minArgs: number;
    public readonly maxArgs: number;

    public constructor(item: SubtagCompilationItem<P>) {
        this.#implementation = item.implementation;
        this.#parameters = item.parameters;
        let min = 0;
        let max = 0;

        for (const parameter of this.#parameters) {
            min += parameter.minRepeat * parameter.readers.length;
            max += parameter.maxRepeat * parameter.readers.length;
        }

        this.minArgs = min;
        this.maxArgs = max;
    }

    public createBinders(): Array<{ argCount: number; binder: SubtagArgumentBinder<P>; }> | ((argCount: number) => SubtagArgumentBinder<P> | undefined) {
        if (Number.isFinite(this.minArgs) && Number.isFinite(this.maxArgs))
            return [...this.#createStaticBinders()];

        return this.#createBinder.bind(this);
    }

    * #createStaticBinders(): Generator<{ argCount: number; binder: SubtagArgumentBinder<P>; }> {
        for (let argCount = this.minArgs; argCount <= this.maxArgs; argCount++) {
            const binder = this.#createBinder(argCount);
            if (binder !== undefined)
                yield { argCount, binder };
        }
    }

    #createBinder(argCount: number): SubtagArgumentBinder<P> | undefined {
        const argBindings = [] as { -readonly [Q in keyof P]?: { parameter: P[Q]; start: number; end: number; } };
        let start = 0;
        let allowed = argCount - this.minArgs;
        for (const parameter of this.#parameters) {
            allowed += parameter.minRepeat * parameter.readers.length;
            const consume = allowed - allowed % parameter.readers.length;
            argBindings.push({ parameter, start, end: start + consume });
            allowed -= consume;
            start += consume;
        }

        if (start !== argCount)
            return undefined;

        const argBindingsFinal = argBindings as { [Q in keyof P]: { parameter: P[Q]; start: number; end: number; } };
        const implementation = this.#implementation;
        return async function* bindImplementation(name, args, script) {
            const result = [] as { -readonly [Q in keyof P]?: SubtagParameterType<P[Q]> };
            for (const { parameter, start, end } of argBindingsFinal) {
                const groups = [];
                for (let i = start; i < end; i += parameter.readers.length) {
                    const group = [];
                    for (let j = 0; i < parameter.readers.length; j++)
                        group.push(yield* parameter.readers[j].read(name, args[i + j], script));
                    groups.push(group);
                }
                result.push(yield* parameter.aggregate(name, groups, script));
            }

            return {
                implementation,
                args: result as P
            };
        };
    }
}

type SubtagArgumentBinder<Parameters extends readonly SubtagParameterDetails[] = readonly SubtagParameterDetails[]> = (name: string, values: SubtagArgument[], script: BBTagScript) => InterruptableProcess<InvokerBindingDetails<Parameters>>;
interface InvokerBindingDetails<Parameters extends readonly SubtagParameterDetails[]> {
    readonly implementation: SubtagCompilationItem<Parameters>['implementation'];
    readonly args: Parameters;
}
