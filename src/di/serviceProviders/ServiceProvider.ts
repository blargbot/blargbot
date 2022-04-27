import { CachingServiceScope, IServiceScope } from '../scopes';
import { Type } from '../types';
import { IServiceProvider } from './IServiceProvider';
import { ResolutionServiceProvider } from './ResolutionServiceProvider';
import { ScopedServiceProvider } from './ScopedServiceProvider';
import { ServiceResolvers } from './types';

export class ServiceProvider implements IServiceProvider {
    readonly #resolvers: ServiceResolvers;
    readonly #rootScope: IServiceScope;

    public constructor(resolvers: ServiceResolvers) {
        this.#resolvers = new Map(resolvers);
        this.#rootScope = new CachingServiceScope();
        if (!this.#resolvers.has(Type.serviceProvider.id))
            this.#resolvers.set(Type.serviceProvider.id, [() => this]);
    }

    public getService<T>(type: Type<T>): T {
        return new ResolutionServiceProvider(this.#resolvers, this.#rootScope, undefined).getService(type);
    }

    public getServices<T>(type: Type<T>): Iterable<T> {
        return new ResolutionServiceProvider(this.#resolvers, this.#rootScope, undefined).getServices(type);
    }

    public withScope(callback: (provider: IServiceProvider) => void): void
    public withScope(callback: (provider: IServiceProvider) => Promise<void>): Promise<void>
    public withScope(callback: (provider: IServiceProvider) => Awaitable<void>): Awaitable<void>
    public withScope(callback: (provider: IServiceProvider) => Awaitable<void>): Awaitable<void> {
        return ScopedServiceProvider.eval(this.#resolvers, this.#rootScope, callback);
    }
}
