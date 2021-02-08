import { BaseUtilities, SendPayload } from '../core/BaseUtilities';
import request from 'request';
import { Cluster } from './Cluster';
import { GuildSettings, StoredGuildCommand, StoredGuild, StoredUser } from '../core/RethinkDb';
import { AnyChannel, GuildTextableChannel, Member, Message, Permission, Textable, TextableChannel, User } from 'eris';
import * as r from 'rethinkdb';
import { commandTypes, defaultStaff, guard, humanize, parse, snowflake } from '../newbu';
import { BaseDCommand } from '../structures/BaseDCommand';
import { BanStore } from '../structures/BanStore';
import { ModerationUtils } from '../core/ModerationUtils';
import { MessageIdQueue } from '../structures/MessageIdQueue';
import moment from 'moment';

interface CanExecuteDiscordCommandOptions {
    storedGuild?: StoredGuild,
    permOverride?: GuildSettings['permoverride'],
    staffPerms?: GuildSettings['staffperms']
}

interface GetUserOptions {
    quiet?: boolean;
    suppress?: boolean;
    onSendCallback?: () => void;
    label?: string;
}

interface LookupOptions {
    onSendCallback?: () => void;
    label?: string;
    suppress?: boolean;
}

interface LookupMatch<T> {
    content: string,
    value: T
}

interface MessagePrompt {
    prompt: Message | null;
    response: Promise<Message | null>;
}

export class ClusterUtilities extends BaseUtilities {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #guildCache: Map<string, StoredGuild>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #userCache: Map<string, StoredUser>;
    public readonly bans: BanStore;
    public readonly commandMessages: MessageIdQueue;
    public readonly moderation: ModerationUtils;

    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster);
        this.#guildCache = new Map();
        this.#userCache = new Map();
        this.bans = new BanStore();
        this.moderation = new ModerationUtils(this.cluster);
        this.commandMessages = new MessageIdQueue(100);
    }

    public async guildSetting<T extends keyof GuildSettings>(guildId: string, key: T): Promise<GuildSettings[T] | null> {
        const guild = await this.getGuild(guildId);
        if (guild === null || guild.settings === undefined)
            return null;

        if (!(key in guild.settings))
            return null;

        return guild.settings[key];
    }

    public async processUser(user: User): Promise<void> {
        if (user.discriminator == '0000') return;
        const storedUser = await this.cluster.rethinkdb.getUser(user.id);
        if (!storedUser) {
            this.logger.debug(`inserting user ${user.id} (${user.username})`);
            await this.cluster.rethinkdb.query(r =>
                r.table('user').insert({
                    userid: user.id,
                    username: user.username,
                    usernames: [{
                        name: user.username,
                        date: r.epochTime(moment().valueOf() / 1000)
                    }],
                    isbot: user.bot,
                    lastspoke: r.epochTime(moment().valueOf() / 1000),
                    lastcommand: null,
                    lastcommanddate: null,
                    discriminator: user.discriminator,
                    todo: []
                }));
        } else {
            const newUser: StoredUser = {};
            let update = false;
            if (storedUser.username != user.username) {
                newUser.username = user.username;
                newUser.usernames = storedUser.usernames ?? [];
                newUser.usernames.push({
                    name: user.username,
                    date: r.epochTime(moment().valueOf() / 1000)
                });
                update = true;
            }
            if (storedUser.discriminator != user.discriminator) {
                newUser.discriminator = user.discriminator;
                update = true;
            }
            if (storedUser.avatarURL != user.avatarURL) {
                newUser.avatarURL = user.avatarURL;
                update = true;
            }

            if (update)
                await this.cluster.rethinkdb.query(r => r.table('user').get(user.id).update(newUser));
        }
    }

    public async getUser(msg: Message, name: string, args: boolean | GetUserOptions = {}): Promise<User | null> {
        if (!name)
            return null;

        const normName = name.toLowerCase();
        const matchScore = (user: { name: string, nick: string, normName: string, normNick: string }): number => {
            let score = 0;
            if (user.name.startsWith(name)) score += 100;
            if (user.nick.startsWith(name)) score += 100;
            if (user.normName.startsWith(normName)) score += 10;
            if (user.normNick.startsWith(normName)) score += 10;
            if (user.normName.includes(normName)) score += 1;
            if (user.normNick.includes(normName)) score += 1;
            return score;
        };

        if (typeof args !== 'object')
            args = { quiet: args };

        const user = await this.getUserById(name);
        if (user)
            return user;

        if (!guard.isGuildMessage(msg)) {
            return matchScore({
                name: msg.author.username,
                nick: msg.author.username,
                normName: msg.author.username.toLowerCase(),
                normNick: msg.author.username.toLowerCase()
            }) > 0 ? msg.author : null;
        }

        let discrim: string | undefined;
        const nameMatch = /^(.*)#(\d{4})$/.exec(name);
        if (nameMatch) {
            [, name, discrim] = nameMatch;
        }

        const userList = msg.channel.guild.members
            .map(m => ({
                member: m,
                match: matchScore({
                    name: m.username,
                    nick: m.nick ?? m.username,
                    normNick: m.nick?.toLowerCase() ?? m.username.toLowerCase(),
                    normName: m.username.toLowerCase()
                })
            }))
            .filter(m => m.match > 0 && (!discrim || discrim == m.member.discriminator))
            .sort((a, b) => b.match - a.match)
            .map(m => m.member.user);

        switch (userList.length) {
            case 1: return userList[0];
            case 0:
                if (args.quiet || args.suppress)
                    return null;
                if (args.onSendCallback)
                    args.onSendCallback();
                await this.send(msg, `No users found${args.label ? ' in ' + args.label : ''}.`);
                return null;
            default:
                if (args.quiet || args.suppress)
                    return null;
                const matches = userList.map(m => ({ content: `${m.username}#${m.discriminator} - ${m.id}`, value: m }));
                const lookupResponse = await this.createLookup(msg, 'user', matches, args);
                return lookupResponse;
        }
    }


    public async createLookup<T>(msg: Message, type: string, matches: LookupMatch<T>[], args: LookupOptions = {}): Promise<T | null> {
        const lookupList = matches.slice(0, 20);
        let outputString = '';
        for (let i = 0; i < lookupList.length; i++) {
            outputString += `${i + 1 < 10 ? ` ${i + 1}` : i + 1}. ${lookupList[i].content}\n`;
        }
        const moreLookup = lookupList.length < matches.length ? `...and ${matches.length - lookupList.length}more.\n` : '';
        try {
            if (args.onSendCallback)
                args.onSendCallback();

            const query = await this.createQuery(msg,
                `Multiple ${type}s found! Please select one from the list.\`\`\`prolog` +
                `\n${outputString}${moreLookup}--------------------` +
                '\nC.cancel query```' +
                `\n**${humanize.fullName(msg.author)}**, please type the number of the ${type} you wish to select below, or type \`c\` to cancel. This query will expire in 5 minutes.`,
                (msg2) => msg2.content.toLowerCase() === 'c' || (parseInt(msg2.content) < lookupList.length + 1 && parseInt(msg2.content) >= 1),
                300000,
                args.label
            );
            const response = await query.response;
            if (query.prompt)
                await this.discord.deleteMessage(query.prompt.channel.id, query.prompt.id);

            if (!response || response.content.toLowerCase() === 'c') {
                if (args.suppress)
                    return null;

                if (args.onSendCallback)
                    args.onSendCallback();

                await this.send(msg, `Query ${response ? 'cancelled' : 'timed out'}${args.label ? ' in ' + args.label : ''}.`);
                return null;
            }

            return lookupList[parseInt(response.content) - 1].value;
        } catch (err) {
            return null;
        }
    }

    public async awaitQuery(
        msg: Message,
        content: SendPayload,
        check: ((message: Message) => boolean) | undefined,
        timeoutMS?: number,
        label?: string
    ): Promise<Message<TextableChannel> | null> {
        const query = await this.createQuery(msg, content, check, timeoutMS, label);
        return await query.response;
    }

    public async createQuery(
        msg: Message,
        content: SendPayload,
        check: ((message: Message) => boolean) | undefined,
        timeoutMS?: number,
        label?: string
    ): Promise<MessagePrompt> {
        if (timeoutMS === undefined)
            timeoutMS = 300000;
        const timeoutMessage = `Query canceled${label ? ' in ' + label : ''} after ${moment.duration(timeoutMS).humanize()}.`;
        return this.createPrompt(msg, content, check, timeoutMS, timeoutMessage);
    }

    public async awaitPrompt(
        msg: Message,
        content: SendPayload,
        check: ((message: Message) => boolean) | undefined,
        timeoutMS: number,
        timeoutMessage: SendPayload | undefined
    ): Promise<Message<TextableChannel> | null> {
        const prompt = await this.createPrompt(msg, content, check, timeoutMS, timeoutMessage);
        return await prompt.response;
    }

    public async createPrompt(
        msg: Message,
        content: SendPayload,
        check: ((message: Message) => boolean) | undefined,
        timeoutMS: number,
        timeoutMessage: SendPayload | undefined
    ): Promise<MessagePrompt> {
        const prompt = await this.send(msg, content);
        const response = this.messageAwaiter.wait([msg.channel.id], [msg.author.id], timeoutMS, check);

        if (timeoutMessage) {
            void response.then(async m => {
                if (m === null)
                    await this.send(msg, timeoutMessage);
            });
        }

        return {
            prompt,
            response
        };
    }

    public async getUserById(userId: string): Promise<User | null> {
        const match = /\d{17,21}/.exec(userId);
        if (!match)
            return null;

        try {
            return this.users.get(match[0])
                ?? await this.discord.getRESTUser(match[0])
                ?? null;
        } catch {
            return null;
        }
    }

    public async insertChatlog(msg: Message, type: number): Promise<void> {
        this.cluster.metrics.chatlogCounter.labels(type === 0 ? 'create' : type === 1 ? 'update' : 'delete').inc();
        const data = {
            id: snowflake.create(),
            content: msg.content,
            attachment: msg.attachments[0] ? msg.attachments[0].url : undefined,
            userid: msg.author.id,
            msgid: msg.id,
            channelid: msg.channel.id,
            guildid: 'guild' in msg.channel ? msg.channel.guild.id : 'DM',
            msgtime: Date.now(),
            type: type,
            embeds: JSON.stringify(msg.embeds)
        };
        try {
            await this.cluster.cassandra.execute(insertChatlog, data, { prepare: true });
            await this.cluster.cassandra.execute(insertChatlogMap, { id: data.id, msgid: msg.id, channelid: msg.channel.id }, { prepare: true });
        } catch (err) {

        }
    }

    public postStats(): void {
        const stats = {
            server_count: this.guilds.size,
            shard_count: this.shards.size,
            shard_id: this.cluster.id
        };
        this.logger.log(stats);
        request.post({
            'url': `https://discord.bots.gg/api/v1/bots/${this.user.id}/stats`,
            'headers': {
                'content-type': 'application/json',
                'Authorization': this.config.general.botlisttoken,
                'User-Agent': 'blargbot/1.0 (ratismal)'
            },
            'json': true,
            body: stats
        }, (err) => {
            if (err)
                this.logger.error(err);
        });

        if (!this.config.general.isbeta) {
            this.logger.info('Posting to matt');

            request.post({
                'url': 'https://www.carbonitex.net/discord/data/botdata.php',
                'headers': {
                    'content-type': 'application/json'
                },
                'json': true,
                body: {
                    'key': this.config.general.carbontoken,
                    'servercount': stats.server_count,
                    shard_count: stats.shard_count,
                    shard_id: stats.shard_id,
                    'logoid': this.user.avatar
                }
            }, (err) => {
                if (err)
                    this.logger.error(err);
            });

            const shards = [];
            for (const shardId of this.shards.map(s => s.id)) {
                shards[shardId] = this.guilds.filter(g => g.shard.id === shardId);
            }
            request.post({
                url: `https://discordbots.org/api/bots/${this.user.id}/stats`,
                json: true,
                headers: {
                    'content-type': 'application/json',
                    'Authorization': this.config.general.botlistorgtoken,
                    'User-Agent': 'blargbot/1.0 (ratismal)'
                },
                body: {
                    shards
                }
            }, err => {
                if (err)
                    this.logger.error(err);
            });
        }
    }

    public async canExecuteCustomCommand(msg: Message<GuildTextableChannel>, command: StoredGuildCommand, quiet: boolean): Promise<boolean> {
        return command !== null
            && !command.hidden
            && (!command.roles?.length || await this.hasPerm(msg, command.roles, quiet));
    }

    public hasRole(msg: Member | Message, roles: string | string[], override = true): boolean {
        let member: Member;
        if (msg instanceof Member) {
            member = msg;
        } else {
            if (msg.member === null)
                return false;
            member = msg.member;
        }

        if (override
            && (member.id === this.cluster.config.discord.users.owner
                || member.guild.ownerID == member.id
                || member.permissions.json.administrator))
            return true;

        if (!Array.isArray(roles))
            roles = [roles];

        return roles.some(r => member.roles.includes(r));
    }


    public isBotHigher(member: Member): boolean {
        const bot = member.guild.members.get(this.cluster.discord.user.id);
        if (bot === undefined)
            return false;
        const botPos = this.getPosition(bot);
        const memPos = this.getPosition(member);
        return botPos > memPos;
    }

    public getPosition(member: Member): number {
        return member.roles
            .map(r => member.guild.roles.get(r))
            .filter(guard.hasValue)
            .sort((a, b) => b.position - a.position)[0]
            ?.position ?? 0;
    }

    public async canExecuteDiscordCommand(
        msg: Message<AnyChannel & Textable>,
        command: BaseDCommand,
        quiet = false,
        options: CanExecuteDiscordCommandOptions = {}
    ): Promise<boolean> {
        if (msg.author.id == this.cluster.config.discord.users.owner)
            return true;

        const category = commandTypes.properties[command.category];

        if (!guard.isGuildMessage(msg)) {
            return category.perm === undefined;
        }

        let { storedGuild, permOverride, staffPerms } = options;
        let adminrole: string | undefined;
        if (!storedGuild) {
            storedGuild = await this.getGuild(msg.channel.guild.id) ?? undefined;
            if (storedGuild?.settings) {
                permOverride = storedGuild.settings.permoverride;
                staffPerms = storedGuild.settings.staffperms;
                if (storedGuild.settings.adminrole !== undefined && storedGuild.settings.adminrole !== '')
                    adminrole = storedGuild.settings.adminrole;
            }
        }

        const commandPerms = storedGuild?.commandperms?.[command.name];
        if (commandPerms?.disabled && !command.cannotDisable)
            return false;

        if (!await category.requirement(this.cluster, msg))
            return false;

        if (permOverride) {
            staffPerms ??= defaultStaff;
            const allow = typeof staffPerms === 'number' ? staffPerms : parseInt(staffPerms);
            if (!isNaN(allow) && msg.member && this.comparePerms(msg.member, allow))
                return true;
        }

        if (commandPerms) {
            if (commandPerms.permission && msg.member && this.comparePerms(msg.member, commandPerms.permission))
                return true;

            if (commandPerms.rolename)
                return await this.hasPerm(msg, [commandPerms.rolename], quiet);
        }

        if (category.perm && !await this.hasPerm(msg, [adminrole || category.perm], quiet))
            return false;

        return true;
    }

    public async isUserStaff(userId: string, guildId: string): Promise<boolean> {
        if (userId == guildId) return true;

        const guild = this.guilds.get(guildId);
        if (!guild) return false;

        const member = guild.members.get(userId);
        if (!member) return false;

        if (guild.ownerID == userId) return true;
        if (member.permissions.has('administrator')) return true;

        const storedGuild = await this.getGuild(guildId);
        if (storedGuild?.settings?.permoverride) {
            let allow = storedGuild.settings.staffperms || defaultStaff;
            if (typeof allow === 'string')
                allow = parseInt(allow);
            const member = this.guilds.get(guildId)?.members.get(userId);
            if (member && this.comparePerms(member, allow)) {
                return true;
            }
        }
        return false;
    }

    public async getGuild(guildid: string): Promise<StoredGuild | null> {
        if (!this.#guildCache.has(guildid)) {
            const guild = await this.rethinkdb.getGuild(guildid);
            if (guild)
                this.#guildCache.set(guildid, guild);
        }
        return this.#guildCache.get(guildid) ?? null;
    }


    public async getCachedUser(userid: string): Promise<StoredUser | null> {
        if (!this.#userCache.has(userid)) {
            const user = await this.rethinkdb.getUser(userid);
            if (user)
                this.#userCache.set(userid, user);
        }
        return this.#userCache.get(userid) ?? null;
    }

    public comparePerms(member: Member, allow?: number): boolean {
        allow ??= defaultStaff;
        const newPerm = new Permission(allow, 0);
        for (const key in newPerm.json) {
            if (member.permissions.has(key)) {
                return true;
            }
        }
        return false;
    }

    public async hasPerm(msg: Member | Message, roles: string[], quiet: boolean, override = true): Promise<boolean> {
        let member: Member;
        let channel: TextableChannel | undefined;
        if (msg instanceof Member) {
            member = msg;
        } else {
            if (!('guild' in msg.channel))
                return true;
            if (!msg.member)
                return false;
            member = msg.member;
            channel = msg.channel;
        }
        if (override
            && (member.id === this.cluster.config.discord.users.owner
                || member.guild.ownerID == member.id
                || member.permissions.json.administrator)
        ) {
            return true;
        }

        roles = roles.map(p => p.toLowerCase());
        const guildRoles = member.guild.roles.filter(m =>
            roles.includes(m.name.toLowerCase())
            || roles.some(p => parse.entityId(p, '@&', true) === m.id));

        if (guildRoles.some(r => member.roles.includes(r.id)))
            return true;

        if (channel && !quiet) {
            const guild = await this.getGuild(member.guild.id);
            if (!guild?.settings?.disablenoperms) {
                const permString = roles.map(m => '`' + m + '`').join(', or ');
                void this.send(channel, `You need the role ${permString} in order to use this command!`);
            }
        }
        return false;
    }

    public readonly ccommand = {
        set: async (guildid: string, key: string, value: StoredGuildCommand): Promise<boolean> => {
            const storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();
            if (!storedGuild)
                return false;

            if (!storedGuild.ccommands)
                storedGuild.ccommands = {};

            storedGuild.ccommands[key] = value;

            await this.cluster.rethinkdb.query(r =>
                r.table('guild')
                    .get(guildid)
                    .update({ ccommands: storedGuild.ccommands }));
            return true;
        },
        get: async (guildid: string, key: string): Promise<StoredGuildCommand | null> => {
            const storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();
            return storedGuild?.ccommands?.[key] ?? null;
        },
        rename: async (guildid: string, key1: string, key2: string): Promise<boolean> => {
            const storedGuild = await this.cluster.util.getGuild(guildid);
            key1 = key1.toLowerCase();
            key2 = key2.toLowerCase();

            if (!storedGuild?.ccommands?.[key1])
                return false;

            storedGuild.ccommands[key2] = storedGuild.ccommands[key1];
            delete storedGuild.ccommands[key1];

            await this.cluster.rethinkdb.query(r =>
                r.table('guild')
                    .get(guildid)
                    .replace(storedGuild));
            return true;
        },
        remove: async (guildid: string, key: string): Promise<boolean> => {
            const storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();

            if (!storedGuild?.ccommands?.[key])
                return false;

            delete storedGuild.ccommands[key];

            await this.cluster.rethinkdb.query(r =>
                r.table('guild')
                    .get(guildid)
                    .replace(storedGuild));
            return true;
        },
        sethelp: async (guildid: string, key: string, help: string): Promise<boolean> => {
            const storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();
            if (!storedGuild)
                return false;

            const ccommand = storedGuild.ccommands?.[key];
            if (!ccommand)
                return false;

            ccommand.help = help;
            await this.cluster.rethinkdb.query(r =>
                r.table('guild')
                    .get(guildid)
                    .replace(storedGuild));
            return true;
        },
        gethelp: async (guildid: string, key: string): Promise<string | undefined> => {
            const storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();

            return storedGuild?.ccommands?.[key]?.help;
        },
        setlang: async (guildid: string, key: string, lang: string): Promise<boolean> => {
            const storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();
            if (!storedGuild)
                return false;

            const ccommand = storedGuild.ccommands?.[key];
            if (!ccommand)
                return false;

            ccommand.lang = lang;
            await this.cluster.rethinkdb.query(r =>
                r.table('guild')
                    .get(guildid)
                    .replace(storedGuild));
            return true;
        },
        getlang: async (guildid: string, key: string): Promise<string | undefined> => {
            const storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();

            return storedGuild?.ccommands?.[key]?.lang;
        }
    };


}


const insertChatlog = `
    INSERT INTO chatlogs (id, content, attachment, userid, msgid, channelid, guildid, msgtime, type, embeds)
        VALUES (:id, :content, :attachment, :userid, :msgid, :channelid, :guildid, :msgtime, :type, :embeds)
        USING TTL 604800
`;
const insertChatlogMap = `
    INSERT INTO chatlogs_map (id, msgid, channelid) VALUES (:id, :msgid, :channelid) USING TTL 604800
`;