module.exports = {
    SIMPLE: 1,
    COMPLEX: 2,
    ARRAY: 3,
    BOT: 4,
    API: 5,
    properties: {
        1: {
            name: 'Simple',
            desc: 'Subtags that require no arguments.'
        },
        2: {
            name: 'General',
            desc: 'General purpose subtags.'
        },
        3: {
            name: 'Array',
            desc: 'Subtags designed specifically for arrays.'
        },
        4: {
            name: 'Blargbot',
            desc: 'Subtags that integrate with blargbots custom functions.'
        },
        5: {
            name: 'API',
            desc: 'Subtags that access the discord API to perform operations'
        }
    }
}