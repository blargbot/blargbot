module.exports = {
    GENERAL: 1,
    CAT: 2,
    NSFW: 3,
    IMAGE: 4,
    MUSIC: 5,
    ADMIN: 6,
    SOCIAL: 7,
    properties: {
        1: {
            name: 'General',
            requirement: () => true,
            description: 'General commands.'
        },
        2: {
            name: 'CATZ MEOW MEOW',
            requirement: msg => msg.author.id == config.discord.users.owner,
            description: 'MREOW MEOWWWOW! **purr**'
        },
        3: {
            name: 'NSFW',
            requirement: () => true,
            description: 'Commands that can only be executed in NSFW channels.'
        },
        4: {
            name: 'Image',
            requirement: () => true,
            description: 'Commands that generate or display images.'
        },
        5: {
            name: 'Music',
            requirement: () => false
        },
        6: {
            name: 'Admin',
            requirement: () => true,
            perm: 'Admin',
            description: 'Powerful commands that require an `admin` role or special permissions.'
        },
        7: {
            name: 'Social',
            requirement: async (msg, storedGuild) => {
                return storedGuild.settings.social;
            },
            description: 'Social commands for interacting with other people'
        }
    }
};