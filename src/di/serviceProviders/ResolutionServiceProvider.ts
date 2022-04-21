import { ServiceResolutionContext } from '../contexts';
import { IServiceScope } from '../scopes';
import { Type } from '../types';
import { IServiceProvider } from './IServiceProvider';
import { ScopedServiceProvider } from './ScopedServiceProvider';
import { ServiceResolvers } from './types';

export class ResolutionServiceProvider implements IServiceProvider {
    readonly #context: ServiceResolutionContext;
    readonly #resolvers: ServiceResolvers;
    readonly #parent: IServiceProvider;

    public constructor(parent: IServiceProvider, resolvers: ServiceResolvers, rootScope: IServiceScope, currentScope: IServiceScope | undefined) {
        this.#parent = parent;
        this.#resolvers = resolvers;
        this.#context = new ServiceResolutionContext(this, rootScope, currentScope);
    }

    public getService<T>(type: Type<T>): T {
        const resolvers = this.#resolvers.get(type.id);
        if (!Array.isArray(resolvers) || resolvers.length === 0)
            throw new Error(`No services were registered for ${type.name}`);
        return resolvers[0](this.#context) as T;
    }

    public getServices<T>(type: Type<T>): Iterable<T> {
        if (type as unknown === Type.serviceProvider)
            return [this.#parent as unknown as T];

        const resolvers = this.#resolvers.get(type.id) ?? [];
        return new CachedIterable(new MappedIterable(resolvers, r => r(this.#context) as T));
    }

    public withScope(callback: (provider: IServiceProvider) => void): void
    public withScope(callback: (provider: IServiceProvider) => Promise<void>): Promise<void>
    public withScope(callback: (provider: IServiceProvider) => Awaitable<void>): Awaitable<void>
    public withScope(callback: (provider: IServiceProvider) => Awaitable<void>): Awaitable<void> {
        return ScopedServiceProvider.eval(this.#resolvers, this.#context.singleton, callback);
    }
}

class MappedIterable<Source, Result> implements Iterable<Result> {
    readonly #source: Iterable<Source>;
    readonly #mapping: (value: Source) => Result;

    public constructor(source: Iterable<Source>, mapping: (value: Source) => Result) {
        this.#source = source;
        this.#mapping = mapping;
    }

    public *[Symbol.iterator](): Iterator<Result, void, never> {
        for (const elem of this.#source)
            yield this.#mapping(elem);
    }
}

class CachedIterable<T> implements Iterable<T> {
    #source?: Iterable<T>;
    readonly #results: T[];
    #iter?: Iterator<T, void, never>;

    public constructor(source: Iterable<T>) {
        this.#source = source;
        this.#results = [];
    }

    public *[Symbol.iterator](): Iterator<T, void, never> {
        if (this.#source === undefined) {
            yield* this.#results;
            return;
        }

        this.#iter ??= this.#source[Symbol.iterator]();
        let i = 0;
        while (true) {
            for (; i < this.#results.length; i++)
                yield this.#results[i];
            const next = this.#iter.next();
            if (next.done === true)
                break;
            this.#results.push(next.value);
        }

        this.#iter = undefined;
        this.#source = undefined;
    }
}
