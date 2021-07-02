import { SubtagVariablePropertiesSet } from '../../types';

export enum SubtagVariableType {
    LOCAL = 'LOCAL_TAG',
    AUTHOR = 'AUTHOR',
    GUILD = 'GUILD_CC',
    GLOBAL = 'GLOBAL',
    TAGGUILD = 'GUILD_TAG',
    GUILDLOCAL = 'LOCAL_CC'
}

export const properties: SubtagVariablePropertiesSet = {
    [SubtagVariableType.LOCAL]: {
        table: 'tag'
    },
    [SubtagVariableType.AUTHOR]: {
        table: 'user'
    },
    [SubtagVariableType.GUILD]: {
        table: 'guild'
    },
    [SubtagVariableType.GLOBAL]: {
        table: 'vars'
    },
    [SubtagVariableType.TAGGUILD]: {
        table: 'tag'
    },
    [SubtagVariableType.GUILDLOCAL]: {
        table: 'guild'
    }
};