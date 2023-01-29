import { Emote } from '@blargbot/discord-emote';
import { markup } from '@blargbot/discord-util';
import type { IValueResolverTransform } from '@blargbot/formatting';
import * as Eris from 'eris';
import moment from 'moment-timezone';

export const tag: IValueResolverTransform = {
    transform(_compiler, source, ...args) {
        let format: string | undefined;
        switch (args.length) {
            case 0: break;
            case 1:
                format = args[0];
                break;
            default: throw new Error('Tag accepts up to 1 value');
        }

        return ctx => {
            let value = source(ctx);
            if (value === undefined)
                return undefined;
            if (typeof value === 'number' || typeof value === 'string') {
                const v = value.toString();
                switch (format) {
                    case '@': return markup.user(v);
                    case '@&': return markup.role(v);
                    case '#': return markup.channel(v);
                    case 't': return markup.timestamp(parseFloat(v));
                    case 't:t':
                    case 't:T':
                    case 't:d':
                    case 't:D':
                    case 't:f':
                    case 't:F':
                    case 't:R': {
                        const key = format.split(':')[1];
                        return markup.timestamp[key](parseFloat(v));
                    }
                }
            }
            if (typeof value !== 'object' || value === null)
                throw new Error('Value must be an object');
            if (value instanceof Eris.Base && (value instanceof Eris.User || value instanceof Eris.Role || value instanceof Eris.Channel))
                return value.mention;
            if (value instanceof Emote)
                return value.toString();
            if (moment.isMoment(value))
                value = value.toDate();
            if (moment.isDuration(value)) {
                value = moment().add(value).toDate();
                format = 'R';
            }
            if (value instanceof Date) {
                const f = format !== undefined && markup.timestamp.isStyle(format) ? format : 'f';
                return markup.timestamp[f](value);
            }
            throw new Error('Unrecognised item, failed to get the tag for it');
        };
    }
};
