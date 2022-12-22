import type { SubtagCompilationItem } from './compiler/SubtagCompilationItem.js';
import type { SubtagParameter } from './parameter/SubtagParameter.js';
import StringArrayReturnAdapter from './results/SubtagArrayResult.js';
import BooleanReturnAdapter from './results/SubtagBooleanResult.js';
import VoidReturnAdapter from './results/SubtagEmptyResult.js';
import NumberReturnAdapter from './results/SubtagNumberResult.js';
import type { SubtagResult, SubtagResultType } from './results/SubtagResult.js';
import StringReturnAdapter from './results/SubtagStringResult.js';
import TransparentReturnAdapter from './results/SubtagTransparentResult.js';

export abstract class Subtag implements Iterable<SubtagCompilationItem> {
    static readonly #signatures = new Map<unknown, Array<(subtag: Subtag) => SubtagCompilationItem>>();
    readonly #options: SubtagOptions;

    public static signature<Result>(options: SubtagSignatureDecoratorOptions<SubtagResult<Result>>): SubtagSignatureDecorator<[], Result>;
    public static signature<Result extends keyof typeof wellKnownReturnAdapters>(options: SubtagSignatureDecoratorOptions<Result>): SubtagSignatureDecorator<[], SubtagResultType<typeof wellKnownReturnAdapters[Result]>>;
    public static signature(options: SubtagSignatureDecoratorOptions<SubtagResult | keyof typeof wellKnownReturnAdapters>): SubtagSignatureDecorator<[], unknown> {
        const adapter = typeof options.returns === 'string' ? wellKnownReturnAdapters[options.returns] : options.returns;
        return this.#createSignatureDecorator([], { ...options, returns: adapter });
    }

    static #createSignatureDecorator<Parameters extends readonly unknown[], ReturnType>(
        parameters: { [P in keyof Parameters]: SubtagParameter<Parameters[P]> },
        options: SubtagSignatureDecoratorOptions<SubtagResult<ReturnType>>
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
                names: options.subtagName ?? [self.#options.name, ...self.#options.aliases ?? []],
                parameters: parameters,
                implementation(script, ...args) {
                    const result = (self as typeof target)[methodName](...args as Parameters);
                    return options.returns.execute(result, script);
                }
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
} satisfies Record<string, SubtagResult>;

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
