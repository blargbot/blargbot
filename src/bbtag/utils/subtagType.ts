import templates from '../text.js';
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
        name: templates.subtag.types.simple.name,
        desc: templates.subtag.types.simple.description
    },
    [SubtagType.MISC]: {
        id: SubtagType.MISC,
        name: templates.subtag.types.misc.name,
        desc: templates.subtag.types.misc.description
    },
    [SubtagType.ARRAY]: {
        id: SubtagType.ARRAY,
        name: templates.subtag.types.array.name,
        desc: templates.subtag.types.array.description
    },
    [SubtagType.JSON]: {
        id: SubtagType.JSON,
        name: templates.subtag.types.json.name,
        desc: templates.subtag.types.json.description
    },
    [SubtagType.MATH]: {
        id: SubtagType.MATH,
        name: templates.subtag.types.math.name,
        desc: templates.subtag.types.math.description
    },
    [SubtagType.LOOPS]: {
        id: SubtagType.LOOPS,
        name: templates.subtag.types.loops.name,
        desc: templates.subtag.types.loops.description
    },
    [SubtagType.BOT]: {
        id: SubtagType.BOT,
        name: templates.subtag.types.bot.name,
        desc: templates.subtag.types.bot.description
    },
    [SubtagType.MESSAGE]: {
        id: SubtagType.MESSAGE,
        name: templates.subtag.types.message.name,
        desc: templates.subtag.types.message.description
    },
    [SubtagType.CHANNEL]: {
        id: SubtagType.CHANNEL,
        name: templates.subtag.types.channel.name,
        desc: templates.subtag.types.channel.description
    },
    [SubtagType.THREAD]: {
        id: SubtagType.THREAD,
        name: templates.subtag.types.thread.name,
        desc: templates.subtag.types.thread.description
    },
    [SubtagType.USER]: {
        id: SubtagType.USER,
        name: templates.subtag.types.user.name,
        desc: templates.subtag.types.user.description
    },
    [SubtagType.ROLE]: {
        id: SubtagType.ROLE,
        name: templates.subtag.types.role.name,
        desc: templates.subtag.types.role.description
    },
    [SubtagType.GUILD]: {
        id: SubtagType.GUILD,
        name: templates.subtag.types.guild.name,
        desc: templates.subtag.types.guild.description
    }
};
