import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { GuildSetIconSubtag, SemiSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import * as Discord from 'discord-api-types/v10';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(GuildSetIconSubtag),
    argCountBounds: { min: 1, max: 1 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageGuild.toString();
    },
    cases: [
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [Subtag.getDescriptor(SemiSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.guildService.setup(m => m.edit(bbctx, argument.isDeepEqual({
                    icon: 'data:image/png;base64,abcdef'
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{guildseticon;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.guildService.setup(m => m.edit(bbctx, argument.isDeepEqual({
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC4UlEQVQ4EV2TS0xTQRSGa3sVJZGoMdpYWipcsSg0pSDYptJSESpagq8CWmvVUgWbgC8oaK0WRBMf+H7EBwYfUaPGxNfCa4gbFy6ICxeujS5cuXfzmRlTFG9ycmfm/uebOXPPrzMaFrNihp8FhhLGIg8xzF9Gt32QqY61JIsHSTvOoxR6SS4eYKo9wFhkVGpFjsjVuWfUyoWZUwoYi9xEiz3niPU4SmENe819dNkzKAvdJBb1cTQ0LDVCKzYUEJ0YiIVsHPMn0WKP+JX6hBZ7xruOJ/xKfUSLPebYqp4JXRaiyya+KrpP0pqmtjCGZnuKovrRPA944r2BYq1lRL2EzxSh23aEe2W3J0ASoM9zop9TjpLvRrM/x2eJopQ20l3UT2JJP/pZTqryQ7wsGEU/qwKDcTn6vHIJkYB5c20cbO7kwaLruIwhFFM1vabDMtEwt5yUeQD97Ep8+VFG1StS63QGJgNeHBjk57WHVNiD6PMc9JpSyJPlOUiZM3LsqW7h65lbjA+PMAkg7kEtdeOpW09d01ZWeTfj94Rk1Pu2cOqihfQhN2dHzPjXtNHUEp98B6KE3Woce3U9l67docuW4MKVW6wMhkn02Xl99wKnbQO8uXeRjp4ymtvi1Jj/K2FXUQxbuQ/xfAm/l++GdVH2Zxz8+KzxfeNHvo2/lYAtdXHWLNzw9w5ECUOWXtSlLtoTPTJ5X98AAhBYv50TV82Mf0jzSMslUtNBxpuZXIIjx4XD6GFbQZi1pSEcyxuo8DRyrjPJ7d4h6psjMtraV/L0sp1gVZiyadV/TiD62ZnjlpN6NSghK4oDspzW1a3EW9qp8gZpde0kVtLO0B6P1Ioc6YVl0z0TXhj1D7PAXEaiaJf8K0aTSr6lRAI2WTbhNzdyMpCWANs0J+LkOmGIbDuL/g9YgyxVKnFZ/RQUO2XsKIwyJ1eV34Qvsnpppn8BAWuDNNGgtx8RAiYiOxduFZp/Ab8B3ajWK9lV5k8AAAAASUVORK5CYII='
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{guildseticon;https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.guildService.setup(m => m.edit(bbctx, argument.isDeepEqual({
                    icon: 'data:;base64,'
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [Subtag.getDescriptor(SemiSubtag)],
            expected: '`Author cannot modify the guild`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Author cannot modify the guild') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{guildseticon;abcdef}',
            subtags: [Subtag.getDescriptor(SemiSubtag)],
            expected: '`Image was not a buffer or a URL`',
            errors: [
                { start: 0, end: 21, error: new BBTagRuntimeError('Image was not a buffer or a URL') }
            ]
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [Subtag.getDescriptor(SemiSubtag)],
            expected: '`Failed to set icon: This is an error`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Failed to set icon: This is an error') }
            ],
            postSetup(bbctx, ctx) {
                ctx.guildService.setup(m => m.edit(bbctx, argument.isDeepEqual({
                    icon: 'data:image/png;base64,abcdef'
                }))).thenResolve({ error: 'This is an error' });
            }
        }
    ]
});
