
type SubtagVariablePropertiesSet = {
    [key in Type]: SubtagVariableProperties;
}

export interface SubtagVariableProperties {
    table: string;
}

export enum Type {
    LOCAL = 1,
    AUTHOR,
    GUILD,
    GLOBAL,
    TAGGUILD,
    GUILDLOCAL
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