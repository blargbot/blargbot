import { Cluster } from '@cluster';
import { snowflake } from '@cluster/utils';
import { guard } from '@core/utils';
import { Snowflake } from 'catflake';
import { GuildMessage, Message } from 'discord.js';
import EventEmitter from 'eventemitter3';

export class MessageAwaitManager {
    private readonly emitter: EventEmitter;
    private readonly channelSnowflakeMap: Map<string, Snowflake[]>;
    private readonly snowflakeMap: Map<Snowflake, { users?: string[]; channels: string[]; }>;

    public constructor(
        private readonly cluster: Cluster
    ) {
        this.emitter = new EventEmitter();
        this.channelSnowflakeMap = new Map();
        this.snowflakeMap = new Map();
    }

    public awaitTagMessage(
        channels: string[],
        users?: string[],
        checkFunction?: (message: GuildMessage) => Promise<boolean>,
        timeout = 300000
    ): Promise<GuildMessage | string> {
        const awaitMessageSnowflake = snowflake.create();
        const snowflakeStr = awaitMessageSnowflake.toString();
        this.addSnowflake(awaitMessageSnowflake, { channels, users });

        const check = checkFunction !== undefined ? checkFunction : () => true;

        return new Promise((resolve) => {
            const waitTimeout = setTimeout(() => {
                this.emitter.emit('resolve_' + snowflakeStr, 'Wait timed out after ' + timeout.toString());
            }, timeout);

            const reactionHandler = (message: GuildMessage): void => {
                void (async () => {
                    const checkResponse = await check(message);
                    this.emitter.emit('checked_' + snowflakeStr + message.id, checkResponse);
                    if (checkResponse) {
                        clearTimeout(waitTimeout);
                        this.emitter.emit('resolve_' + snowflakeStr, message);
                    }
                })();
            };
            this.emitter.on('check_' + snowflakeStr, reactionHandler);
            this.emitter.once('resolve_' + snowflakeStr, (result: GuildMessage | string) => {
                this.emitter.removeListener('check_' + snowflakeStr, reactionHandler);
                this.removeSnowflake(awaitMessageSnowflake);
                resolve(result);
            });
        });
    }

    public async checkMessage(
        message: Message
    ): Promise<boolean> {
        if (!guard.isGuildMessage(message))
            return false;
        const snowflakes = this.channelSnowflakeMap.get(message.channel.id);
        if (snowflakes === undefined)
            return false;

        const matchedSnowflakes: Snowflake[] = [];
        for (const snowflake of snowflakes) {
            const snowflakeData = this.snowflakeMap.get(snowflake);
            if (snowflakeData === undefined)
                continue;
            if (!snowflakeData.channels.includes(message.channel.id))
                return false;
            if (snowflakeData.users === undefined)
                matchedSnowflakes.push(snowflake);
            else if (snowflakeData.users.includes(message.author.id))
                matchedSnowflakes.push(snowflake);
        }

        if (matchedSnowflakes.length === 0)
            return false;
        try {
            const results = await Promise.all(matchedSnowflakes.map(snowflake => {
                return this.waitForMessageHandlerResponse(snowflake, message);
            }));
            if (results.filter(result => typeof result === 'boolean' ? result : false).length > 0)
                return true;
            return false;
        } catch (e: unknown) {
            this.cluster.logger.error(e);
            return false;
        }
    }

    private addSnowflake(
        snowflake: Snowflake,
        data: { channels: string[]; users?: string[]; }
    ): void {
        this.snowflakeMap.set(snowflake, data);
        for (const channel of data.channels) {
            const channelSnowflakes = this.channelSnowflakeMap.get(channel);
            if (channelSnowflakes !== undefined)
                this.channelSnowflakeMap.set(channel, [...channelSnowflakes, snowflake]);
            else
                this.channelSnowflakeMap.set(channel, [snowflake]);
        }
    }

    private removeSnowflake(
        snowflake: Snowflake
    ): void {
        const snowflakeData = this.snowflakeMap.get(snowflake);
        if (snowflakeData !== undefined) {
            this.removeSnowflakeChannels(snowflake, snowflakeData.channels);
            this.snowflakeMap.delete(snowflake);
        }
    }

    private removeSnowflakeChannels(
        snowflake: Snowflake,
        channels: string[]
    ): void {
        for (const channel of channels) {
            const channelSnowflakes = this.channelSnowflakeMap.get(channel);
            if (channelSnowflakes === undefined)
                continue;
            channelSnowflakes.splice(channelSnowflakes.indexOf(snowflake), 1);
            if (channelSnowflakes.length === 0)
                this.channelSnowflakeMap.delete(channel);
            else
                this.channelSnowflakeMap.set(channel, channelSnowflakes);
        }
    }

    private waitForMessageHandlerResponse(
        snowflake: Snowflake,
        message: Message
    ): Promise<boolean> {
        this.emitter.emit('check_' + snowflake.toString(), message);
        return new Promise((resolve, reject) => {
            const resolveHandler = (result: unknown): void => {
                if (typeof result === 'boolean') {
                    resolve(result);
                    clearTimeout(timeout);
                } else
                    reject(result);
            };
            const timeout = setTimeout(() => {
                resolve(false);
                this.emitter.off('checked_' + snowflake.toString() + message.id, resolveHandler);
            }, 300 * 1000);
            this.emitter.once('checked_' + snowflake.toString() + message.id, resolveHandler);
        });
    }
}
