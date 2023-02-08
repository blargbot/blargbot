import type { IFormattable } from '@blargbot/formatting';
import { FormatString } from '@blargbot/formatting';
import type * as Eris from 'eris';

export const templates = FormatString.defineTree('core', t => ({
    common: {
        duration: {
            full: {
                template: t<{ parts: Iterable<string>; }>('{parts#plural(0:0 seconds|{#join(, | and )})}'),
                year: {
                    order: '0',
                    display: t<{ value: number; }>('{value#plural(0:|1:1 year|{} years)}')
                },
                month: {
                    order: '1',
                    display: t<{ value: number; }>('{value#plural(0:|1:1 month|{} months)}')
                },
                day: {
                    order: '2',
                    display: t<{ value: number; }>('{value#plural(0:|1:1 day|{} days)}')
                },
                hour: {
                    order: '3',
                    display: t<{ value: number; }>('{value#plural(0:|1:1 hour|{} hours)}')
                },
                minute: {
                    order: '4',
                    display: t<{ value: number; }>('{value#plural(0:|1:1 minute|{} minutes)}')
                },
                second: {
                    order: '5',
                    display: t<{ value: number; }>('{value#plural(0:|1:1 second|{} seconds)}')
                },
                millisecond: {
                    order: '6',
                    display: t<{ value: number; }>('{value#plural(0:|1:1 millisecond|{} milliseconds)}')
                }
            }
        }
    },
    utils: {
        send: {
            errors: {
                messageNoPerms: 'I tried to send a message in response to your command, but didn\'t have permission to speak. If you think this is an error, please contact the staff on your guild to give me the `Send Messages` permission.',
                channelNoPerms: 'I tried to send a message in response to your command, but didn\'t have permission to see the channel. If you think this is an error, please contact the staff on your guild to give me the `Read Messages` permission.',
                embedNoPerms: 'I don\'t have permission to embed links! This will break several of my commands. Please give me the `Embed Links` permission. Thanks!',
                guild: t<{ channel: Eris.GuildChannel; message: IFormattable<string>; }>('{message}\nGuild: {channel.guild.name} ({channel.guild.id})\nChannel: {channel.name} ({channel.id})\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.'),
                dm: t<{ channel: Eris.Channel; message: IFormattable<string>; }>('{message}\nChannel: PRIVATE CHANNEL ({channel.id})\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.')
            }
        }
    }
}));

export default templates;
