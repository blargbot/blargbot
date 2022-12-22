import type { BBTagScript, InterruptableProcess, SubtagCallEvaluator } from '@bbtag/engine';
import { NotEnoughArgumentsError, TooManyArgumentsError, UnknownSubtagError } from '@bbtag/engine';

import type { SubtagParameter } from '../parameter/SubtagParameter.js';
import { SubtagArgument } from '../SubtagArgument.js';
import type { SubtagCompilationItem } from './SubtagCompilationItem.js';

export class SubtagCompilationKernel {
    readonly #nameMap: Map<string, SubtagCompilationBinderCollection>;

    public constructor() {
        this.#nameMap = new Map();
    }

    public add(item: SubtagCompilationItem): void {
        const factory = new SubtagInvokerFactory(item);
        for (const name of item.names) {
            const lname = name.toLowerCase();
            let invokers = this.#nameMap.get(lname);
            if (invokers === undefined)
                this.#nameMap.set(lname, invokers = new SubtagCompilationBinderCollection(lname));
            invokers.add(factory);
        }
    }

    public compile(): SubtagCallEvaluator['execute'] {
        const nameMap = new Map([...this.#nameMap].map(([name, binders]) => [name, binders.compile()] as const));
        function* namesFor(name: string): Generator<string> {
            name = name.toLowerCase();
            yield name;
            const dotIndex = name.lastIndexOf('.');
            if (dotIndex !== -1)
                yield `${name.slice(0, dotIndex)}.*`;
        }
        return async function* (name, call, script) {
            for (const n of namesFor(name)) {
                const invoker = nameMap.get(n);
                if (invoker !== undefined)
                    return yield* invoker(name, call.args.map((a, i) => new SubtagArgument(script, i, a)), script);
            }

            throw new UnknownSubtagError(name);
        };
    }
}

class SubtagCompilationBinderCollection {
    readonly #factories: SubtagInvokerFactory[];
    readonly #name: string;
    #minArgs: number;
    #maxArgs: number;

    public constructor(name: string) {
        this.#name = name;
        this.#factories = [];
        this.#minArgs = Infinity;
        this.#maxArgs = -Infinity;
    }

    public add(factory: SubtagInvokerFactory): void {
        this.#factories.push(factory);
        if (this.#minArgs > factory.minArgs)
            this.#minArgs = factory.minArgs;
        if (this.#maxArgs < factory.maxArgs)
            this.#maxArgs = factory.maxArgs;
    }

    public compile(): SubtagArgumentInvoker {
        const lookup = new Map<number, SubtagArgumentInvoker>();
        const tests = [] as Array<(argCount: number) => SubtagArgumentInvoker | undefined>;
        const name = this.#name;
        const minArgs = this.#minArgs;
        const maxArgs = this.#maxArgs;
        for (const factory of this.#factories) {
            const invokers = factory.createInvokers();
            if (typeof invokers === 'function')
                tests.push(invokers);
            else for (const { argCount, invoker } of invokers) {
                if (lookup.has(argCount))
                    throw new Error(`Multiple bindings for name ${name} with arg count ${argCount}`);
                lookup.set(argCount, invoker);
            }
        }

        return async function* findAndInvoke(name, args, script) {
            const invoker = lookup.get(args.length);
            if (invoker !== undefined)
                return yield* invoker(name, args, script);

            const tested = tests
                .map(t => t(args.length))
                .filter((v): v is Exclude<typeof v, undefined> => v !== undefined);
            if (tested.length === 1)
                return yield* tested[0](name, args, script);

            if (tested.length > 1)
                throw new Error(`Multiple bindings for name ${name} with arg count ${args.length}`);
            if (args.length < minArgs)
                throw new NotEnoughArgumentsError(minArgs, args.length);
            else if (args.length > maxArgs)
                throw new TooManyArgumentsError(maxArgs, args.length);
            throw new Error(`No binding available to handle ${name} with ${args.length} arguments`);
        };
    }
}

class SubtagInvokerFactory {
    readonly #invoker: SubtagCompilationItem['implementation'];
    readonly #parameters: SubtagCompilationItem['parameters'];
    public readonly minArgs: number;
    public readonly maxArgs: number;

    public constructor(item: SubtagCompilationItem) {
        this.#invoker = item.implementation;
        this.#parameters = item.parameters;
        let min = 0;
        let max = 0;

        for (const parameter of this.#parameters) {
            min += parameter.minRepeat * parameter.values.length;
            max += parameter.maxRepeat * parameter.values.length;
        }

        this.minArgs = min;
        this.maxArgs = max;
    }

    public createInvokers(): Array<{ argCount: number; invoker: SubtagArgumentInvoker; }> | ((argCount: number) => SubtagArgumentInvoker | undefined) {
        if (Number.isFinite(this.minArgs) && Number.isFinite(this.maxArgs))
            return [...this.#createStaticInvokers()];

        return this.#createInvoker.bind(this);
    }

    * #createStaticInvokers(): Generator<{ argCount: number; invoker: SubtagArgumentInvoker; }> {
        for (let argCount = this.minArgs; argCount <= this.maxArgs; argCount++) {
            const invoker = this.#createInvoker(argCount);
            if (invoker !== undefined)
                yield { argCount, invoker };
        }
    }

    #createInvoker(argCount: number): SubtagArgumentInvoker | undefined {
        const argBindings: Array<{ parameter: SubtagParameter; start: number; end: number; }> = [];
        let start = 0;
        let allowed = argCount - this.minArgs;
        for (const parameter of this.#parameters) {
            allowed += parameter.minRepeat * parameter.values.length;
            const consume = allowed - allowed % parameter.values.length;
            argBindings.push({ parameter, start, end: start + consume });
            allowed -= consume;
            start += consume;
        }

        if (start !== argCount)
            return undefined;

        const invoker = this.#invoker;
        return async function* bindAndInvoke(name, args, script) {
            const result = [];
            for (const { parameter, start, end } of argBindings) {
                const groups = [];
                for (let i = start; i < end; i += parameter.values.length) {
                    const group = [];
                    for (let j = 0; i < parameter.values.length; j++)
                        group.push(yield* parameter.values[j].read(name, args[i + j], script));
                    groups.push(group);
                }
                result.push(yield* parameter.aggregate(name, groups, script));
            }
            return yield* invoker(...result);
        };
    }
}

type SubtagArgumentInvoker = (name: string, values: SubtagArgument[], script: BBTagScript) => InterruptableProcess<string>;
