declare module 'redis-lock' {
    import type { RedisClientType } from 'redis';

    export interface RedisLockProvider {
        (key: string, timeoutMs?: number): Promise<RedisLock>;
    }

    export interface RedisLock {
        (): Promise<void>;
    }

    function createLockProvider(client: RedisClientType, retryDelayMs?: number): RedisLockProvider;

    export = createLockProvider
}
