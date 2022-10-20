import { SubtagPropertiesSet } from '../types';

export enum SubtagType {
    SIMPLE = 1,
    MISC,
    ARRAY,
    JSON,
    MATH,
    LOOPS,
    BOT,
    MESSAGE,
    CHANNEL,
    THREAD,
    USER,
    ROLE,
    GUILD
}

export const tagTypeDetails: SubtagPropertiesSet = {
    [SubtagType.SIMPLE]: {
        id: SubtagType.SIMPLE,
        name: 'Simple',
        desc: 'Subtags that require no arguments.'
    },
    [SubtagType.MISC]: {
        id: SubtagType.MISC,
        name: 'Miscellaneous',
        desc: 'Miscellaneous subtags for general things.'
    },
    [SubtagType.ARRAY]: {
        id: SubtagType.ARRAY,
        name: 'Array',
        desc: 'Subtags designed specifically for arrays.'
    },
    [SubtagType.JSON]: {
        id: SubtagType.JSON,
        name: 'JSON',
        desc: 'Subtags designed for JSON objects.'
    },
    [SubtagType.MATH]: {
        id: SubtagType.MATH,
        name: 'Math',
        desc: 'Subtags designed for mathematical purposes.'
    },
    [SubtagType.LOOPS]: {
        id: SubtagType.LOOPS,
        name: 'Loops',
        desc: 'Subtags that iterate over arrays/strings.'
    },
    [SubtagType.BOT]: {
        id: SubtagType.BOT,
        name: 'Blargbot',
        desc: 'Subtags that integrate with blargbots custom functions.'
    },
    [SubtagType.MESSAGE]: {
        id: SubtagType.MESSAGE,
        name: 'Message',
        desc: 'Subtags that interact with messages.'
    },
    [SubtagType.CHANNEL]: {
        id: SubtagType.CHANNEL,
        name: 'Channel',
        desc: 'Subtags that interact with channels.'
    },
    [SubtagType.THREAD]: {
        id: SubtagType.THREAD,
        name: 'Thread',
        desc: 'Subtags that interact with threads.'
    },
    [SubtagType.USER]: {
        id: SubtagType.USER,
        name: 'User',
        desc: 'Subtags that interact with users.'
    },
    [SubtagType.ROLE]: {
        id: SubtagType.ROLE,
        name: 'Role',
        desc: 'Subtags that interact with roles.'
    },
    [SubtagType.GUILD]: {
        id: SubtagType.GUILD,
        name: 'Guild',
        desc: 'Subtags that interact with guilds.'
    }
};
