export interface BBTagVariable {
    readonly name: string;
    readonly type: SubtagVariableType;
    readonly scope: string;
    content: string;
}

export enum SubtagVariableType {
    LOCAL = 'LOCAL_TAG',
    AUTHOR = 'AUTHOR',
    GUILD = 'GUILD_CC',
    GLOBAL = 'GLOBAL',
    TAGGUILD = 'GUILD_TAG',
    GUILDLOCAL = 'LOCAL_CC'
}
