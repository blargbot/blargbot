import { IServiceProvider, ServiceProvider, ServiceResolver, ServiceResolvers } from '../serviceProviders';
import { Type } from '../types';
import { GetTypes } from '../types/Type';
import { IServiceContainer } from './IServiceContainer';
import { ServiceLifetime } from './ServiceLifetime';
import { ServiceResolutionError } from './ServiceResolutionError';

export class ServiceContainer implements IServiceContainer {
    readonly #resolvers: ServiceResolvers;
    readonly #unknownTypes: Set<symbol>;

    public constructor() {
        this.#resolvers = new Map();
        this.#unknownTypes = new Set();
    }

    public addConstructors<T>(serviceType: Type<T>, implementations: Iterable<new () => T>, lifetime?: ServiceLifetime): this {
        for (const implementation of implementations)
            this.addConstructor(serviceType, implementation, lifetime);
        return this;
    }

    public addConstructor<T, Args extends readonly Type[]>(serviceType: Type<T>, implementation: new (...args: GetTypes<Args>) => T, args: Args, lifetime?: ServiceLifetime): this;
    public addConstructor<T>(serviceType: Type<T>, implementation: new () => T, lifetime?: ServiceLifetime): this;
    public addConstructor<T, Args extends readonly Type[]>(implementation: new (...args: GetTypes<Args>) => T, args: Args, lifetime?: ServiceLifetime): this;
    public addConstructor<T>(implementation: new () => T, lifetime?: ServiceLifetime): this;
    public addConstructor(...args: Parameters<typeof splitAddCtorArgs>): this {
        const [type, impl, dep, lifetime = ServiceLifetime.TRANSIENT] = splitAddCtorArgs(...args);

        if (!isConstructor(impl))
            throw new Error('Implementation must be a new-able function.');

        const factory = makeSafeFactory(type, provider => new impl(...dep.map(d => provider.getService(d))));
        this.#addResolver(type, ctx => ctx[lifetime].resolve(factory, ctx.provider));
        for (const type of dep) {
            if (!this.#resolvers.has(type.id))
                this.#unknownTypes.add(type.id);
        }
        return this;
    }

    public discover<T, Args extends readonly Type[]>(type: new (...args: GetTypes<Args>) => T, lifetime?: ServiceLifetime): this {
        const interfaces = Type.implements(type);
        const args = Type.constructorArgs(type);
        if (args === undefined)
            return this;
        let t = type as (new (...args: never) => unknown) | null | undefined;
        while (typeof t === 'function' && t !== Object) {
            this.addConstructor(Type.instanceOf(t), type, args as Args, lifetime);
            const baseProto = Object.getPrototypeOf(t.prototype) as ({ constructor: new (...args: never) => unknown; }) | null | undefined;
            t = baseProto?.constructor;
        }
        for (const iType of interfaces)
            this.addConstructor(iType, type, args as Args, lifetime);
        return this;
    }

    public addFactory<T>(serviceType: Type<T>, factory: (provider: IServiceProvider) => T, lifetime?: ServiceLifetime): this {
        const _lifetime = lifetime ?? ServiceLifetime.TRANSIENT;
        factory = makeSafeFactory(serviceType, factory);
        this.#addResolver(serviceType, ctx => ctx[_lifetime].resolve(factory, ctx.provider));
        return this;
    }

    public addInstance<T>(serviceType: Type<T>, value: T): this {
        const factory = makeSafeFactory(serviceType, () => value);
        this.#addResolver(serviceType, ctx => ctx.singleton.resolve(factory, ctx.provider));
        return this;
    }

    #addResolver<T>(type: Type<T>, resolver: ServiceResolver): void {
        let resolvers = this.#resolvers.get(type.id);
        if (resolvers === undefined) {
            this.#resolvers.set(type.id, resolvers = []);
            this.#unknownTypes.delete(type.id);
        }
        resolvers.push(resolver);
    }

    public getResolvers(): ServiceResolvers {
        const resolvers: ServiceResolvers = new Map();
        for (const [type, r] of this.#resolvers)
            resolvers.set(type, r.slice(0));
        return resolvers;
    }

    public buildServiceProvider(): IServiceProvider {
        const resolvers: ServiceResolvers = new Map();
        for (const [id, r] of this.#resolvers)
            resolvers.set(id, r.slice(0));

        for (const id of [...resolvers.keys()]) {
            const elem = Type.get(id);
            if (!resolvers.has(elem.iterable.id))
                resolvers.set(elem.iterable.id, [p => p.provider.getServices(elem)]);
            if (!resolvers.has(elem.array.id))
                resolvers.set(elem.array.id, [p => [...p.provider.getServices(elem)]]);
            if (!resolvers.has(elem.readonlyArray.id))
                resolvers.set(elem.readonlyArray.id, [p => [...p.provider.getServices(elem)]]);
        }

        const missing = [...this.#unknownTypes].filter(t => !resolvers.has(t) && t !== Type.serviceProvider.id);
        if (missing.length > 0) {
            throw new Error(`The following types haven't been given a resolution method:
===========================================
${missing.map(t => Type.get(t).name).join('\n')}`);
        }

        return new ServiceProvider(resolvers);
    }
}

function makeSafeFactory<T>(type: Type<T>, resolver: (provider: IServiceProvider) => T): (provider: IServiceProvider) => T {
    return (...args) => {
        try {
            return resolver(...args);
        } catch (err: unknown) {
            throw new ServiceResolutionError(type, err);
        }
    };
}

function splitAddCtorArgs(...args:
    | readonly [serviceType: Type<unknown>, implementation: new (...args: unknown[]) => unknown, args: ReadonlyArray<Type<unknown>>, lifetime: ServiceLifetime]

    | readonly [serviceType: Type<unknown>, implementation: new (...args: unknown[]) => unknown, args: ReadonlyArray<Type<unknown>>]
    | readonly [serviceType: Type<unknown>, implementation: new () => unknown, lifetime: ServiceLifetime]
    | readonly [implementation: new (...args: unknown[]) => unknown, args: ReadonlyArray<Type<unknown>>, lifetime: ServiceLifetime]

    | readonly [implementation: new (...args: unknown[]) => unknown, args: ReadonlyArray<Type<unknown>>]
    | readonly [implementation: new () => unknown, lifetime: ServiceLifetime]
    | readonly [serviceType: Type<unknown>, implementation: new () => unknown]

    | readonly [implementation: new () => unknown]
): readonly [serviceType: Type<unknown>, implementation: new (...args: unknown[]) => unknown, args: ReadonlyArray<Type<unknown>>, lifetime?: ServiceLifetime] {
    const x = args;

    switch (x.length) {
        case 1: return [Type.instanceOf(x[0]), x[0], []];
        case 4: return x;
        case 2:
            if (x[0] instanceof Type)
                return [x[0], x[1], []] as ReturnType<typeof splitAddCtorArgs>;
            if (typeof x[1] === 'string')
                return [Type.instanceOf(x[0]), x[0], [], x[1]];
            return [Type.instanceOf(x[0]), x[0], x[1]] as ReturnType<typeof splitAddCtorArgs>;
        case 3:
            if (!(x[0] instanceof Type))
                return [Type.instanceOf(x[0]), x[0], x[1], x[2]] as ReturnType<typeof splitAddCtorArgs>;
            if (typeof x[2] === 'string')
                return [x[0], x[1], [], x[2]] as ReturnType<typeof splitAddCtorArgs>;
            return [x[0], x[1], x[2]] as ReturnType<typeof splitAddCtorArgs>;
    }
}

function isConstructor(value: unknown): value is new (...args: never) => object {
    if (typeof value !== 'function' || value === Symbol)
        return false;
    try {
        Reflect.construct(String, [], value);
        return true;
    } catch (err: unknown) {
        if (err instanceof TypeError && err.message.endsWith('is not a constructor'))
            return false;
        throw err;
    }
}
