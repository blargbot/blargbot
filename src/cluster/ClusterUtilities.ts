import { BaseUtilities, SendPayload } from '../core/BaseUtilities';
import request from 'request';
import { Cluster } from './Cluster';
import { Guild, GuildTextableChannel, Member, Message, Permission, Role, TextableChannel, User } from 'eris';
import { commandTypes, defaultStaff, guard, humanize, parse } from '../utils';
import { BaseDCommand } from '../structures/BaseDCommand';
import { BanStore } from '../structures/BanStore';
import { ModerationUtils } from '../core/ModerationUtils';
import { MessageIdQueue } from '../structures/MessageIdQueue';
import moment from 'moment';
import { GuildSettings, StoredGuild, StoredGuildCommand } from '../core/database';

interface CanExecuteDiscordCommandOptions {
    storedGuild?: DeepReadOnly<StoredGuild>,
    permOverride?: GuildSettings['permoverride'],
    staffPerms?: GuildSettings['staffperms']
}

export interface FindEntityOptions {
    quiet?: boolean;
    suppress?: boolean;
    onSendCallback?: () => void;
    label?: string;
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
    public readonly bans: BanStore;
    public readonly commandMessages: MessageIdQueue;
    public readonly moderation: ModerationUtils;

    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster);
        this.bans = new BanStore();
        this.moderation = new ModerationUtils(this.cluster);
        this.commandMessages = new MessageIdQueue(100);
    }

    public async getUser(msg: Pick<Message, 'channel' | 'content' | 'author'>, name: string, args: boolean | FindEntityOptions = {}): Promise<User | null> {
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


    public async getRole(msg: Pick<Message<GuildTextableChannel>, 'channel' | 'author' | 'content'>, name: string, args: boolean | FindEntityOptions = {}): Promise<Role | null> {
        if (!name)
            return null;

        const normName = name.toLowerCase();
        const matchScore = (role: { name: string, normName: string }): number => {
            let score = 0;
            if (role.name.startsWith(name)) score += 100;
            if (role.normName.startsWith(normName)) score += 10;
            if (role.normName.includes(normName)) score += 1;
            return score;
        };

        if (typeof args !== 'object')
            args = { quiet: args };

        const role = await this.getRoleById(msg.channel.guild, name);
        if (role)
            return role;

        const roleList = msg.channel.guild.roles
            .map(r => ({
                role: r,
                match: matchScore({
                    name: r.name,
                    normName: r.name.toLowerCase()
                })
            }))
            .filter(r => r.match > 0)
            .sort((a, b) => b.match - a.match)
            .map(r => r.role);

        switch (roleList.length) {
            case 1: return roleList[0];
            case 0:
                if (args.quiet || args.suppress)
                    return null;
                if (args.onSendCallback)
                    args.onSendCallback();
                await this.send(msg, `No roles found${args.label ? ' in ' + args.label : ''}.`);
                return null;
            default:
                if (args.quiet || args.suppress)
                    return null;
                const matches = roleList.map(r => ({ content: `${r.name} - ${r.color.toString(16)} (${r.id})`, value: r }));
                const lookupResponse = await this.createLookup(msg, 'role', matches, args);
                return lookupResponse;
        }
    }

    public async createLookup<T>(msg: Pick<Message, 'author' | 'channel' | 'content'>, type: string, matches: LookupMatch<T>[], args: FindEntityOptions = {}): Promise<T | null> {
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
        msg: Pick<Message, 'channel' | 'content' | 'author'>,
        content: SendPayload,
        check: ((message: Message) => boolean) | undefined,
        timeoutMS?: number,
        label?: string
    ): Promise<Message<TextableChannel> | null> {
        const query = await this.createQuery(msg, content, check, timeoutMS, label);
        return await query.response;
    }

    public async createQuery(
        msg: Pick<Message, 'channel' | 'content' | 'author'>,
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
        msg: Pick<Message, 'channel' | 'content' | 'author'>,
        content: SendPayload,
        check: ((message: Message) => boolean) | undefined,
        timeoutMS: number,
        timeoutMessage: SendPayload | undefined
    ): Promise<Message<TextableChannel> | null> {
        const prompt = await this.createPrompt(msg, content, check, timeoutMS, timeoutMessage);
        return await prompt.response;
    }

    public async createPrompt(
        msg: Pick<Message, 'channel' | 'content' | 'author'>,
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

    public async getGuildById(guildId: string): Promise<Guild | null> {

        const match = /\d{17,21}/.exec(guildId);
        if (!match)
            return null;
        try {
            return this.guilds.get(match[0])
                ?? await this.discord.getRESTGuild(match[0])
                ?? null;
        } catch {
            return null;
        }
    }

    public async getRoleById(guild: string | Guild, roleId: string): Promise<Role | null> {
        const _guild = typeof guild === 'string' ? await this.getGuildById(guild) : guild;
        if (!_guild)
            return null;
        const match = /\d{17,21}/.exec(roleId);
        if (!match)
            return null;

        try {
            return _guild.roles.get(match[0]) ?? null;
        } catch {
            return null;
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

    public async canExecuteCustomCommand(msg: Message<GuildTextableChannel>, command: DeepReadOnly<StoredGuildCommand>, quiet: boolean): Promise<boolean> {
        return command !== null
            && !command.hidden
            && (!command.roles?.length || await this.hasPerm(msg, command.roles, quiet));
    }

    public hasRole(msg: Member | Message, roles: string | readonly string[], override = true): boolean {
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

        if (typeof roles === 'string')
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
        msg: Message<TextableChannel>,
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
            storedGuild = await this.database.guilds.get(msg.channel.guild.id) ?? undefined;
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

        const storedGuild = await this.database.guilds.get(guildId);
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

    public async hasPerm(msg: Member | Message, roles: readonly string[], quiet: boolean, override = true): Promise<boolean> {
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
            const guild = await this.database.guilds.get(member.guild.id);
            if (!guild?.settings?.disablenoperms) {
                const permString = roles.map(m => '`' + m + '`').join(', or ');
                void this.send(channel, `You need the role ${permString} in order to use this command!`);
            }
        }
        return false;
    }
}