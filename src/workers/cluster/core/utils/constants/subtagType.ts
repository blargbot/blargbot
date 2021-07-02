import { SubtagPropertiesSet } from '../../types';

export enum SubtagType {
    SIMPLE = 1,
    COMPLEX,
    ARRAY,
    BOT,
    API
}

export const properties: SubtagPropertiesSet = {
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
    [SubtagType.BOT]: {
        name: 'Blargbot',
        desc: 'Subtags that integrate with blargbots custom functions.'
    },
    [SubtagType.API]: {
        name: 'API',
        desc: 'Subtags that access the discord API to perform operations'
    }
};