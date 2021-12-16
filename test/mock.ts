import { instance, verify, when } from 'ts-mockito';
import { Matcher } from 'ts-mockito/lib/matcher/type/Matcher';
import { MethodStubSetter } from 'ts-mockito/lib/MethodStubSetter';
import { MethodStubVerificator } from 'ts-mockito/lib/MethodStubVerificator';
import { Mocker } from 'ts-mockito/lib/Mock';
import { AbstractMethodStub } from 'ts-mockito/lib/stub/AbstractMethodStub';
import { MethodStub } from 'ts-mockito/lib/stub/MethodStub';
import { isProxy } from 'util/types';

export class Mock<T> {
    readonly #expressionProvider: T;

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
    }

    public setup<R>(action: (instance: T) => Promise<R>): MethodStubSetter<Promise<R>, R, Error>
    public setup<R>(action: (instance: T) => R): MethodStubSetter<R>
    public setup(action: (instance: T) => unknown): MethodStubSetter<unknown, unknown, unknown> {
        return when(action(this.#expressionProvider));
    }

    public verify<R>(action: (instance: T) => R): MethodStubVerificator<R> {
        return verify(action(this.#expressionProvider));
    }

    public get instance(): T {
        return instance(this.#expressionProvider);
    }
}

function createMockArgumentFilter<T>(assertion: (value: unknown) => value is T): MockArgumentFilter<T> {
    return Object.defineProperty<() => T, 'and', MockArgumentFilter<T>['and']>(function createMockArgument() {
        return new SatisfiesMatcher<T>(assertion) as unknown as T;
    }, 'and', {
        value: function and<R extends T>(next: (value: T) => value is R) {
            return createMockArgumentFilter((value): value is R => assertion(value) && next(value));
        }
    });
}

export const argument = {
    is<T>(assertion: (value: unknown) => value is T): MockArgumentFilter<T> {
        return createMockArgumentFilter(assertion);
    },
    isInstanceof<T>(type: new (...args: never) => T): MockArgumentFilter<T> {
        return this.is((x): x is T => x instanceof type);
    },
    isTypeof<T extends keyof TypeofMap>(type: T): MockArgumentFilter<TypeofMap[T]> {
        return this.is((x): x is TypeofMap[T] => typeof x === type);
    },
    matches<T extends string = string>(pattern: RegExp): MockArgumentFilter<T> {
        return this.is((x): x is T => typeof x === 'string' && pattern.test(x));
    }
};

export interface MockArgumentFilter<T> {
    (): T;
    and<R extends T>(assertion: (value: T) => value is R): MockArgumentFilter<R>;
    and(assertion: (value: T) => boolean): MockArgumentFilter<T>;
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
            throw new Error(`The '${this.name}' method/property hasnt been configured to accept 0 arguments`);
        throw new Error(`The '${this.name}' method hasnt been configured to accept the arguments: ${JSON.stringify(args.map(arg => isProxy(arg) ? '__PROXY' : arg))}`);
    }

    public getValue(): never {
        throw new Error(`The '${this.name}' property hasnt been mocked`);
    }
}

class SatisfiesMatcher<T> extends Matcher {
    public constructor(private readonly test: (value: unknown) => value is T) {
        super();
    }

    public match<T>(value: unknown): value is T {
        return this.test(value);
    }

    public toString(): string {
        return `satisfies(${this.test.toString()})`;
    }
}
