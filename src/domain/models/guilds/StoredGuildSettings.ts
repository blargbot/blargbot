export interface StoredGuildSettings {
    readonly actonlimitsonly?: boolean;
    readonly adminrole?: string; // role tag or role name
    readonly antimention?: number;
    readonly banat?: number;
    readonly banoverride?: string;
    readonly cahnsfw?: boolean;
    readonly deletenotif?: boolean;
    readonly disableeveryone?: boolean;
    readonly disablenoperms?: boolean;
    readonly dmhelp?: boolean;
    readonly farewellchan?: string;
    readonly greetchan?: string;
    readonly kickat?: number;
    readonly kickoverride?: string;
    readonly makelogs?: boolean;
    readonly modlog?: string; // channelid or channel tag
    readonly mutedrole?: string; // roleid or role tag
    readonly nocleverbot?: boolean;
    readonly prefix?: readonly string[];
    readonly social?: boolean;
    readonly staffperms?: string;
    readonly tableflip?: boolean;
}

export type GuildSettingDocs = {
    [P in keyof StoredGuildSettings as GetConfigurableSettingKey<P>]-?: GuildSettingDescriptor<P>
}

type GetConfigurableSettingKey<T extends keyof StoredGuildSettings> = GuildSettingTypeName<StoredGuildSettings[T]> extends never ? never : T;

type GuildSettingTypeName<T> =
    | (T extends string ? 'string' | 'channel' | 'role' | 'permission' : never)
    | (T extends number ? 'float' | 'int' : never)
    | (T extends boolean ? 'bool' : never)

type GuildSettingDescriptor<T extends keyof StoredGuildSettings = keyof StoredGuildSettings> = {
    readonly key: T;
    readonly name: string;
    readonly desc: string;
    readonly type: GuildSettingTypeName<StoredGuildSettings[T]>;
}
