import { guard } from '@blargbot/core/utils';
import { StoredUser, StoredUsername, StoredUserSettings, UserDetails, UserTodo } from '@blargbot/domain/models';
import { UserStore } from '@blargbot/domain/stores';
import { Logger } from '@blargbot/logger';

import { RethinkDb } from '../clients';
import { RethinkDbCachedTable } from '../tables/RethinkDbCachedTable';

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

    public async getSetting<K extends keyof StoredUserSettings>(userId: string, key: K, skipCache?: boolean): Promise<StoredUserSettings[K] | undefined> {
        const user = await this.#table.get(userId, skipCache);
        return user?.[key];
    }

    public async setSetting<K extends keyof StoredUserSettings>(userId: string, key: K, value: StoredUserSettings[K]): Promise<boolean> {
        const user = await this.#table.get(userId);
        if (user === undefined)
            return false;

        if (!await this.#table.update(userId, { [key]: this.#table.setExpr(value) }))
            return false;

        setProp(user, key, value as StoredUser[K]);
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

    public async upsert(user: UserDetails): Promise<'inserted' | 'updated' | false> {
        if (user.discriminator === '0000')
            return false;
        const currentUser = await this.#table.get(user.id, true);
        if (currentUser === undefined) {
            if (await this.#table.insert({
                userid: user.id,
                username: user.username,
                usernames: [{
                    name: user.username,
                    date: new Date()
                }],
                isbot: user.bot,
                lastspoke: new Date(),
                discriminator: user.discriminator,
                todo: []
            })) {
                return 'inserted';
            }
        } else {
            const update: Partial<Mutable<StoredUser>> = {};
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

            if (Object.values(update).some(guard.hasValue) && await this.#table.update(user.id, update))
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

function setIfUndefined<Target, Key extends keyof Target>(target: Target, key: Key, value: Exclude<Target[Key], undefined>): Exclude<Target[Key], undefined> {
    return (target[key] ??= value) as Exclude<Target[Key], undefined>;
}

function push<T>(target: readonly T[], ...values: readonly T[]): void {
    (target as T[]).push(...values);
}

function removeAt<T>(target: readonly T[], index: number): readonly T[] {
    return (target as T[]).splice(index, 1);
}
