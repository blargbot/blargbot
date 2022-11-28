import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { EmojiCreateSubtag } from '@blargbot/bbtag/subtags/guild/emojiCreate';
import { SemiSubtag } from '@blargbot/bbtag/subtags/simple/semi';
import { argument } from '@blargbot/test-util/mock';
import Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new EmojiCreateSubtag(),
    argCountBounds: { min: 2, max: 3 },
    setup(ctx) {
        ctx.roles.authorizer.permissions = Eris.Constants.Permissions.manageEmojisAndStickers.toString();
    },
    cases: [
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '23946249762743426',
            setup(ctx) {
                ctx.discord.setup(m => m.createGuildEmoji(ctx.guild.id, argument.isDeepEqual({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).thenResolve({
                    animated: false,
                    available: true,
                    id: '23946249762743426',
                    managed: false,
                    name: 'My cool emoji',
                    roles: [],
                    require_colons: true
                });
            }
        },
        {
            code: '{emojicreate;My cool emoji;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            expected: '23946249762743426',
            setup(ctx) {
                ctx.discord.setup(m => m.createGuildEmoji(ctx.guild.id, argument.isDeepEqual({
                    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC4UlEQVQ4EV2TS0xTQRSGa3sVJZGoMdpYWipcsSg0pSDYptJSESpagq8CWmvVUgWbgC8oaK0WRBMf+H7EBwYfUaPGxNfCa4gbFy6ICxeujS5cuXfzmRlTFG9ycmfm/uebOXPPrzMaFrNihp8FhhLGIg8xzF9Gt32QqY61JIsHSTvOoxR6SS4eYKo9wFhkVGpFjsjVuWfUyoWZUwoYi9xEiz3niPU4SmENe819dNkzKAvdJBb1cTQ0LDVCKzYUEJ0YiIVsHPMn0WKP+JX6hBZ7xruOJ/xKfUSLPebYqp4JXRaiyya+KrpP0pqmtjCGZnuKovrRPA944r2BYq1lRL2EzxSh23aEe2W3J0ASoM9zop9TjpLvRrM/x2eJopQ20l3UT2JJP/pZTqryQ7wsGEU/qwKDcTn6vHIJkYB5c20cbO7kwaLruIwhFFM1vabDMtEwt5yUeQD97Ep8+VFG1StS63QGJgNeHBjk57WHVNiD6PMc9JpSyJPlOUiZM3LsqW7h65lbjA+PMAkg7kEtdeOpW09d01ZWeTfj94Rk1Pu2cOqihfQhN2dHzPjXtNHUEp98B6KE3Woce3U9l67docuW4MKVW6wMhkn02Xl99wKnbQO8uXeRjp4ymtvi1Jj/K2FXUQxbuQ/xfAm/l++GdVH2Zxz8+KzxfeNHvo2/lYAtdXHWLNzw9w5ECUOWXtSlLtoTPTJ5X98AAhBYv50TV82Mf0jzSMslUtNBxpuZXIIjx4XD6GFbQZi1pSEcyxuo8DRyrjPJ7d4h6psjMtraV/L0sp1gVZiyadV/TiD62ZnjlpN6NSghK4oDspzW1a3EW9qp8gZpde0kVtLO0B6P1Ioc6YVl0z0TXhj1D7PAXEaiaJf8K0aTSr6lRAI2WTbhNzdyMpCWANs0J+LkOmGIbDuL/g9YgyxVKnFZ/RQUO2XsKIwyJ1eV34Qvsnpppn8BAWuDNNGgtx8RAiYiOxduFZp/Ab8B3ajWK9lV5k8AAAAASUVORK5CYII=',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).thenResolve({
                    animated: false,
                    available: true,
                    id: '23946249762743426',
                    managed: false,
                    name: 'My cool emoji',
                    roles: [],
                    require_colons: true
                });
            }
        },
        {
            code: '{emojicreate;My cool emoji;https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0}',
            expected: '23946249762743426',
            setup(ctx) {
                ctx.discord.setup(m => m.createGuildEmoji(ctx.guild.id, argument.isDeepEqual({
                    image: 'data:;base64,',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).thenResolve({
                    animated: false,
                    available: true,
                    id: '23946249762743426',
                    managed: false,
                    name: 'My cool emoji',
                    roles: [],
                    require_colons: true
                });
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef;["9128735617428916","abc",null]}',
            subtags: [new SemiSubtag()],
            expected: '23946249762743426',
            setup(ctx) {
                ctx.roles.other.id = '9128735617428916';

                ctx.discord.setup(m => m.createGuildEmoji(ctx.guild.id, argument.isDeepEqual({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: ['9128735617428916']
                }), 'Command User#0000')).thenResolve({
                    animated: false,
                    available: true,
                    id: '23946249762743426',
                    managed: false,
                    name: 'My cool emoji',
                    roles: ['9128735617428916'],
                    require_colons: true
                });
            },
            postSetup(bbctx, ctx) {
                const role = bbctx.guild.roles.get(ctx.roles.other.id);
                if (role === undefined)
                    throw new Error('Failed to find role under test');

                ctx.util.setup(m => m.findRoles(bbctx.guild, '9128735617428916')).thenResolve([role]);
                ctx.util.setup(m => m.findRoles(bbctx.guild, 'abc')).thenResolve([]);
                ctx.util.setup(m => m.findRoles(bbctx.guild, '')).thenResolve([]);
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Author cannot create emojis`',
            errors: [
                { start: 0, end: 61, error: new BBTagRuntimeError('Author cannot create emojis') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{emojicreate;;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Name was not provided`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Name was not provided') }
            ]
        },
        {
            code: '{emojicreate;My cool emoji;abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Image was not a buffer or a URL`',
            errors: [
                { start: 0, end: 34, error: new BBTagRuntimeError('Image was not a buffer or a URL') }
            ]
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to create emoji: This is an error`',
            errors: [
                { start: 0, end: 61, error: new BBTagRuntimeError('Failed to create emoji: This is an error') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error');
                ctx.discord.setup(m => m.createGuildEmoji(ctx.guild.id, argument.isDeepEqual({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).thenReject(error);
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to create emoji: And this is line 2`',
            errors: [
                { start: 0, end: 61, error: new BBTagRuntimeError('Failed to create emoji: And this is line 2') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error\nAnd this is line 2');
                ctx.discord.setup(m => m.createGuildEmoji(ctx.guild.id, argument.isDeepEqual({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).thenReject(error);
            }
        }
    ]
});
