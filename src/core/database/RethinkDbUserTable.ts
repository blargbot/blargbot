import { RethinkDb } from './core/RethinkDb';
import { User } from 'eris';
import { RethinkDbCachedTable } from './core/RethinkDbCachedTable';
import { StoredUser, UserTable } from './types';

export class RethinkDbUserTable extends RethinkDbCachedTable<'user', 'userid'> implements UserTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: CatLogger
    ) {
        super('user', 'userid', rethinkDb, logger);
    }

    public async get(userId: string, skipCache = false): Promise<DeepReadOnly<StoredUser> | undefined> {
        return await this.rget(userId, skipCache);
    }

    public async add(user: StoredUser): Promise<boolean> {
        return await this.rinsert(user);
    }

    public async upsert(user: User): Promise<boolean> {
        if (user.discriminator === '0000')
            return false;
        const currentUser = await this.rget(user.id, true);
        if (currentUser === undefined) {
            this.logger.debug(`inserting user ${user.id} (${user.username})`);
            return await this.add({
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
            });
        } else {
            const update: Partial<StoredUser> = {};
            if (currentUser.username != user.username) {
                currentUser.username = update.username = user.username;
                update.usernames = currentUser.usernames;
                update.usernames.push({
                    name: user.username,
                    date: new Date()
                });
            }
            if (currentUser.discriminator != user.discriminator) {
                currentUser.discriminator = update.discriminator = user.discriminator;
            }
            if (currentUser.avatarURL != user.avatarURL) {
                currentUser.avatarURL = update.avatarURL = user.avatarURL;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const _ in update)
                return await this.rupdate(user.id, update);
        }
        return false;
    }

    public async setTagReport(userId: string, tagName: string, reason: string | undefined): Promise<boolean> {
        const user = await this.rget(userId);
        if (!user)
            return false;

        const reports = user.reports ??= {};
        if (reason !== undefined)
            reports[tagName] = reason;
        else
            delete reports[tagName];

        return await this.rupdate(userId, r => ({
            reports: {
                [tagName]: reason === undefined ? r.literal() : reason
            }
        }));
    }
}