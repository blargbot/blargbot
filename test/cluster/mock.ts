import { instance, verify, when } from 'ts-mockito';
import { Matcher } from 'ts-mockito/lib/matcher/type/Matcher';
import { StrictEqualMatcher } from 'ts-mockito/lib/matcher/type/StrictEqualMatcher';
import { MethodStubSetter } from 'ts-mockito/lib/MethodStubSetter';
import { MethodStubVerificator } from 'ts-mockito/lib/MethodStubVerificator';
import { Mocker } from 'ts-mockito/lib/Mock';
import { AbstractMethodStub } from 'ts-mockito/lib/stub/AbstractMethodStub';
import { MethodStub } from 'ts-mockito/lib/stub/MethodStub';
import { isProxy } from 'util/types';

export class Mock<T> {
    readonly #expressionProvider: T;
    readonly #assertions: Array<() => void>;

    // eslint-disable-next-line @typescript-eslint/ban-types
    public constructor(clazz?: (new (...args: never[]) => T) | (Function & { prototype: T; }), strict = true) {
        const ctx = {} as Record<PropertyKey, unknown>;

        if (typeof clazz === 'function' && typeof clazz.prototype === 'object')
            Object.setPrototypeOf(ctx, <object | null>clazz.prototype);

        for (const symbol of [Symbol.toPrimitive, 'then', 'catch'])
            if (!(symbol in ctx))
                ctx[symbol] = undefined;

        const mock = new StrictMocker(clazz, strict);
        this.#expressionProvider = mock.getMock() as T;
        this.#assertions = [];
    }

    public setup<R>(action: (instance: T) => R, requireCall?: boolean): [R] extends [PromiseLike<infer P>] ? VerifiableMethodStubSetter<R, P, Error> : VerifiableMethodStubSetter<R>
    public setup(action: (instance: T) => unknown, requireCall = true): VerifiableMethodStubSetter<unknown, unknown, unknown> {
        const call = action(this.#expressionProvider);
        const setter = when(call);
        if (requireCall)
            this.#assertions.push(() => verify(call).atLeast(1));
        return Object.defineProperties(
            setter,
            {
                'verifiable':
                {
                    value: (verifier: number | ((verifier: MethodStubVerificator<T>) => void)) => {
                        switch (typeof verifier) {
                            case 'function':
                                this.#assertions.push(() => verifier(verify(call)));
                                break;
                            case 'number':
                                this.#assertions.push(() => verify(call).times(verifier));
                                break;
                        }
                        return setter;
                    }
                }
            }
        );
    }

    public verifyAll(): void {
        const errors = [];
        for (const assertions of this.#assertions) {
            try {
                assertions();
            } catch (err: unknown) {
                errors.push(err);
            }
        }
        switch (errors.length) {
            case 0: break;
            case 1: throw errors[0];
            default: throw new AggregateError(errors, errors.join('\n'));
        }
    }

    public get instance(): T {
        return instance(this.#expressionProvider);
    }
}

function createMockArgumentFilter<T>(assertion: (value: unknown) => value is T): MockArgumentFilter<T> {
    return {
        get value() {
            return new SatisfiesMatcher<T>(assertion) as unknown as T;
        },
        and<R extends T>(next: (value: T) => value is R) {
            return createMockArgumentFilter((value): value is R => assertion(value) && next(value));
        },
        array() {
            return createMockArgumentFilter((value): value is T[] => Array.isArray(value) && value.every(assertion)).value;
        }
    };
}

export const argument = {
    any(): MockArgumentFilter<unknown> {
        return this.is((_x): _x is unknown => true);
    },
    is<T>(assertion: (value: unknown) => value is T): MockArgumentFilter<T> {
        return createMockArgumentFilter(assertion);
    },
    in<T>(...values: T[]): MockArgumentFilter<T> {
        return this.is((value): value is T => {
            return values.some(v => v instanceof Matcher ? v.match(value) : v === value);
        });
    },
    assert<T>(assertion: (value: unknown) => void): MockArgumentFilter<T> {
        return this.is((value): value is T => {
            assertion(value);
            return true;
        });
    },
    isInstanceof<T>(type: new (...args: never) => T): MockArgumentFilter<T> {
        return this.is((x): x is T => x instanceof type);
    },
    isTypeof<T extends keyof TypeofMap>(type: T): MockArgumentFilter<TypeofMap[T]> {
        return this.is((x): x is TypeofMap[T] => typeof x === type);
    },
    matches<T extends string = string>(pattern: RegExp): MockArgumentFilter<T> {
        return this.is((x): x is T => typeof x === 'string' && pattern.test(x));
    },
    isDeepEqual<T>(value: T, ignoreExcessUndefined = true): T {
        return new DeepEqualMatcher<T>(value, !ignoreExcessUndefined) as unknown as T;
    },
    exact<T>(value: T): T {
        return new StrictEqualMatcher(value) as unknown as T;
    }
};

export interface VerifiableMethodStubSetter<T, Resolve = void, Reject = Error> extends MethodStubSetter<T, Resolve, Reject> {
    verifiable(count: number): MethodStubSetter<T, Resolve, Reject>;
    verifiable(verify: (verifier: MethodStubVerificator<T>) => void): MethodStubSetter<T, Resolve, Reject>;
}

export interface MockArgumentFilter<T> {
    get value(): T;
    and<R extends T>(assertion: (value: T) => value is R): MockArgumentFilter<R>;
    and(assertion: (value: T) => boolean): MockArgumentFilter<T>;
    array(): T[];
}

type TypeofMap = {
    'string': string;
    'number': number;
    'bigint': bigint;
    'boolean': boolean;
    'symbol': symbol;
    'undefined': undefined;
    'object': object | null;
    // eslint-disable-next-line @typescript-eslint/ban-types
    'function': Function;
}

class StrictMocker extends Mocker {
    // eslint-disable-next-line @typescript-eslint/ban-types
    public constructor(clazz?: (new (...args: never[]) => unknown) | (Function & { prototype: unknown; }), private readonly strict = false) {
        const ctx = {} as Record<PropertyKey, unknown>;

        if (typeof clazz === 'function' && typeof clazz.prototype === 'object')
            Object.setPrototypeOf(ctx, <object | null>clazz.prototype);

        for (const symbol of [Symbol.toPrimitive, 'then', 'catch'])
            if (!(symbol in ctx))
                ctx[symbol] = undefined;

        super(clazz, ctx);
    }

    protected getEmptyMethodStub(key: string, args: unknown[]): MethodStub {
        return this.strict
            ? new MethodNotConfiguredStub(key)
            : super.getEmptyMethodStub(key, args);
    }
}

class MethodNotConfiguredStub extends AbstractMethodStub implements MethodStub {
    public constructor(protected readonly name: string) {
        super();
    }

    public isApplicable(): boolean {
        return true;
    }

    public execute(args: unknown[]): never {
        if (args.length === 0)
            throw new MethodNotConfiguredError(`The '${this.name}' method/property hasnt been configured to accept 0 arguments`);
        const strArgs = args.map(a => {
            if (a === undefined)
                return 'undefined';
            if (!isProxy(a)) {
                try {
                    return JSON.stringify(a, (_, value) => typeof value === 'bigint' ? value.toString() : value as unknown);
                } catch (err: unknown) {
                    if (!(err instanceof MethodNotConfiguredError))
                        throw err;
                }
            }

            const proto = Object.getPrototypeOf(a) as object;
            return `<PROXY ${proto.constructor.name}>`;
        });

        throw new MethodNotConfiguredError(`The '${this.name}' method hasnt been configured to accept the arguments: [${strArgs.join(',')}]`);
    }

    public getValue(): never {
        throw new MethodNotConfiguredError(`The '${this.name}' property hasnt been mocked`);
    }
}

class MethodNotConfiguredError extends Error {
}

class SatisfiesMatcher<T> extends Matcher {
    public constructor(private readonly test: (value: unknown) => value is T) {
        super();
    }

    public match(value: unknown): value is T {
        try {
            return this.test(value);
        } catch (err: unknown) {
            if (err instanceof MethodNotConfiguredError)
                return false;
            throw err;
        }
    }

    public toString(): string {
        return `satisfies(${this.test.toString()})`;
    }
}

class DeepEqualMatcher<T> extends Matcher {
    public constructor(private readonly expected: T, private readonly strict = false) {
        super();
    }

    public match(value: unknown): value is T {
        return this.deepEqual(value, this.expected);
    }

    private deepEqual(left: unknown, right: unknown): boolean {
        if (left === right)
            return true;

        if (right instanceof Matcher) {
            if (left instanceof Matcher)
                return false;
            return right.match(left);
        }
        if (left instanceof Matcher)
            return left.match(right);

        if (typeof left !== typeof right)
            return false;

        if (typeof left !== 'object' || typeof right !== 'object')
            return false;

        if (left === null && right === null)
            return true;

        if (left === null || right === null)
            return false;

        if (Array.isArray(left)) {
            if (!Array.isArray(right))
                return false;
            if (left.length !== right.length)
                return false;
            return left.every((v, i) => this.deepEqual(v, right[i]));
        }
        if (Array.isArray(right))
            return false;

        const leftLookup = new Map(Object.entries(left as Record<string, unknown>));
        for (const [key, rightVal] of Object.entries(right as Record<string, unknown>)) {
            if (this.strict && !leftLookup.has(key))
                return false;
            const leftVal = leftLookup.get(key);
            leftLookup.delete(key);
            if (!this.deepEqual(leftVal, rightVal))
                return false;
        }
        if (this.strict && leftLookup.size > 0)
            return false;
        for (const [, value] of leftLookup)
            if (value !== undefined)
                return false;
        return true;
    }

    public toString(): string {
        if (this.expected instanceof Array) {
            return `deepEqual([${this.expected.toString()}])`;
        }

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return `deepEqual(${this.expected})`;

    }
}
