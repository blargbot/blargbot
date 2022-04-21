import { Type } from '../types';

export interface IServiceProvider {
    getService<T>(name: Type<T>): T;
    getServices<T>(name: Type<T>): Iterable<T>;
    withScope(callback: (provider: IServiceProvider) => void): void;
    withScope(callback: (provider: IServiceProvider) => Promise<void>): Promise<void>;
    withScope(callback: (provider: IServiceProvider) => Awaitable<void>): Awaitable<void>;
}
