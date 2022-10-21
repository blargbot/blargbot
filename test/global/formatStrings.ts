// include these files so that the FormatString.list() has access to them.
import '@blargbot/bbtag/text';
import '@blargbot/cluster/text';
import '@blargbot/core/text';

import { FormatStringCompiler, transformers } from '@blargbot/core/formatting';
import { FormatString } from '@blargbot/domain/messages';
import { expect } from 'chai';
import { describe, it } from 'mocha';

for (const template of FormatString.list()) {
    describe(`Template ${template.id}`, () => {
        it('should compile successfully', () => {
            // arrange
            const compiler = new FormatStringCompiler({ transformers });

            // act
            const formatter = compiler.compile(template.template);

            // assert
            expect(formatter).to.not.be.undefined;
        });
    });
}
