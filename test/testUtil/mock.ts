import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { isProxy } from 'node:util/types';

export interface MockOptions<out T extends Mockable> {
    typeof:
    | (T extends object ? 'object' : never)
    | (T extends Callable ? 'function' : never);
    loose?: boolean;
    id?: string;
}

export type Callable =
    | ((this: never, ...args: never) => unknown)
    | (abstract new (...args: never) => unknown);
export type Mockable = object | Callable;

export interface InterceptOptions {
    /**
     * There are situations where javascript limits what values can be returned from a mock object.
     * This property decides if, when encountering one of these situations, the proxy should throw
     * an error or silently discard the result of the setup.
     *
     * This situation commonly occurs when `Reflect.preventExtensions`, `Reflect.isExtensible` and
     * `Reflect.defineProperty(foo, bar, { configurable: false })` is used.
     * */
    allowUninterceptableInvocations?: boolean;

    /**
     * Identifies this as a fallback setup, only to be used if nothing else has provided a setup.
     */
    isFallback?: boolean;
}

export type Callback<T extends Mockable, Result> = (invocation: Invocation, mock: Mock<T>) => Result;
export type Assertion<T extends Mockable> = (invocations: readonly Invocation[], mock: Mock<T>) => void;
export interface SetupMock<T extends Mockable, Result> {
    invokes(callback: Callback<T, Result>, options?: InterceptOptions): Disposable & SetupMock<T, Result>;
    invokesAsync(callback: Result extends PromiseLike<infer V> ? Callback<T, Awaitable<V>> : never, options?: InterceptOptions): Disposable & SetupMock<T, Result>;
    returns(value: Result, options?: InterceptOptions): Disposable & SetupMock<T, Result>;
    resolves(value: Result extends PromiseLike<infer V> ? Awaitable<V> : never, options?: InterceptOptions): Disposable & SetupMock<T, Result>;
    throws(error: unknown, options?: InterceptOptions): Disposable & SetupMock<T, Result>;
    rejects(error: Result extends PromiseLike<unknown> ? unknown : never, options?: InterceptOptions): Disposable & SetupMock<T, Result>;

    addAssertion(assertion: Assertion<T>): Disposable & SetupMock<T, Result>;
    mustNotHappen(): Disposable & SetupMock<T, Result>;
    mustHappen(): Disposable & SetupMock<T, Result>;
    mustHappen(exactly: number): Disposable & SetupMock<T, Result>;
    mustHappen(minInclusive: number, maxInclusive: number): Disposable & SetupMock<T, Result>;
    mustHappen(options: Iterable<number>): Disposable & SetupMock<T, Result>;
}
export interface VerifyMock<T extends Mockable> {
    satisfies(assertion: Assertion<T>): void;
    mustNotHaveHappened(): void;
    mustHaveHappened(): void;
    mustHaveHappened(exactly: number): void;
    mustHaveHappened(minInclusive: number, maxInclusive: number): void;
    mustHaveHappened(options: Iterable<number>): void;
}

export class MockError extends Error {
    public override readonly name = MockError.name;
    public constructor(...args: ConstructorParameters<typeof Error>) {
        super(...args);
    }
}

const mocks = new WeakMap<Mockable, Mock<Mockable>>();

type MockHelper<T extends Mockable = Mockable> = { [P in keyof InstanceType<typeof Mock<T>>]: InstanceType<typeof Mock<T>>[P] };
export interface Mock<out T extends Mockable = Mockable> extends MockHelper<T> {
    get instance(): T;
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export const Mock = class Mock<T extends Mockable = Mockable> {
    readonly #strict: boolean;
    readonly #id: string | null;
    readonly #shape: T;
    readonly #instance: T;
    readonly #invocations: Invocation[] = [];
    readonly #getProxies: Record<PropertyKey, unknown> = {};
    readonly #getGetProxies: Record<PropertyKey, Record<PropertyKey, unknown>> = {};
    readonly #interceptors = {
        get: new Map<PropertyKey, Array<Interceptor<T, unknown>>>(),
        set: new Map<PropertyKey, Array<Interceptor<T, boolean>>>(),
        call: [] as Array<Interceptor<T, unknown>>,
        new: [] as Array<Interceptor<T, object>>,
        delete: new Map<PropertyKey, Array<Interceptor<T, boolean>>>(),
        has: new Map<PropertyKey, Array<Interceptor<T, boolean>>>(),
        method: new Map<PropertyKey, Array<Interceptor<T, unknown>>>(),
        newNested: new Map<PropertyKey, Array<Interceptor<T, object>>>(),
        getPrototype: [] as Array<Interceptor<T, object | null>>,
        setPrototype: [] as Array<Interceptor<T, boolean>>,
        defineProperty: new Map<PropertyKey, Array<Interceptor<T, boolean>>>(),
        ownKeys: [] as Array<Interceptor<T, ArrayLike<PropertyKey>>>,
        getDescriptor: new Map<PropertyKey, Array<Interceptor<T, PropertyDescriptor>>>(),
        isExtensible: [] as Array<Interceptor<T, boolean>>,
        preventExtensions: [] as Array<Interceptor<T, boolean>>
    } satisfies Record<Expression['kind'], unknown>;
    readonly #verifiers: Array<Verifier<T>> = [];

    public get instance(): T {
        return this.#instance;
    }

    public get invocations(): readonly Invocation[] {
        return [...this.#invocations];
    }

    public get id(): string | null {
        return this.#id;
    }

    public static isMocked<T extends Mockable>(value: T): boolean;
    public static isMocked<T extends Mockable>(value: T, property: PropertyKey): boolean;
    public static isMocked<T extends Mockable>(value: T, property?: keyof T): boolean {
        while (!mocks.has(value)) {
            if (property !== undefined && Reflect.has(value, property))
                return false;
            const proto = Reflect.getPrototypeOf(value) as T | null;
            if (proto === null)
                return false;
            value = proto;
        }
        return true;
    }

    public static fromInstance<T extends Mockable>(instance: T): Mock<T> | undefined {
        while (!mocks.has(instance)) {
            const proto = Reflect.getPrototypeOf(instance) as T | null;
            if (proto === null)
                return undefined;
            instance = proto;
        }
        return mocks.get(instance) as Mock<T>;
    }

    public constructor(options?: MockOptions<T>) {
        switch (options?.typeof) {
            case 'object':
                this.#shape = Object.create(null) as T;
                break;
            case 'function':
            default:
                this.#shape = function () { } as T;
                break;

        }
        this.#strict = options?.loose !== true;
        this.#id = options?.id ?? null;

        function canMutate(target: T, property: PropertyKey): boolean {
            return Reflect.isExtensible(target)
                && canFake(target, property);
        }
        function canFake(target: T, property: PropertyKey): boolean {
            return Reflect.getOwnPropertyDescriptor(target, property)?.configurable !== false;
        }

        this.#instance = makeOpaqueProxy<T>(this.#shape, {
            fallback() {
                throw new MockError('Unsupported call');
            },
            apply: (_, thisArg, argArray) => this.#handleInteraction<unknown>('call', thisArg, '[[Call]]', argArray, true),
            construct: (_, argArray, newTarget) => this.#handleInteraction('new', newTarget, '[[Construct]]', argArray, true),
            defineProperty: (_, p, attributes) => {
                const canIntercept = canMutate(_, p);
                const result = this.#handleInteraction<boolean>('defineProperty', this.#instance, p, [attributes], canIntercept);
                if (!canIntercept)
                    return Reflect.defineProperty(_, p, attributes);
                if (result && attributes.configurable === false)
                    Reflect.defineProperty(_, p, attributes);
                return result;
            },
            deleteProperty: (_, p) => {
                const canIntercept = canMutate(_, p);
                const result = this.#handleInteraction<boolean>('delete', this.#instance, p, [], canIntercept);
                if (!canIntercept)
                    return Reflect.deleteProperty(_, p);
                return result;
            },
            get: (_, p, thisArg) => {
                const canIntercept = canFake(_, p);
                const result = this.#handleInteraction<unknown>('get', thisArg, p, [], canIntercept);
                if (!canIntercept)
                    return Reflect.get(_, p, thisArg);
                return result;
            },
            set: (_, p, value, thisArg) => {
                // To support using the mocked instance as a prototype, we need to
                // skip any set calls which are on derived objects, e.g.
                //
                // const mock = new Mock();
                // const derived = Object.create(mock.instance);
                // derived.someProp = 'On derived';
                //
                // The last line sets the property directly on 'derived', it should
                // not be intercepted by the mock.
                if (thisArg !== this.#instance)
                    return Reflect.set(_, p, value, thisArg);

                const canIntercept = canMutate(_, p);
                const result = this.#handleInteraction<boolean>('set', thisArg, p, [value], canIntercept);
                if (!canIntercept)
                    return Reflect.set(_, p, value, thisArg);
                return result;
            },
            has: (_, p) => {
                const canIntercept = canFake(_, p);
                const result = this.#handleInteraction<boolean>('has', this.#instance, p, [], canIntercept);
                if (!canIntercept)
                    return Reflect.has(_, p);
                return result;
            },
            getOwnPropertyDescriptor: (_, p) => {
                const canIntercept = canMutate(_, p);
                const result = this.#handleInteraction<PropertyDescriptor | undefined>('getDescriptor', this.#instance, p, [], canIntercept);
                if (!canIntercept)
                    return Reflect.getOwnPropertyDescriptor(_, p);
                return result;
            },
            getPrototypeOf: _ => {
                const canIntercept = Reflect.isExtensible(_);
                const result = this.#handleInteraction<Mockable | null>('getPrototype', this.#instance, '[[Prototype]]', [], canIntercept);
                if (!canIntercept)
                    return Reflect.getPrototypeOf(_);
                return result;
            },
            setPrototypeOf: (_, v) => {
                const canIntercept = Reflect.isExtensible(_);
                const result = this.#handleInteraction<boolean>('setPrototype', this.#instance, '[[Prototype]]', [v], canIntercept);
                if (!canIntercept)
                    return Reflect.setPrototypeOf(_, v);
                return result;
            },
            isExtensible: _ => {
                this.#handleInteraction<boolean>('isExtensible', this.#instance, '[[IsExtensible]]', [], false);
                return Reflect.isExtensible(_);
            },
            ownKeys: _ => {
                const canIntercept = Reflect.isExtensible(_);
                const result = this.#handleInteraction<ArrayLike<string | symbol>>('ownKeys', this.#instance, '[[OwnKeys]]', [], canIntercept);
                if (!canIntercept)
                    return Reflect.ownKeys(_);
                return result;
            },
            preventExtensions: _ => {
                this.#handleInteraction<boolean>('preventExtensions', this.#instance, '[[PreventExtensions]]', [], false);
                return Reflect.preventExtensions(_);
            }
        });
        mocks.set(this.#instance, this);
    }

    public toString(): string {
        if (this.#id === null)
            return '$mock';
        return `$mock<${this.#id}>`;
    }

    #hasCallInterceptors(): boolean {
        if (typeof this.#shape !== 'function')
            return false;
        return this.#interceptors.call.length > 0;
    }
    #hasMethodLikeInterceptor(name: PropertyKey): boolean {
        return (this.#interceptors.method.get(name)?.length ?? 0) > 0
            || (this.#interceptors.newNested.get(name)?.length ?? 0) > 0;
    }

    #interceptorsFor(expression: Expression): Array<Interceptor<T, unknown>> {
        switch (expression.kind) {
            case 'call':
            case 'new':
            case 'getPrototype':
            case 'setPrototype':
            case 'ownKeys':
            case 'isExtensible':
            case 'preventExtensions':
                return this.#interceptors[expression.kind];

            default: {
                const map = this.#interceptors[expression.kind];
                let result = map.get(expression.name);
                if (result === undefined)
                    map.set(expression.name, result = []);
                return result;
            }

        }
    }

    #findInterceptor(invocation: Invocation): Interceptor<T, unknown> | undefined {
        let lastMatch;
        const x = this.#interceptors[invocation.kind];
        const interceptors = x instanceof Map
            ? x.get(invocation.name) ?? []
            : x;

        for (const interceptor of interceptors) {
            if (lastMatch !== undefined && interceptor.expression.specificity < lastMatch.expression.specificity)
                break;
            if (isMatch(interceptor.expression, invocation, this.#instance)) {
                if (interceptor.isFallback) {
                    lastMatch ??= interceptor;
                } else {
                    lastMatch = interceptor;
                    if (!interceptor.invoked)
                        return interceptor;
                }
            }
        }
        return lastMatch;
    }

    #createNotConfiguredHandler(invocation: Invocation): undefined | (() => never) {
        if (!this.#strict)
            return undefined;
        return () => {
            this.#invocations.push(invocation);
            throw new MockError(`No setup has been configured for ${debugInvocation(invocation, this)}`);
        };
    }

    #handleInteraction<T>(kind: Invocation['kind'], $this: unknown, name: PropertyKey, args: readonly unknown[], canIntercept: boolean): T {
        const invocation: Invocation = { kind, name, this: $this, arguments: args, canIntercept };
        const interceptor = this.#findInterceptor(invocation);
        if (interceptor !== undefined) {
            this.#invocations.push(invocation);
            interceptor.invoked = true;
            return interceptor.handler(invocation, this) as T;
        }

        if (canIntercept && kind === 'get') {
            const shouldReturnProxy =
                (name === 'call' || name === 'apply')
                && this.#hasCallInterceptors()
                || this.#hasMethodLikeInterceptor(name);
            if (shouldReturnProxy) {
                return (this.#getProxies[name] ??= makeOpaqueProxy(function () { }, {
                    fallback: this.#createNotConfiguredHandler(invocation),
                    apply: (_, thisArg, args) => this.#invokeGetApply(invocation, thisArg, args),
                    construct: (_, argsArray, newTarget) => this.#invokeGetConstruct(invocation, newTarget, argsArray),
                    get: (_, p) => this.#invokeGetGet(invocation, p)
                })) as T;
            }
        }

        // Special case for async interactions. Promise resolution probes every returned value
        // for a `then` property to determine whether it is a thenable. An unconfigured mock
        // must therefore return undefined here rather than throw, otherwise returning a mock
        // from an async function would require explicitly configuring `then` on every mock.
        if (kind === 'get' && name === 'then') {
            this.#invocations.push(invocation);
            return undefined as T;
        }

        this.#createNotConfiguredHandler(invocation)?.();

        this.#invocations.push(invocation);
        switch (kind) {
            case 'call':
            case 'method':
            case 'get':
            case 'getDescriptor':
                return undefined as T;
            case 'new':
            case 'newNested':
            case 'getPrototype':
                return null as T;
            case 'delete':
                return true as T;
            case 'has':
            case 'set':
            case 'setPrototype':
            case 'isExtensible':
            case 'preventExtensions':
            case 'defineProperty':
                return false as T;
            case 'ownKeys':
                return [] as T;
        }
    }

    #invokeCallMethod(kind: 'method' | 'call', name: PropertyKey, args: readonly unknown[]): unknown {
        const [thisArg, ...argsArray] = args;
        const invocation: Invocation = { kind, name, this: thisArg, arguments: Array.from(argsArray), canIntercept: true };
        const interceptor = this.#findInterceptor(invocation);
        if (interceptor !== undefined) {
            this.#invocations.push(invocation);
            interceptor.invoked = true;
            return interceptor.handler(invocation, this);
        }
        return this.#createNotConfiguredHandler(invocation)?.();
    }

    #invokeApplyMethod(kind: 'method' | 'call', name: PropertyKey, args: readonly unknown[]): unknown {
        const [thisArg, argsArray] = args;
        if (!isArrayLike(argsArray))
            throw new MockError('Apply expects the second argument to be array like.');
        const invocation: Invocation = { kind, name, this: thisArg, arguments: Array.from(argsArray), canIntercept: true };
        const interceptor = this.#findInterceptor(invocation);
        if (interceptor !== undefined) {
            this.#invocations.push(invocation);
            interceptor.invoked = true;
            return interceptor.handler(invocation, this);
        }
        return this.#createNotConfiguredHandler(invocation)?.();
    }

    #invokeGetApply(get: Invocation, thisArg: unknown, args: readonly unknown[]): unknown {
        if (typeof this.#shape === 'function') {
            switch (get.name) {
                case 'call':
                    return this.#invokeCallMethod('call', '[[Call]]', args);
                case 'apply':
                    return this.#invokeApplyMethod('call', '[[Call]]', args);
            }
        }
        const invocation: Invocation = { kind: 'method', name: get.name, this: thisArg, arguments: args, canIntercept: true };
        const interceptor = this.#findInterceptor(invocation);
        if (interceptor !== undefined) {
            this.#invocations.push(invocation);
            interceptor.invoked = true;
            return interceptor.handler(invocation, this);
        }

        return this.#createNotConfiguredHandler(invocation)?.();
    }

    #invokeGetConstruct(get: Invocation, newTarget: unknown, args: readonly unknown[]): object {
        const invocation: Invocation = { kind: 'newNested', name: get.name, this: newTarget, arguments: args, canIntercept: true };
        const interceptor = this.#findInterceptor(invocation);
        if (interceptor !== undefined) {
            this.#invocations.push(invocation);
            interceptor.invoked = true;
            return interceptor.handler(invocation, this) as object;
        }

        this.#createNotConfiguredHandler(invocation)?.();
        return Object.create(null) as object;
    }

    #invokeGetGet(get: Invocation, inner: PropertyKey): unknown {
        if (this.#hasMethodLikeInterceptor(get.name)) {
            switch (inner) {
                case 'call': {
                    return (this.#getGetProxies[get.name] ??= {})[inner] ??= makeOpaqueProxy(function () { }, {
                        fallback: this.#createNotConfiguredHandler(get),
                        apply: (_, __, args) => this.#invokeCallMethod('method', get.name, args)
                    });
                }
                case 'apply': {
                    return (this.#getGetProxies[get.name] ??= {})[inner] ??= makeOpaqueProxy(function () { }, {
                        fallback: this.#createNotConfiguredHandler(get),
                        apply: (_, __, args) => this.#invokeApplyMethod('method', get.name, args)
                    });
                }

            }
        }

        return this.#createNotConfiguredHandler(get)?.();
    }

    public reset(): void {
        this.clearSetups();
        this.#invocations.length = 0;
        this.#verifiers.length = 0;
    }

    public clearInvocations(): void {
        this.#invocations.length = 0;
        for (const value of Object.values(this.#interceptors)) {
            const groups = value instanceof Map ? value.values() : [value];
            for (const group of groups) {
                for (const invocation of group) {
                    invocation.invoked = false;
                }
            }
        }
    }

    public clearVerifiers(): void {
        this.#verifiers.length = 0;
    }

    public clearSetups(): void {
        for (const value of Object.values(this.#interceptors)) {
            const groups = value instanceof Map ? value.values() : [value];
            for (const group of groups) {
                group.length = 0;
            }
        }
    }

    public verifyAll(): void {
        const errors = [];
        for (const verifier of this.#verifiers) {
            const invocations = this.#invocations.filter(i => isMatch(verifier.expression, i, this.#instance));
            try {
                verifier.handler(invocations, this);
            } catch (error) {
                errors.push(error);
            }
        }

        if (errors.length > 1)
            throw new AggregateError(errors);
        if (errors.length === 1)
            throw errors[0];
    }

    public verify(action: (instance: T, matcher: ArgumentMatchers<T>) => unknown): VerifyMock<T> {
        const expression = toExpression(action, this.#shape, true);
        return this.#verify(expression);
    }

    #verify(expression: Expression): VerifyMock<T> {
        const result: VerifyMock<T> = {
            satisfies: (assertion) => {
                const invocations = this.#invocations.filter(i => isMatch(expression, i, this.#instance));
                assertion(invocations, this);
            },
            mustNotHaveHappened: () => {
                result.satisfies(mustNotHaveHappened(this, expression));
            },
            mustHaveHappened: (...args: [number | Iterable<number>] | [number, number] | []) => {
                return result.satisfies(mustHaveHappened(this, expression, ...args));
            }
        };
        return result;
    }

    public setup<Result>(action: (instance: T, matchers: ArgumentMatchers<T>) => Result): SetupMock<T, Result> {
        const expression = toExpression(action, this.#shape, false);
        return this.#setup(expression);
    }

    public setupSet<Result>(action: (instance: T, matchers: ArgumentMatchers<T>) => Result): SetupMock<T, boolean> {
        const expression = toExpression(action, this.#shape, true);
        if (expression.kind !== 'set')
            throw new Error('Only expressions of the form `x => x.something = value` are supported with setupSet');
        return this.#setup(expression);
    }

    public setupProperty<Property extends keyof T>(property: Property, initialValue: T[Property]): Disposable {
        let value = initialValue;
        const getHandle = this.setup(m => m[property]).invokes(() => value);
        const setHandle = this.setupSet((m, $) => m[property] = $.anything).invokes(i => {
            value = i.arguments[0] as T[Property];
            return true;
        });
        return {
            [Symbol.dispose]() {
                using _0 = getHandle;
                using _1 = setHandle;
            }
        };
    }

    #setup<Result>(expression: Expression): SetupMock<T, Result> {
        const result: SetupMock<T, Result> = {
            invokes: (handler, options) => {
                switch (expression.kind) {
                    case 'method': {
                        const nameStr = keyToProp(expression.name);
                        if ((this.#interceptors.get.get(expression.name)?.length ?? 0) > 0)
                            throw new MockError(`Cannot setup x${nameStr}(...) because x${nameStr} is already configured.`);
                        break;
                    }
                    case 'newNested': {
                        const nameStr = keyToProp(expression.name);
                        if ((this.#interceptors.get.get(expression.name)?.length ?? 0) > 0)
                            throw new MockError(`Cannot setup new x${nameStr}(...) because x${nameStr} is already configured.`);
                        break;
                    }
                    case 'get': {
                        const nameStr = keyToProp(expression.name);
                        if ((this.#interceptors.method.get(expression.name)?.length ?? 0) > 0)
                            throw new MockError(`Cannot setup x${nameStr} because x${nameStr}(...) is already configured.`);
                        if ((this.#interceptors.newNested.get(expression.name)?.length ?? 0) > 0)
                            throw new MockError(`Cannot setup x${nameStr} because new x${nameStr}(...) is already configured.`);
                        break;
                    }
                }

                if (options?.allowUninterceptableInvocations !== true) {
                    handler = (h => (i, m) => {
                        if (!i.canIntercept)
                            throw new MockError(`Cannot mock the result of ${debugInvocation(i, m)} because this JavaScript operation is not interceptable in the object's current state.`);
                        return h(i, m);
                    })(handler);
                }

                const interceptor: Interceptor<T, ReturnType<typeof handler>> = {
                    expression,
                    handler,
                    invoked: false,
                    isFallback: options?.isFallback ?? false
                };
                const interceptors = this.#interceptorsFor(expression);
                const specificity = expression.specificity;
                let low = 0;
                let high = interceptors.length;

                while (low < high) {
                    const mid = low + Math.floor((high - low) / 2);
                    if (interceptors[mid].expression.specificity >= specificity)
                        low = mid + 1;
                    else
                        high = mid;
                }

                interceptors.splice(low, 0, interceptor);
                return Object.create(result, {
                    [Symbol.dispose]: {
                        value: () => {
                            const i = interceptors.indexOf(interceptor);
                            if (i !== -1)
                                interceptors.splice(i, 1);
                        }
                    }
                });
            },

            invokesAsync: (value, options) => result.invokes((i, m) => Promise.try(value, i, m) as Result, options),
            returns: (value, options) => result.invokes(() => value, options),
            resolves: (value, options) => result.invokes(() => Promise.resolve(value) as Result, options),
            throws: (error, options) => result.invokes(() => { throw error; }, options),
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            rejects: (error, options) => result.invokes(() => Promise.reject(error) as Result, options),

            addAssertion: (handler) => {
                const verifier = { expression, handler };
                this.#verifiers.push(verifier);
                return Object.create(result, {
                    [Symbol.dispose]: {
                        value: () => {
                            const i = this.#verifiers.indexOf(verifier);
                            if (i !== -1)
                                this.#verifiers.splice(i, 1);
                        }
                    }
                });
            },
            mustNotHappen: () => {
                return result.addAssertion(mustNotHaveHappened(this, expression));
            },
            mustHappen: (...args: [number | Iterable<number>] | [number, number] | []) => {
                return result.addAssertion(mustHaveHappened(this, expression, ...args));
            }
        };
        return result;
    }
};

function mustNotHaveHappened<T extends Mockable>(mock: Mock<T>, expression: Expression): Assertion<T> {
    return i => {
        if (i.length !== 0) {
            assert.fail(`Expected ${debugMatchers(expression, mock)} to not be called but it has been ${i.length} time(s).`);
        }
    };
}

function mustHaveHappened<T extends Mockable>(mock: Mock<T>, expression: Expression, ...args: [number | Iterable<number>] | [number, number] | []): Assertion<T> {
    if (args.length === 0) {
        return i => {
            if (i.length === 0) {
                assert.fail(`Expected ${debugMatchers(expression, mock)} to have been called but it has not.`);
            }
        };
    }
    if (args.length === 2) {
        const [min, max] = args;
        return i => {
            if (min > i.length || i.length > max) {
                assert.fail(`Expected ${debugMatchers(expression, mock)} to have been called between ${min} and ${max} time(s) (inclusive), but found ${i.length}.`);
            }
        };
    }
    const v0 = args[0];
    if (typeof v0 === 'number') {
        return i => {
            if (i.length !== v0) {
                assert.fail(`Expected ${debugMatchers(expression, mock)} to have been called ${v0} time(s), but found ${i.length}.`);
            }
        };
    }
    const options = [...v0];
    return i => {
        if (!options.includes(i.length)) {
            assert.fail(`Expected ${debugMatchers(expression, mock)} to have been called one of [${options.join(',')}] time(s), but found ${i.length}.`);
        }
    };
}

interface Interceptor<T extends Mockable, Result> {
    readonly expression: Expression;
    readonly handler: Callback<T, Result>;
    readonly isFallback: boolean;
    invoked: boolean;
}
interface Verifier<T extends Mockable> {
    readonly expression: Expression;
    readonly handler: Assertion<T>;
}

abstract class ArgumentMatcher {
    public abstract specificity: number;

    public static oneOf(...matchers: ArgumentMatcher[]): ArgumentMatcher {
        return new OneOfArgumentMatcher(...matchers);
    }

    public static from(value: unknown, thisArg?: unknown): ArgumentMatcher {
        value = PublicArgumentMatcher.reveal(value);
        if (!isProxy(value) && value instanceof ArgumentMatcher)
            return value;
        if (arguments.length > 1 && value === thisArg)
            return thisArgumentMatcher;
        switch (typeof value) {
            case 'string':
            case 'number':
            case 'bigint':
            case 'function':
            case 'boolean':
            case 'symbol':
                return new StrictArgumentMatcher(value);
            case 'undefined':
                return StrictArgumentMatcher.undefined;
            default:
                if (value === null)
                    return StrictArgumentMatcher.null;
                if (Object.getPrototypeOf(value) !== Object.prototype)
                    return new StrictArgumentMatcher(value);
                return new StrictArgumentMatcher(value);
        }
    }

    public abstract check(value: unknown, thisArg: unknown): boolean;
    public abstract toString(): string;
    public abstract equals(other: ArgumentMatcher): boolean;
}

const thisArgumentMatcher = new class ThisArgumentMatcher extends ArgumentMatcher {
    public override specificity = 100_000_000;

    public override check(value: unknown, thisArg: unknown): boolean {
        if (value === thisArg)
            return true;
        if (typeof value === 'function' || typeof value === 'object' && value !== null)
            return Object.prototype.isPrototypeOf.call(thisArg, value);
        return false;
    }
    public override toString(): string {
        return 'this';
    }
    public override equals(other: ArgumentMatcher): boolean {
        return this === other;
    }
};
class StrictArgumentMatcher extends ArgumentMatcher {
    readonly #expected: unknown;
    public static readonly undefined = new StrictArgumentMatcher(undefined);
    public static readonly null = new StrictArgumentMatcher(null);

    public static readonly specificity = 100_000_000_000_000;
    public override specificity = StrictArgumentMatcher.specificity;

    public constructor(expected: unknown) {
        super();
        this.#expected = expected;
    }
    public override check(value: unknown): boolean {
        return value === this.#expected;
    }
    public override toString(): string {
        return argToString(this.#expected);
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof StrictArgumentMatcher && other.#expected === this.#expected;
    }
}
class GuardedArgumentMatcher<T> extends ArgumentMatcher {
    readonly #guard: (value: T) => boolean;

    public override specificity = 100_000;

    public constructor(guard: (value: T) => boolean) {
        super();
        this.#guard = guard;
    }
    public override check(value: unknown): boolean {
        return this.#guard(value as T);
    }
    public override toString(): string {
        return `matches(${this.#guard.name})`;
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof GuardedArgumentMatcher && other.#guard === this.#guard;
    }
}
class InstanceOfArgumentMatcher extends ArgumentMatcher {
    readonly #ctor: abstract new (...args: never) => unknown;
    public override specificity = 10_000;

    public constructor(ctor: abstract new (...args: never) => unknown) {
        super();
        this.#ctor = ctor;
    }
    public override check(value: unknown): boolean {
        return value instanceof this.#ctor;
    }
    public override toString(): string {
        return `instanceOf(${this.#ctor.name})`;
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof InstanceOfArgumentMatcher && other.#ctor === this.#ctor;
    }
}
class AssertingArgumentMatcher<T> extends ArgumentMatcher {
    readonly #assertion: (value: T) => void;
    public override specificity = 100_000;

    public constructor(assertion: (value: T) => void) {
        super();
        this.#assertion = assertion;
    }
    public override check(value: unknown): boolean {
        try {
            this.#assertion(value as T);
            return true;
        } catch {
            return false;
        }
    }
    public override toString(): string {
        return `asserts(${this.#assertion.name})`;
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof AssertingArgumentMatcher && other.#assertion === this.#assertion;
    }
}
class LooksLikeArgumentMatcher extends ArgumentMatcher {
    readonly #skeleton: unknown;
    public override specificity: number;
    public constructor(skeleton: unknown) {
        super();
        this.#skeleton = skeleton;
        this.specificity = LooksLikeArgumentMatcher.#calcSpecificity(skeleton);
    }
    public override check(value: unknown, thisArg: unknown): boolean {
        return LooksLikeArgumentMatcher.#check(value, this.#skeleton, thisArg);
    }
    static #calcSpecificity(value: unknown): number {
        value = PublicArgumentMatcher.reveal(value);
        if (value instanceof ArgumentMatcher)
            return value.specificity;

        switch (typeof value) {
            case 'string':
            case 'bigint':
            case 'boolean':
            case 'number':
            case 'symbol':
            case 'undefined':
            case 'function':
                return StrictArgumentMatcher.specificity;
            case 'object': {
                if (value === null)
                    return StrictArgumentMatcher.specificity;
                if (value instanceof Array)
                    return value.reduce((p: number, c: unknown) => p + this.#calcSpecificity(c), 0);
                if (Reflect.getPrototypeOf(value) === Object.prototype)
                    return (Reflect.ownKeys(value) as Array<keyof typeof value>).reduce((p, c) => p + this.#calcSpecificity(value[c]), 0);
                if ('valueOf' in value && typeof value.valueOf === 'function')
                    return StrictArgumentMatcher.specificity / 2;
                return StrictArgumentMatcher.specificity;
            }
        }
    }
    static #check(value: unknown, skeleton: unknown, thisArg: unknown): boolean {
        skeleton = PublicArgumentMatcher.reveal(skeleton);
        if (skeleton instanceof ArgumentMatcher)
            return skeleton.check(value, thisArg);

        if (typeof value !== typeof skeleton)
            return false;

        switch (typeof value) {
            case 'string':
            case 'bigint':
            case 'boolean':
            case 'number':
            case 'symbol':
            case 'undefined':
            case 'function':
                return value === skeleton;
            case 'object': {
                const $skeleton = skeleton as typeof value;
                if (value === $skeleton)
                    return true;
                if (value === null || $skeleton === null)
                    return false;
                if ($skeleton instanceof Array && value instanceof Array)
                    return value.length === $skeleton.length && $skeleton.every((v, i) => this.#check(value[i], v, thisArg));
                if (Reflect.getPrototypeOf($skeleton) === Object.prototype)
                    return (Reflect.ownKeys($skeleton) as Array<keyof typeof $skeleton>)
                        .every(k => this.#check(value[k], $skeleton[k], thisArg));
                if ('valueOf' in $skeleton && typeof $skeleton.valueOf === 'function' && 'valueOf' in value && typeof value.valueOf === 'function')
                    return $skeleton.valueOf() === value.valueOf();
                return false;
            }
        }
    }

    public override toString(): string {
        return `looksLike(${argToString(this.#skeleton)})`;
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof LooksLikeArgumentMatcher
            && this.check(other.#skeleton, Symbol())
            && other.check(this.#skeleton, Symbol());
    }
}
class OneOfArgumentMatcher extends ArgumentMatcher {
    readonly #options: ArgumentMatcher[];
    public override get specificity(): number {
        return this.#options.map(x => x.specificity).reduce((p, c) => p + c);
    }

    public constructor(...options: ArgumentMatcher[]) {
        super();
        this.#options = options;
    }
    public override check(value: unknown, thisArg: unknown): boolean {
        return this.#options.some(opt => opt.check(value, thisArg));
    }
    public override toString(): string {
        return `OneOf(${this.#options.map(opt => opt.toString()).join(' | ')})`;
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof OneOfArgumentMatcher
            && this.#options.length === other.#options.length
            && this.#options.every((opt, i) => opt.equals(other.#options[i]));
    }
}
const anyArgumentMatcher = new class AnyArgumentMatcher extends ArgumentMatcher {
    public override specificity = 0;
    public override check(): boolean {
        return true;
    }
    public override toString(): string {
        return 'anything';
    }
    public override equals(other: ArgumentMatcher): boolean {
        return this === other;
    }
};
const positiveArgumentMatcher = new class PositiveArgumentMatcher extends ArgumentMatcher {
    public override specificity = 100;
    public override check(value: unknown): boolean {
        return typeof value === 'number' && value > 0;
    }
    public override toString(): string {
        return '(any positive number)';
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof PositiveArgumentMatcher;
    }
};
const negativeArgumentMatcher = new class NegativeArgumentMatcher extends ArgumentMatcher {
    public override specificity = 100;
    public override check(value: unknown): boolean {
        return typeof value === 'number' && value < 0;
    }
    public override toString(): string {
        return '(any negative number)';
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof NegativeArgumentMatcher;
    }
};
const integerArgumentMatcher = new class IntegerArgumentMatcher extends ArgumentMatcher {
    public override specificity = 10;
    public override check(value: unknown): boolean {
        return typeof value === 'number' && value % 1 === 0;
    }
    public override toString(): string {
        return '(any integer)';
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof IntegerArgumentMatcher;
    }
};
const numberArgumentMatcher = new class NumberArgumentMatcher extends ArgumentMatcher {
    public override specificity = 1;
    public override check(value: unknown): boolean {
        return typeof value === 'number';
    }
    public override toString(): string {
        return '(any number)';
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof NumberArgumentMatcher;
    }
};
const booleanArgumentMatcher = new class BooleanArgumentMatcher extends ArgumentMatcher {
    public override specificity = 1;
    public override check(value: unknown): boolean {
        return typeof value === 'boolean';
    }
    public override toString(): string {
        return '(true | false)';
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof BooleanArgumentMatcher;
    }
};
const bigintArgumentMatcher = new class BigIntArgumentMatcher extends ArgumentMatcher {
    public override specificity = 1;
    public override check(value: unknown): boolean {
        return typeof value === 'bigint';
    }
    public override toString(): string {
        return '(any bigint)';
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof BigIntArgumentMatcher;
    }
};
const symbolArgumentMatcher = new class SymbolArgumentMatcher extends ArgumentMatcher {
    public override specificity = 1;
    public override check(value: unknown): boolean {
        return typeof value === 'symbol';
    }
    public override toString(): string {
        return '(any symbol)';
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof SymbolArgumentMatcher;
    }
};
const stringArgumentMatcher = new class StringArgumentMatcher extends ArgumentMatcher {
    public override specificity = 1;
    public override check(value: unknown): boolean {
        return typeof value === 'string';
    }
    public override toString(): string {
        return '(any string)';
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof StringArgumentMatcher;
    }
};
const deepMemberError = (): never => {
    throw new MockError('Cannot mock deep members.');
};

export interface ArgumentMatchers<out T = never> {
    <R>(skeleton: R): R;
    readonly anything: never;
    readonly unknown: unknown;
    readonly undefined: undefined;
    readonly null: null;
    readonly this: T;
    readonly number: number;
    readonly integer: number;
    readonly positive: number;
    readonly negative: number;
    readonly string: string;
    readonly symbol: symbol;
    readonly boolean: boolean;
    readonly bigint: bigint;
    readonly strict: <R>(value: R) => R;
    readonly satisfies: <R>(guard: (value: R) => boolean) => R;
    readonly asserts: <R>(guard: (value: R) => void) => R;
    readonly oneOf: <R extends unknown[]>(...values: R) => R[number];
    readonly instanceOf: <R>(ctor: abstract new (...args: never) => R) => R;
    readonly looksLike: <R>(skeleton: R) => R;
}

function toExpression<T extends Mockable>(
    action: (value: T, matchers: ArgumentMatchers<T>) => unknown,
    shape: T,
    allowDirectSet: boolean
): Expression {
    let expression: Expression | undefined;
    let checkResult: (value: unknown) => boolean = () => {
        throw new MockError('No mockable calls were made.');
    };

    const ensureEmpty = (): void => {
        if (expression !== undefined)
            throw new MockError('Cannot mock multiple expressions in one go.');
    };

    const target = typeof shape === 'function'
        ? function () { } as T
        : Object.create(null) as T;
    Reflect.setPrototypeOf(target, shape);

    const deadEnd = makeOpaqueProxy(() => { }, { fallback: deepMemberError });
    const ownKeysResult = [...Reflect.ownKeys(target), `\0mock-ownKeys-${randomUUID()}`];

    const getResult = makeOpaqueProxy(function () { }, {
        fallback: deepMemberError,
        // OK: $mock => $mock.foo(...)              = method
        // OK: $mock => $mock.call(thisArg, ...)    = call if $mock is a function, method otherwise
        // OK: $mock => $mock.apply(thisArg, [...]) = call if $mock is a function, method otherwise
        apply(_, __, args) {
            if (expression?.kind !== 'get')
                return deepMemberError();
            if (typeof target === 'function') {
                if (expression.name === 'call') {
                    // mocking x => x.call(thisArg, arg1, arg2, arg3, ...)
                    const [thisArg, ...argArray] = args as unknown[];
                    expression = {
                        kind: 'call',
                        thisArg: ArgumentMatcher.from(thisArg, proxy),
                        parameters: argArray.map(x => ArgumentMatcher.from(x, proxy)),
                        specificity: 0
                    };
                    setCallSpecificity(expression);
                    checkResult = v => v === deadEnd;
                    return deadEnd;
                }
                if (expression.name === 'apply') {
                    // mocking x => x.apply(thisArg, [arg1, arg2, arg3, ...])
                    const [thisArg, argArray] = args as unknown[];
                    if (!isArrayLike(argArray))
                        throw new MockError('Apply expects an argument array');
                    expression = {
                        kind: 'call',
                        thisArg: ArgumentMatcher.from(thisArg, proxy),
                        parameters: Array.from(argArray, x => ArgumentMatcher.from(x, proxy)),
                        specificity: 0
                    };
                    setCallSpecificity(expression);
                    checkResult = v => v === deadEnd;
                    return deadEnd;
                }
            }

            // mocking one of:
            // $mock => $mock.foo(...)
            // $mock => $mock.call(...) when $mock is not a function
            // $mock => $mock.apply(...) when $mock is not a function
            // We dont care about the thisArg here, you should mock via .call or .apply if you do care
            expression = {
                kind: 'method',
                name: expression.name,
                thisArg: anyArgumentMatcher,
                parameters: args.map(x => ArgumentMatcher.from(x, proxy)),
                specificity: 0
            };
            setCallSpecificity(expression);
            checkResult = v => v === deadEnd;
            return deadEnd;
        },

        // OK:  $mock => new $mock.foo(...)              = newNested
        construct(_, args, newTarget) {
            if (expression?.kind !== 'get')
                return deepMemberError();

            expression = {
                kind: 'newNested',
                name: expression.name,
                newTarget: ArgumentMatcher.from(newTarget, proxy),
                parameters: args.map(x => ArgumentMatcher.from(x, proxy)),
                specificity: 0
            };
            setNewSpecificity(expression);
            checkResult = v => v === deadEnd;
            return deadEnd;
        },

        // BAD: $mock => $mock.foo.bar
        // BAD: $mock => $mock.foo.call
        // BAD: $mock => $mock.foo.apply
        // OK:  $mock => $mock.foo.call(thisArg, ...)    = method
        // OK:  $mock => $mock.foo.apply(thisArg, [...]) = method
        get(_, p) {
            if (expression?.kind !== 'get')
                return deepMemberError();

            const methodName = expression.name;
            switch (p) {
                case 'call': {
                    checkResult = () => {
                        throw new MockError(`Cannot mock 'm => m${keyToProp(methodName)}.call' directly. To mock method calls with a strongly checked this arg you must mock either 'm => m${keyToProp(methodName)}.call(thisArg, ...)' or 'm => m${keyToProp(methodName)}.apply(thisArg, [...])'`);
                    };
                    return getMethodCall;
                }
                case 'apply': {
                    checkResult = () => {
                        throw new MockError(`Cannot mock 'm => m${keyToProp(methodName)}.apply' directly. To mock method calls with a strongly checked this arg you must mock either 'm => m${keyToProp(methodName)}.call(thisArg, ...)' or 'm => m${keyToProp(methodName)}.apply(thisArg, [...])'`);
                    };
                    return getMethodApply;
                }
                default:
                    return deepMemberError();
            }
        }
    });
    const getMethodCall = makeOpaqueProxy(function () { }, {
        fallback: deepMemberError,
        apply(_, __, args) {
            if (expression?.kind !== 'get')
                return deepMemberError();
            // mocking x => x.method.call(thisArg, arg1, arg2, arg3, ...)
            const [thisArg, ...argArray] = args as unknown[];
            expression = {
                kind: 'method',
                name: expression.name,
                thisArg: ArgumentMatcher.from(thisArg, proxy),
                parameters: argArray.map(x => ArgumentMatcher.from(x, proxy)),
                specificity: 0
            };
            setCallSpecificity(expression);
            checkResult = v => v === deadEnd;
            return deadEnd;
        }
    });
    const getMethodApply = makeOpaqueProxy(function () { }, {
        fallback: deepMemberError,
        apply(_, __, args) {
            if (expression?.kind !== 'get')
                return deepMemberError();
            // mocking x => x.method.apply(thisArg, [arg1, arg2, arg3, ...])
            const [thisArg, argArray] = args as unknown[];
            if (!isArrayLike(argArray))
                throw new MockError('Apply expects an argument array');
            expression = {
                kind: 'method',
                name: expression.name,
                thisArg: ArgumentMatcher.from(thisArg, proxy),
                parameters: Array.from(argArray, x => ArgumentMatcher.from(x, proxy)),
                specificity: 0
            };
            setCallSpecificity(expression);
            checkResult = v => v === deadEnd;
            return deadEnd;
        }
    });

    const proxy = new Proxy<T>(target, {
        apply(_, __, argArray) {
            ensureEmpty();
            expression = {
                kind: 'call',
                thisArg: anyArgumentMatcher,
                parameters: argArray.map(x => ArgumentMatcher.from(x, proxy)),
                specificity: 0
            };
            setCallSpecificity(expression);
            checkResult = v => v === deadEnd;
            return deadEnd;
        },
        construct(_, argArray, newTarget) {
            ensureEmpty();
            expression = {
                kind: 'new',
                newTarget: ArgumentMatcher.from(newTarget, proxy),
                parameters: argArray.map(x => ArgumentMatcher.from(x, proxy)),
                specificity: 0
            };
            setNewSpecificity(expression);
            checkResult = v => v === deadEnd;
            return deadEnd;
        },
        get(_, name) {
            ensureEmpty();
            expression = { kind: 'get', name, specificity: 0 };
            checkResult = v => v === getResult;
            return getResult;
        },
        set(_, name, value) {
            ensureEmpty();
            const matcher = ArgumentMatcher.from(value, proxy);
            expression = { kind: 'set', name, value: matcher, specificity: matcher.specificity };
            checkResult = v => {
                if (v === true)
                    return true;
                if (v === value) {
                    if (allowDirectSet)
                        return true;
                    throw new MockError('Cannot setup set methods using .setup(x => x.someProp = someValue). Either use .setup(x => Reflect.set(x, \'someProp\', someValue)) or .setupSet(\'someProp\', someValue)');
                }
                return false;
            };
            return true;
        },
        deleteProperty(_, name) {
            ensureEmpty();
            expression = { kind: 'delete', name, specificity: 0 };
            checkResult = v => v === true;
            return true;
        },
        has(_, name) {
            ensureEmpty();
            expression = { kind: 'has', name, specificity: 0 };
            checkResult = v => v === true;
            return true;
        },
        getPrototypeOf() {
            ensureEmpty();
            expression = { kind: 'getPrototype', specificity: 0 };
            checkResult = v => v === deadEnd;
            return deadEnd;
        },
        setPrototypeOf(_, value) {
            ensureEmpty();
            const matcher = ArgumentMatcher.from(value, proxy);
            expression = { kind: 'setPrototype', value: matcher, specificity: matcher.specificity };
            checkResult = v => {
                if (v === true)
                    return true;
                if (v === proxy)
                    throw new MockError('Cannot setup using Object.setPrototypeOf. Use Reflect.setPrototypeOf instead.');
                return false;
            };
            return true;
        },
        defineProperty(_, name, descriptor) {
            ensureEmpty();
            expression = {
                kind: 'defineProperty',
                name,
                configurable: descriptor.configurable,
                enumerable: descriptor.enumerable,
                writable: descriptor.writable,
                specificity: 0
            };
            for (const key of ['value', 'get', 'set'] as const) {
                if (key in descriptor) {
                    // eslint-disable-next-line @typescript-eslint/unbound-method
                    expression[key] = ArgumentMatcher.from(descriptor[key], proxy);
                    expression.specificity += expression[key].specificity;
                    // Replace the descriptor value incase this is the `get` or `set` properties.
                    descriptor[key] = () => { };
                }
            }
            const actual = Reflect.defineProperty(target, name, descriptor);
            checkResult = v => {
                if (v === actual)
                    return true;
                if (v === proxy)
                    throw new MockError('Cannot setup using Object.defineProperty or Object.defineProperties. Use Reflect.defineProperty instead.');
                return false;
            };
            return actual;
        },
        ownKeys() {
            ensureEmpty();
            expression = { kind: 'ownKeys', specificity: 0 };
            checkResult = v => Array.isArray(v) && ownKeysResult.length === v.length && ownKeysResult.every((x, i) => v[i] === x);
            return ownKeysResult;
        },
        getOwnPropertyDescriptor(_, name) {
            if (expression?.kind === 'ownKeys' && ownKeysResult.includes(name))
                throw new MockError('Cannot mock Object.keys, use Reflect.ownKeys instead.');

            ensureEmpty();
            expression = { kind: 'getDescriptor', name, specificity: 0 };
            checkResult = v => typeof v === 'object'
                && v !== null
                && v !== deadEnd
                && v !== getResult
                && v !== getMethodApply
                && v !== getMethodCall
                && v !== proxy
                && 'configurable' in v
                && 'enumerable' in v
                && 'value' in v
                && v.configurable === true
                && v.enumerable === false
                && v.value === deadEnd;
            return {
                configurable: true,
                enumerable: false,
                value: deadEnd
            };
        },
        isExtensible() {
            ensureEmpty();
            expression = { kind: 'isExtensible', specificity: 0 };
            checkResult = v => v === true;
            return true;
        },
        preventExtensions() {
            ensureEmpty();
            expression = { kind: 'preventExtensions', specificity: 0 };
            const actual = Reflect.preventExtensions(target);
            checkResult = v => {
                if (v === actual)
                    return true;
                if (v === proxy)
                    throw new MockError('Cannot setup using Object.preventExtensions. Use Reflect.preventExtensions instead.');
                return false;
            };
            return actual;
        }
    });

    const response = action(proxy, publicArgumentMatchers);

    if (expression === undefined || !checkResult(response))
        throw new MockError('Expression is not mockable');

    return expression;
}

class PublicArgumentMatcher extends class Stamper {
    protected constructor(thisArg: Mockable) {
        return thisArg;
    }
} {
    readonly #impl: ArgumentMatcher;

    public static disguise<T>(impl: ArgumentMatcher): T {
        const result = makeOpaqueProxy({}, {
            fallback() {
                throw new MockError('Cannot interact with an argument matcher. They are opaque sentinel values and should only be used inside mock setups.');
            }
        });
        new PublicArgumentMatcher(result, impl);
        return result as T;
    }

    private constructor(target: Mockable, impl: ArgumentMatcher) {
        super(target);
        this.#impl = impl;
    }

    public static reveal<T>(target: T): ArgumentMatcher | T {
        if (typeof target === 'object' && target !== null && #impl in target)
            return target.#impl;
        return target;
    }
}

function looksLike<T>(value: T): T {
    return PublicArgumentMatcher.disguise(new LooksLikeArgumentMatcher(value));
}
const publicArgumentMatchers: ArgumentMatchers<never> = Object.freeze(Object.assign(
    looksLike,
    {
        anything: PublicArgumentMatcher.disguise<never>(anyArgumentMatcher),
        unknown: PublicArgumentMatcher.disguise<unknown>(anyArgumentMatcher),
        undefined: PublicArgumentMatcher.disguise<undefined>(StrictArgumentMatcher.undefined),
        null: PublicArgumentMatcher.disguise<null>(StrictArgumentMatcher.null),
        this: PublicArgumentMatcher.disguise<never>(thisArgumentMatcher),
        number: PublicArgumentMatcher.disguise<number>(numberArgumentMatcher),
        integer: PublicArgumentMatcher.disguise<number>(integerArgumentMatcher),
        positive: PublicArgumentMatcher.disguise<number>(positiveArgumentMatcher),
        negative: PublicArgumentMatcher.disguise<number>(negativeArgumentMatcher),
        string: PublicArgumentMatcher.disguise<string>(stringArgumentMatcher),
        symbol: PublicArgumentMatcher.disguise<symbol>(symbolArgumentMatcher),
        boolean: PublicArgumentMatcher.disguise<boolean>(booleanArgumentMatcher),
        bigint: PublicArgumentMatcher.disguise<bigint>(bigintArgumentMatcher),
        strict: v => PublicArgumentMatcher.disguise(new StrictArgumentMatcher(v)),
        satisfies: v => PublicArgumentMatcher.disguise(new GuardedArgumentMatcher(v)),
        asserts: v => PublicArgumentMatcher.disguise(new AssertingArgumentMatcher(v)),
        oneOf: (...v) => PublicArgumentMatcher.disguise(new OneOfArgumentMatcher(...v.map(v => ArgumentMatcher.from(v)))),
        instanceOf: v => PublicArgumentMatcher.disguise(new InstanceOfArgumentMatcher(v)),
        looksLike
    } satisfies { [P in keyof ArgumentMatchers<never>]: ArgumentMatchers<never>[P]; }
));

type Expression =
    | { specificity: number; kind: 'call'; thisArg: ArgumentMatcher; parameters: readonly ArgumentMatcher[]; }
    | { specificity: number; kind: 'new'; newTarget: ArgumentMatcher; parameters: readonly ArgumentMatcher[]; }
    | { specificity: number; kind: 'get'; name: PropertyKey; }
    | { specificity: number; kind: 'set'; name: PropertyKey; value: ArgumentMatcher; }
    | { specificity: number; kind: 'delete'; name: PropertyKey; }
    | { specificity: number; kind: 'has'; name: PropertyKey; }
    | { specificity: number; kind: 'method'; name: PropertyKey; thisArg: ArgumentMatcher; parameters: readonly ArgumentMatcher[]; }
    | { specificity: number; kind: 'newNested'; name: PropertyKey; newTarget: ArgumentMatcher; parameters: readonly ArgumentMatcher[]; }
    | { specificity: number; kind: 'getPrototype'; }
    | { specificity: number; kind: 'setPrototype'; value: ArgumentMatcher; }
    | { specificity: number; kind: 'defineProperty'; name: PropertyKey; value?: ArgumentMatcher; get?: ArgumentMatcher; set?: ArgumentMatcher; } & Omit<PropertyDescriptor, 'value' | 'get' | 'set'>
    | { specificity: number; kind: 'ownKeys'; }
    | { specificity: number; kind: 'getDescriptor'; name: PropertyKey; }
    | { specificity: number; kind: 'isExtensible'; }
    | { specificity: number; kind: 'preventExtensions'; };

interface Invocation {
    readonly kind: Expression['kind'];
    readonly this: unknown;
    readonly arguments: readonly unknown[];
    readonly name: PropertyKey;
    readonly canIntercept: boolean;
}

function isArrayLike(value: unknown): value is ArrayLike<unknown> {
    return typeof value === 'object'
        && value !== null
        && 'length' in value
        && typeof value.length === 'number';
}

function keyToProp(key: PropertyKey): string {
    if (typeof key === 'symbol')
        return `[${String(key)}]`;
    if (typeof key === 'number')
        return `[${key}]`;
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key))
        return `.${key}`;
    return `[${JSON.stringify(key)}]`;
}

function keyToSource(key: PropertyKey): string {
    if (typeof key === 'symbol')
        return String(key);
    if (typeof key === 'number')
        return `${key}`;
    return JSON.stringify(key);
}

function debugMatchers(expr: Expression, mock: Mock): string {
    switch (expr.kind) {
        case 'call': {
            if (expr.thisArg === thisArgumentMatcher || expr.thisArg === anyArgumentMatcher)
                return `${mock.toString()}(${expr.parameters.map(p => p.toString()).join(',')})`;
            return `${mock.toString()}.apply(${expr.thisArg.toString()}, [${expr.parameters.map(p => p.toString()).join(',')}])`;
        }
        case 'new': {
            if (expr.newTarget === thisArgumentMatcher)
                return `new ${mock.toString()}(${expr.parameters.map(p => p.toString()).join(',')})`;
            return `new (class Derived extends ${mock.toString()} {...})(${expr.newTarget.toString()}, [${expr.parameters.map(p => p.toString()).join(',')}])`;
        }
        case 'method': {
            if (expr.thisArg === thisArgumentMatcher || expr.thisArg === anyArgumentMatcher)
                return `${mock.toString()}${keyToProp(expr.name)}(${expr.parameters.map(p => p.toString()).join(',')})`;
            return `${mock.toString()}${keyToProp(expr.name)}.apply(${expr.thisArg.toString()}, [${expr.parameters.map(p => p.toString()).join(',')}])`;
        }
        case 'newNested': {
            if (expr.newTarget === thisArgumentMatcher)
                return `new ${mock.toString()}${keyToProp(expr.name)}(${expr.parameters.map(p => p.toString()).join(',')})`;
            return `new (class Derived extends ${mock.toString()}${keyToProp(expr.name)} {...})(${expr.newTarget.toString()}, [${expr.parameters.map(p => p.toString()).join(',')}])`;
        }
        case 'get': {
            return `$mock${keyToProp(expr.name)}`;
        }
        case 'set': {
            return `$mock${keyToProp(expr.name)} = ${expr.value.toString()}`;
        }
        case 'delete': {
            return `delete $mock${keyToProp(expr.name)}`;
        }
        case 'has': {
            return `Reflect.has($mock, ${keyToSource(expr.name)})`;
        }
        case 'ownKeys': {
            return 'Reflect.ownKeys($mock)';
        }
        case 'getPrototype': {
            return 'Reflect.getPrototypeOf($mock)';
        }
        case 'setPrototype': {
            return `Reflect.setPrototypeOf($mock, ${expr.value.toString()})`;
        }
        case 'defineProperty': {
            const definition = [];
            if (expr.configurable !== undefined)
                definition.push(`configurable: ${expr.configurable}`);
            if (expr.writable !== undefined)
                definition.push(`writable: ${expr.writable}`);
            if (expr.enumerable !== undefined)
                definition.push(`enumerable: ${expr.enumerable}`);
            if (expr.get !== undefined)
                definition.push(`get: ${expr.get.toString()}`);
            if (expr.set !== undefined)
                definition.push(`set: ${expr.set.toString()}`);
            if (expr.value !== undefined)
                definition.push(`value: ${expr.value.toString()}`);
            return `Reflect.defineProperty($mock, ${keyToSource(expr.name)}, {${definition.join(',')}})`;
        }
        case 'getDescriptor': {
            return `Reflect.getOwnPropertyDescriptor($mock, ${keyToSource(expr.name)})`;
        }
        case 'isExtensible': {
            return 'Reflect.isExtensible($mock)';
        }
        case 'preventExtensions': {
            return 'Reflect.preventExtensions($mock)';
        }
    }
}

function argToString(value: unknown): string {
    value = PublicArgumentMatcher.reveal(value);
    switch (typeof value) {
        case 'string':
        case 'number':
        case 'boolean':
            return JSON.stringify(value);
        case 'bigint':
            return `${value}n`;
        case 'symbol':
            return String(value);
        case 'undefined':
            return 'undefined';
        case 'function':
            return `function ${value.name}(...) {...}`;
        case 'object': {
            if (value === null)
                return 'null';
            const mock = Mock.fromInstance(value);
            if (mock !== undefined)
                return mock.toString();

            let content;
            if (value.toString !== Object.prototype.toString)
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                content = value.toString();
            else
                content = `{${Object.entries(value).map(([k, v]) => `[${keyToSource(k)}]:${argToString(v)}`).join(',')}}`;
            const prototype = Object.getPrototypeOf(value) as object | null;
            if (prototype === null || typeof prototype.constructor !== 'function' || prototype.constructor.name === '')
                return content;
            if (value instanceof Array)
                return `[${value.map(argToString).join(',')}]`;
            return `${prototype.constructor.name}(${content})`;
        }
    }
}

function hasPrototype(target: unknown, prototype: unknown): boolean {
    while (target !== prototype) {
        if (typeof target !== 'object' || target === null)
            return false;
        if (mocks.has(target))
            return false;
        target = Reflect.getPrototypeOf(target);
    }
    return true;
}

function debugInvocation(invocation: Invocation, mock: Mock): string {
    switch (invocation.kind) {
        case 'call': {
            if (hasPrototype(invocation.this, mock.instance) || invocation.this === undefined && typeof mock === 'function')
                return `${mock.toString()}(${invocation.arguments.map(argToString).join(',')})`;
            return `${mock.toString()}.apply(${argToString(invocation.this)}, [${invocation.arguments.map(argToString).join(',')}])`;
        }
        case 'new': {
            if (invocation.this === mock)
                return `new ${mock.toString()}(${invocation.arguments.map(argToString).join(',')})`;
            return `new (class Derived extends ${mock.toString()} {...})(${argToString(invocation.this)}, [${invocation.arguments.map(argToString).join(',')}])`;
        }
        case 'method': {
            if (hasPrototype(invocation.this, mock.instance))
                return `${mock.toString()}${keyToProp(invocation.name)}(${invocation.arguments.map(argToString).join(',')})`;
            return `${mock.toString()}${keyToProp(invocation.name)}.apply(${argToString(invocation.this)}, [${invocation.arguments.map(argToString).join(',')}])`;
        }
        case 'newNested': {
            if (invocation.this === mock)
                return `new ${mock.toString()}${keyToProp(invocation.name)}(${invocation.arguments.map(argToString).join(',')})`;
            return `new (class Derived extends ${mock.toString()}${keyToProp(invocation.name)} {...})(${argToString(invocation.this)}, [${invocation.arguments.map(argToString).join(',')}])`;
        }
        case 'get': {
            return `$mock${keyToProp(invocation.name)}`;
        }
        case 'set': {
            return `$mock${keyToProp(invocation.name)} = ${argToString(invocation.arguments[0])}`;
        }
        case 'delete': {
            return `delete $mock${keyToProp(invocation.name)}`;
        }
        case 'has': {
            return `Reflect.has($mock, ${keyToSource(invocation.name)})`;
        }
        case 'ownKeys': {
            return 'Reflect.ownKeys($mock)';
        }
        case 'getPrototype': {
            return 'Reflect.getPrototypeOf($mock)';
        }
        case 'setPrototype': {
            return `Reflect.setPrototypeOf($mock, ${argToString(invocation.arguments[0])})`;
        }
        case 'defineProperty': {
            return `Reflect.defineProperty($mock, ${keyToSource(invocation.name)}, ${argToString(invocation.arguments[0])})`;
        }
        case 'getDescriptor': {
            return `Reflect.getOwnPropertyDescriptor($mock, ${keyToSource(invocation.name)})`;
        }
        case 'isExtensible': {
            return 'Reflect.isExtensible($mock)';
        }
        case 'preventExtensions': {
            return 'Reflect.preventExtensions($mock)';
        }
    }
}

function isMatch(expression: Expression, invocation: Invocation, mockInstance: unknown): boolean {
    if (expression.kind !== invocation.kind)
        return false;

    switch (expression.kind) {
        case 'call': {
            return expression.thisArg.check(invocation.this, mockInstance)
                && expression.parameters.length === invocation.arguments.length
                && expression.parameters.every((p, i) => p.check(invocation.arguments[i], mockInstance));
        }
        case 'new': {
            return expression.newTarget.check(invocation.this, mockInstance)
                && expression.parameters.length === invocation.arguments.length
                && expression.parameters.every((p, i) => p.check(invocation.arguments[i], mockInstance));
        }
        case 'method': {
            return expression.thisArg.check(invocation.this, mockInstance)
                && expression.name === invocation.name
                && expression.parameters.length === invocation.arguments.length
                && expression.parameters.every((p, i) => p.check(invocation.arguments[i], mockInstance));
        }
        case 'newNested': {
            return expression.newTarget.check(invocation.this, mockInstance)
                && expression.name === invocation.name
                && expression.parameters.length === invocation.arguments.length
                && expression.parameters.every((p, i) => p.check(invocation.arguments[i], mockInstance));
        }
        case 'get': {
            return expression.name === invocation.name;
        }
        case 'set': {
            return expression.name === invocation.name
                && expression.value.check(invocation.arguments[0], mockInstance);
        }
        case 'delete': {
            return expression.name === invocation.name;
        }
        case 'has': {
            return expression.name === invocation.name;
        }
        case 'ownKeys': {
            return true;
        }
        case 'getPrototype': {
            return true;
        }
        case 'setPrototype': {
            return expression.value.check(invocation.arguments[0], mockInstance);
        }
        case 'defineProperty': {
            const attributes = invocation.arguments[0] as null | undefined | Record<string, unknown>;
            return expression.name === invocation.name
                && typeof attributes === 'object'
                && attributes !== null
                && 'configurable' in attributes === 'configurable' in expression
                && 'writable' in attributes === 'writable' in expression
                && 'enumerable' in attributes === 'enumerable' in expression
                && 'get' in attributes === 'get' in expression
                && 'set' in attributes === 'set' in expression
                && 'value' in attributes === 'value' in expression
                && attributes.configurable === expression.configurable
                && attributes.writable === expression.writable
                && attributes.enumerable === expression.enumerable
                && expression.get?.check(attributes.get, mockInstance) !== false
                && expression.set?.check(attributes.set, mockInstance) !== false
                && expression.value?.check(attributes.value, mockInstance) !== false;
        }
        case 'getDescriptor': {
            return expression.name === invocation.name;
        }
        case 'isExtensible': {
            return true;
        }
        case 'preventExtensions': {
            return true;
        }
    }
}

function makeOpaqueProxy<T extends Mockable>(target: T, traps: ProxyHandler<T> & { fallback?: () => never; }): T {
    function getOrDefault<K extends keyof ProxyHandler<T>>(key: K, fallback: NonNullable<ProxyHandler<T>[K]>): NonNullable<ProxyHandler<T>[K]> {
        return traps[key]?.bind(traps) as ProxyHandler<T>[K] ?? traps.fallback ?? fallback;
    }
    return new Proxy(target, {
        apply: getOrDefault('apply', () => undefined),
        construct: getOrDefault('construct', () => Object.freeze(Object.create(null) as object)),
        defineProperty: getOrDefault('defineProperty', () => false),
        deleteProperty: getOrDefault('deleteProperty', () => true),
        get: getOrDefault('get', () => undefined),
        getOwnPropertyDescriptor: getOrDefault('getOwnPropertyDescriptor', () => undefined),
        getPrototypeOf: getOrDefault('getPrototypeOf', () => null),
        has: getOrDefault('has', () => false),
        isExtensible: getOrDefault('isExtensible', () => false),
        ownKeys: getOrDefault('ownKeys', () => []),
        preventExtensions: getOrDefault('preventExtensions', () => false),
        set: getOrDefault('set', () => false),
        setPrototypeOf: getOrDefault('setPrototypeOf', () => false)
    } satisfies Required<ProxyHandler<T>>);
}

function setCallSpecificity(expr: Extract<Expression, { kind: 'call' | 'method'; }>): void {
    expr.specificity += expr.thisArg.specificity;
    expr.specificity = expr.parameters.reduce((p, c) => p + c.specificity, expr.specificity);
}
function setNewSpecificity(expr: Extract<Expression, { kind: 'new' | 'newNested'; }>): void {
    expr.specificity += expr.newTarget.specificity;
    expr.specificity = expr.parameters.reduce((p, c) => p + c.specificity, expr.specificity);
}
