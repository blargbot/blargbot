import { Logger } from '@core/Logger';
import { MutableStoredUser, StoredUser, StoredUsername, StoredUserSettings, UserTable, UserTodo } from '@core/types';
import { guard } from '@core/utils';
import { User } from 'discord.js';

import { RethinkDb, RethinkDbCachedTable } from './base';

export class RethinkDbUserTable extends RethinkDbCachedTable<'user', 'userid'> implements UserTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        super('user', 'userid', rethinkDb, logger);
    }

    public async getSetting<K extends keyof StoredUserSettings>(userId: string, key: K, skipCache?: boolean): Promise<StoredUserSettings[K] | undefined> {
        const user = await this.rget(userId, skipCache);
        return user?.[key];
    }

    public async setSetting<K extends keyof StoredUserSettings>(userId: string, key: K, value: StoredUserSettings[K]): Promise<boolean> {
        const user = await this.rget(userId);
        if (user === undefined)
            return false;

        if (!await this.rupdate(userId, { [key]: this.setExpr(value) }))
            return false;

        if (value === undefined)
            delete user[key];
        else
            user[key] = value as MutableStoredUser[K];

        return true;
    }

    public async get(userId: string, skipCache = false): Promise<StoredUser | undefined> {
        return await this.rget(userId, skipCache);
    }

    public async removeUsernames(userId: string, usernames: readonly string[] | 'all'): Promise<boolean> {
        const user = await this.rget(userId);
        if (user === undefined)
            return false;

        const success = await this.rupdate(userId, user => ({
            usernames: usernames === 'all' ? [] : user('usernames').filter(username => this.expr([...usernames]).contains<string>(username('name')).not())
        }));

        if (!success)
            return false;

        if (usernames === 'all')
            user.usernames = [];
        else {
            const nameLookup = new Set(usernames);
            user.usernames = user.usernames.filter(username => !nameLookup.has(username.name));
        }

        return true;
    }

    public async getUsernames(userId: string, skipCache?: boolean): Promise<readonly StoredUsername[] | undefined> {
        const user = await this.rget(userId, skipCache);
        if (user === undefined)
            return undefined;

        return user.usernames;
    }

    public async upsert(user: User): Promise<'inserted' | 'updated' | false> {
        if (user.discriminator === '0000')
            return false;
        const currentUser = await this.rget(user.id, true);
        if (currentUser === undefined) {
            if (await this.rinsert({
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
            const update: Partial<MutableStoredUser> = {};
            if (currentUser.username !== user.username) {
                currentUser.username = update.username = user.username;
                update.usernames = currentUser.usernames;
                update.usernames.push({
                    name: user.username,
                    date: new Date()
                });
            }
            if (currentUser.discriminator !== user.discriminator) {
                currentUser.discriminator = update.discriminator = user.discriminator;
            }

            const avatarUrl = user.displayAvatarURL({ dynamic: true, format: 'png', size: 512 });
            if (currentUser.avatarURL !== avatarUrl) {
                currentUser.avatarURL = update.avatarURL = avatarUrl;
            }

            if (Object.values(update).some(guard.hasValue) && await this.rupdate(user.id, update))
                return 'updated';
        }

        return false;
    }

    public async setTagReport(userId: string, tagName: string, reason: string | undefined): Promise<boolean> {
        const user = await this.rget(userId);
        if (user === undefined)
            return false;

        if (!await this.rupdate(userId, { reports: { [tagName]: this.setExpr(reason) } }))
            return false;

        const reports = user.reports ??= {};
        if (reason !== undefined)
            reports[tagName] = reason;
        else
            delete reports[tagName];

        return true;
    }

    public async addPrefix(userId: string, prefix: string): Promise<boolean> {
        const user = await this.rget(userId);
        if (user === undefined)
            return false;

        const success = await this.rupdate(userId, user => ({
            prefixes: user('prefixes').default([]).setInsert(prefix)
        }));

        if (!success)
            return false;

        const oldLength = user.prefixes?.length ?? 0;
        user.prefixes = [...new Set([...user.prefixes ?? [], prefix])];
        return oldLength !== user.prefixes.length;
    }

    public async removePrefix(userId: string, prefix: string): Promise<boolean> {
        const user = await this.rget(userId);
        if (user === undefined)
            return false;

        const success = await this.rupdate(userId, user => ({
            prefixes: user('prefixes').default([]).filter(p => p.ne(prefix))
        }));

        if (!success)
            return false;

        const oldLength = user.prefixes?.length;
        user.prefixes = user.prefixes?.filter(p => p !== prefix);
        return oldLength !== user.prefixes?.length;
    }

    public async getTodo(userId: string, skipCache?: boolean): Promise<readonly string[] | undefined> {
        const user = await this.rget(userId, skipCache);
        if (user === undefined)
            return undefined;

        return user.todo.filter(t => t.active === 1).map(t => t.content);
    }

    public async addTodo(userId: string, item: string): Promise<boolean> {
        const user = await this.rget(userId);
        if (user === undefined)
            return false;

        const todo: UserTodo = {
            active: 1,
            content: item
        };

        if (!await this.rupdate(userId, u => ({ todo: u('todo').append(todo) })))
            return false;

        user.todo.push(todo);
        return true;
    }

    public async removeTodo(userId: string, index: number): Promise<boolean> {
        const user = await this.rget(userId);
        if (user === undefined)
            return false;

        if (!await this.rupdate(userId, u => ({ todo: u('todo').deleteAt(index).filter(t => t('active').eq(1)) })))
            return false;

        return user.todo.splice(index, 1).length === 1;
    }
}
