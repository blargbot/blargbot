import { ServiceResolutionContext } from '../contexts';
import { IServiceScope } from '../scopes';
import { Type } from '../types';
import { CachedIterable, MappedIterable } from '../util';
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
        if (type as unknown === Type.serviceProvider)
            return this.#parent as unknown as T;

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
