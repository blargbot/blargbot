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
    readonly greetChan?: string;
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
