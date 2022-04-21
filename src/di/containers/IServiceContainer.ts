import { IServiceProvider } from '../serviceProviders';
import { Type } from '../types';
import { ServiceLifetime } from './ServiceLifetime';

export interface IServiceContainer {
    addConstructor<T, Args extends readonly unknown[]>(
        serviceType: Type<T>,
        implementation: new (...args: Args) => T,
        args: { readonly [P in keyof Args]: Type<Args[P]> },
        lifetime?: ServiceLifetime
    ): this;
    addConstructor<T>(
        serviceType: Type<T>,
        implementation: new () => T,
        lifetime?: ServiceLifetime
    ): this;
    addConstructor<T, Args extends readonly unknown[]>(
        implementation: new (...args: Args) => T,
        args: { readonly [P in keyof Args]: Type<Args[P]> },
        lifetime?: ServiceLifetime
    ): this;
    addConstructor<T>(
        implementation: new () => T,
        lifetime?: ServiceLifetime
    ): this;

    addConstructors<T>(serviceType: Type<T>, implementations: Iterable<new () => T>, lifetime?: ServiceLifetime): this;

    addFactory<T>(
        serviceType: Type<T>,
        factory: (provider: IServiceProvider) => T,
        lifetime?: ServiceLifetime
    ): this;

    addInstance<T>(
        serviceType: Type<T>,
        value: T
    ): this;

    buildServiceProvider(): IServiceProvider;
}
