import { AnyMessage, GuildChannel, GuildMessage, Member, User } from 'eris';
import { Timer } from '../../structures/Timer';
import request from 'request';
import { commandTypes, createRegExp, guard, ModerationType, modlogColour, parse, randInt, sleep, humanize } from '../../utils';
import { Cluster } from '..';
import { DiscordEventService } from '../../structures/DiscordEventService';
import { limits, RuntimeLimit } from '../../core/bbtag';
import { ChatlogType, StoredGuildCommand } from '../../core/database';
import { metrics } from '../../core/Metrics';
import { BaseCommand, CommandContext } from '../../core/command';

export class MessageCreateEventHandler extends DiscordEventService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #arWhitelist: Set<string>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #whitelistInterval?: NodeJS.Timeout;

    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageCreate', cluster.logger);
        this.#arWhitelist = new Set<string>();
    }

    public start(): void {
        super.start();
        this.#whitelistInterval = setInterval(() => void this.checkWhitelist(), 1000 * 60 * 15);
        void this.checkWhitelist();
    }

    public stop(): void {
        super.stop();
        if (this.#whitelistInterval) {
            clearInterval(this.#whitelistInterval);
            this.#whitelistInterval = undefined;
        }
    }

    public async execute(message: AnyMessage): Promise<void> {
        void this.cluster.database.users.upsert(message.author);
        metrics.messageCounter.inc();

        if (guard.isGuildMessage(message) && await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs'))
            void this.cluster.database.chatlogs.add(message, ChatlogType.CREATE);

        if (message.author.id === this.cluster.discord.user.id)
            this.handleOurMessage(message);
        else
            void this.handleUserMessage(message);
    }

    public async handleUserMessage(msg: AnyMessage): Promise<void> {
        let prefix: string | undefined;
        const prefixes: string[] = [];

        if (guard.isGuildMessage(msg)) {
            void this.handleAntiMention(msg);
            void this.handleCensor(msg);
            void this.handleRoleme(msg);
            void this.handleAutoresponse(msg, true);
            void this.handleTableflip(msg);
            const prefix = await this.cluster.database.guilds.getSetting(msg.channel.guild.id, 'prefix');
            if (typeof prefix === 'string')
                prefixes.push(prefix);
            else if (prefix !== undefined)
                prefixes.push(...prefix);

            if (await this.isBlacklisted(msg.channel, msg.author))
                return;
        }

        const userPrefixes = await this.cluster.database.users.getSetting(msg.author.id, 'prefixes');
        if (userPrefixes)
            prefixes.push(...userPrefixes);

        prefixes.push(this.cluster.config.discord.defaultPrefix, this.cluster.discord.user.username);
        prefixes.sort((a, b) => b.length - a.length); //sort descending

        let doCleverbot = false;
        if (msg.content.startsWith(`<@${this.cluster.discord.user.id}>`)
            || msg.content.startsWith(`<@!${this.cluster.discord.user.id}>`)) {
            prefix = /<@!?[0-9]{17,21}>/.exec(msg.content)?.[0];
            this.logger.debug('Was a mention');
            doCleverbot = true;
        } else {
            for (const p of prefixes) {
                if (msg.content.toLowerCase().startsWith(p.toLowerCase())) {
                    prefix = p;
                    break;
                }
            }
        }

        if (prefix === undefined) {
            this.cluster.util.messageAwaiter.emit(msg);
            if (guard.isGuildMessage(msg))
                void this.handleAutoresponse(msg, false);
            return;
        }

        const blacklistReason = await this.cluster.database.users.getSetting(msg.author.id, 'blacklisted');
        if (blacklistReason) {
            await this.cluster.util.send(msg, `You have been blacklisted from the bot for the following reason: ${blacklistReason}`);
            return;
        }

        try {
            const context = new CommandContext(msg, prefix);
            if (await this.tryHandleCustomCommand(context) || await this.tryHandleDefaultCommand(context)) {
                if (guard.isGuildMessage(msg))
                    void this.handleDeleteNotif(msg);
                return;
            }

            if (doCleverbot && !msg.author.bot && guard.isGuildMessage(msg) && !await this.cluster.database.guilds.getSetting(msg.channel.guild.id, 'nocleverbot')) {
                void this.handleCleverbot(msg);
            } else {
                this.cluster.util.messageAwaiter.emit(msg);
            }

            if (guard.isGuildMessage(msg))
                void this.handleAutoresponse(msg, false);
        } catch (err) {
            this.logger.error(err?.stack);
        }
    }

    public async flipTables(msg: GuildMessage, unflip: boolean): Promise<void> {
        const tableflip = await this.cluster.database.guilds.getSetting(msg.channel.guild.id, 'tableflip');
        if (tableflip) {
            const seed = randInt(0, 3);
            await this.cluster.util.send(msg, tables[unflip ? 'unflip' : 'flip'].prod[seed]);
        }
    }

    public async tryHandleCustomCommand(context: CommandContext): Promise<boolean> {
        if (context.author.bot)
            return false;

        if (!guard.isGuildCommandContext(context))
            return false;

        const command = await this.cluster.database.guilds.getCommand(context.channel.guild.id, context.commandName);
        if (command === undefined || !await this.cluster.util.canExecuteCustomCommand(context, command, true))
            return false;

        const { authorizer, alias } = command;
        let { content, flags, cooldown, author } = command;
        if (alias)
            ({ content = '', flags, cooldown, author }
                = await this.cluster.database.tags.get(alias) ?? {});

        if (!content)
            return false;

        this.logger.command(`Custom command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) on server ${context.channel.guild.name} (${context.channel.guild.id})`);

        if (alias !== undefined) {
            await this.cluster.database.tags.incrementUses(alias);
        }
        await this.cluster.bbtag.execute(content, {
            message: context.message,
            tagName: context.commandName,
            limit: limits.CustomCommandLimit,
            flags,
            input: context.args,
            isCC: true,
            tagVars: alias !== undefined,
            cooldown,
            author,
            authorizer
        });
        metrics.commandCounter.labels('custom', 'custom').inc();

        return true;
    }

    public async tryHandleDefaultCommand(context: CommandContext): Promise<boolean> {
        if (context.author.bot)
            return false;

        const command = this.cluster.commands.get(context.commandName);
        if (!command || !await this.cluster.util.canExecuteDefaultCommand(context, command))
            return false;

        try {
            const outputLog = guard.isGuildCommandContext(context)
                ? `Command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) on server ${context.channel.guild.name} (${context.channel.guild.id})`
                : `Command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) in a PM (${context.channel.id}) Message ID: ${context.id}`;
            this.logger.command(outputLog);
            const timer = new Timer().start();
            await this.executeCommand(command, context);
            timer.end();
            metrics.commandLatency.labels(command.name, commandTypes.properties[command.category].name.toLowerCase()).observe(timer.elapsed);
            metrics.commandCounter.labels(command.name, commandTypes.properties[command.category].name.toLowerCase()).inc();
        } catch (err) {
            this.logger.error(err.stack);
            metrics.commandError.labels(command.name).inc();
        } finally {
            return true;
        }
    }

    public async executeCommand(command: BaseCommand, context: CommandContext): Promise<void> {
        try {
            await command.execute(context);
        } catch (err) {
            this.logger.error(err);
            if (err.code === 50001 && !(await this.cluster.database.users.get(context.author.id))?.dontdmerrors) {
                if (!guard.isGuildChannel(context.channel))
                    void this.cluster.util.sendDM(context.author,
                        'Oops, I dont seem to have permission to do that!');
                else
                    void this.cluster.util.sendDM(context.author,
                        'Hi! You asked me to do something, but I didn\'t have permission to do it! Please make sure I have permissions to do what you asked.\n' +
                        `Guild: ${context.channel.guild.name}\n` +
                        `Channel: ${context.channel.name}\n` +
                        `Command: ${context.commandText}\n` +
                        '\n' +
                        'If you wish to stop seeing these messages, do the command `dmerrors`.');
            }
            throw err;
        }
    }



    public handleOurMessage(msg: AnyMessage): void {
        const channel = msg.channel;
        if (guard.isGuildChannel(channel)) {
            const guild = channel.guild;
            this.logger.output(`${guild.name} (${guild.id})> ${channel.name} (${channel.id})> ${msg.author.username}> ${msg.content} (${msg.id})`);
        } else if (guard.isPrivateChannel(channel)) {
            const recipient = channel.recipient;
            this.logger.output(`PM> ${recipient.username} (${recipient.id})> (${channel.id})> ${msg.author.username}> ${msg.content} (${msg.id})`);
        } else {
            this.logger.output(`??> (${channel.id})> ${msg.author.username}> ${msg.content} (${msg.id})`);
        }
    }

    public async handleAntiMention(msg: GuildMessage): Promise<void> {
        const antimention = await this.cluster.database.guilds.getSetting(msg.channel.guild.id, 'antimention');
        if (antimention === undefined)
            return;

        const parsedAntiMention = typeof antimention === 'string' ? parseInt(antimention) : antimention;
        if (parsedAntiMention === 0 || isNaN(parsedAntiMention) || msg.mentions.length < parsedAntiMention)
            return;

        this.cluster.util.bans.set(msg.channel.guild.id, msg.author.id, {
            mod: this.cluster.discord.user,
            type: 'Auto-Ban',
            reason: 'Mention spam'
        });

        try {
            await this.cluster.discord.banGuildMember(msg.channel.guild.id, msg.author.id, 1);
        } catch (err) {
            this.cluster.util.bans.clear(msg.channel.guild.id, msg.author.id);
            await this.cluster.util.send(msg, `${msg.author.username} is mention spamming, but I lack the permissions to ban them!`);
        }
    }

    public async handleCensor(msg: GuildMessage): Promise<void> {
        const censor = await this.cluster.database.guilds.getCensors(msg.channel.guild.id);
        if (!censor?.list?.length)
            return;

        //First, let's check exceptions
        const { channel, user, role } = censor.exception ?? {};
        if ((channel?.length && channel.includes(msg.channel.id))
            || (user?.length && user.includes(msg.author.id))
            || (role?.length && msg.member && this.cluster.util.hasRole(msg.member, role)))
            return;

        for (const cens of censor.list) {
            const term = cens.term;
            if (cens.regex) {
                try {
                    const regex = createRegExp(term);
                    if (!regex.test(msg.content))
                        continue;
                } catch (err) { }
            }
            else if (!msg.content.toLowerCase().includes(term.toLowerCase()))
                continue;

            const res = await this.cluster.util.moderation.issueWarning(msg.author, msg.channel.guild, cens.weight);
            if (cens.weight > 0) {
                await this.cluster.util.moderation.logAction(
                    msg.channel.guild,
                    msg.author,
                    this.cluster.discord.user,
                    'Auto-Warning',
                    cens.reason || 'Said a blacklisted phrase.',
                    modlogColour.WARN,
                    [
                        {
                            name: 'Warnings',
                            value: `Assigned: ${cens.weight}\nNew Total: ${res?.count || 0}`,
                            inline: true
                        }
                    ]);
            }
            try {
                await msg.delete();
            } catch (err) {
                // bu.send(msg, `${bu.getFullName(msg.author)} said a blacklisted word, but I was not able to delete it.`);
            }
            let content = '';
            switch (res?.type) {
                case ModerationType.KICK:
                    content = cens.deleteMessage ?? censor.rule?.deleteMessage ?? ''; // TODO cant find the definition for the default messages
                    break;
                case ModerationType.BAN:
                    content = cens.banMessage ?? censor.rule?.banMessage ?? ''; // TODO cant find the definition for the default messages
                    break;
                case ModerationType.WARN:
                    content = cens.kickMessage ?? censor.rule?.kickMessage ?? ''; // TODO cant find the definition for the default messages
                    break;
            }
            await this.cluster.bbtag.execute(content, {
                message: msg,
                tagName: 'censor',
                limit: limits.CustomCommandLimit,
                input: humanize.smartSplit(msg.content),
                isCC: true
            });
        }
    }

    public async handleRoleme(msg: GuildMessage): Promise<void> {
        const roleme = await this.cluster.database.guilds.getRolemes(msg.channel.guild.id);
        if (!roleme?.length || !msg.member)
            return;

        const rolemes = roleme.filter(m => m.channels.indexOf(msg.channel.id) > -1 || m.channels.length == 0);
        if (rolemes.length == 0)
            return;

        for (const roleme of rolemes) {
            let message = roleme.message;
            let content = msg.content;
            if (!roleme.casesensitive) {
                message = message.toLowerCase();
                content = content.toLowerCase();
            }
            if (message !== content)
                continue;

            const roleList = new Set(msg.member.roles);
            roleme.add?.forEach(r => roleList.add(r));
            roleme.remove?.forEach(r => roleList.add(r));

            try {
                await msg.member.edit({ roles: [...roleList] });
                this.logger.verbose(roleme.output);
                await this.cluster.bbtag.execute(roleme.output || 'Your roles have been edited!', {
                    message: msg,
                    tagName: 'roleme',
                    limit: limits.CustomCommandLimit,
                    input: [],
                    isCC: true
                });
            } catch (err) {
                await this.cluster.util.send(msg, 'A roleme was triggered, but I don\'t have the permissions required to give you your role!');
            }
        }
    }

    public async checkWhitelist(): Promise<void> {
        const whitelist = await this.cluster.database.vars.get('arwhitelist');
        this.#arWhitelist = new Set(whitelist?.values);
    }

    public defaultMember(msg: GuildMessage, tag: StoredGuildCommand): Member | null {
        if (msg.member)
            return msg.member;

        const id = tag.authorizer || tag.author;
        if (!id)
            return null;

        return msg.channel.guild.members.get(id) ?? null;
    }

    private async * findAutoresponses(msg: GuildMessage, everything: boolean): AsyncGenerator<{ commandName: string, limit: RuntimeLimit, silent?: boolean }> {
        const ars = await this.cluster.database.guilds.getAutoresponses(msg.channel.guild.id);
        if (everything) {
            if (ars.everything)
                yield { commandName: ars.everything.executes, limit: new limits.EverythingAutoResponseLimit(), silent: true };
            return;
        }

        if (ars.list === undefined)
            return;

        for (const ar of ars.list) {
            if (ar.regex) {
                try {
                    const exp = createRegExp(ar.term);
                    if (exp.exec(msg.content))
                        yield { commandName: ar.executes, limit: new limits.GeneralAutoResponseLimit() };
                } catch (err) {
                    this.logger.log(err);
                    await this.cluster.util.send(msg, 'Unsafe or invalid regex! Terminating.');
                    return;
                }
            } else if (msg.content.includes(ar.term)) {
                yield { commandName: ar.executes, limit: new limits.GeneralAutoResponseLimit() };
            }
        }
    }

    public async handleAutoresponse(msg: GuildMessage, everything: boolean): Promise<void> {
        if (!this.#arWhitelist.has(msg.channel.guild.id) || msg.author.discriminator === '0000')
            return;

        for await (const { commandName, limit, silent = false } of this.findAutoresponses(msg, everything)) {
            const tag = await this.cluster.database.guilds.getCommand(msg.channel.id, commandName);
            if (tag !== undefined) {
                await this.cluster.bbtag.execute(tag.content, {
                    message: msg,
                    limit,
                    author: tag.author,
                    input: humanize.smartSplit(msg.content),
                    isCC: true,
                    tagName: commandName,
                    silent
                });
            }
        }
    }

    public async isBlacklisted(channel: GuildChannel, user: User): Promise<boolean> {
        return (await this.cluster.database.guilds.getChannelSetting(channel.guild.id, channel.id, 'blacklisted') ?? false)
            && !await this.cluster.util.isUserStaff(user.id, channel.guild.id);
    }

    public async handleDeleteNotif(msg: GuildMessage): Promise<void> {
        const deleteNotif = await this.cluster.database.guilds.getSetting(msg.channel.guild.id, 'deletenotif');
        if (parse.boolean(deleteNotif, false, true))
            this.cluster.util.commandMessages.push(msg.channel.guild.id, msg.id);
    }


    public async queryCleverbot(input: string): Promise<string> {
        return await new Promise<string>((res, rej) => {
            request.post(this.cluster.config.cleverbot.endpoint, { form: { input } }, (err, _, bod: string) => {
                if (err) rej(err);
                else {
                    const content = /<font size="2" face="Verdana" color=darkred>(.+)<\/font>/.exec(bod);
                    if (content)
                        return res(content[1].replace(/(\W)alice(\W)/gi, '$1blargbot$2').replace(/<br>/gm, '\n'));
                    res('Hi, I\'m blargbot! It\'s nice to meet you.');
                }
            });
        });
    }

    public async handleCleverbot(msg: AnyMessage): Promise<void> {
        await this.cluster.discord.sendChannelTyping(msg.channel.id);
        let username = this.cluster.discord.user.username;
        if (guard.isGuildMessage(msg)) {
            const member = msg.channel.guild.members.get(this.cluster.discord.user.id);
            if (member?.nick)
                username = member.nick;
        }

        const msgToSend = msg.content.replace(new RegExp('@' + '\u200b' + username + ',?'), '').trim();
        metrics.cleverbotStats.inc();
        try {
            const response = await this.queryCleverbot(msgToSend);
            await sleep(1500);
            await this.cluster.util.send(msg, response);
        } catch (err) {
            this.logger.error(err);
            await this.cluster.util.send(msg, 'Failed to contact the API. Blame cleverbot.io');
        }
    }

    public async handleTableflip(msg: GuildMessage): Promise<void> {
        if (msg.content.indexOf('(╯°□°）╯︵ ┻━┻') > -1 && !msg.author.bot) {
            await this.flipTables(msg, false);
        }
        if (msg.content.indexOf('┬─┬﻿ ノ( ゜-゜ノ)') > -1 && !msg.author.bot) {
            await this.flipTables(msg, true);
        }
    }
}

const tables = {
    flip: {
        prod: [
            'Whoops! Let me get that for you ┬──┬﻿ ¯\\\\_(ツ)',
            '(ヘ･_･)ヘ┳━┳ What are you, an animal?',
            'Can you not? ヘ(´° □°)ヘ┳━┳',
            'Tables are not meant to be flipped ┬──┬ ノ( ゜-゜ノ)',
            '(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Wheee!',
            '┻━┻ ︵ヽ(`Д´)ﾉ︵﻿ ┻━┻ Get these tables out of my face!',
            '┻━┻ミ＼(≧ﾛ≦＼) Hey, catch!',
            'Flipping tables with elegance! (/¯◡ ‿ ◡)/¯ ~ ┻━┻'
        ]
    },
    unflip: {
        prod: [
            '┬──┬﻿ ¯\\\\_(ツ) A table unflipped is a table saved!',
            '┣ﾍ(≧∇≦ﾍ)… (≧∇≦)/┳━┳ Unflip that table!',
            'Yay! Cleaning up! ┣ﾍ(^▽^ﾍ)Ξ(ﾟ▽ﾟ*)ﾉ┳━┳',
            'ヘ(´° □°)ヘ┳━┳ Was that so hard?',
            '(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Here comes the entropy!',
            'I\'m sorry, did you just pick that up? ༼ﾉຈل͜ຈ༽ﾉ︵┻━┻',
            'Get back on the ground! (╯ರ ~ ರ）╯︵ ┻━┻',
            'No need to be so serious! (ﾉ≧∇≦)ﾉ ﾐ ┸━┸'
        ]
    }
};