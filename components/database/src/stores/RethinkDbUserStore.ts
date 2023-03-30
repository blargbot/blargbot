import type { ResettableStoredUserData, StoredUser, StoredUsername, UserDetails, UserTodo } from '@blargbot/domain/models/index.js';
import type { UserStore } from '@blargbot/domain/stores/index.js';
import type { Logger } from '@blargbot/logger';
import type { UpdateData } from 'rethinkdb';

import type { RethinkDb } from '../clients/index.js';
import { RethinkDbCachedTable } from '../tables/RethinkDbCachedTable.js';

export class RethinkDbUserStore implements UserStore {
    readonly #table: RethinkDbCachedTable<StoredUser, 'userid'>;

    public constructor(
        rethinkDb: RethinkDb,
        logger: Logger,
        shouldCache: (id: string) => boolean
    ) {
        this.#table = new RethinkDbCachedTable('user', 'userid', rethinkDb, logger);
        this.#table.watchChanges(shouldCache);
    }

    public async getProp<K extends keyof StoredUser>(userId: string, key: K, skipCache?: boolean): Promise<StoredUser[K] | undefined> {
        const user = await this.#table.get(userId, skipCache);
        return user?.[key];
    }

    public async setProp<K extends keyof StoredUser>(userId: string, key: K, value: StoredUser[K]): Promise<boolean> {
        const user = await this.#table.get(userId);
        if (user === undefined)
            return false;

        if (!await this.#table.update(userId, { [key]: this.#table.setExpr(value) }))
            return false;

        setProp(user, key, value);
        return true;
    }

    public async get(userId: string, skipCache = false): Promise<StoredUser | undefined> {
        return await this.#table.get(userId, skipCache);
    }

    public async removeUsernames(userId: string, usernames: readonly string[] | 'all'): Promise<boolean> {
        const user = await this.#table.get(userId);
        if (user === undefined)
            return false;

        const success = await this.#table.update(userId, user => ({
            usernames: usernames === 'all' ? [] : user('usernames').filter(username => this.#table.expr([...usernames]).contains<string[]>(username('name')).not())
        }));

        if (!success)
            return false;

        if (usernames === 'all')
            setProp(user, 'usernames', []);
        else {
            const nameLookup = new Set(usernames);
            setProp(user, 'usernames', user.usernames.filter(username => !nameLookup.has(username.name)));
        }

        return true;
    }

    public async getUsernames(userId: string, skipCache?: boolean): Promise<readonly StoredUsername[] | undefined> {
        const user = await this.#table.get(userId, skipCache);
        if (user === undefined)
            return undefined;

        return user.usernames;
    }

    public async reset(user: UserDetails): Promise<'inserted' | 'updated' | false> {
        return await this.#upsert(user, v => {
            v.usernames = [{ name: user.username, date: new Date() }];
            Object.assign(v, userDefaults);
            for (const entry of Object.entries(v))
                v[entry[0]] = this.#table.setExpr(entry[1]) as never;
        });
    }

    public async upsert(user: UserDetails): Promise<'inserted' | 'updated' | false> {
        return await this.#upsert(user);
    }

    async #upsert(user: UserDetails, transform?: (value: UpdateData<Mutable<StoredUser>>) => void): Promise<'inserted' | 'updated' | false> {
        if (user.discriminator === '0000')
            return false;
        const currentUser = await this.#table.get(user.id, true);
        if (currentUser === undefined) {
            const insert: StoredUser = {
                userid: user.id,
                username: user.username,
                usernames: [{
                    name: user.username,
                    date: new Date()
                }],
                discriminator: user.discriminator,
                todo: []
            };

            transform?.(insert);

            if (await this.#table.insert(insert))
                return 'inserted';
        } else {
            const update: UpdateData<Mutable<StoredUser>> = {};
            if (currentUser.username !== user.username) {
                setProp(currentUser, 'username', update.username = user.username);
                update.usernames = currentUser.usernames;
                push(update.usernames, {
                    name: user.username,
                    date: new Date()
                });
            }
            if (currentUser.discriminator !== user.discriminator)
                setProp(currentUser, 'discriminator', update.discriminator = user.discriminator);

            if (currentUser.avatarURL !== user.avatarURL)
                setProp(currentUser, 'avatarURL', update.avatarURL = user.avatarURL);

            transform?.(update);

            if (Object.keys(update).length > 0 && await this.#table.update(user.id, update))
                return 'updated';
        }

        return false;
    }

    public async setTagReport(userId: string, tagName: string, reason: string | undefined): Promise<boolean> {
        const user = await this.#table.get(userId);
        if (user === undefined)
            return false;

        if (!await this.#table.update(userId, { reports: { [tagName]: this.#table.setExpr(reason) } }))
            return false;

        const reports = setIfUndefined(user, 'reports', {});
        setProp(reports, tagName, reason);
        return true;
    }

    public async addPrefix(userId: string, prefix: string): Promise<boolean> {
        const user = await this.#table.get(userId);
        if (user === undefined)
            return false;

        const success = await this.#table.update(userId, user => ({
            prefixes: user('prefixes').default([]).setInsert(prefix)
        }));

        if (!success)
            return false;

        const oldLength = user.prefixes?.length ?? 0;
        const prefixes = setProp(user, 'prefixes', [...new Set([...user.prefixes ?? [], prefix])]);
        return oldLength !== prefixes.length;
    }

    public async removePrefix(userId: string, prefix: string): Promise<boolean> {
        const user = await this.#table.get(userId);
        if (user === undefined)
            return false;

        const success = await this.#table.update(userId, user => ({
            prefixes: user('prefixes').default([]).filter(p => p.ne(prefix))
        }));

        if (!success)
            return false;

        const oldLength = user.prefixes?.length;
        setProp(user, 'prefixes', user.prefixes?.filter(p => p !== prefix));
        return oldLength !== user.prefixes?.length;
    }

    public async getTodo(userId: string, skipCache?: boolean): Promise<readonly string[] | undefined> {
        const user = await this.#table.get(userId, skipCache);
        if (user === undefined)
            return undefined;

        return user.todo.filter(t => t.active === 1).map(t => t.content);
    }

    public async addTodo(userId: string, item: string): Promise<boolean> {
        const user = await this.#table.get(userId);
        if (user === undefined)
            return false;

        const todo: UserTodo = {
            active: 1,
            content: item
        };

        if (!await this.#table.update(userId, u => ({ todo: u('todo').append(todo) })))
            return false;

        push(user.todo, todo);
        return true;
    }

    public async removeTodo(userId: string, index: number): Promise<boolean> {
        const user = await this.#table.get(userId);
        if (user === undefined)
            return false;

        if (!await this.#table.update(userId, u => ({ todo: u('todo').deleteAt(index).filter(t => t('active').eq(1)) })))
            return false;

        return removeAt(user.todo, index).length === 1;
    }
}

function setProp<Target, Key extends keyof Target, Value extends Target[Key]>(target: Target, key: Key, value: Value): Value {
    if (value as unknown === undefined)
        delete target[key];
    else
        target[key] = value;
    return value;
}

function setIfUndefined<Target, Key extends keyof Target>(target: Target, key: Key, value: Exclude<Target[Key], undefined>): Exclude<Target[Key], undefined>
function setIfUndefined<Key extends PropertyKey, Target extends { [P in Key]?: unknown }>(target: Target, key: Key, value: Exclude<Target[Key], undefined>): Exclude<Target[Key], undefined> {
    return (target[key] ??= value) as Exclude<Target[Key], undefined>;
}

function push<T>(target: readonly T[], ...values: readonly T[]): void {
    (target as T[]).push(...values);
}

function removeAt<T>(target: readonly T[], index: number): readonly T[] {
    return (target as T[]).splice(index, 1);
}

const userDefaults: { [P in keyof Required<ResettableStoredUserData>]: ResettableStoredUserData[P] } = {
    dontdmerrors: undefined,
    prefixes: undefined,
    timezone: undefined,
    todo: []
};
