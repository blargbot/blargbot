import { RethinkDb, RethinkDbCachedTable } from './core';
import { User } from 'eris';
import { MutableStoredUser, StoredUser, StoredUserSettings, UserTable } from './types';
import { Logger } from '@core/Logger';
import { guard } from '@core/utils';

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

    public async get(userId: string, skipCache = false): Promise<StoredUser | undefined> {
        return await this.rget(userId, skipCache);
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
            if (currentUser.avatarURL !== user.avatarURL) {
                currentUser.avatarURL = update.avatarURL = user.avatarURL;
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
}
