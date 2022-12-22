import type { SubtagCompilationItem } from './compiler/SubtagCompilationItem.js';
import type { SubtagParameter } from './parameter/SubtagParameter.js';
import BooleanReturnAdapter from './returns/BooleanReturnAdapter.js';
import NumberReturnAdapter from './returns/NumberReturnAdapter.js';
import StringArrayReturnAdapter from './returns/StringArrayReturnAdapter.js';
import StringReturnAdapter from './returns/StringReturnAdapter.js';
import type { SubtagReturnAdapter, SubtagReturnAdapterType } from './returns/SubtagReturnAdapter.js';
import TransparentReturnAdapter from './returns/TransparentReturnAdapter.js';
import VoidReturnAdapter from './returns/VoidReturnAdapter.js';

export abstract class Subtag implements Iterable<SubtagCompilationItem> {
    static readonly #signatures = new Map<unknown, Array<(subtag: Subtag) => SubtagCompilationItem>>();
    readonly #options: SubtagOptions;

    public static signature<Result>(options: SubtagSignatureDecoratorOptions<SubtagReturnAdapter<Result>>): SubtagSignatureDecorator<[], Result>;
    public static signature<Result extends keyof typeof wellKnownReturnAdapters>(options: SubtagSignatureDecoratorOptions<Result>): SubtagSignatureDecorator<[], SubtagReturnAdapterType<typeof wellKnownReturnAdapters[Result]>>;
    public static signature(options: SubtagSignatureDecoratorOptions<SubtagReturnAdapter | keyof typeof wellKnownReturnAdapters>): SubtagSignatureDecorator<[], unknown> {
        const adapter = typeof options.returns === 'string' ? wellKnownReturnAdapters[options.returns] : options.returns;
        return this.#createSignatureDecorator([], { ...options, returns: adapter });
    }

    static #createSignatureDecorator<Parameters extends readonly unknown[], ReturnType>(
        parameters: { [P in keyof Parameters]: SubtagParameter<Parameters[P]> },
        options: SubtagSignatureDecoratorOptions<SubtagReturnAdapter<ReturnType>>
    ): SubtagSignatureDecorator<Parameters, ReturnType> {
        return Object.assign<
            SubtagSignatureDecoratorFn<Parameters, ReturnType>,
            Required<Partial<SubtagSignatureDecorator<Parameters, ReturnType>>>
        >((target, methodName) => {
            let signatures = this.#signatures.get(target);
            if (signatures === undefined)
                this.#signatures.set(target, signatures = []);

            signatures.push(self => ({
                id: `${self.#options.name}.${options.id}`,
                implementation: function (...args) {
                    return options.returns.getResult((self as typeof target)[methodName](...args as Parameters));
                },
                names: options.subtagName ?? [self.#options.name, ...self.#options.aliases ?? []],
                parameters: parameters
            }));
        }, {
            parameter: p => this.#createSignatureDecorator([...parameters, p], options)
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

interface SubtagSignatureDecoratorFn<Parameters extends readonly unknown[], ReturnType> {
    <This extends SignatureDecoratorThis<MethodName, ReturnType, Parameters>, MethodName extends PropertyKey>(target: This, method: MethodName): void;
}

export interface SubtagSignatureDecorator<Parameters extends readonly unknown[], ReturnType> extends SubtagSignatureDecoratorFn<Parameters, ReturnType> {
    parameter<Parameter>(parameter: SubtagParameter<Parameter>): SubtagSignatureDecorator<[...Parameters, Parameter], ReturnType>;
}

export interface SubtagSignatureDecoratorOptions<Return> {
    readonly id: string;
    readonly returns: Return;
    readonly subtagName?: string | Iterable<string>;
}

type SignatureDecoratorThis<MethodName extends PropertyKey, ReturnType, Parameters extends readonly unknown[]> = Subtag & {
    [P in MethodName]: (...args: Parameters) => ReturnType
}
