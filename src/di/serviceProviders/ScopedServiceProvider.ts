import { CachingServiceScope, IServiceScope } from '../scopes';
import { Type } from '../types';
import { IServiceProvider } from './IServiceProvider';
import { ResolutionServiceProvider } from './ResolutionServiceProvider';
import { ServiceResolvers } from './types';

export class ScopedServiceProvider implements IServiceProvider {
    public static eval(resolvers: ServiceResolvers, rootScope: IServiceScope, callback: (provider: IServiceProvider) => Awaitable<void>): Awaitable<void> {
        const scope = new ScopedServiceProvider(resolvers, rootScope);
        let result;
        try {
            result = callback(scope);
        } finally {
            if (result instanceof Promise)
                result.finally(() => scope.dispose());
            scope.dispose();
        }
        return result;
    }

    readonly #resolvers: ServiceResolvers;
    readonly #rootScope: IServiceScope;
    #_currentScope?: CachingServiceScope;

    get #currentScope(): CachingServiceScope {
        if (this.#_currentScope === undefined)
            throw new Error('Scope has been disposed!');
        return this.#_currentScope;
    }

    private constructor(resolvers: ServiceResolvers, rootScope: IServiceScope) {
        this.#resolvers = resolvers;
        this.#rootScope = rootScope;
        this.#_currentScope = new CachingServiceScope();
    }

    public getService<T>(type: Type<T>): T {
        return new ResolutionServiceProvider(this.#resolvers, this.#rootScope, this.#currentScope).getService(type);
    }

    public getServices<T>(type: Type<T>): Iterable<T> {
        return new ResolutionServiceProvider(this.#resolvers, this.#rootScope, this.#currentScope).getServices(type);
    }

    public withScope(callback: (provider: IServiceProvider) => void): void
    public withScope(callback: (provider: IServiceProvider) => Promise<void>): Promise<void>
    public withScope(callback: (provider: IServiceProvider) => Awaitable<void>): Awaitable<void>
    public withScope(callback: (scope: IServiceProvider) => Awaitable<void>): Awaitable<void> {
        return ScopedServiceProvider.eval(this.#resolvers, this.#rootScope, callback);
    }

    public dispose(): void {
        this.#_currentScope?.dispose();
        this.#_currentScope = undefined;
    }
}
