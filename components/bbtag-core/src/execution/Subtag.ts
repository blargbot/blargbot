import type { InterruptableProcess } from '../runtime/InterruptableProcess.js';
import type { SubtagCompilationItem } from './compilation/SubtagCompilationItem.js';
import BooleanReturnAdapter from './return/BooleanReturnAdapter.js';
import NumberReturnAdapter from './return/NumberReturnAdapter.js';
import StringArrayReturnAdapter from './return/StringArrayReturnAdapter.js';
import StringReturnAdapter from './return/StringReturnAdapter.js';
import TransparentReturnAdapter from './return/TransparentReturnAdapter.js';
import VoidReturnAdapter from './return/VoidReturnAdapter.js';
import type { SubtagParameter } from './SubtagParameter.js';
import type { SubtagReturnAdapter, SubtagReturnAdapterType } from './SubtagReturnAdapter.js';

export abstract class Subtag implements Iterable<SubtagCompilationItem> {
    static readonly #signatures = new Map<unknown, Array<(subtag: Subtag) => SubtagCompilationItem>>();
    readonly #options: SubtagOptions;

    public static signature<Parameters extends readonly SubtagParameter[]>(...parameters: Parameters): SubtagSignatureDecorator<Parameters, InterruptableProcess<string>> {
        return this.#signature<Parameters, InterruptableProcess<string>>({
            parameters: parameters,
            names: undefined,
            adapter: TransparentReturnAdapter,
            id: 'default'
        });
    }

    static #signature<Parameters extends readonly SubtagParameter[], ReturnType>(options: SubtagSignatureDecoratorOptions<Parameters, ReturnType>): SubtagSignatureDecorator<Parameters, ReturnType> {
        return Object.assign(<This extends Subtag, MethodName extends PropertyKey>(
            target: This & { [P in MethodName]: (...args: ParameterTypes<Parameters>) => ReturnType },
            methodName: MethodName
        ) => {
            let signatures = this.#signatures.get(target);
            if (signatures === undefined)
                this.#signatures.set(target, signatures = []);

            signatures.push(self => ({
                id: `${self.#options.name}.${options.id}`,
                implementation: function (...args) {
                    return options.adapter.getResult((self as This & { [P in MethodName]: (...args: ParameterTypes<Parameters>) => ReturnType })[methodName](...args as ParameterTypes<Parameters>));
                },
                names: options.names ?? [self.#options.name, ...self.#options.aliases ?? []],
                parameters: options.parameters
            }));
        }, {
            returns: (adapter: SubtagReturnAdapter<unknown> | keyof typeof wellKnownReturnAdapters) => this.#signature({ ...options, adapter: typeof adapter === 'string' ? wellKnownReturnAdapters[adapter] : adapter }),
            withName: (name: string | Iterable<string>) => this.#signature({ ...options, names: typeof name === 'string' ? [...options.names ?? [], name] : [...options.names ?? [], ...name] }),
            withId: (id: string) => this.#signature({ ...options, id })
        }) satisfies SubtagSignatureDecorator<Parameters, ReturnType>;
    }

    public constructor(options: SubtagOptions) {
        this.#options = options;
    }

    public *[Symbol.iterator](): Generator<SubtagCompilationItem> {
        for (const signature of Subtag.#signatures.get(Object.getPrototypeOf(this)) ?? [])
            yield signature(this);
    }
}

const wellKnownReturnAdapters = {
    transparent: TransparentReturnAdapter,
    string: StringReturnAdapter,
    number: NumberReturnAdapter,
    boolean: BooleanReturnAdapter,
    void: VoidReturnAdapter,
    'string[]': StringArrayReturnAdapter
} satisfies Record<string, SubtagReturnAdapter<unknown>>;

export interface SubtagOptions {
    readonly name: string;
    readonly aliases?: Iterable<string>;
}

export interface SubtagSignatureDecoratorOptions<Parameters extends readonly SubtagParameter[], ReturnType> {
    readonly parameters: Parameters;
    readonly adapter: SubtagReturnAdapter<ReturnType>;
    readonly names?: readonly string[];
    readonly id: string;
}

export interface SubtagSignatureDecorator<Parameters extends readonly SubtagParameter[], ReturnType> {
    <This extends Subtag, MethodName extends PropertyKey>(
        target: This & { [P in MethodName]: (...args: ParameterTypes<Parameters>) => ReturnType },
        method: MethodName
    ): void;

    returns<ReturnType>(handler: SubtagReturnAdapter<ReturnType>): SubtagSignatureDecorator<Parameters, ReturnType>;
    returns<ReturnType extends keyof typeof wellKnownReturnAdapters>(handler: ReturnType): SubtagSignatureDecorator<Parameters, SubtagReturnAdapterType<typeof wellKnownReturnAdapters[ReturnType]>>;
    withName(name: string | Iterable<string>): SubtagSignatureDecorator<Parameters, ReturnType>;
    withId(id: string): SubtagSignatureDecorator<Parameters, ReturnType>;
}

type ParameterTypes<Parameters extends readonly SubtagParameter[]> = {
    [P in keyof Parameters]: Parameters[P] extends SubtagParameter<infer R> ? R : unknown
}
