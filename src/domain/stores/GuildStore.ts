import { ChannelSettings, CommandPermissions, GuildAnnounceOptions, GuildAutoresponses, GuildCensor, GuildCensors, GuildCommandTag, GuildDetails, GuildFilteredAutoresponse, GuildImportedCommandTag, GuildModlogEntry, GuildRolemeEntry, GuildSourceCommandTag, GuildTriggerTag, GuildVoteban, GuildVotebans, NamedGuildCommandTag, StoredGuild, StoredGuildEventLogConfig, StoredGuildEventLogType, StoredGuildSettings } from '../models';

export interface GuildStore {
    reset(guild: GuildDetails): Promise<void>;
    getRoleme(guildId: string, id: number, skipCache?: boolean): Promise<GuildRolemeEntry | undefined>;
    setRoleme(guildId: string, id: number, roleme: GuildRolemeEntry | undefined): Promise<boolean>;
    updateModlogCase(guildId: string, caseid: number, modlog: Partial<Omit<GuildModlogEntry, 'caseid'>>): Promise<boolean>;
    getModlogCase(guildId: string, caseId?: number, skipCache?: boolean): Promise<GuildModlogEntry | undefined>;
    removeModlogCases(guildId: string, ids?: readonly number[]): Promise<readonly GuildModlogEntry[] | undefined>;
    getInterval(guildId: string, skipCache?: boolean): Promise<GuildTriggerTag | undefined>;
    setInterval(guildId: string, interval: GuildTriggerTag | undefined): Promise<boolean>;
    getFarewell(guildId: string, skipCache?: boolean): Promise<GuildTriggerTag | undefined>;
    setFarewell(guildId: string, farewell: GuildTriggerTag | undefined): Promise<boolean>;
    getGreeting(guildId: string, skipCache?: boolean): Promise<GuildTriggerTag | undefined>;
    setGreeting(guildId: string, greeting: GuildTriggerTag | undefined): Promise<boolean>;
    setAnnouncements(guildId: string, options: GuildAnnounceOptions | undefined): Promise<boolean>;
    getAnnouncements(guildId: string, skipCache?: boolean): Promise<GuildAnnounceOptions | undefined>;
    clearVoteBans(guildId: string, userId?: string): Promise<void>;
    getVoteBans(guildId: string, skipCache?: boolean): Promise<GuildVotebans | undefined>;
    getVoteBans(guildId: string, target: string, skipCache?: boolean): Promise<readonly GuildVoteban[] | undefined>;
    hasVoteBanned(guildId: string, target: string, signee: string, skipCache?: boolean): Promise<boolean>;
    addVoteBan(guildId: string, target: string, signee: string, reason?: string): Promise<number | false>;
    removeVoteBan(guildId: string, target: string, signee: string): Promise<number | false>;
    getAutoresponse(guildId: string, index: number, skipCache?: boolean): Promise<GuildFilteredAutoresponse | undefined>;
    getAutoresponse(guildId: string, index: 'everything', skipCache?: boolean): Promise<GuildTriggerTag | undefined>;
    getAutoresponse(guildId: string, index: number | 'everything', skipCache?: boolean): Promise<GuildTriggerTag | GuildFilteredAutoresponse | undefined>;
    getAutoresponses(guildId: string, skipCache?: boolean): Promise<GuildAutoresponses | undefined>;
    setAutoresponse(guildId: string, index: number, autoresponse: GuildFilteredAutoresponse | undefined): Promise<boolean>;
    setAutoresponse(guildId: string, index: 'everything', autoresponse: GuildTriggerTag | undefined): Promise<boolean>;
    setAutoresponse<T extends number | 'everything'>(guildId: string, index: T, autoresponse: undefined | (T extends number ? GuildFilteredAutoresponse : GuildTriggerTag)): Promise<boolean>;
    getChannelSetting<K extends keyof ChannelSettings>(guildId: string, channelId: string, key: K, skipCache?: boolean): Promise<ChannelSettings[K] | undefined>;
    setChannelSetting<K extends keyof ChannelSettings>(guildId: string, channelId: string, key: K, value: ChannelSettings[K]): Promise<boolean>;
    getRolemes(guildId: string, skipCache?: boolean): Promise<{ readonly [id: string]: GuildRolemeEntry | undefined; } | undefined>;
    getCensors(guildId: string, skipCache?: boolean): Promise<GuildCensors | undefined>;
    getCensor(guildId: string, id: number, skipCache?: boolean): Promise<GuildCensor | undefined>;
    setCensor(guildId: string, id: number, censor: GuildCensor | undefined): Promise<boolean>;
    censorIgnoreUser(guildId: string, userId: string, ignored: boolean): Promise<boolean>;
    censorIgnoreChannel(guildId: string, channelId: string, ignored: boolean): Promise<boolean>;
    censorIgnoreRole(guildId: string, roleId: string, ignored: boolean): Promise<boolean>;
    setCensorRule(guildId: string, id: number | undefined, ruleType: 'timeout' | 'kick' | 'ban' | 'delete', code: GuildTriggerTag | undefined): Promise<boolean>;
    getCensorRule(guildId: string, id: number | undefined, ruleType: 'timeout' | 'kick' | 'ban' | 'delete', skipCache?: boolean): Promise<GuildTriggerTag | undefined>;
    getCustomCommands(guildId: string, skipCache?: boolean): Promise<readonly NamedGuildCommandTag[]>;
    getCustomCommandNames(guildId: string, skipCache?: boolean): Promise<readonly string[]>;
    get(guildId: string, skipCache?: boolean): Promise<StoredGuild | undefined>;
    upsert(guild: GuildDetails): Promise<'inserted' | 'updated' | false>;
    exists(guildId: string, skipCache?: boolean): Promise<boolean>;
    isActive(guildId: string, skipCache?: boolean): Promise<boolean>;
    setActive(guildId: string, active?: boolean): Promise<boolean>;
    getIds(skipCache?: boolean): Promise<readonly string[]>;
    getSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, skipCache?: boolean): Promise<StoredGuildSettings[K] | undefined>;
    setSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, value: StoredGuildSettings[K]): Promise<boolean>;
    getCommand(guildId: string, commandName: string, skipCache?: boolean): Promise<NamedGuildCommandTag | undefined>;
    getIntervals(skipCache?: boolean): Promise<ReadonlyArray<{ readonly guildId: string; readonly interval: GuildTriggerTag; }>>;
    updateCommand(guildId: string, commandName: string, command: Partial<GuildCommandTag>): Promise<boolean>;
    updateCommands(guildId: string, commandNames: string[], command: Partial<GuildCommandTag>): Promise<readonly string[]>;
    setCommand(guildId: string, commandName: string, command: GuildCommandTag | undefined): Promise<boolean>;
    setCommandProp<K extends keyof GuildSourceCommandTag>(guildId: string, commandName: string, key: K, value: GuildSourceCommandTag[K]): Promise<boolean>;
    setCommandProp<K extends keyof GuildImportedCommandTag>(guildId: string, commandName: string, key: K, value: GuildImportedCommandTag[K]): Promise<boolean>;
    setCommandProp<K extends keyof GuildCommandTag>(guildId: string, commandName: string, key: K, value: GuildCommandTag[K]): Promise<boolean>;
    renameCommand(guildId: string, oldName: string, newName: string): Promise<boolean>;
    getNewModlogCaseId(guildId: string, skipCache?: boolean): Promise<number | undefined>;
    addModlogCase(guildId: string, modlog: GuildModlogEntry): Promise<boolean>;
    getLogIgnores(guildId: string, skipCache?: boolean): Promise<ReadonlySet<string>>;
    getLogChannel(guildId: string, type: StoredGuildEventLogType, skipCache?: boolean): Promise<string | undefined>;
    getLogChannels(guildId: string, skipCache?: boolean): Promise<StoredGuildEventLogConfig>;
    setLogChannel(guildId: string, event: StoredGuildEventLogType, channel: string | undefined): Promise<boolean>;
    setLogChannel(guildId: string, events: StoredGuildEventLogType[], channel: string | undefined): Promise<boolean>;
    setLogIgnores(guildId: string, userIds: readonly string[], ignore: boolean): Promise<boolean>;
    getWarnings(guildId: string, userId: string, skipCache?: boolean): Promise<number | undefined>;
    setWarnings(guildId: string, userId: string, count: number | undefined): Promise<boolean>;
    getCommandPerms(guildId: string, skipCache?: boolean): Promise<Readonly<Record<string, CommandPermissions>> | undefined>;
    getCommandPerms(guildId: string, commandName: string, skipCache?: boolean): Promise<CommandPermissions | undefined>;
    setCommandPerms(guildId: string, commands: string[], permissions: Partial<CommandPermissions>): Promise<readonly string[]>;
}
