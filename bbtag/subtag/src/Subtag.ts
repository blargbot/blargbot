import type { SubtagCompilationItem } from './compiler/SubtagCompilationItem.js';
import { stringResultAdapter } from './index.js';
import type { SubtagParameterDetails } from './parameter/SubtagParameter.js';
import type { SubtagResultAdapter } from './results/SubtagResultAdapter.js';

const signaturesList: unique symbol = Symbol('SignaturesList');

export abstract class Subtag implements Iterable<SubtagCompilationItem> {
    public static signature(options: SubtagSignatureDecoratorOptions): SubtagSignatureDecorator<[], Awaitable<string>> {
        return this.#createSignatureDecorator([], stringResultAdapter, options);
    }

    static #createSignatureDecorator<Parameters extends readonly unknown[], ReturnType>(
        parameters: { [P in keyof Parameters]: SubtagParameterDetails<Parameters[P]> },
        resultAdapter: SubtagResultAdapter<ReturnType>,
        options: SubtagSignatureDecoratorOptions
    ): SubtagSignatureDecorator<Parameters, ReturnType> {
        const decorator: Required<Partial<SubtagSignatureDecorator<Parameters, ReturnType>>> = {
            parameter: p => this.#createSignatureDecorator([...parameters, p], resultAdapter, options),
            useConversion: a => this.#createSignatureDecorator(parameters, a, options),
            implementedBy: (target, methodName) => {
                function factory(self: typeof target): SubtagCompilationItem {
                    return {
                        id: `${self.#options.name}.${options.id}`,
                        names: options.subtagName ?? [self.#options.name, ...self.#options.aliases ?? []],
                        parameters: parameters,
                        implementation(script, ...args) {
                            const result = self[methodName](...args as Parameters);
                            return resultAdapter.execute(result, script);
                        }
                    };
                }

                if (#signatures in target)
                    target.#signatures.push(factory(target));
                else
                    getSignatureList(target).push(factory);
            }
        };
        return Object.assign(decorator.implementedBy, decorator);
    }

    readonly #options: SubtagOptions;
    readonly #signatures: SubtagCompilationItem[];

    public constructor(options: SubtagOptions) {
        this.#options = options;
        this.#signatures = [];
    }

    public *[Symbol.iterator](): Generator<SubtagCompilationItem> {
        for (const signature of getSignatureList(this))
            yield signature(this);
        for (const signature of this.#signatures)
            yield signature;
    }
}

function getSignatureList<Target extends Subtag>(target: Target): Array<(self: Target) => SubtagCompilationItem> {
    let signatures = (target as { [signaturesList]?: ReturnType<typeof getSignatureList<Target>>; })[signaturesList] ?? [];
    if (!Object.prototype.hasOwnProperty.call(target, signaturesList)) {
        Object.defineProperty(target, signaturesList, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: signatures = [...signatures]
        });
    }
    return signatures;
}

export interface SubtagOptions {
    readonly name: string;
    readonly aliases?: Iterable<string>;
    readonly deprecated?: boolean;
}

interface SubtagSignatureDecoratorFn<Parameters extends readonly unknown[], ReturnType> {
    <This extends SignatureDecoratorThis<MethodName, ReturnType, Parameters>, MethodName extends PropertyKey>(target: This, method: MethodName): void;
}

export interface SubtagSignatureDecorator<Parameters extends readonly unknown[], ReturnType> extends SubtagSignatureDecoratorFn<Parameters, ReturnType> {
    parameter<Parameter>(parameter: SubtagParameterDetails<Parameter>): SubtagSignatureDecorator<[...Parameters, Parameter], ReturnType>;
    useConversion<ReturnType>(adapter: SubtagResultAdapter<ReturnType>): SubtagSignatureDecorator<Parameters, ReturnType>;
    implementedBy: SubtagSignatureDecoratorFn<Parameters, ReturnType>;
}

export interface SubtagSignatureDecoratorOptions {
    readonly id: string;
    readonly subtagName?: string | Iterable<string>;
}

type SignatureDecoratorThis<MethodName extends PropertyKey, ReturnType, Parameters extends readonly unknown[]> = Subtag & {
    [P in MethodName]: (...args: Parameters) => ReturnType
}
