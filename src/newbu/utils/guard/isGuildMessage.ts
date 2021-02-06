import { AnyChannel, GuildTextableChannel, Message, Textable } from "eris";
import { isGuildChannel } from "./isGuildChannel";


export function isGuildMessage<T extends Textable & AnyChannel>(message: Message<T>): message is Message<GuildTextableChannel & T> {
    return isGuildChannel(message.channel);
}
