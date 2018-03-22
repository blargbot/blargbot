/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:37
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('color')
        .withDesc('Attempts to convert `color` to a hex code. `color` can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number.')
        .withExample(
            '{color;pink}',
            'ffc0cb'
        )
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenArgs('1', async function (subtag, context, args) {
            let color = bu.parseColor(args[0]);
            if (color == null)
                return Builder.util.error(subtag, context, 'Invalid color');
            return color.toString(16).padStart(6, '0');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
