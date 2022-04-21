import { IServiceProvider } from '../serviceProviders';
import { IServiceScope } from './IServiceScope';

export class CachingServiceScope implements IServiceScope {
    #_resultCache?: Map<(provider: IServiceProvider) => unknown, { v: unknown; }>;
    get #resultCache(): Map<(provider: IServiceProvider) => unknown, { v: unknown; }> {
        if (this.#_resultCache === undefined)
            throw new Error('Scope cache has been disposed');
        return this.#_resultCache;
    }

    public constructor() {
        this.#_resultCache = new Map<(provider: IServiceProvider) => unknown, { v: unknown; }>();
    }

    public resolve<T>(factory: (provider: IServiceProvider) => T, provider: IServiceProvider): T {
        let result = this.#resultCache.get(factory);
        if (result === undefined)
            this.#resultCache.set(factory, result = { v: factory(provider) });
        return result.v as T;
    }

    public dispose(): void {
        this.#_resultCache?.clear();
        this.#_resultCache = undefined;
    }
}
