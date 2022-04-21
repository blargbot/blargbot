import { IServiceProvider } from '../serviceProviders';
import { Type } from '../types';
import { GetTypes } from '../types/Type';
import { ServiceLifetime } from './ServiceLifetime';

export interface IServiceContainer {
    addConstructor<T, Args extends readonly Type[]>(
        serviceType: Type<T>,
        implementation: new (...args: GetTypes<Args>) => T,
        args: Args,
        lifetime?: ServiceLifetime
    ): this;
    addConstructor<T>(
        serviceType: Type<T>,
        implementation: new () => T,
        lifetime?: ServiceLifetime
    ): this;
    addConstructor<T, Args extends readonly Type[]>(
        implementation: new (...args: GetTypes<Args>) => T,
        args: Args,
        lifetime?: ServiceLifetime
    ): this;
    addConstructor<T>(
        implementation: new () => T,
        lifetime?: ServiceLifetime
    ): this;

    addConstructors<T>(serviceType: Type<T>, implementations: Iterable<new () => T>, lifetime?: ServiceLifetime): this;

    discover(type: new (...args: never) => unknown, lifetime?: ServiceLifetime): this;

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
