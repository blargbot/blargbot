
type TagPropertiesSet = {
    [key in Type]: TagProperties;
}

export interface TagProperties {
    name: string;
    desc: string;
}

export enum Type {
    SIMPLE = 1,
    COMPLEX,
    ARRAY,
    BOT,
    API
}

export const properties: TagPropertiesSet = {
    [Type.SIMPLE]: {
        name: 'Simple',
        desc: 'Subtags that require no arguments.'
    },
    [Type.COMPLEX]: {
        name: 'General',
        desc: 'General purpose subtags.'
    },
    [Type.ARRAY]: {
        name: 'Array',
        desc: 'Subtags designed specifically for arrays.'
    },
    [Type.BOT]: {
        name: 'Blargbot',
        desc: 'Subtags that integrate with blargbots custom functions.'
    },
    [Type.API]: {
        name: 'API',
        desc: 'Subtags that access the discord API to perform operations'
    }
}