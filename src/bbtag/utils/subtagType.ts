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
        name: `Simple`,
        desc: `Subtags that require no arguments.`
    },
    [SubtagType.MISC]: {
        name: `Miscellaneous`,
        desc: `Miscellaneous subtags for general things.`
    },
    [SubtagType.ARRAY]: {
        name: `Array`,
        desc: `Subtags designed specifically for arrays.`
    },
    [SubtagType.JSON]: {
        name: `JSON`,
        desc: `Subtags designed for JSON objects.`
    },
    [SubtagType.MATH]: {
        name: `Math`,
        desc: `Subtags designed for mathematical purposes.`
    },
    [SubtagType.LOOPS]: {
        name: `Loops`,
        desc: `Subtags that iterate over arrays/strings.`
    },
    [SubtagType.BOT]: {
        name: `Blargbot`,
        desc: `Subtags that integrate with blargbots custom functions.`
    },
    [SubtagType.MESSAGE]: {
        name: `Message`,
        desc: `Subtags that interact with messages.`
    },
    [SubtagType.CHANNEL]: {
        name: `Channel`,
        desc: `Subtags that interact with channels.`
    },
    [SubtagType.THREAD]: {
        name: `Thread`,
        desc: `Subtags that interact with threads.`
    },
    [SubtagType.USER]: {
        name: `User`,
        desc: `Subtags that interact with users.`
    },
    [SubtagType.ROLE]: {
        name: `Role`,
        desc: `Subtags that interact with roles.`
    },
    [SubtagType.GUILD]: {
        name: `Guild`,
        desc: `Subtags that interact with guilds.`
    }
};
