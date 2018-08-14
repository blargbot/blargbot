const Builder = require('../structures/TagBuilder');
var Color = require('color');

module.exports =
    Builder.AutoTag('color')
        .withArgs(a => [
            a.require('text')
        ]).withDesc('Convert colors. Default output `hex`. It converts all ways between `rgb`, `hsl`, `hsv`, `hwb`, `cmyk`, `ansi16`, `hex` strings, and CSS `keyword`s (will round to closest).')
        .withExample(
        '{color;#4286f4;RGB}',
        '[66,134,244]'
        )
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            let arr = await bu.getArray(args[0]);
            let input = undefined;

            if (arr == null || !Array.isArray(arr.v)) input = args[0];
            else input = arr.v;

            let method = undefined;
            if (typeof args[1] === 'undefined') method = 'hex';
            else method = args[1].toLowerCase();

            let color = undefined;
            try {
                color = Color(input);
            } catch(e) {
                color = Color('#' + input);
            }

            if (typeof color === 'undefined') return 'Failed to parse color';
            if (typeof color[method] !== 'function') return 'Invalid method';

            let converted = color[method]();

            if (typeof converted === 'object') {
                if (typeof converted.color === 'object') {
                    return JSON.stringify(converted.color);
                } else {
                    return converted.color;
                }
            } else {
                return converted;
            }
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();
