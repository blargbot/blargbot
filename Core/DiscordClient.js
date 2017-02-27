class DiscordClient extends _dep.Eris.Client {
    constructor(shardId) {
        super(_config.discord.token, {
            autoReconnect: true,
            disableEveryone: true,
            disableEvents: {
                TYPING_START: true
            },
            getAllUsers: true,
            maxShards: 1,
            firstShardId: shardId,
            lastShardId: shardId,
            restMode: true,
            defaultImageFormat: 'png',
            defaultImageSize: 512,
            messageLimit: 1
        });


    }
}