
type SubtagVariablePropertiesSet = {
    [key in Type]: SubtagVariableProperties;
}

export interface SubtagVariableProperties {
    table: string;
}

export enum Type {
    LOCAL = 'LOCAL_TAG',
    AUTHOR = 'AUTHOR',
    GUILD = 'GUILD_CC',
    GLOBAL = 'GLOBAL',
    TAGGUILD = 'GUILD_TAG',
    GUILDLOCAL = 'LOCAL_CC'
}

export const properties: SubtagVariablePropertiesSet = {
    [Type.LOCAL]: {
        table: 'tag'
    },
    [Type.AUTHOR]: {
        table: 'user'
    },
    [Type.GUILD]: {
        table: 'guild'
    },
    [Type.GLOBAL]: {
        table: 'vars'
    },
    [Type.TAGGUILD]: {
        table: 'tag'
    },
    [Type.GUILDLOCAL]: {
        table: 'guild'
    }
};