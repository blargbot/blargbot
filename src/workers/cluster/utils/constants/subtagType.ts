import { SubtagPropertiesSet } from '@cluster/types';

export enum SubtagType {
    SIMPLE = 1,
    COMPLEX,
    ARRAY,
    JSON,
    MATH,
    LANG,
    LOOPS,
    BOT,
    //API,
    MESSAGE,
    CHANNEL,
    THREAD,
    USER,
    ROLE,
    GUILD
}

export const tagTypeDetails: SubtagPropertiesSet = {
    [SubtagType.SIMPLE]: {
        name: 'Simple',
        desc: 'Subtags that require no arguments.'
    },
    [SubtagType.COMPLEX]: {
        name: 'General',
        desc: 'General purpose subtags.'
    },
    [SubtagType.ARRAY]: {
        name: 'Array',
        desc: 'Subtags designed specifically for arrays.'
    },
    [SubtagType.JSON]: {
        name: 'JSON',
        desc: 'Subtags designed for JSON objects.'
    },
    [SubtagType.MATH]: {
        name: 'Math',
        desc: 'Subtags designed for mathematical purposes.'
    },
    [SubtagType.LANG]: {
        name: 'Lang',
        desc: 'Lang'
    },
    [SubtagType.LOOPS]: {
        name: 'Loops',
        desc: 'Subtags that iterate over arrays/strings.'
    },
    [SubtagType.BOT]: {
        name: 'Blargbot',
        desc: 'Subtags that integrate with blargbots custom functions.'
    },
    // [SubtagType.API]: {
    //     name: 'API',
    //     desc: 'Subtags that access the discord API to perform operations.'
    // },
    [SubtagType.MESSAGE]: {
        name: 'Message',
        desc: 'Subtags that interact with messages.'
    },
    [SubtagType.CHANNEL]: {
        name: 'Channel',
        desc: 'Subtags that interact with channels.'
    },
    [SubtagType.THREAD]: {
        name: 'Thread',
        desc: 'Subtags that interact with threads.'
    },
    [SubtagType.USER]: {
        name: 'User',
        desc: 'Subtags that interact with users.'
    },
    [SubtagType.ROLE]: {
        name: 'Role',
        desc: 'Subtags that interact with roles.'
    },
    [SubtagType.GUILD]: {
        name: 'Guild',
        desc: 'Subtags that interact with guilds.'
    }
};
