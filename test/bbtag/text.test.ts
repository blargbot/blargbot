import '@blargbot/bbtag/text';

import { FormatString } from '@blargbot/domain/messages';
import * as fs from 'fs';

const tests = [];

for (const str of FormatString.list()) {
    tests.push(`
    describe('${str.id}', () => {
        it('Should correctly resolve', () => {
            // arrange
            const compiler = new FormatStringCompiler({ transformers });
            const formatter = new DefaultFormatter(new Intl.Locale('en-GB'), compiler);

            // act
            const result = ${str.id}[format](formatter);

            // assert
            expect(result).to.eq(${JSON.stringify(str.template)});
        })
    })`);
}

const result = `
import bbtag from '@blargbot/bbtag/text';
import { FormatStringCompiler, DefaultFormatter, transformers } from '@blargbot/core/formatting';
import { format } from '@blargbot/domain/messages';
import { describe, it } from 'mocha';
import { expect } from 'chai';

describe('Blargbot bbtag templates', () => {${tests.join('')}
})`;

fs.writeFileSync(`${__filename.slice(0, -3)}.ts`, result);
