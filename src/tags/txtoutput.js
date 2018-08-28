const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('txtoutput')
        .withArgs(a =>[a.require('text'), a.require('file name'), a.optional('message')])
        .withDesc('Output text in a file. Only 1 per execution.')
        .withExample(
        '{txtoutput;Hello world!;file.txt}',
        '(In a file attachment called "file.txt")\nHello world!'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (subtag, context, args) {
            if (context.state.outputMessage) return Builder.util.error(subtag, context, '`Cannot send multiple txtoutputs`');

            if (!args[0] || !args[1]) return Builder.util.error(subtag, context, '`Input arguments empty`');

            if (typeof args[0] !== 'string') args[0] = args[0] + '';

            context.sendOutput(args[2] || '', {
                name: args[1],
                file: args[0]
            });
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();
