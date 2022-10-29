import { FormatString, IFormattable } from '@blargbot/formatting';
import { Channel, GuildChannel } from 'eris';

export const templates = FormatString.defineTree('core', t => ({
    common: {
        duration: {
            full: {
                template: t<{ parts: Iterable<string>; }>()('{parts#plural(0:0 seconds|{#join(, | and )})}'),
                year: {
                    order: t('0'),
                    display: t<{ value: number; }>()('{value#plural(0:|1:1 year|{} years)}')
                },
                month: {
                    order: t('1'),
                    display: t<{ value: number; }>()('{value#plural(0:|1:1 month|{} months)}')
                },
                day: {
                    order: t('2'),
                    display: t<{ value: number; }>()('{value#plural(0:|1:1 day|{} days)}')
                },
                hour: {
                    order: t('3'),
                    display: t<{ value: number; }>()('{value#plural(0:|1:1 hour|{} hours)}')
                },
                minute: {
                    order: t('4'),
                    display: t<{ value: number; }>()('{value#plural(0:|1:1 minute|{} minutes)}')
                },
                second: {
                    order: t('5'),
                    display: t<{ value: number; }>()('{value#plural(0:|1:1 second|{} seconds)}')
                },
                millisecond: {
                    order: t('6'),
                    display: t<{ value: number; }>()('{value#plural(0:|1:1 millisecond|{} milliseconds)}')
                }
            }
        }
    },
    utils: {
        send: {
            errors: {
                messageNoPerms: t('I tried to send a message in response to your command, but didn\'t have permission to speak. If you think this is an error, please contact the staff on your guild to give me the `Send Messages` permission.'),
                channelNoPerms: t('I tried to send a message in response to your command, but didn\'t have permission to see the channel. If you think this is an error, please contact the staff on your guild to give me the `Read Messages` permission.'),
                embedNoPerms: t('I don\'t have permission to embed links! This will break several of my commands. Please give me the `Embed Links` permission. Thanks!'),
                guild: t<{ channel: GuildChannel; message: IFormattable<string>; }>()('{message}\nGuild: {channel.guild.name} ({channel.guild.id})\nChannel: {channel.name} ({channel.id})\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.'),
                dm: t<{ channel: Channel; message: IFormattable<string>; }>()('{message}\nChannel: PRIVATE CHANNEL ({channel.id})\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.')
            }
        }
    }
}));

export default templates;
