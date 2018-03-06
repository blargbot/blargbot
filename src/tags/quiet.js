
const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('quiet')
        .acceptsArrays()
        .withArgs(a => a.optional('isQuiet'))
        .withDesc('Tells any subtags that rely on a `quiet` field to be/not be quiet based on `isQuiet`. `isQuiet` defaults to `true`')
        .withExample(
            '{quiet} {usermention;cat}',
            'cat'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', async function (params) {
            return {
              quiet: bu.parseBoolean(params.args[1] || true)
            }
        })
        .build();