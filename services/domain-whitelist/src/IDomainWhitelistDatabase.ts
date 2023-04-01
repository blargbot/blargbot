export interface IDomainWhitelistDatabase {
    set(domain: string, whitelisted: boolean): Awaitable<void>;
    check(domain: string): Awaitable<boolean>;
}
