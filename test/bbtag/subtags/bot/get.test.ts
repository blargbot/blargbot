import { BBTagRuntimeError, NotANumberError } from '@blargbot/bbtag/errors';
import { GetSubtag } from '@blargbot/bbtag/subtags/bot/get';
import { TagVariableType } from '@blargbot/domain/models';

import { runSubtagTests, SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new GetSubtag(),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...generateTestCases(false, `testTag`, [
            { args: [`myVariableName`], key: `${TagVariableType.LOCAL}.testTag.myVariableName`, value: `LOCAL_TAG value`, expected: `LOCAL_TAG value` },
            { args: [`~myVariableName`], key: undefined, value: undefined, expected: `` },
            { args: [`*myVariableName`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: `GLOBAL value`, expected: `GLOBAL value` },
            { args: [`@myVariableName`], key: `${TagVariableType.AUTHOR}.823764823946284623234.myVariableName`, value: `AUTHOR value`, expected: `AUTHOR value` },
            { args: [`_myVariableName`], key: `${TagVariableType.TAGGUILD}.23904768237436873424.myVariableName`, value: `GUILD_TAG value`, expected: `GUILD_TAG value` },
            { args: [`myVariableName`], key: `${TagVariableType.LOCAL}.testTag.myVariableName`, value: `LOCAL_TAG value`, expected: `LOCAL_TAG value` },
            { args: [`*myVariableName`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: [`a`, `b`, `c`], expected: `{"v":["a","b","c"],"n":"*myVariableName"}` },
            { args: [`*myVariableName`, `0`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: [`a`, `b`, `c`], expected: `a` },
            { args: [`*myVariableName`, `1`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: [`a`, `b`, `c`], expected: `b` },
            { args: [`*myVariableName`, `2`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: [`a`, `b`, `c`], expected: `c` },
            { args: [`*myVariableName`, `2`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: `This isnt an array`, expected: `This isnt an array` },
            { args: [`*myVariableName`, `abc`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: `This isnt an array`, expected: `This isnt an array` }
        ]),
        ...generateTestCases(true, `testTag`, [
            { args: [`myVariableName`], key: `${TagVariableType.GUILDLOCAL}.23904768237436873424_testTag.myVariableName`, value: `LOCAL_CC value`, expected: `LOCAL_CC value` },
            { args: [`~myVariableName`], key: undefined, value: undefined, expected: `` },
            { args: [`*myVariableName`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: `GLOBAL value`, expected: `GLOBAL value` },
            { args: [`@myVariableName`], key: `${TagVariableType.AUTHOR}.823764823946284623234.myVariableName`, value: `AUTHOR value`, expected: `AUTHOR value` },
            { args: [`_myVariableName`], key: `${TagVariableType.GUILD}.23904768237436873424.myVariableName`, value: `GUILD_CC value`, expected: `GUILD_CC value` },
            { args: [`*myVariableName`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: [`a`, `b`, `c`], expected: `{"v":["a","b","c"],"n":"*myVariableName"}` },
            { args: [`*myVariableName`, `0`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: [`a`, `b`, `c`], expected: `a` },
            { args: [`*myVariableName`, `1`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: [`a`, `b`, `c`], expected: `b` },
            { args: [`*myVariableName`, `2`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: [`a`, `b`, `c`], expected: `c` },
            { args: [`*myVariableName`, `2`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: `This isnt an array`, expected: `This isnt an array` },
            { args: [`*myVariableName`, `abc`], key: `${TagVariableType.GLOBAL}..myVariableName`, value: `This isnt an array`, expected: `This isnt an array` }
        ]),
        {
            code: `{get;*myVariableName;abc}`,
            expected: `\`Not a number\``,
            errors: [
                { start: 0, end: 25, error: new NotANumberError(`abc`) }
            ],
            async postSetup(ctx) {
                await ctx.variables.set(`*myVariableName`, [1, 2, 3]);
            }
        },
        {
            code: `{get;*myVariableName;4}`,
            expected: `\`Index out of range\``,
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError(`Index out of range`) }
            ],
            async postSetup(ctx) {
                await ctx.variables.set(`*myVariableName`, [1, 2, 3]);
            }
        },
        {
            code: `{get;*myVariableName;-1}`,
            expected: `\`Index out of range\``,
            errors: [
                { start: 0, end: 24, error: new BBTagRuntimeError(`Index out of range`) }
            ],
            async postSetup(ctx) {
                await ctx.variables.set(`*myVariableName`, [1, 2, 3]);
            }
        }
    ]
});

function* generateTestCases(isCC: boolean, tagName: string, cases: Array<{ args: string[]; key: keyof SubtagTestContext[`tagVariables`] | undefined; value: JToken | undefined; expected: string; }>): Generator<SubtagTestCase> {
    for (const { args, key, value, expected } of cases) {
        const title = isCC ? `Custom command` : `Tag`;
        const code = `{${[`get`, ...args].join(`;`)}}`;
        yield {
            title: `From DB and ${title}`,
            code: code,
            expected,
            setup(ctx) {
                ctx.guild.id = `23904768237436873424`;
                ctx.roles.everyone.id = ctx.guild.id;
                ctx.users.command.id = `823764823946284623234`;
                ctx.options.isCC = isCC;
                ctx.options.tagName = tagName;
                if (key !== undefined)
                    ctx.tagVariables[key] = value;
            }
        };
        yield {
            title: `From cache and ${title}`,
            code: code,
            expected,
            setup(ctx) {
                ctx.guild.id = `23904768237436873424`;
                ctx.roles.everyone.id = ctx.guild.id;
                ctx.users.command.id = `823764823946284623234`;
                ctx.options.isCC = isCC;
                ctx.options.tagName = tagName;
            },
            async postSetup(bbctx) {
                await bbctx.variables.set(args[0], value);
            }
        };
        yield {
            title: `Ignoring cache and ${title}`,
            code: `{${[`get`, `!${args[0]}`, ...args.slice(1)].join(`;`)}}`,
            expected,
            setup(ctx) {
                ctx.guild.id = `23904768237436873424`;
                ctx.roles.everyone.id = ctx.guild.id;
                ctx.users.command.id = `823764823946284623234`;
                ctx.options.isCC = isCC;
                ctx.options.tagName = tagName;
                if (key !== undefined)
                    ctx.tagVariables[key] = value;
            },
            async postSetup(bbctx) {
                await bbctx.variables.set(args[0], `FAIL`);
            }
        };
    }
}
