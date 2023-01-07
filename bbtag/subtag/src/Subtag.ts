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
            convertResultUsing: a => this.#createSignatureDecorator(parameters, a, options),
            implementedBy: (target, methodName) => {
                ensureOwnSignatureList(target).push(target => {
                    const names = typeof options.subtagName === 'string'
                        ? [options.subtagName]
                        : options.subtagName ?? [target.#options.name, ...target.#options.aliases ?? []];
                    return {
                        id: `${target.#options.name}.${options.id}`,
                        names,
                        parameters: parameters,
                        implementation(script, ...args) {
                            const result = target[methodName](...args as Parameters);
                            return resultAdapter.execute(result, script);
                        }
                    };
                });
            }
        };
        return Object.assign(decorator.implementedBy, decorator);
    }

    readonly #options: SubtagOptions;

    public constructor(options: SubtagOptions) {
        this.#options = options;
    }

    public *[Symbol.iterator](): Generator<SubtagCompilationItem> {
        let current = this as Subtag;
        do {
            const signatures = getOwnSignatureList(current);
            if (signatures !== undefined)
                for (const signature of signatures)
                    yield signature(this);

            current = Object.getPrototypeOf(current) as typeof current;
        } while (current instanceof Subtag);
    }
}

function getOwnSignatureList<Target extends Subtag>(target: Target): Array<(self: Target) => SubtagCompilationItem> | undefined {
    if (!(target instanceof Subtag))
        throw new Error('Cannot set signatures on a non-subtag object');
    if (!Object.prototype.hasOwnProperty.call(target, signaturesList))
        return undefined;
    return (target as { [signaturesList]?: ReturnType<typeof getOwnSignatureList<Target>>; })[signaturesList];
}

function ensureOwnSignatureList<Target extends Subtag>(target: Target): Array<(self: Target) => SubtagCompilationItem> {
    let signatures = getOwnSignatureList(target);
    if (signatures === undefined) {
        Object.defineProperty(target, signaturesList, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: signatures = []
        });
    }
    return signatures;
}

export interface SubtagOptions {
    readonly name?: string;
    readonly aliases?: Iterable<string>;
    readonly deprecated?: boolean;
}

interface SubtagSignatureDecoratorFn<Parameters extends readonly unknown[], ReturnType> {
    <This extends SignatureDecoratorThis<MethodName, ReturnType, Parameters>, MethodName extends PropertyKey>(target: This, method: MethodName): void;
}

export interface SubtagSignatureDecorator<Parameters extends readonly unknown[], ReturnType> extends SubtagSignatureDecoratorFn<Parameters, ReturnType> {
    parameter<Parameter>(parameter: SubtagParameterDetails<Parameter>): SubtagSignatureDecorator<[...Parameters, Parameter], ReturnType>;
    convertResultUsing<ReturnType>(adapter: SubtagResultAdapter<ReturnType>): SubtagSignatureDecorator<Parameters, ReturnType>;
    implementedBy: SubtagSignatureDecoratorFn<Parameters, ReturnType>;
}

export interface SubtagSignatureDecoratorOptions {
    readonly id: string;
    readonly subtagName?: string | Iterable<string>;
}

type SignatureDecoratorThis<MethodName extends PropertyKey, ReturnType, Parameters extends readonly unknown[]> = Subtag & {
    [P in MethodName]: (...args: Parameters) => ReturnType
}
