import 'module-alias/register';

import config from '@config';
import { Database } from '@core/database';
import { createLogger, Logger } from '@core/Logger';
import { guard } from '@core/utils';
import { AnyChannel, Client as Discord } from 'discord.js';

void (async function () {
    // This is for migrating from the js blarg to the ts blarg
    const logger = createLogger(config, 'MIGRATE');
    const discord = new Discord({
        intents: [
        ],
        shardCount: 100,
        shards: [0]
    });
    const database = new Database({
        discord: discord,
        cassandra: config.cassandra,
        logger: logger,
        postgres: config.postgres,
        rethinkDb: config.rethink
    });

    await Promise.all([
        discord.login(config.discord.token),
        database.connect()
    ]);

    await Promise.allSettled([
        migrateChangelog(discord, database, logger)
    ]);

    process.exit();
})();

/** TS blarg now uses the news channel feature for changelogs. This subscribes all channels that were using the old method to the new one and then clears the DB */
async function migrateChangelog(discord: Discord, database: Database, logger: Logger): Promise<void> {
    const changelogs = <{ guilds: Record<string, string>; } | undefined>await database.vars.get('changelog');
    await discord.guilds.fetch(config.discord.guilds.home);
    const changelogChannel = <AnyChannel | null>await discord.channels.fetch(config.discord.channels.changelog);
    if (changelogChannel === null || changelogChannel.type !== 'GUILD_NEWS' || !('addFollower' in changelogChannel)) {
        logger.error('[migrateChangelog] Cannot locate changelog news channel');
        return;
    }

    const unmigrated = { ...changelogs?.guilds ?? {} };
    for (const [guildId, channelId] of Object.entries(unmigrated)) {
        try {
            const channel = await discord.channels.fetch(channelId, { allowUnknownGuild: true });
            if (channel !== null && guard.isTextableChannel(channel)) {
                try {
                    await changelogChannel.addFollower(channel.id, 'Blargbot changelogs moved to news channels');
                    await channel.send('Hi! Ive recently received an update to how changelogs work. This channel was subscribed, so I have migrated it to the new method! You can unsubscribe by running `b!changelog unsubscribe`');
                } catch (ex: unknown) {
                    logger.error('[migrateChangelog] Guild:', guildId, 'Channel:', channelId, ex);
                    await channel.send('Hi! Ive recently received an update to how changelogs work. This channel was subscribed, but I wasnt able to update it to the new method. Please run `b!changelog subscribe` to fix this!');
                }
            }
            delete unmigrated[guildId];
        } catch (ex: unknown) {
            logger.error('[migrateChangelog] Guild:', guildId, 'Channel:', channelId, ex);
        }
    }

    await database.vars.delete('changelog');

    const failed = Object.entries(unmigrated);
    const success = Object.keys(changelogs?.guilds ?? {}).length - failed.length;
    logger.info('[migrateChangelog] Complete.', success, 'channels updated.', failed.length, 'channels failed:', unmigrated);
}
