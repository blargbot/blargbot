
type VariablePropertiesSet = {
    [key in Type]: VariableProperties;
}

export interface VariableProperties {
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

export const properties: VariablePropertiesSet = {
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