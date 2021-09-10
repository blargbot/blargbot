import { Cluster } from '@cluster';
import { AwaitReactionsResponse } from '@cluster/types';
import { parse } from '@cluster/utils';
import { guard, snowflake } from '@core/utils';
import { Snowflake } from 'catflake';
import { GuildMessage, Message, MessageReaction, PartialMessageReaction, User } from 'discord.js';
import EventEmitter from 'eventemitter3';

export class ReactionAwaitManager {
    private readonly messageMap: Map<string, Snowflake[]>;
    private readonly reactionSnowflakeMap: Map<Snowflake, { users?: string[]; reactions?: string[]; messages: string[]; }>;
    private readonly emitter: EventEmitter;
    public constructor(
        private readonly cluster: Cluster
    ) {
        this.messageMap = new Map();
        this.reactionSnowflakeMap = new Map();
        this.emitter = new EventEmitter();
    }

    public awaitTagReactions(
        messages: string[],
        users: string[],
        reactions?: string[],
        checkFunction?: (message: GuildMessage, user: User, reaction: MessageReaction) => Promise<boolean>,
        timeout = 300000
    ): Promise<AwaitReactionsResponse | string> {
        const awaitReactionsSnowflake = snowflake.create();
        const snowflakeStr = awaitReactionsSnowflake.toString();

        this.addSnowflake(awaitReactionsSnowflake, {
            messages,
            users,
            reactions
        });

        const check = checkFunction !== undefined ? checkFunction : () => true;

        return new Promise((resolve) => {
            const waitTimeout = setTimeout(() => {
                this.emitter.emit('resolve_' + snowflakeStr, 'Wait timed out after ' + timeout.toString());
            }, timeout);

            const reactionHandler = (message: Message, user: User, reaction: MessageReaction): void => {
                if (!guard.isGuildMessage(message))
                    return;
                void (async () => {
                    const checkResponse = await check(message, user, reaction);
                    this.emitter.emit('checked_' + snowflakeStr + message.id + user.id + reaction.emoji.toString(), checkResponse);
                    if (checkResponse) {
                        clearTimeout(waitTimeout);
                        this.emitter.emit('resolve_' + snowflakeStr, {
                            message,
                            user,
                            reaction
                        });
                    }
                })();
            };
            this.emitter.on('check_' + snowflakeStr, reactionHandler);
            this.emitter.once('resolve_' + snowflakeStr, (result: AwaitReactionsResponse | string) => {
                this.emitter.off('check_' + snowflakeStr, reactionHandler);
                this.removeSnowflake(awaitReactionsSnowflake);
                resolve(result);
            });
        });

    }

    public async checkTagReaction(
        message: Message,
        user: User,
        reaction: MessageReaction | PartialMessageReaction
    ): Promise<boolean> {
        const snowflakes = this.messageMap.get(message.id);
        const emoji = parse.emoji(reaction.emoji.toString())[0];
        if (snowflakes === undefined)
            return false;
        const matchedSnowflakes: Snowflake[] = [];
        for (const snowflake of snowflakes) {
            const snowflakeData = this.reactionSnowflakeMap.get(snowflake);
            if (snowflakeData === undefined)
                continue;

            if (snowflakeData.users === undefined) {
                if (snowflakeData.reactions === undefined) {
                    matchedSnowflakes.push(snowflake);
                } else if (snowflakeData.reactions.includes(emoji))
                    matchedSnowflakes.push(snowflake);
                continue;
            }

            if (snowflakeData.users.includes(user.id)) {
                if (snowflakeData.reactions === undefined)
                    matchedSnowflakes.push(snowflake);
                else if (snowflakeData.reactions.includes(emoji))
                    matchedSnowflakes.push(snowflake);
            }
        }

        if (matchedSnowflakes.length === 0)
            return false;
        try {
            const results = await Promise.all(matchedSnowflakes.map(snowflake => {
                return this.waitForReactionHandlerResponse(snowflake, message, user, reaction);
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
        snowflakeData: { users?: string[]; reactions?: string[]; messages: string[]; }
    ): void {
        this.reactionSnowflakeMap.set(snowflake, snowflakeData);

        for (const message of snowflakeData.messages) {
            const existingMessageSnowflakes = this.messageMap.get(message);
            if (existingMessageSnowflakes !== undefined) {
                existingMessageSnowflakes.push(snowflake);
                continue;
            }
            this.messageMap.set(message, [snowflake]);
        }
    }
    private removeSnowflake(
        snowflake: Snowflake
    ): void {
        const snowflakeData = this.reactionSnowflakeMap.get(snowflake);
        if (snowflakeData === undefined)
            return;
        for (const message of snowflakeData.messages) {
            const msg = this.messageMap.get(message);
            if (msg === undefined)
                continue;
            msg.splice(msg.indexOf(snowflake), 1);
            if (msg.length === 0)
                this.messageMap.delete(message);
            else
                this.messageMap.set(message, msg);
        }

    }

    private waitForReactionHandlerResponse(
        snowflake: Snowflake,
        message: Message,
        user: User,
        reaction: MessageReaction | PartialMessageReaction
    ): Promise<boolean> {
        this.emitter.emit('check_' + snowflake.toString(), message, user, reaction);
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                resolve(false);
            }, 300 * 1000);

            const resolveHandler = (result: unknown): void => {
                clearTimeout(timeout);
                if (typeof result === 'boolean')
                    return resolve(result);
                reject(result);
            };
            this.emitter.once('checked_' + snowflake.toString() + message.id + user.id + reaction.emoji.toString(), resolveHandler);
        });
    }
}
