import type Discord from '@blargbot/discord-types';

export interface ExtendedMessage extends Discord.GatewayMessageCreateDispatchData {
    readonly channel: Discord.APIChannel;
    readonly guild?: Discord.APIGuild;
}
