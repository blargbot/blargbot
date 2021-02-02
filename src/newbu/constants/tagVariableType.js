module.exports = {
    LOCAL: 1,
    AUTHOR: 2,
    GUILD: 3,
    GLOBAL: 4,
    TAGGUILD: 5,
    GUILDLOCAL: 6,
    properties: {
        1: {
            table: 'tag'
        },
        2: {
            table: 'user'
        },
        3: {
            table: 'guild'
        },
        4: {
            table: 'vars'
        },
        5: {
            table: 'tag'
        },
        6: {
            table: 'guild'
        }
    }
};