import { Cluster } from './Cluster';
import { AnyChannel, Channel, AnyMessage, Guild, GuildChannel, Member, Permission, Role, Textable, User, UserChannelInteraction } from 'eris';
import moment from 'moment';
import { BaseUtilities, BanStore, MessageIdQueue, MessageAwaiter, ReactionAwaiter, FindEntityOptions, guard, codeBlock, LookupMatch, humanize, SendPayload, MessagePrompt, CommandContext, StoredGuildCommand, BaseCommand, CanExecuteDefaultCommandOptions, commandTypes, defaultStaff, parse } from './core';
import { ModerationManager } from './managers';
import fetch from 'node-fetch';

export class ClusterUtilities extends BaseUtilities {
    public readonly bans: BanStore;
    public readonly commandMessages: MessageIdQueue;
    public readonly moderation: ModerationManager;
    public readonly messageAwaiter: MessageAwaiter;
    public readonly reactionAwaiter: ReactionAwaiter;

    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster);
        this.bans = new BanStore();
        this.moderation = new ModerationManager(this.cluster);
        this.commandMessages = new MessageIdQueue(100);
        this.messageAwaiter = new MessageAwaiter(this.logger);
        this.reactionAwaiter = new ReactionAwaiter(this.logger);
    }

    public async getUser(msg: UserChannelInteraction, name: string, args: boolean | FindEntityOptions = {}): Promise<User | null> {
        if (!name)
            return null;

        const normName = name.toLowerCase();
        const matchScore = (user: { name: string; nick: string; normName: string; normNick: string; }): number => {
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

        if (!guard.isGuildRelated(msg)) {
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
            .filter(m => m.match > 0 && (discrim === undefined || discrim == m.member.discriminator))
            .sort((a, b) => b.match - a.match)
            .map(m => m.member.user);

        switch (userList.length) {
            case 1: return userList[0];
            case 0:
                if (args.quiet === true || args.suppress == true)
                    return null;
                if (args.onSendCallback)
                    args.onSendCallback();
                await this.send(msg, `No users found${args.label !== undefined ? ' in ' + args.label : ''}.`);
                return null;
            default: {
                if (args.quiet === true || args.suppress == true)
                    return null;
                const matches = userList.map(m => ({ content: `${m.username}#${m.discriminator} - ${m.id}`, value: m }));
                const lookupResponse = await this.createLookup(msg, 'user', matches, args);
                return lookupResponse;
            }
        }
    }

    public async getRole(msg: UserChannelInteraction<GuildChannel>, name: string, args: boolean | FindEntityOptions = {}): Promise<Role | null> {
        if (!name)
            return null;

        const normName = name.toLowerCase();
        const matchScore = (role: { name: string; normName: string; }): number => {
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
                if (args.quiet === true || args.suppress == true)
                    return null;
                if (args.onSendCallback)
                    args.onSendCallback();
                await this.send(msg, `No roles found${args.label !== undefined ? ' in ' + args.label : ''}.`);
                return null;
            default: {
                if (args.quiet === true || args.suppress == true)
                    return null;
                const matches = roleList.map(r => ({ content: `${r.name} - ${r.color.toString(16)} (${r.id})`, value: r }));
                const lookupResponse = await this.createLookup(msg, 'role', matches, args);
                return lookupResponse;
            }
        }
    }

    public async getChannel(msg: UserChannelInteraction, name: string, args: boolean | FindEntityOptions = {}): Promise<AnyChannel | null> {
        if (!name)
            return null;

        const normName = name.toLowerCase();
        const matchScore = (role: { name: string; normName: string; }): number => {
            let score = 0;
            if (role.name.startsWith(name)) score += 100;
            if (role.normName.startsWith(normName)) score += 10;
            if (role.normName.includes(normName)) score += 1;
            return score;
        };

        if (typeof args !== 'object')
            args = { quiet: args };

        const channel = await this.getChannelById(name);
        if (guard.isGuildChannel(msg.channel)) {
            if (channel)
                return channel;
        } else {
            return channel?.id === msg.channel.id ? channel : null;
        }

        const channelList = msg.channel.guild.channels
            .map(c => ({
                channel: c,
                match: matchScore({
                    name: c.name,
                    normName: c.name.toLowerCase()
                })
            }))
            .filter(c => c.match > 0)
            .sort((a, b) => b.match - a.match)
            .map(c => c.channel);

        switch (channelList.length) {
            case 1: return channelList[0];
            case 0:
                if (args.quiet === true || args.suppress == true)
                    return null;
                if (args.onSendCallback)
                    args.onSendCallback();
                await this.send(msg, `No channel found${args.label !== undefined ? ' in ' + args.label : ''}.`);
                return null;
            default: {
                if (args.quiet === true || args.suppress == true)
                    return null;
                const matches = channelList.map(c => ({ content: `${c.name} (${c.id})`, value: c }));
                const lookupResponse = await this.createLookup(msg, 'channel', matches, args);
                return lookupResponse;
            }
        }
    }

    public async displayPaged(
        channel: Textable & Channel,
        user: User,
        filterText: string,
        getItems: (skip: number, take: number) => Promise<readonly string[]>,
        itemCount: () => Promise<number>,
        pageSize = 20,
        separator = '\n'
    ): Promise<boolean | null> {
        let page = 0;
        while (!isNaN(page)) {
            const items = await getItems(page * pageSize, pageSize);
            if (items.length === 0)
                return false;
            const total = await itemCount();
            const pageCount = Math.ceil(total / pageSize);
            const query = await this.createQuery(channel, user,
                `Found ${items.length}/${total}${filterText}.\n` +
                `Page **#${page + 1}/${pageCount}**\n` +
                `${codeBlock(items.join(separator), 'fix')}\n` +
                `Type a number between **1 and ${pageCount}** to view that page, or type \`c\` to cancel.`,
                reply => {
                    page = parse.int(reply.content) - 1;
                    return (page >= 0 && page < pageCount)
                        || reply.content.toLowerCase() === 'c';
                });

            const response = await query.response;
            try {
                await query.prompt?.delete();
            } catch (err: unknown) {
                this.logger.error(`Failed to paging prompt (channel: ${query.prompt?.channel.id} message: ${query.prompt?.id}):`, err);
            }
            if (!response)
                return null;
        }
        return true;
    }

    public async createLookup<T>(msg: UserChannelInteraction, type: string, matches: Array<LookupMatch<T>>, args: FindEntityOptions = {}): Promise<T | null> {
        const lookupList = matches.slice(0, 20);
        let outputString = '';
        for (let i = 0; i < lookupList.length; i++) {
            outputString += `${i + 1 < 10 ? ` ${i + 1}` : i + 1}. ${lookupList[i].content}\n`;
        }
        const moreLookup = lookupList.length < matches.length ? `...and ${matches.length - lookupList.length}more.\n` : '';
        try {
            if (args.onSendCallback)
                args.onSendCallback();

            const query = await this.createQuery(msg.channel, msg.author,
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
                if (args.suppress === true)
                    return null;

                if (args.onSendCallback)
                    args.onSendCallback();

                await this.send(msg, `Query ${response ? 'cancelled' : 'timed out'}${args.label !== undefined ? ' in ' + args.label : ''}.`);
                return null;
            }

            return lookupList[parseInt(response.content) - 1].value;
        } catch (err: unknown) {
            return null;
        }
    }

    public async awaitQuery(
        channel: Textable & Channel,
        user: User,
        content: SendPayload,
        check?: ((message: AnyMessage) => boolean),
        timeoutMS?: number,
        label?: string
    ): Promise<AnyMessage | null> {
        const query = await this.createQuery(channel, user, content, check, timeoutMS, label);
        return await query.response;
    }

    public async createQuery(
        channel: Textable & Channel,
        user: User,
        content: SendPayload,
        check?: ((message: AnyMessage) => boolean),
        timeoutMS = 300000,
        label?: string
    ): Promise<MessagePrompt> {
        const timeoutMessage = `Query canceled${label !== undefined ? ' in ' + label : ''} after ${moment.duration(timeoutMS).humanize()}.`;
        return this.createPrompt(channel, user, content, check, timeoutMS, timeoutMessage);
    }

    public async awaitPrompt(
        channel: Textable & Channel,
        user: User,
        content: SendPayload,
        check?: ((message: AnyMessage) => boolean),
        timeoutMS?: number,
        timeoutMessage?: SendPayload
    ): Promise<AnyMessage | null> {
        const prompt = await this.createPrompt(channel, user, content, check, timeoutMS, timeoutMessage);
        return await prompt.response;
    }

    public async createPrompt(
        channel: Textable & Channel,
        user: User,
        content: SendPayload,
        check?: ((message: AnyMessage) => boolean),
        timeoutMS = 300000,
        timeoutMessage?: SendPayload
    ): Promise<MessagePrompt> {
        const prompt = await this.send(channel, content);
        const response = this.messageAwaiter.wait([channel.id], [user.id], timeoutMS, check);

        if (timeoutMessage !== undefined) {
            void response.then(async m => {
                if (m === null)
                    await this.send(channel, timeoutMessage);
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
            return this.discord.users.get(match[0])
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
            return this.discord.guilds.get(match[0])
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

    public async getChannelById(channelId: string): Promise<AnyChannel | null> {
        const match = /\d{17,21}/.exec(channelId);
        if (!match)
            return null;

        try {
            return this.discord.getChannel(match[0])
                ?? await this.discord.getRESTChannel(match[0])
                ?? null;
        } catch {
            return null;
        }
    }

    /* eslint-disable @typescript-eslint/naming-convention */
    public async postStats(): Promise<void> {
        const stats = {
            server_count: this.discord.guilds.size,
            shard_count: this.discord.shards.size,
            shard_id: this.cluster.id
        };
        this.logger.log(stats);
        const promises: Array<PromiseLike<unknown>> = [];
        promises.push(
            fetch(`https://discord.bots.gg/api/v1/bots/${this.user.id}/stats`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': this.config.general.botlisttoken,
                    'User-Agent': 'blargbot/1.0 (ratismal)'
                },
                body: JSON.stringify(stats)
            })
        );

        if (!this.config.general.isbeta) {
            this.logger.info('Posting to matt');

            promises.push(
                fetch('https://www.carbonitex.net/discord/data/botdata.php', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        'key': this.config.general.carbontoken,
                        'servercount': stats.server_count,
                        shard_count: stats.shard_count,
                        shard_id: stats.shard_id,
                        'logoid': this.user.avatar
                    })
                })
            );

            const shards = [];
            for (const shardId of this.discord.shards.map(s => s.id)) {
                shards[shardId] = this.discord.guilds.filter(g => g.shard.id === shardId);
            }
            promises.push(
                fetch(`https://discordbots.org/api/bots/${this.user.id}/stats`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': this.config.general.botlistorgtoken,
                        'User-Agent': 'blargbot/1.0 (ratismal)'
                    },
                    body: JSON.stringify(shards)
                })
            );
        }

        for (const promise of promises) {
            try {
                await promise;
            } catch (err: unknown) {
                this.logger.error(err);
            }
        }
    }
    /* eslint-enable @typescript-eslint/naming-convention */

    public async canExecuteCustomCommand(context: CommandContext<GuildChannel>, command: StoredGuildCommand, quiet: boolean): Promise<boolean> {
        return command !== null
            && command.hidden !== true
            && (command.roles === undefined || await this.hasPerm(context.message, command.roles, quiet));
    }

    public hasRole(msg: Member | AnyMessage, roles: string | readonly string[], override = true): boolean {
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

    public async canExecuteDefaultCommand(
        context: CommandContext,
        command: BaseCommand,
        quiet = false,
        options: CanExecuteDefaultCommandOptions = {}
    ): Promise<boolean> {
        if (context.author.id == this.cluster.config.discord.users.owner)
            return true;

        const category = commandTypes.properties[command.category];
        if (!guard.isGuildCommandContext(context))
            return category.perm === undefined;

        if (!await category.requirement(context))
            return false;

        const commandPerms = await this.database.guilds.getCommandPerms(context.channel.guild.id, command.name);
        if (commandPerms?.disabled === true && !command.cannotDisable)
            return false;

        const permOverride = options.permOverride ?? await this.database.guilds.getSetting(context.channel.guild.id, 'permoverride');
        if (permOverride === true) {
            const staffPerms = options.staffPerms ?? await this.database.guilds.getSetting(context.channel.guild.id, 'staffperms') ?? defaultStaff;
            const allow = typeof staffPerms === 'number' ? staffPerms : parseInt(staffPerms);
            if (!isNaN(allow) && context.message.member && this.comparePerms(context.message.member, allow))
                return true;
        }

        if (commandPerms) {
            if (commandPerms.permission !== undefined && context.message.member && this.comparePerms(context.message.member, commandPerms.permission))
                return true;

            switch (typeof commandPerms.rolename) {
                case 'undefined': break;
                case 'string': return await this.hasPerm(context.message, [commandPerms.rolename], quiet);
                case 'object': return await this.hasPerm(context.message, commandPerms.rolename, quiet);
            }
        }

        const adminrole = await this.database.guilds.getSetting(context.channel.guild.id, 'adminrole');
        if (category.perm !== undefined && !await this.hasPerm(context.message, [adminrole ?? category.perm], quiet))
            return false;

        return true;
    }

    public async isUserStaff(userId: string, guildId: string): Promise<boolean> {
        if (userId == guildId) return true;

        const guild = this.discord.guilds.get(guildId);
        if (!guild) return false;

        const member = guild.members.get(userId);
        if (!member) return false;

        if (guild.ownerID == userId) return true;
        if (member.permissions.has('administrator')) return true;

        const storedGuild = await this.database.guilds.get(guildId);
        if (storedGuild?.settings?.permoverride === true) {
            let allow = storedGuild.settings.staffperms ?? defaultStaff;
            if (typeof allow === 'string')
                allow = parseInt(allow);
            const member = this.discord.guilds.get(guildId)?.members.get(userId);
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

    public async hasPerm(msg: Member | AnyMessage, roles: readonly string[], quiet: boolean, override = true): Promise<boolean> {
        let member: Member;
        let channel: (Textable & Channel) | undefined;
        if (msg instanceof Member) {
            member = msg;
        } else {
            if (!guard.isGuildMessage(msg))
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
            if (guild?.settings?.disablenoperms !== true) {
                const permString = roles.map(m => '`' + m + '`').join(', or ');
                void this.send(channel, `You need the role ${permString} in order to use this command!`);
            }
        }
        return false;
    }

    public isStaff(id: string): boolean {
        return this.cluster.botStaff.staff.has(id);
    }

    public isSupport(id: string): boolean {
        return this.cluster.botStaff.support.has(id);
    }
}