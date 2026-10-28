import type { GetGuildCreatedTimestampFeature } from '@blargbot/bbtag/subtags';
import { GuildCreatedAtSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetGuildCreatedTimestampFeature>({ id: 'features' });

const now = Temporal.Instant.from('2026-09-22T22:20:00Z');
await runSubtagTests({
    subtag: new GuildCreatedAtSubtag(features.instance),
    argCountBounds: { min: 0, max: 1 },
    names: ['guildCreatedAt'],
    setup(ctx, _, test) {
        ctx.adoptMock(features);
        test.mock.method(Temporal.Now, 'instant', () => now);
    },
    cases: [
        {
            code: '{guildcreatedat}',
            expected: '2018-02-25T20:03:52Z',
            setup(ctx) {
                features.setup(m => m.getGuildCreatedTimestamp(ctx.guildId))
                    .resolves(Temporal.Instant.from('2018-02-25T20:03:52Z'))
                    .mustHappen(1);
            }
        },
        {
            code: '{guildcreatedat;}',
            expected: '2018-02-25T20:03:52Z',
            setup(ctx) {
                features.setup(m => m.getGuildCreatedTimestamp(ctx.guildId))
                    .resolves(Temporal.Instant.from('2018-02-25T20:03:52Z'))
                    .mustHappen(1);
            }
        },
        {
            code: '{guildcreatedat;X}',
            expected: '1519589032',
            setup(ctx) {
                features.setup(m => m.getGuildCreatedTimestamp(ctx.guildId))
                    .resolves(Temporal.Instant.from('2018-02-25T20:03:52Z'))
                    .mustHappen(1);
            }
        },
        {
            code: '{guildcreatedat;DD/MM/YYYY}',
            expected: '25/02/2018',
            setup(ctx) {
                features.setup(m => m.getGuildCreatedTimestamp(ctx.guildId))
                    .resolves(Temporal.Instant.from('2018-02-25T20:03:52Z'))
                    .mustHappen(1);
            }
        },
        {
            code: '{guildcreatedat}',
            expected: '2026-09-22T22:20:00Z',
            setup(ctx) {
                features.setup(m => m.getGuildCreatedTimestamp(ctx.guildId))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});
