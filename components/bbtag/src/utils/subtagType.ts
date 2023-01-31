import textTemplates from '../text.js';
import type { SubtagPropertiesSet } from '../types.js';

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
        name: textTemplates.subtag.types.simple.name,
        desc: textTemplates.subtag.types.simple.description
    },
    [SubtagType.MISC]: {
        id: SubtagType.MISC,
        name: textTemplates.subtag.types.misc.name,
        desc: textTemplates.subtag.types.misc.description
    },
    [SubtagType.ARRAY]: {
        id: SubtagType.ARRAY,
        name: textTemplates.subtag.types.array.name,
        desc: textTemplates.subtag.types.array.description
    },
    [SubtagType.JSON]: {
        id: SubtagType.JSON,
        name: textTemplates.subtag.types.json.name,
        desc: textTemplates.subtag.types.json.description
    },
    [SubtagType.MATH]: {
        id: SubtagType.MATH,
        name: textTemplates.subtag.types.math.name,
        desc: textTemplates.subtag.types.math.description
    },
    [SubtagType.LOOPS]: {
        id: SubtagType.LOOPS,
        name: textTemplates.subtag.types.loops.name,
        desc: textTemplates.subtag.types.loops.description
    },
    [SubtagType.BOT]: {
        id: SubtagType.BOT,
        name: textTemplates.subtag.types.bot.name,
        desc: textTemplates.subtag.types.bot.description
    },
    [SubtagType.MESSAGE]: {
        id: SubtagType.MESSAGE,
        name: textTemplates.subtag.types.message.name,
        desc: textTemplates.subtag.types.message.description
    },
    [SubtagType.CHANNEL]: {
        id: SubtagType.CHANNEL,
        name: textTemplates.subtag.types.channel.name,
        desc: textTemplates.subtag.types.channel.description
    },
    [SubtagType.THREAD]: {
        id: SubtagType.THREAD,
        name: textTemplates.subtag.types.thread.name,
        desc: textTemplates.subtag.types.thread.description
    },
    [SubtagType.USER]: {
        id: SubtagType.USER,
        name: textTemplates.subtag.types.user.name,
        desc: textTemplates.subtag.types.user.description
    },
    [SubtagType.ROLE]: {
        id: SubtagType.ROLE,
        name: textTemplates.subtag.types.role.name,
        desc: textTemplates.subtag.types.role.description
    },
    [SubtagType.GUILD]: {
        id: SubtagType.GUILD,
        name: textTemplates.subtag.types.guild.name,
        desc: textTemplates.subtag.types.guild.description
    }
};
