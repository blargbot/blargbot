import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { isProxy, isTypedArray } from 'node:util/types';

export type MockOptions<T extends Mockable> = T extends Callable ? CallableMockOptions : ObjectMockOptions;
export type MockCtorArgs<T extends Mockable> = T extends Callable ? [options: MockOptions<T>] : [options?: MockOptions<T>];
interface CallableMockOptions extends MockOptionsBase {
    callable: true;
}
interface ObjectMockOptions extends MockOptionsBase {
    callable?: boolean;
}
interface MockOptionsBase {
    loose?: boolean;
    id?: string;
}

export type Callable =
    | ((this: never, ...args: never) => unknown)
    | (abstract new (...args: never) => unknown);
export type Mockable = object | Callable;
export type Expression<T extends Mockable, Result> = (target: T, $: ArgumentMatchers<T>) => Result;
export interface BoundExpression<out T extends Mockable, Result> {
    readonly invocations: Iterable<Invocation>;
    readonly setup: SetupMock<T, Result>;
    readonly verify: VerifyMock<T>;
    toString(): string;
}

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
export interface SetupMock<T extends Mockable, Result> extends Disposable {
    invokes(callback: Callback<T, Result>, options?: InterceptOptions): SetupMock<T, Result>;
    invokesAsync(callback: Result extends PromiseLike<infer V> ? Callback<T, Awaitable<V>> : never, options?: InterceptOptions): SetupMock<T, Result>;
    returns(value: Result, options?: InterceptOptions): SetupMock<T, Result>;
    resolves(value: Result extends PromiseLike<infer V> ? Awaitable<V> : never, options?: InterceptOptions): SetupMock<T, Result>;
    throws(error: unknown, options?: InterceptOptions): SetupMock<T, Result>;
    rejects(error: Result extends PromiseLike<unknown> ? unknown : never, options?: InterceptOptions): SetupMock<T, Result>;
    yieldsAsync(value: Result extends AsyncIterable<infer V> ? Awaitable<Iterable<V>> : never, options?: InterceptOptions): SetupMock<T, Result>;

    addAssertion(assertion: Assertion<T>): SetupMock<T, Result>;
    mustNotHappen(): SetupMock<T, Result>;
    mustHappen(): SetupMock<T, Result>;
    mustHappen(exactly: number): SetupMock<T, Result>;
    mustHappen(minInclusive: number, maxInclusive: number): SetupMock<T, Result>;
    mustHappen(options: Iterable<number>): SetupMock<T, Result>;
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
    public constructor(...args: ConstructorParameters<typeof Error>) {
        super(...args);
        this.name = new.target.name;
    }
}

const mocks = new WeakMap<Mockable, Mock<Mockable>>();

type MockHelper<T extends Mockable = Mockable> = { [P in keyof InstanceType<typeof Mock<T>>]: InstanceType<typeof Mock<T>>[P] };
export interface Mock<out T extends Mockable = Mockable> extends MockHelper<T> {
    get instance(): T;
}
type PropertyKey = string | symbol;
// eslint-disable-next-line @typescript-eslint/naming-convention
export const Mock = class Mock<T extends Mockable = Mockable> {
    readonly #strict: boolean;
    readonly #id: string | null;
    readonly #shape: T;
    readonly #instance: T;
    readonly #invocations: Invocation[] = [];
    readonly #getProxies = new Map<PropertyKey, unknown>();
    readonly #getGetProxies = new Map<PropertyKey, Map<PropertyKey, unknown>>();
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
    } satisfies Record<ExpressionData['kind'], unknown>;
    readonly #verifiers: Array<Verifier<T, unknown>> = [];
    readonly #isCallable: boolean;
    readonly #children = new Map<unknown, { readonly mock: Mock; setup(): void; }>();

    public get instance(): T {
        return this.#instance;
    }

    public get invocations(): Invocation[] {
        return [...this.#invocations];
    }

    public get id(): string | null {
        return this.#id;
    }

    public findInvocations<Result>(expression: Expression<T, Result>): Invocation[] {
        const data = parseExpression(expression, this.#isCallable, true);
        return this.#invocations.filter(i => isMatch(data, i, this.#instance));
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

    public constructor(...[{ callable = false, loose = false, id } = {}]: MockCtorArgs<T>) {
        this.#isCallable = callable;
        this.#shape = callable
            ? function () { } as T
            : Object.create(null) as T;
        new MockBrand(this.#shape, this);
        this.#strict = !loose;
        this.#id = id ?? null;

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
                    return Reflect.set(_, p, value, _);
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
                if (result)
                    Reflect.setPrototypeOf(_, v);
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
        return this.#isCallable && this.#interceptors.call.length > 0;
    }
    #hasMethodLikeInterceptor(name: PropertyKey): boolean {
        return (this.#interceptors.method.get(name)?.length ?? 0) > 0
            || (this.#interceptors.newNested.get(name)?.length ?? 0) > 0;
    }
    #interceptorsFor<Result>(expression: ExpressionData): Array<Interceptor<T, Result>>
    #interceptorsFor(expression: ExpressionData): Array<Interceptor<T, unknown>> {
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
        const x = this.#interceptors[invocation.kind];
        const interceptors = x instanceof Map
            ? x.get(invocation.name) ?? []
            : x;

        return this.#findInterceptorFiltered(interceptors.values().filter(i => !i.isFallback), invocation)
            ?? this.#findInterceptorFiltered(interceptors.values().filter(i => i.isFallback), invocation);
    }

    #findInterceptorFiltered(interceptors: Iterable<Interceptor<T, unknown>>, invocation: Invocation): Interceptor<T, unknown> | undefined {
        let lastMatch;
        for (const interceptor of interceptors) {
            if (lastMatch !== undefined && interceptor.expression.specificity < lastMatch.expression.specificity)
                break;
            if (isMatch(interceptor.expression, invocation, this.#instance)) {
                lastMatch = interceptor;
                if (!interceptor.invoked)
                    return interceptor;
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
        const invocation = createInvocation({ kind, name, this: $this, arguments: args, canIntercept });
        const interceptor = this.#findInterceptor(invocation);
        if (interceptor !== undefined) {
            this.#invocations.push(invocation);
            interceptor.invoked = true;
            const result = interceptor.callback(invocation, this) as T;
            if (kind === 'get' && typeof result === 'function' && isProxy(result))
                assertMockableMethod(name);
            return result;
        }

        if (canIntercept && kind === 'get') {
            const shouldReturnProxy =
                (name === 'call' || name === 'apply')
                && this.#hasCallInterceptors()
                || this.#hasMethodLikeInterceptor(name);
            if (shouldReturnProxy) {
                assertMockableMethod(name);

                return this.#getProxies.getOrInsertComputed(name, () => makeOpaqueProxy(function () { }, {
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
        const invocation = createInvocation({ kind, name, this: thisArg, arguments: Array.from(argsArray), canIntercept: true });
        const interceptor = this.#findInterceptor(invocation);
        if (interceptor !== undefined) {
            this.#invocations.push(invocation);
            interceptor.invoked = true;
            return interceptor.callback(invocation, this);
        }
        return this.#createNotConfiguredHandler(invocation)?.();
    }

    #invokeApplyMethod(kind: 'method' | 'call', name: PropertyKey, args: readonly unknown[]): unknown {
        const [thisArg, argsArray] = args;
        if (!isArrayLike(argsArray))
            throw new MockError('Apply expects the second argument to be array like.');
        const invocation = createInvocation({ kind, name, this: thisArg, arguments: Array.from(argsArray), canIntercept: true });
        const interceptor = this.#findInterceptor(invocation);
        if (interceptor !== undefined) {
            this.#invocations.push(invocation);
            interceptor.invoked = true;
            return interceptor.callback(invocation, this);
        }
        return this.#createNotConfiguredHandler(invocation)?.();
    }

    #invokeGetApply(get: Invocation, thisArg: unknown, args: readonly unknown[]): unknown {
        if (this.#isCallable) {
            switch (get.name) {
                case 'call':
                    return this.#invokeCallMethod('call', '[[Call]]', args);
                case 'apply':
                    return this.#invokeApplyMethod('call', '[[Call]]', args);
            }
        }
        const invocation = createInvocation({ kind: 'method', name: get.name, this: thisArg, arguments: args, canIntercept: true });
        const interceptor = this.#findInterceptor(invocation);
        if (interceptor !== undefined) {
            this.#invocations.push(invocation);
            interceptor.invoked = true;
            return interceptor.callback(invocation, this);
        }

        return this.#createNotConfiguredHandler(invocation)?.();
    }

    #invokeGetConstruct(get: Invocation, newTarget: unknown, args: readonly unknown[]): object {
        const invocation = createInvocation({ kind: 'newNested', name: get.name, this: newTarget, arguments: args, canIntercept: true });
        const interceptor = this.#findInterceptor(invocation);
        if (interceptor !== undefined) {
            this.#invocations.push(invocation);
            interceptor.invoked = true;
            return interceptor.callback(invocation, this) as object;
        }

        this.#createNotConfiguredHandler(invocation)?.();
        return Object.create(null) as object;
    }

    #getGetProxy(name: PropertyKey): Map<PropertyKey, unknown> {
        return this.#getGetProxies.getOrInsertComputed(name, () => new Map());
    }

    #invokeGetGet(get: Invocation, inner: PropertyKey): unknown {
        if (this.#hasMethodLikeInterceptor(get.name)) {
            switch (inner) {
                case 'call': {
                    return this.#getGetProxy(get.name).getOrInsertComputed(inner, () => makeOpaqueProxy(function () { }, {
                        fallback: this.#createNotConfiguredHandler(get),
                        apply: (_, __, args) => this.#invokeCallMethod('method', get.name, args)
                    }));
                }
                case 'apply': {
                    return this.#getGetProxy(get.name).getOrInsertComputed(inner, () => makeOpaqueProxy(function () { }, {
                        fallback: this.#createNotConfiguredHandler(get),
                        apply: (_, __, args) => this.#invokeApplyMethod('method', get.name, args)
                    }));
                }

            }
        }

        return this.#createNotConfiguredHandler(get)?.();
    }

    public reset(): void {
        this.clearInterceptors();
        this.clearInvocations();
        this.clearVerifiers();
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
        for (const entry of this.#children.values())
            entry.mock.clearInvocations();
    }

    public clearVerifiers(): void {
        this.#verifiers.length = 0;
        for (const entry of this.#children.values())
            entry.mock.clearVerifiers();
    }

    public clearInterceptors(): void {
        for (const value of Object.values(this.#interceptors)) {
            const groups = value instanceof Map ? value.values() : [value];
            for (const group of groups) {
                group.length = 0;
            }
        }
        for (const entry of this.#children.values()) {
            entry.setup();
            entry.mock.clearInterceptors();
        }
    }

    public verifyAll(): void {
        const errors = [];
        for (const verifier of this.#verifiers) {
            const invocations = this.findInvocations(verifier.expression);
            try {
                verifier.assertion(invocations, this);
            } catch (error) {
                errors.push(error);
            }
        }
        for (const child of this.#children.values()) {
            try {
                child.mock.verifyAll();
            } catch (error) {
                if (error instanceof AggregateError)
                    errors.push(...error.errors as unknown[]);
                else
                    errors.push(error);
            }
        }

        if (errors.length > 1)
            throw new AggregateError(errors);
        if (errors.length === 1)
            throw errors[0];
    }

    public verify<Result>(expression: Expression<T, Result>): VerifyMock<T> {
        const data = parseExpression(expression, this.#isCallable, true);
        return this.#verify(data);
    }

    #verify(expression: ExpressionData): VerifyMock<T> {
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

    public expression<Result>(expression: Expression<T, Result>): BoundExpression<T, Result> {
        const setup = (): SetupMock<T, Result> => this.#setup(parseExpression(expression, this.#isCallable, false));
        const verify = (): VerifyMock<T> => this.#verify(parseExpression(expression, this.#isCallable, true));
        const invocations = (): Invocation[] => this.findInvocations(expression);
        return {
            toString: () => debugExpression(parseExpression(expression, this.#isCallable, true), this),
            get invocations() {
                return invocations();
            },
            get setup() {
                return setup();
            },
            get verify() {
                return verify();
            }
        };
    }

    public static verifySequence(...args: ReadonlyArray<BoundExpression<Mockable, unknown>>): void {
        if (args.length === 0)
            assert.fail('Cannot verify an empty sequence');

        let order = -1;
        let previous: BoundExpression<Mockable, unknown> = null!;
        for (const bound of args) {
            let empty = true;
            let matched = false;
            for (const invocation of bound.invocations) {
                empty = false;
                if (invocation.order > order) {
                    matched = true;
                    order = invocation.order;
                    break;
                }
            }
            if (empty)
                assert.fail(`Expected ${bound.toString()} to have been called but it has not.`);
            if (!matched)
                assert.fail(`Expexted ${bound.toString()} to have been called after ${previous.toString()} but it has not.`);
            previous = bound;
        }
    }

    #getChild<T extends Mockable>(key: unknown, createMock: () => Mock<T>, setup: (mock: Mock<T>) => void): Mock<T> {
        const entry = this.#children.getOrInsertComputed(key, () => {
            const mock = createMock();
            setup(mock);
            return {
                mock: mock as unknown as Mock,
                setup: () => setup(mock)
            };
        });
        return entry.mock as unknown as Mock<T>;
    }

    public get [Symbol.dispose](): Mock<() => void> {
        return this.#getChild(Symbol.dispose, () => new Mock({
            callable: true,
            id: this.id === null ? 'Symbol.dispose' : `${this.id}.Symbol.dispose`
        }), mock => this.setup(m => (m as Disposable)[Symbol.dispose]).returns(function (this: Disposable) {
            mock.instance.call(this);
        }));
    }

    public get [Symbol.asyncDispose](): Mock<() => PromiseLike<void>> {
        return this.#getChild(Symbol.asyncDispose, () => new Mock({
            callable: true,
            id: this.id === null ? 'Symbol.asyncDispose' : `${this.id}.Symbol.asyncDispose`
        }), mock => this.setup(m => (m as AsyncDisposable)[Symbol.asyncDispose]).returns(function (this: AsyncDisposable) {
            return mock.instance.call(this);
        }));
    }

    public setup<Result>(expression: Expression<T, Result>): SetupMock<T, Result> {
        const details = parseExpression(expression, this.#isCallable, false);
        return this.#setup(details);
    }

    public setupSet<Result>(expression: Expression<T, Result>): SetupMock<T, boolean> {
        const details = parseExpression(expression, this.#isCallable, true);
        if (details.kind !== 'set')
            throw new MockError('Only expressions of the form `x => x.something = value` are supported with setupSet');
        return this.#setup(details);
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

    #isSetUp(kind: 'get' | 'method' | 'newNested', name: PropertyKey): boolean {
        return (this.#interceptors[kind].get(name)?.filter(x => !x.isFallback).length ?? 0) > 0;
    }

    static readonly #setupMockImpl = class SetupMockImpl<T extends Mockable, Result> implements SetupMock<T, Result> {
        readonly #mock: Mock<T>;
        readonly #expression: ExpressionData;
        readonly #disposeActions: ReadonlyArray<() => void>;

        public constructor(mock: Mock<T>, expression: ExpressionData, disposeActions: ReadonlyArray<() => void>) {
            this.#mock = mock;
            this.#expression = expression;
            this.#disposeActions = disposeActions;
        }
        public [Symbol.dispose](): void {
            for (const dispose of this.#disposeActions)
                dispose();
        }
        public invokes(callback: Callback<T, Result>, options?: InterceptOptions): SetupMock<T, Result> {
            if (this.#expression.kind === 'method')
                assertMockableMethod(this.#expression.name);
            switch (this.#expression.kind) {
                case 'method': {
                    const nameStr = keyToProp(this.#expression.name);
                    if (this.#mock.#isSetUp('get', this.#expression.name))
                        throw new MockError(`Cannot setup x${nameStr}(...) because x${nameStr} is already configured.`);
                    break;
                }
                case 'newNested': {
                    const nameStr = keyToProp(this.#expression.name);
                    if (this.#mock.#isSetUp('get', this.#expression.name))
                        throw new MockError(`Cannot setup new x${nameStr}(...) because x${nameStr} is already configured.`);
                    break;
                }
                case 'get': {
                    const nameStr = keyToProp(this.#expression.name);
                    if (this.#mock.#isSetUp('method', this.#expression.name))
                        throw new MockError(`Cannot setup x${nameStr} because x${nameStr}(...) is already configured.`);
                    if (this.#mock.#isSetUp('newNested', this.#expression.name))
                        throw new MockError(`Cannot setup x${nameStr} because new x${nameStr}(...) is already configured.`);
                    break;
                }
            }

            if (options?.allowUninterceptableInvocations !== true) {
                callback = (h => (i, m) => {
                    if (!i.canIntercept)
                        throw new MockError(`Cannot mock the result of ${debugInvocation(i, m)} because this JavaScript operation is not interceptable in the object's current state.`);
                    return h(i, m);
                })(callback);
            }

            const interceptor: Interceptor<T, Result> = {
                expression: this.#expression,
                callback,
                invoked: false,
                isFallback: options?.isFallback ?? false
            };
            const interceptors = this.#mock.#interceptorsFor(this.#expression);
            const specificity = this.#expression.specificity;
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
            return new SetupMockImpl(this.#mock, this.#expression, [
                () => {
                    const index = interceptors.indexOf(interceptor);
                    if (index !== -1)
                        interceptors.splice(index, 1);
                },
                ...this.#disposeActions
            ]);
        }

        public invokesAsync(callback: Result extends PromiseLike<infer V> ? Callback<T, Awaitable<V>> : never, options?: InterceptOptions): SetupMock<T, Result> {
            return this.invokes((i, m) => Promise.try(callback, i, m) as Result, options);
        }

        public returns(value: Result, options?: InterceptOptions): SetupMock<T, Result> {
            return this.invokes(() => value, options);
        }

        public resolves(value: Result extends PromiseLike<infer V> ? Awaitable<V> : never, options?: InterceptOptions): SetupMock<T, Result> {
            return this.invokes(() => Promise.resolve(value) as Result, options);
        }

        public throws(error: unknown, options?: InterceptOptions): SetupMock<T, Result> {
            return this.invokes(() => {
                throw error;
            }, options);
        }

        public rejects(error: Result extends PromiseLike<unknown> ? unknown : never, options?: InterceptOptions): SetupMock<T, Result> {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return this.invokes(() => Promise.reject(error) as Result, options);
        }

        public yieldsAsync(value: Result extends AsyncIterable<infer V> ? Iterable<V> : never, options?: InterceptOptions): SetupMock<T, Result> {
            return this.invokes(async function* () {
                yield* await Promise.resolve(value);
            } as () => Result, options);
        }

        public addAssertion(assertion: Assertion<T>): SetupMock<T, Result> {
            const verifier = { expression: toExpression(this.#expression), assertion };
            this.#mock.#verifiers.push(verifier);
            return new SetupMockImpl(this.#mock, this.#expression, [
                () => {
                    const i = this.#mock.#verifiers.indexOf(verifier);
                    if (i !== -1)
                        this.#mock.#verifiers.splice(i, 1);
                },
                ...this.#disposeActions
            ]);
        }

        public mustNotHappen(): SetupMock<T, Result> {
            return this.addAssertion(mustNotHaveHappened(this.#mock, this.#expression));
        }

        public mustHappen(): SetupMock<T, Result>;
        public mustHappen(exactly: number): SetupMock<T, Result>;
        public mustHappen(minInclusive: number, maxInclusive: number): SetupMock<T, Result>;
        public mustHappen(options: Iterable<number>): SetupMock<T, Result>;
        public mustHappen(...args: [number | Iterable<number>] | [number, number] | []): SetupMock<T, Result> {
            return this.addAssertion(mustHaveHappened(this.#mock, this.#expression, ...args));
        }
    };

    #setup<Result>(expression: ExpressionData): SetupMock<T, Result> {
        return new Mock.#setupMockImpl(this, expression, []);
    }
};

function mustNotHaveHappened<T extends Mockable>(mock: Mock<T>, expression: ExpressionData): Assertion<T> {
    return i => {
        if (i.length !== 0) {
            assert.fail(`Expected ${debugExpression(expression, mock)} to not be called but it has been ${i.length} time(s).`);
        }
    };
}

function mustHaveHappened<T extends Mockable>(mock: Mock<T>, expression: ExpressionData, ...args: [number | Iterable<number>] | [number, number] | []): Assertion<T> {
    if (args.length === 0) {
        return i => {
            if (i.length === 0) {
                assert.fail(`Expected ${debugExpression(expression, mock)} to have been called but it has not.`);
            }
        };
    }
    if (args.length === 2) {
        const [min, max] = args;
        return i => {
            if (min > i.length || i.length > max) {
                assert.fail(`Expected ${debugExpression(expression, mock)} to have been called between ${min} and ${max} time(s) (inclusive), but found ${i.length}.`);
            }
        };
    }
    const v0 = args[0];
    if (typeof v0 === 'number') {
        return i => {
            if (i.length !== v0) {
                assert.fail(`Expected ${debugExpression(expression, mock)} to have been called ${v0} time(s), but found ${i.length}.`);
            }
        };
    }
    const options = [...v0];
    return i => {
        if (!options.includes(i.length)) {
            assert.fail(`Expected ${debugExpression(expression, mock)} to have been called one of [${options.join(',')}] time(s), but found ${i.length}.`);
        }
    };
}

interface Interceptor<T extends Mockable, Result> {
    readonly expression: ExpressionData;
    readonly callback: Callback<T, Result>;
    readonly isFallback: boolean;
    invoked: boolean;
}
interface Verifier<in T extends Mockable, out Result> {
    readonly expression: Expression<T, Result>;
    readonly assertion: Assertion<T>;
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
    public static readonly specificity = 100_000_000_000_000;
    public static readonly undefined = new StrictArgumentMatcher(undefined);
    public static readonly null = new StrictArgumentMatcher(null);

    readonly #expected: unknown;
    public override specificity = StrictArgumentMatcher.specificity;

    public constructor(expected: unknown) {
        super();
        this.#expected = expected;
    }
    public override check(value: unknown): boolean {
        return Object.is(value, this.#expected);
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
class CollectionEqualMatcher<Item> extends ArgumentMatcher {
    readonly #source: readonly unknown[];
    readonly #orderMatters: boolean;
    public specificity: number = 100_000;

    public constructor(source: Iterable<Item>, orderMatters: boolean) {
        super();
        this.#source = Iterator.from(source).map(x => PublicArgumentMatcher.reveal(x)).toArray();
        this.#orderMatters = orderMatters;
        for (const item of this.#source) {
            if (item instanceof ArgumentMatcher)
                this.specificity += item.specificity;
            else
                this.specificity += StrictArgumentMatcher.specificity;
        }
    }

    #checkAll(items: Iterable<unknown>, thisArg: unknown): boolean {
        if (this.#orderMatters) {
            const arr = [...items];
            return arr.length === this.#source.length && this.#source.every((x, i) => {
                const y = arr[i];
                if (x instanceof ArgumentMatcher)
                    return x.check(y, thisArg);
                return x === y;
            });
        }

        const matchCount = new Map(this.#source.map(x => [x, 0]));
        const matchers = this.#source.filter(x => x instanceof ArgumentMatcher);
        for (const item of items) {
            if (matchCount.has(item))
                matchCount.set(item, matchCount.get(item)! + 1);
            else {
                let matched = false;
                for (const matcher of matchers) {
                    if (matcher.check(item, thisArg)) {
                        matched = true;
                        matchCount.set(matcher, matchCount.get(matcher)! + 1);
                    }
                }
                if (!matched)
                    return false;
            }
        }
        return matchCount.values().every(v => v > 0);
    }

    public check(value: unknown, thisArg: unknown): boolean {
        if (typeof value === 'string')
            return this.#checkAll(value, thisArg);
        if (typeof value !== 'object' || value === null)
            return false;
        if (!(Symbol.iterator in value) || typeof value[Symbol.iterator] !== 'function')
            return false;
        return this.#checkAll(value as Iterable<unknown>, thisArg);
    }

    public toString(): string {
        return `[${this.#source.map(x => x instanceof ArgumentMatcher ? x.toString() : argToString(x)).join(',')}]`;
    }

    public equals(other: ArgumentMatcher): boolean {
        return other instanceof CollectionEqualMatcher &&
            this.#source.length === other.#source.length &&
            this.#source.every((x, i) => {
                const y = other.#source[i];
                if (x instanceof ArgumentMatcher)
                    return y instanceof ArgumentMatcher && x.equals(y);
                return x === y;
            });
    }
}
class LooksLikeArgumentMatcher extends ArgumentMatcher {
    readonly #skeleton: unknown;
    readonly #allowExcessOwnProperties: boolean;
    public override specificity: number;
    public constructor(skeleton: unknown, allowExcessOwnProperties: boolean) {
        super();
        this.#skeleton = skeleton;
        this.#allowExcessOwnProperties = allowExcessOwnProperties;
        this.specificity = LooksLikeArgumentMatcher.#calcSpecificity(skeleton);
    }
    public override check(value: unknown, thisArg: unknown): boolean {
        return this.#check(value, this.#skeleton, thisArg);
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
                if (isTypedArray(value))
                    return 100_000_000;
                if (Reflect.getPrototypeOf(value) === Object.prototype)
                    return (Reflect.ownKeys(value) as Array<keyof typeof value>).reduce((p, c) => p + this.#calcSpecificity(value[c]), 0);
                if ('valueOf' in value && typeof value.valueOf === 'function')
                    return StrictArgumentMatcher.specificity / 2;
                return StrictArgumentMatcher.specificity;
            }
        }
    }
    #check(value: unknown, skeleton: unknown, thisArg: unknown): boolean {
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
                if ($skeleton instanceof Array)
                    return Array.isArray(value) && value.length === $skeleton.length && $skeleton.every((v, i) => this.#check(value[i], v, thisArg));
                if (isTypedArray($skeleton))
                    return isTypedArray(value) && $skeleton.BYTES_PER_ELEMENT === value.BYTES_PER_ELEMENT && $skeleton.length === value.length && $skeleton.every((v, i) => value[i] === v);
                if (Reflect.getPrototypeOf($skeleton) === Object.prototype || Reflect.getPrototypeOf($skeleton) === Reflect.getPrototypeOf(value)) {
                    return (Reflect.ownKeys($skeleton) as Array<keyof typeof $skeleton>)
                        .every(k => this.#check(value[k], $skeleton[k], thisArg))
                        && (this.#allowExcessOwnProperties || new Set(Reflect.ownKeys(value)).difference(new Set(Reflect.ownKeys($skeleton))).size === 0);
                };
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
        return this.#options.map(x => x.specificity).reduce((p, c) => Math.max(p, c), 0);
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
class AllOfArgumentMatcher extends ArgumentMatcher {
    readonly #options: ArgumentMatcher[];
    public override get specificity(): number {
        return this.#options.map(x => x.specificity).reduce((p, c) => p + c, 0);
    }

    public constructor(...options: ArgumentMatcher[]) {
        super();
        this.#options = options;
    }
    public override check(value: unknown, thisArg: unknown): boolean {
        return this.#options.every(opt => opt.check(value, thisArg));
    }
    public override toString(): string {
        return `AllOf(${this.#options.map(opt => opt.toString()).join(' & ')})`;
    }
    public override equals(other: ArgumentMatcher): boolean {
        return other instanceof AllOfArgumentMatcher
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

type ArrayToIntersection<T extends readonly unknown[], Result = unknown>
    = T extends readonly [infer Elem, ...infer Rest] ? ArrayToIntersection<Rest, Elem & Result>
    : Result

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
    readonly oneOf: <const R extends readonly unknown[]>(...values: R) => R[number];
    readonly allOf: <const R extends readonly unknown[]>(...values: R) => ArrayToIntersection<R>;
    readonly instanceOf: <R>(ctor: abstract new (...args: never) => R) => R;
    readonly looksLike: <R>(skeleton: R) => R;
    readonly looksLikeLoose: <R>(skeleton: R) => R;
    readonly sequenceEqual: <R>(items: R extends Iterable<infer Item> ? Iterable<Item> : never) => R;
    readonly setEqual: <R>(items: R extends Iterable<infer Item> ? Iterable<Item> : never) => R;
}

export function toExpression<T extends Mockable>(data: ExpressionData): Expression<T, unknown> {
    switch (data.kind) {
        case 'call': return m => Reflect.apply(m as never, data.thisArg, data.parameters.map(PublicArgumentMatcher.disguise));
        case 'new': return m => Reflect.construct(m as never, data.parameters.map(PublicArgumentMatcher.disguise));
        case 'get': return m => Reflect.get(m, data.name);
        case 'set': return m => Reflect.set(m, data.name, PublicArgumentMatcher.disguise(data.value));
        case 'delete': return m => Reflect.deleteProperty(m, data.name);
        case 'has': return m => Reflect.has(m, data.name);
        case 'method': return m => Reflect.apply(Reflect.get(m, data.name) as never, data.thisArg, data.parameters.map(PublicArgumentMatcher.disguise));
        case 'newNested': return m => Reflect.construct(Reflect.get(m, data.name) as never, data.parameters.map(PublicArgumentMatcher.disguise));
        case 'getPrototype': return m => Reflect.getPrototypeOf(m);
        case 'setPrototype': return m => Reflect.setPrototypeOf(m, PublicArgumentMatcher.disguise(data.value));
        case 'defineProperty': {
            const descriptor: PropertyDescriptor = {};
            for (const key of ['get', 'set', 'value'] as const) {
                if (key in data)
                    descriptor[key] = data[key] === undefined ? undefined : PublicArgumentMatcher.disguise<never>(data[key]);
            }
            for (const key of ['configurable', 'enumerable', 'writable'] as const) {
                if (key in data)
                    descriptor[key] = data[key];
            }
            return m => Reflect.defineProperty(m, data.name, descriptor);
        }
        case 'ownKeys': return m => Reflect.ownKeys(m);
        case 'getDescriptor': return m => Reflect.getOwnPropertyDescriptor(m, data.name);
        case 'isExtensible': return m => Reflect.isExtensible(m);
        case 'preventExtensions': return m => Reflect.preventExtensions(m);
    }
}

function parseExpression<T extends Mockable, Result>(
    expression: Expression<T, Result>,
    isCallable: boolean,
    allowDirectSet: boolean
): ExpressionData {
    let data: Mutable<ExpressionData> | undefined;
    let checkResult: (value: unknown) => boolean = () => {
        throw new MockError('No mockable calls were made.');
    };

    const ensureEmpty = (): void => {
        if (data !== undefined)
            throw new MockError('Cannot mock multiple expressions in one go.');
    };

    const target = isCallable
        ? function () { } as T
        : Object.create(null) as T;

    const deadEnd = makeOpaqueProxy(() => { }, { fallback: deepMemberError });
    const ownKeysResult = [...Reflect.ownKeys(target), `\0mock-ownKeys-${randomUUID()}`];

    const getResult = makeOpaqueProxy(function () { }, {
        fallback: deepMemberError,
        // OK: $mock => $mock.foo(...)              = method
        // OK: $mock => $mock.call(thisArg, ...)    = call if $mock is a function, method otherwise
        // OK: $mock => $mock.apply(thisArg, [...]) = call if $mock is a function, method otherwise
        apply(_, __, args) {
            if (data?.kind !== 'get')
                return deepMemberError();
            if (typeof target === 'function') {
                if (data.name === 'call') {
                    // mocking x => x.call(thisArg, arg1, arg2, arg3, ...)
                    const [thisArg, ...argArray] = args as unknown[];
                    data = {
                        kind: 'call',
                        thisArg: ArgumentMatcher.from(thisArg, proxy),
                        parameters: argArray.map(x => ArgumentMatcher.from(x, proxy)),
                        specificity: 0
                    };
                    setCallSpecificity(data);
                    checkResult = v => v === deadEnd;
                    return deadEnd;
                }
                if (data.name === 'apply') {
                    // mocking x => x.apply(thisArg, [arg1, arg2, arg3, ...])
                    const [thisArg, argArray] = args as unknown[];
                    if (!isArrayLike(argArray))
                        throw new MockError('Apply expects an argument array');
                    data = {
                        kind: 'call',
                        thisArg: ArgumentMatcher.from(thisArg, proxy),
                        parameters: Array.from(argArray, x => ArgumentMatcher.from(x, proxy)),
                        specificity: 0
                    };
                    setCallSpecificity(data);
                    checkResult = v => v === deadEnd;
                    return deadEnd;
                }
            }

            // mocking one of:
            // $mock => $mock.foo(...)
            // $mock => $mock.call(...) when $mock is not a function
            // $mock => $mock.apply(...) when $mock is not a function
            // We dont care about the thisArg here, you should mock via .call or .apply if you do care
            data = {
                kind: 'method',
                name: data.name,
                thisArg: anyArgumentMatcher,
                parameters: args.map(x => ArgumentMatcher.from(x, proxy)),
                specificity: 0
            };
            setCallSpecificity(data);
            checkResult = v => v === deadEnd;
            return deadEnd;
        },

        // OK:  $mock => new $mock.foo(...)              = newNested
        construct(_, args, newTarget) {
            if (data?.kind !== 'get')
                return deepMemberError();
            if (newTarget !== getResult)
                throw new MockError('Cannot mock derived classes.');

            data = {
                kind: 'newNested',
                name: data.name,
                parameters: args.map(x => ArgumentMatcher.from(x, proxy)),
                specificity: 0
            };
            setNewSpecificity(data);
            checkResult = v => v === deadEnd;
            return deadEnd;
        },

        // BAD: $mock => $mock.foo.bar
        // BAD: $mock => $mock.foo.call
        // BAD: $mock => $mock.foo.apply
        // OK:  $mock => $mock.foo.call(thisArg, ...)    = method
        // OK:  $mock => $mock.foo.apply(thisArg, [...]) = method
        get(_, p) {
            if (data?.kind !== 'get')
                return deepMemberError();

            const methodName = data.name;
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
            if (data?.kind !== 'get')
                return deepMemberError();
            // mocking x => x.method.call(thisArg, arg1, arg2, arg3, ...)
            const [thisArg, ...argArray] = args as unknown[];
            data = {
                kind: 'method',
                name: data.name,
                thisArg: ArgumentMatcher.from(thisArg, proxy),
                parameters: argArray.map(x => ArgumentMatcher.from(x, proxy)),
                specificity: 0
            };
            setCallSpecificity(data);
            checkResult = v => v === deadEnd;
            return deadEnd;
        }
    });
    const getMethodApply = makeOpaqueProxy(function () { }, {
        fallback: deepMemberError,
        apply(_, __, args) {
            if (data?.kind !== 'get')
                return deepMemberError();

            // mocking x => x.method.apply(thisArg, [arg1, arg2, arg3, ...])
            const [thisArg, argArray] = args as unknown[];
            if (!isArrayLike(argArray))
                throw new MockError('Apply expects an argument array');
            data = {
                kind: 'method',
                name: data.name,
                thisArg: ArgumentMatcher.from(thisArg, proxy),
                parameters: Array.from(argArray, x => ArgumentMatcher.from(x, proxy)),
                specificity: 0
            };
            setCallSpecificity(data);
            checkResult = v => v === deadEnd;
            return deadEnd;
        }
    });

    const proxy = new Proxy<T>(target, {
        apply(_, __, argArray) {
            ensureEmpty();
            data = {
                kind: 'call',
                thisArg: anyArgumentMatcher,
                parameters: argArray.map(x => ArgumentMatcher.from(x, proxy)),
                specificity: 0
            };
            setCallSpecificity(data);
            checkResult = v => v === deadEnd;
            return deadEnd;
        },
        construct(_, argArray, newTarget) {
            ensureEmpty();
            if (newTarget !== proxy)
                throw new MockError('Cannot mock derived classes.');
            data = {
                kind: 'new',
                parameters: argArray.map(x => ArgumentMatcher.from(x, proxy)),
                specificity: 0
            };
            setNewSpecificity(data);
            checkResult = v => v === deadEnd;
            return deadEnd;
        },
        get(_, name) {
            ensureEmpty();
            data = { kind: 'get', name, specificity: 0 };
            checkResult = v => v === getResult;
            return getResult;
        },
        set(_, name, value) {
            ensureEmpty();
            const matcher = ArgumentMatcher.from(value, proxy);
            data = { kind: 'set', name, value: matcher, specificity: matcher.specificity };
            checkResult = v => {
                if (v === true)
                    return true;
                if (v === value) {
                    if (allowDirectSet)
                        return true;
                    throw new MockError('Cannot setup set methods using .setup(m => m.someProp = someValue). Either use .setup(x => Reflect.set(x, \'someProp\', someValue)) or .setupSet(m => m.someProp = someValue)');
                }
                return false;
            };
            return true;
        },
        deleteProperty(_, name) {
            ensureEmpty();
            data = { kind: 'delete', name, specificity: 0 };
            checkResult = v => v === true;
            return true;
        },
        has(_, name) {
            ensureEmpty();
            data = { kind: 'has', name, specificity: 0 };
            checkResult = v => v === true;
            return true;
        },
        getPrototypeOf() {
            ensureEmpty();
            data = { kind: 'getPrototype', specificity: 0 };
            checkResult = v => v === deadEnd;
            return deadEnd;
        },
        setPrototypeOf(_, value) {
            ensureEmpty();
            const matcher = ArgumentMatcher.from(value, proxy);
            data = { kind: 'setPrototype', value: matcher, specificity: matcher.specificity };
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
            data = {
                kind: 'defineProperty',
                name,
                specificity: 0
            };
            for (const key of Reflect.ownKeys(descriptor) as Array<keyof typeof descriptor>) {
                switch (key) {
                    case 'value':
                    case 'get':
                    case 'set':
                        // eslint-disable-next-line @typescript-eslint/unbound-method
                        data[key] = ArgumentMatcher.from(descriptor[key], proxy);
                        data.specificity += data[key].specificity;
                        break;
                    default:
                        data[key] = descriptor[key];
                        break;
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
            data = { kind: 'ownKeys', specificity: 0 };
            checkResult = v => Array.isArray(v) && ownKeysResult.length === v.length && ownKeysResult.every((x, i) => v[i] === x);
            return ownKeysResult;
        },
        getOwnPropertyDescriptor(_, name) {
            if (data?.kind === 'ownKeys' && ownKeysResult.includes(name))
                throw new MockError('Cannot mock Object.keys, use Reflect.ownKeys instead.');

            ensureEmpty();
            data = { kind: 'getDescriptor', name, specificity: 0 };
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
            data = { kind: 'isExtensible', specificity: 0 };
            checkResult = v => v === true;
            return true;
        },
        preventExtensions() {
            ensureEmpty();
            data = { kind: 'preventExtensions', specificity: 0 };
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

    const response = expression(proxy, publicArgumentMatchers);

    if (data === undefined || !checkResult(response))
        throw new MockError('Expression is not mockable');

    return Object.freeze(data);
}

class PublicArgumentMatcher extends class Stamper {
    protected constructor(thisArg: Mockable) {
        return thisArg;
    }
} {
    readonly #impl: ArgumentMatcher;

    public static disguise<T>(this: void, impl: ArgumentMatcher): T {
        const result = makeOpaqueProxy(function () { }, {
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
        if (typeof target === 'function' && #impl in target)
            return target.#impl;
        return target;
    }
}

function looksLike<T>(value: T): T {
    return PublicArgumentMatcher.disguise(new LooksLikeArgumentMatcher(value, false));
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
        satisfies: <R>(v: (value: R) => boolean) => PublicArgumentMatcher.disguise(new GuardedArgumentMatcher(v)),
        asserts: <R>(v: (value: R) => void) => PublicArgumentMatcher.disguise(new AssertingArgumentMatcher(v)),
        oneOf: (...v) => PublicArgumentMatcher.disguise(new OneOfArgumentMatcher(...v.map(v => ArgumentMatcher.from(v)))),
        allOf: (...v) => PublicArgumentMatcher.disguise(new AllOfArgumentMatcher(...v.map(v => ArgumentMatcher.from(v)))),
        instanceOf: v => PublicArgumentMatcher.disguise(new InstanceOfArgumentMatcher(v)),
        sequenceEqual: v => PublicArgumentMatcher.disguise(new CollectionEqualMatcher(v, true)),
        setEqual: v => PublicArgumentMatcher.disguise(new CollectionEqualMatcher(v, false)),
        looksLikeLoose: v => PublicArgumentMatcher.disguise(new LooksLikeArgumentMatcher(v, true)),
        looksLike
    } satisfies { [P in keyof ArgumentMatchers<never>]: ArgumentMatchers<never>[P]; }
));

type Clean<T> = { [P in keyof T]: T[P] } & {};
type ExpressionData = Clean<Readonly<{ specificity: number; } & (
    | { kind: 'call'; thisArg: ArgumentMatcher; parameters: readonly ArgumentMatcher[]; }
    | { kind: 'new'; parameters: readonly ArgumentMatcher[]; }
    | { kind: 'get'; name: PropertyKey; }
    | { kind: 'set'; name: PropertyKey; value: ArgumentMatcher; }
    | { kind: 'delete'; name: PropertyKey; }
    | { kind: 'has'; name: PropertyKey; }
    | { kind: 'method'; name: PropertyKey; thisArg: ArgumentMatcher; parameters: readonly ArgumentMatcher[]; }
    | { kind: 'newNested'; name: PropertyKey; parameters: readonly ArgumentMatcher[]; }
    | { kind: 'getPrototype'; }
    | { kind: 'setPrototype'; value: ArgumentMatcher; }
    | { kind: 'defineProperty'; name: PropertyKey; value?: ArgumentMatcher; get?: ArgumentMatcher; set?: ArgumentMatcher; } & Omit<PropertyDescriptor, 'value' | 'get' | 'set'>
    | { kind: 'ownKeys'; }
    | { kind: 'getDescriptor'; name: PropertyKey; }
    | { kind: 'isExtensible'; }
    | { kind: 'preventExtensions'; }
)>>;

export interface Invocation {
    readonly kind: ExpressionData['kind'];
    readonly this: unknown;
    readonly arguments: readonly unknown[];
    readonly name: PropertyKey;
    readonly canIntercept: boolean;
    readonly order: number;
}
let invocationId = 0;
function createInvocation(options: Omit<Invocation, 'order'>): Invocation {
    return {
        ...options,
        order: invocationId++
    };
}

function isArrayLike(value: unknown): value is ArrayLike<unknown> {
    return typeof value === 'object'
        && value !== null
        && 'length' in value
        && typeof value.length === 'number';
}

function keyToProp(key: PropertyKey, includeDot = true): string {
    if (typeof key === 'symbol')
        return `[${String(key)}]`;
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key))
        return includeDot ? `.${key}` : key;
    return `[${JSON.stringify(key)}]`;
}

function keyToSource(key: PropertyKey): string {
    if (typeof key === 'symbol')
        return String(key);
    return JSON.stringify(key);
}

function debugExpression(expr: ExpressionData, mock: Mock): string {
    const $mock = mock.toString();
    switch (expr.kind) {
        case 'call': {
            if (expr.thisArg === thisArgumentMatcher || expr.thisArg === anyArgumentMatcher)
                return `${$mock}(${expr.parameters.map(p => p.toString()).join(',')})`;
            return `${$mock}.apply(${expr.thisArg.toString()}, [${expr.parameters.map(p => p.toString()).join(',')}])`;
        }
        case 'new': {
            return `new ${$mock}(${expr.parameters.map(p => p.toString()).join(',')})`;
        }
        case 'method': {
            if (expr.thisArg === thisArgumentMatcher || expr.thisArg === anyArgumentMatcher)
                return `${$mock}${keyToProp(expr.name)}(${expr.parameters.map(p => p.toString()).join(',')})`;
            return `${$mock}${keyToProp(expr.name)}.apply(${expr.thisArg.toString()}, [${expr.parameters.map(p => p.toString()).join(',')}])`;
        }
        case 'newNested': {
            return `new ${$mock}${keyToProp(expr.name)}(${expr.parameters.map(p => p.toString()).join(',')})`;
        }
        case 'get': {
            return `${$mock}${keyToProp(expr.name)}`;
        }
        case 'set': {
            return `${$mock}${keyToProp(expr.name)} = ${expr.value.toString()}`;
        }
        case 'delete': {
            return `delete ${$mock}${keyToProp(expr.name)}`;
        }
        case 'has': {
            return `Reflect.has(${$mock}, ${keyToSource(expr.name)})`;
        }
        case 'ownKeys': {
            return `Reflect.ownKeys(${$mock})`;
        }
        case 'getPrototype': {
            return `Reflect.getPrototypeOf(${$mock})`;
        }
        case 'setPrototype': {
            return `Reflect.setPrototypeOf(${$mock}, ${expr.value.toString()})`;
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
            return `Reflect.defineProperty(${$mock}, ${keyToSource(expr.name)}, {${definition.join(',')}})`;
        }
        case 'getDescriptor': {
            return `Reflect.getOwnPropertyDescriptor(${$mock}, ${keyToSource(expr.name)})`;
        }
        case 'isExtensible': {
            return `Reflect.isExtensible(${$mock})`;
        }
        case 'preventExtensions': {
            return `Reflect.preventExtensions(${$mock})`;
        }
    }
}

function argToString(value: unknown): string {
    value = PublicArgumentMatcher.reveal(value);
    switch (typeof value) {
        case 'number':
        case 'boolean':
            return value.toString();
        case 'string':
            return JSON.stringify(value);
        case 'bigint':
            return `${value}n`;
        case 'symbol':
            return String(value);
        case 'undefined':
            return 'undefined';
        case 'function': {
            const mock = Mock.fromInstance(value);
            if (mock !== undefined)
                return mock.toString();
            if (/^class\s/.test(Function.prototype.toString.call(value)))
                return `class ${value.name}`;
            return `function ${value.name}`;
        }
        case 'object': {
            if (value === null)
                return 'null';
            const mock = Mock.fromInstance(value);
            if (mock !== undefined)
                return mock.toString();
            if (value instanceof Array)
                return `[${value.map(argToString).join(',')}]`;
            let content;
            // eslint-disable-next-line @typescript-eslint/unbound-method
            if (value.toString !== Object.prototype.toString && Mock.fromInstance(value.toString) === undefined)
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                content = value.toString();
            else if (Symbol.iterator in value && typeof value[Symbol.iterator] === 'function')
                content = `${[...value as Iterable<unknown>].map(v => argToString(v)).join(',')}`;
            else
                content = `${Object.entries(value).map(([k, v]) => `${keyToProp(k, false)}:${argToString(v)}`).join(',')}`;
            const prototype = Object.getPrototypeOf(value) as object | null;
            if (prototype === null || prototype === Object.prototype)
                return `{${content}}`;
            const prototypeMock = Mock.fromInstance(prototype);
            if (prototypeMock !== undefined)
                return `${prototypeMock.toString()}(${content})`;
            const constructorMock = Mock.fromInstance(prototype.constructor);
            if (constructorMock !== undefined)
                return `${constructorMock.toString()}(${content})`;
            if (prototype.constructor.name === '')
                return content;
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
    const $mock = mock.toString();
    switch (invocation.kind) {
        case 'call': {
            if (invocation.this === mock || invocation.this === undefined || hasPrototype(invocation.this, mock.instance))
                return `${$mock}(${invocation.arguments.map(argToString).join(',')})`;
            return `${$mock}.apply(${argToString(invocation.this)}, [${invocation.arguments.map(argToString).join(',')}])`;
        }
        case 'new': {
            if (invocation.this === mock.instance)
                return `new ${$mock}(${invocation.arguments.map(argToString).join(',')})`;
            return `new (class Derived extends ${$mock} {...})(${argToString(invocation.this)}, [${invocation.arguments.map(argToString).join(',')}])`;
        }
        case 'method': {
            if (hasPrototype(invocation.this, mock.instance))
                return `${$mock}${keyToProp(invocation.name)}(${invocation.arguments.map(argToString).join(',')})`;
            return `${$mock}${keyToProp(invocation.name)}.apply(${argToString(invocation.this)}, [${invocation.arguments.map(argToString).join(',')}])`;
        }
        case 'newNested': {
            if (invocation.this === mock.instance)
                return `new ${$mock}${keyToProp(invocation.name)}(${invocation.arguments.map(argToString).join(',')})`;
            return `new (class Derived extends ${$mock}${keyToProp(invocation.name)} {...})(${argToString(invocation.this)}, [${invocation.arguments.map(argToString).join(',')}])`;
        }
        case 'get': {
            return `${$mock}${keyToProp(invocation.name)}`;
        }
        case 'set': {
            return `${$mock}${keyToProp(invocation.name)} = ${argToString(invocation.arguments[0])}`;
        }
        case 'delete': {
            return `delete ${$mock}${keyToProp(invocation.name)}`;
        }
        case 'has': {
            return `Reflect.has(${$mock}, ${keyToSource(invocation.name)})`;
        }
        case 'ownKeys': {
            return `Reflect.ownKeys(${$mock})`;
        }
        case 'getPrototype': {
            return `Reflect.getPrototypeOf(${$mock})`;
        }
        case 'setPrototype': {
            return `Reflect.setPrototypeOf(${$mock}, ${argToString(invocation.arguments[0])})`;
        }
        case 'defineProperty': {
            return `Reflect.defineProperty(${$mock}, ${keyToSource(invocation.name)}, ${argToString(invocation.arguments[0])})`;
        }
        case 'getDescriptor': {
            return `Reflect.getOwnPropertyDescriptor(${$mock}, ${keyToSource(invocation.name)})`;
        }
        case 'isExtensible': {
            return `Reflect.isExtensible(${$mock})`;
        }
        case 'preventExtensions': {
            return `Reflect.preventExtensions(${$mock})`;
        }
    }
}

function isMatch(expression: ExpressionData, invocation: Invocation, mockInstance: unknown): boolean {
    if (expression.kind !== invocation.kind)
        return false;

    switch (expression.kind) {
        case 'call': {
            return expression.thisArg.check(invocation.this, mockInstance)
                && expression.parameters.length === invocation.arguments.length
                && expression.parameters.every((p, i) => p.check(invocation.arguments[i], mockInstance));
        }
        case 'new': {
            return expression.parameters.length === invocation.arguments.length
                && expression.parameters.every((p, i) => p.check(invocation.arguments[i], mockInstance));
        }
        case 'method': {
            return expression.thisArg.check(invocation.this, mockInstance)
                && expression.name === invocation.name
                && expression.parameters.length === invocation.arguments.length
                && expression.parameters.every((p, i) => p.check(invocation.arguments[i], mockInstance));
        }
        case 'newNested': {
            return expression.name === invocation.name
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

const prunedErrors = new WeakSet<MockError>();
function rewriteMockErrorStack<T extends (...args: never) => unknown>(fn: T): T {
    const result = function (...args) {
        try {
            return fn(...args);
        } catch (error) {
            if (error instanceof MockError && !prunedErrors.has(error)) {
                prunedErrors.add(error);
                Error.captureStackTrace(error, result);
            }
            throw error;
        }
    } as T;
    return result;
}

function makeOpaqueProxy<T extends Mockable>(target: T, traps: ProxyHandler<T> & { fallback?: () => never; }): T {
    function getOrDefault<K extends keyof ProxyHandler<T>>(key: K, fallback: NonNullable<ProxyHandler<T>[K]>): NonNullable<ProxyHandler<T>[K]> {
        const impl = traps[key]?.bind(traps) as ProxyHandler<T>[K] ?? traps.fallback ?? fallback;
        return rewriteMockErrorStack(impl);
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

function setCallSpecificity(expr: Extract<Mutable<ExpressionData>, { kind: 'call' | 'method'; }>): void {
    expr.specificity += expr.thisArg.specificity;
    expr.specificity = expr.parameters.reduce((p, c) => p + c.specificity, expr.specificity);
}
function setNewSpecificity(expr: Extract<Mutable<ExpressionData>, { kind: 'new' | 'newNested'; }>): void {
    expr.specificity = expr.parameters.reduce((p, c) => p + c.specificity, expr.specificity);
}

function assertMockableMethod(name: PropertyKey): void {
    if (!canMockDispose) {
        if (name === Symbol.dispose || name === Symbol.asyncDispose) {
            throw new MockError(
                'Cannot implement Symbol.dispose or Symbol.asyncDispose as mock functions as ' +
                'the Javascript runtime does not support Proxied functions in this case.\n\n' +
                'Unsupported:\n' +
                '  -  $mock.setup(m => m[Symbol.dispose]()).returns()\n' +
                '  -  $mock.setup(m => m[Symbol.asyncDispose]()).resolves()\n' +
                '  -  $mock.setup(m => m[Symbol.dispose]).returns(mockedFunction)\n' +
                '  -  $mock.setup(m => m[Symbol.asyncDispose]).returns(mockedFunction)\n' +
                'Supported:\n' +
                '  -  $mock.setup(m => m[Symbol.dispose]).returns(() => {})\n' +
                '  -  $mock.setup(m => m[Symbol.asyncDispose]).returns(() => Promise.resolve())\n' +
                '  -  $mock.setup(m => m[Symbol.dispose]).returns(() => mockedFunction());\n' +
                '  -  $mock.setup(m => m[Symbol.asyncDispose]).returns(() => mockedFunction());\n' +
                '  -  $mock[Symbol.dispose].setup(m => m()).returns();\n' +
                '  -  $mock[Symbol.asyncDispose].setup(m => m()).resolves();'
            );
        }
    }
}

const canMockDispose = (() => {
    try {
        const dispose = new Proxy(() => { }, {});
        using _ = { [Symbol.dispose]: dispose };
        return true;
    } catch {
        return false;
    }
})();

class MockBrand<T extends Mockable> extends class {
    public constructor(target: Mockable) {
        return target;
    }
} {
    // @ts-expect-error Intentional, its is a marker for debugging
    // eslint-disable-next-line no-unused-private-class-members
    readonly #mock: Mock<T>;
    public constructor(target: T, mock: Mock<T>) {
        super(target);
        this.#mock = mock;
    }
}
