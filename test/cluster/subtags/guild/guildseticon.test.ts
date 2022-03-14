import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { GuildSetIconSubtag } from '@blargbot/cluster/subtags/guild/guildseticon';
import { SemiSubtag } from '@blargbot/cluster/subtags/simple/semi';
import { Constants } from 'eris';

import { argument } from '../../../mock';
import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new GuildSetIconSubtag(),
    argCountBounds: { min: 1, max: 1 },
    setup(ctx) {
        ctx.roles.command.permissions = Constants.Permissions.manageGuild.toString();
    },
    cases: [
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.discord.setup(m => m.editGuild(ctx.guild.id, argument.isDeepEqual({
                    icon: 'data:image/png;base64,abcdef'
                }), 'Command User#0000')).thenResolve(bbctx.guild);
            }
        },
        {
            code: '{guildseticon;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.discord.setup(m => m.editGuild(ctx.guild.id, argument.isDeepEqual({
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC4UlEQVQ4EV2TS0xTQRSGa3sVJZGoMdpYWipcsSg0pSDYptJSESpagq8CWmvVUgWbgC8oaK0WRBMf+H7EBwYfUaPGxNfCa4gbFy6ICxeujS5cuXfzmRlTFG9ycmfm/uebOXPPrzMaFrNihp8FhhLGIg8xzF9Gt32QqY61JIsHSTvOoxR6SS4eYKo9wFhkVGpFjsjVuWfUyoWZUwoYi9xEiz3niPU4SmENe819dNkzKAvdJBb1cTQ0LDVCKzYUEJ0YiIVsHPMn0WKP+JX6hBZ7xruOJ/xKfUSLPebYqp4JXRaiyya+KrpP0pqmtjCGZnuKovrRPA944r2BYq1lRL2EzxSh23aEe2W3J0ASoM9zop9TjpLvRrM/x2eJopQ20l3UT2JJP/pZTqryQ7wsGEU/qwKDcTn6vHIJkYB5c20cbO7kwaLruIwhFFM1vabDMtEwt5yUeQD97Ep8+VFG1StS63QGJgNeHBjk57WHVNiD6PMc9JpSyJPlOUiZM3LsqW7h65lbjA+PMAkg7kEtdeOpW09d01ZWeTfj94Rk1Pu2cOqihfQhN2dHzPjXtNHUEp98B6KE3Woce3U9l67docuW4MKVW6wMhkn02Xl99wKnbQO8uXeRjp4ymtvi1Jj/K2FXUQxbuQ/xfAm/l++GdVH2Zxz8+KzxfeNHvo2/lYAtdXHWLNzw9w5ECUOWXtSlLtoTPTJ5X98AAhBYv50TV82Mf0jzSMslUtNBxpuZXIIjx4XD6GFbQZi1pSEcyxuo8DRyrjPJ7d4h6psjMtraV/L0sp1gVZiyadV/TiD62ZnjlpN6NSghK4oDspzW1a3EW9qp8gZpde0kVtLO0B6P1Ioc6YVl0z0TXhj1D7PAXEaiaJf8K0aTSr6lRAI2WTbhNzdyMpCWANs0J+LkOmGIbDuL/g9YgyxVKnFZ/RQUO2XsKIwyJ1eV34Qvsnpppn8BAWuDNNGgtx8RAiYiOxduFZp/Ab8B3ajWK9lV5k8AAAAASUVORK5CYII='
                }), 'Command User#0000')).thenResolve(bbctx.guild);
            }
        },
        {
            code: '{guildseticon;https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.discord.setup(m => m.editGuild(ctx.guild.id, argument.isDeepEqual({
                    icon: 'data:;base64,'
                }), 'Command User#0000')).thenResolve(bbctx.guild);
            }
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Author cannot modify the guild`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Author cannot modify the guild') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = '0';
            }
        },
        {
            code: '{guildseticon;abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Image was not a buffer or a URL`',
            errors: [
                { start: 0, end: 21, error: new BBTagRuntimeError('Image was not a buffer or a URL') }
            ]
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to set icon: This is an error`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Failed to set icon: This is an error') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error');
                ctx.discord.setup(m => m.editGuild(ctx.guild.id, argument.isDeepEqual({
                    icon: 'data:image/png;base64,abcdef'
                }), 'Command User#0000')).thenReject(error);
            }
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to set icon: And this is line 2`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Failed to set icon: And this is line 2') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error\nAnd this is line 2');
                ctx.discord.setup(m => m.editGuild(ctx.guild.id, argument.isDeepEqual({
                    icon: 'data:image/png;base64,abcdef'
                }), 'Command User#0000')).thenReject(error);
            }
        }
    ]
});
