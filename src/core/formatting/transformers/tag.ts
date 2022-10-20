import Eris from 'eris';
import moment from 'moment-timezone';

import { Emote } from '../../Emote';
import { IValueResolverTransform } from '../FormatStringCompiler';

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
            const value = source(ctx);
            if (value === undefined)
                return undefined;
            if (typeof value !== 'object' || value === null)
                throw new Error('Value must be an object');
            if (value instanceof Eris.Base && (value instanceof Eris.User || value instanceof Eris.Role || value instanceof Eris.Channel))
                return value.mention;
            if (value instanceof Emote)
                return value.toString();
            if (value instanceof Date)
                return `<t:${moment(value).unix()}:${format ?? 'f'}>`;
            if (moment.isMoment(value))
                return `<t:${value.unix()}:${format ?? 'f'}>`;
            if (moment.isDuration(value))
                return `<t:${moment().add(value).unix()}:R>`;
            if ('username' in value && 'discriminator' in value)
                return `${String((value as { username: unknown; }).username)}#${String((value as { discriminator: unknown; }).discriminator)}`;
            throw new Error('Unrecognised item, failed to get the tag for it');
        };
    }
};
