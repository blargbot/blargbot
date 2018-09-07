
const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.BotTag('quiet')
        .acceptsArrays()
        .withArgs(a => a.optional('isQuiet'))
        .withDesc('Tells any subtags that rely on a `quiet` field to be/not be quiet based on `isQuiet`. `isQuiet` defaults to `true`')
        .withExample(
            '{quiet} {usermention;cat}',
            'cat'
        )
        .whenArgs('0-1', async function (subtag, context, args) {
            context.scope.quiet = bu.parseBoolean(args[0] || true);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();