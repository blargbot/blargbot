import { InvalidEmbedError, replacers } from '@blargbot/bbtag-engine';
import { Iterable } from '@blargbot/util';
import moment from 'moment-timezone';

import { runSubtagTests, TestDataSubtag } from '../../SubtagTestSuite.js';

const testData = {
    '256': 'a'.repeat(256),
    '257': 'a'.repeat(257),
    '1024': 'a'.repeat(1024),
    '1025': 'a'.repeat(1025),
    '2048': 'a'.repeat(2048),
    '2049': 'a'.repeat(2049),
    '4096': 'a'.repeat(4096),
    '4097': 'a'.repeat(4097)
};

await runSubtagTests({
    replacer: replacers.embedBuildReplacer,
    names: [],
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{buildembed;title}',
            expected: '`Invalid embed: Missing \':\'`',
            errors: [
                { error: new InvalidEmbedError('Missing \':\'', 'title') }
            ]
        },
        {
            code: '{buildembed;title: abc}',
            expected: '{"title":"abc"}'
        },
        {
            code: '{buildembed;title:{testdata;256}}',
            subtags: [new TestDataSubtag(testData)],
            expected: /^{"title":"a{256}"}$/
        },
        {
            code: '{buildembed;title:{testdata;257}}',
            subtags: [new TestDataSubtag(testData)],
            expected: '`Invalid embed: Title too long`',
            errors: [
                { error: new InvalidEmbedError('Title too long', testData[257]) }
            ]
        },
        {
            code: '{buildembed;description: abc}',
            expected: '{"description":"abc"}'
        },
        {
            code: '{buildembed;description:{testdata;4096}}',
            subtags: [new TestDataSubtag(testData)],
            expected: /^{"description":"a{4096}"}$/
        },
        {
            code: '{buildembed;description:{testdata;4097}}',
            subtags: [new TestDataSubtag(testData)],
            expected: '`Invalid embed: Description too long`',
            errors: [
                { error: new InvalidEmbedError('Description too long', testData[4097]) }
            ]
        },
        {
            code: '{buildembed;footer.text: abc}',
            expected: '{"footer":{"text":"abc"}}'
        },
        {
            code: '{buildembed;footer.text:{testdata;2048}}',
            subtags: [new TestDataSubtag(testData)],
            expected: /^{"footer":{"text":"a{2048}"}}$/
        },
        {
            code: '{buildembed;footer.text:{testdata;2049}}',
            subtags: [new TestDataSubtag(testData)],
            expected: '`Invalid embed: Footer text too long`',
            errors: [
                { error: new InvalidEmbedError('Footer text too long', testData[2049]) }
            ]
        },
        {
            code: '{buildembed;author.name: abc}',
            expected: '{"author":{"name":"abc"}}'
        },
        {
            code: '{buildembed;author.name:{testdata;256}}',
            subtags: [new TestDataSubtag(testData)],
            expected: /^{"author":{"name":"a{256}"}}$/
        },
        {
            code: '{buildembed;author.name:{testdata;257}}',
            subtags: [new TestDataSubtag(testData)],
            expected: '`Invalid embed: Author name too long`',
            errors: [
                { error: new InvalidEmbedError('Author name too long', testData[257]) }
            ]
        },
        {
            code: '{buildembed;fields.name: abc;fields.value: def}',
            expected: '{"fields":[{"name":"abc","value":"def"}]}'
        },
        {
            code: '{buildembed;fields.name:{testdata;256};fields.value: def}',
            subtags: [new TestDataSubtag(testData)],
            expected: /^{"fields":\[{"name":"a{256}","value":"def"}]}$/
        },
        {
            code: `{buildembed;${Iterable.forever('fields.name: abc;fields.value: def').take(25).toArray().join(';')}}`,
            expected: /^{"fields":\[(?:{"name":"abc","value":"def"},?){25}]}$/
        },
        {
            code: `{buildembed;${Iterable.forever('fields.name: abc;fields.value: def').take(25).toArray().join(';')};fields.name: abc}`,
            expected: '`Invalid embed: Too many fields`',
            errors: [
                { error: new InvalidEmbedError('Too many fields') }
            ]
        },
        {
            code: '{buildembed;fields.name:{testdata;257};fields.value: def}',
            subtags: [new TestDataSubtag(testData)],
            expected: '`Invalid embed: Field name too long`',
            errors: [
                { error: new InvalidEmbedError('Field name too long', testData[257]) }
            ]
        },
        {
            code: '{buildembed;fields.name:abc}',
            expected: '`Invalid embed: Field missing value`',
            errors: [
                { error: new InvalidEmbedError('Field missing value', 'Field at index 0') }
            ]
        },
        {
            code: '{buildembed;fields.name: ;fields.value:def}',
            expected: '`Invalid embed: Field missing name`',
            errors: [
                { error: new InvalidEmbedError('Field missing name', 'Field at index 0') }
            ]
        },
        {
            code: '{buildembed;fields.name: abc;fields.value:{testdata;1024}}',
            subtags: [new TestDataSubtag(testData)],
            expected: /^{"fields":\[{"name":"abc","value":"a{1024}"}]}$/
        },
        {
            code: '{buildembed;fields.name: abc;fields.value:{testdata;1025}}',
            subtags: [new TestDataSubtag(testData)],
            expected: '`Invalid embed: Field value too long`',
            errors: [
                { error: new InvalidEmbedError('Field value too long', testData[1025]) }
            ]
        },
        {
            code: '{buildembed;fields.value:abc}',
            expected: '`Invalid embed: Field name not specified`',
            errors: [
                { error: new InvalidEmbedError('Field name not specified') }
            ]
        },
        {
            code: '{buildembed;fields.name: abc;fields.value: def;fields.inline:true}',
            expected: '{"fields":[{"name":"abc","value":"def","inline":true}]}'
        },
        {
            code: '{buildembed;fields.name: abc;fields.value: def;fields.inline:false}',
            expected: '{"fields":[{"name":"abc","value":"def","inline":false}]}'
        },
        {
            code: '{buildembed;fields.name: abc;fields.value: def;fields.inline:xyz}',
            expected: '`Invalid embed: Inline must be a boolean`',
            errors: [
                { error: new InvalidEmbedError('Inline must be a boolean', 'xyz') }
            ]
        },
        {
            code: '{buildembed;fields.inline:xyz}',
            expected: '`Invalid embed: Field name not specified`',
            errors: [
                { error: new InvalidEmbedError('Field name not specified') }
            ]
        },
        {
            code: '{buildembed;url:https://www.google.com/}',
            expected: '{"url":"https://www.google.com/"}'
        },
        {
            code: '{buildembed;url:abc}',
            expected: '`Invalid embed: Invalid url`',
            errors: [
                { error: new InvalidEmbedError('Invalid url', 'abc') }
            ]
        },
        {
            code: '{buildembed;footer.icon_url:https://www.google.com/}',
            expected: '{"footer":{"text":"\u200b","icon_url":"https://www.google.com/"}}'
        },
        {
            code: '{buildembed;footer.icon_url:https://www.google.com/;footer.text:def}',
            expected: '{"footer":{"text":"def","icon_url":"https://www.google.com/"}}'
        },
        {
            code: '{buildembed;footer.text:def;footer.icon_url:https://www.google.com/}',
            expected: '{"footer":{"text":"def","icon_url":"https://www.google.com/"}}'
        },
        {
            code: '{buildembed;footer.icon_url:abc}',
            expected: '`Invalid embed: Invalid footer.icon_url`',
            errors: [
                { error: new InvalidEmbedError('Invalid footer.icon_url', 'abc') }
            ]
        },
        {
            code: '{buildembed;thumbnail.url:https://www.google.com/}',
            expected: '{"thumbnail":{"url":"https://www.google.com/"}}'
        },
        {
            code: '{buildembed;thumbnail.url:abc}',
            expected: '`Invalid embed: Invalid thumbnail.url`',
            errors: [
                { error: new InvalidEmbedError('Invalid thumbnail.url', 'abc') }
            ]
        },
        {
            code: '{buildembed;image.url:https://www.google.com/}',
            expected: '{"image":{"url":"https://www.google.com/"}}'
        },
        {
            code: '{buildembed;image.url:abc}',
            expected: '`Invalid embed: Invalid image.url`',
            errors: [
                { error: new InvalidEmbedError('Invalid image.url', 'abc') }
            ]
        },
        {
            code: '{buildembed;author.url:https://www.google.com/}',
            expected: '{"author":{"name":"\u200b","url":"https://www.google.com/"}}'
        },
        {
            code: '{buildembed;author.url:https://www.google.com/;author.name:def}',
            expected: '{"author":{"name":"def","url":"https://www.google.com/"}}'
        },
        {
            code: '{buildembed;author.name:def;author.url:https://www.google.com/}',
            expected: '{"author":{"name":"def","url":"https://www.google.com/"}}'
        },
        {
            code: '{buildembed;author.url:abc}',
            expected: '`Invalid embed: Invalid author.url`',
            errors: [
                { error: new InvalidEmbedError('Invalid author.url', 'abc') }
            ]
        },
        {
            code: '{buildembed;author.icon_url:https://www.google.com/}',
            expected: '{"author":{"name":"\u200b","icon_url":"https://www.google.com/"}}'
        },
        {
            code: '{buildembed;author.icon_url:https://www.google.com/;author.name:def}',
            expected: '{"author":{"name":"def","icon_url":"https://www.google.com/"}}'
        },
        {
            code: '{buildembed;author.name:def;author.icon_url:https://www.google.com/}',
            expected: '{"author":{"name":"def","icon_url":"https://www.google.com/"}}'
        },
        {
            code: '{buildembed;author.icon_url:abc}',
            expected: '`Invalid embed: Invalid author.icon_url`',
            errors: [
                { error: new InvalidEmbedError('Invalid author.icon_url', 'abc') }
            ]
        },
        {
            code: '{buildembed;color:123456}',
            expected: '{"color":1193046}'
        },
        {
            code: '{buildembed;color:red}',
            expected: '{"color":16711680}'
        },
        {
            code: '{buildembed;color:blue}',
            expected: '{"color":255}'
        },
        {
            code: '{buildembed;color:qwertyuiop}',
            expected: '`Invalid embed: Invalid color`',
            errors: [
                { error: new InvalidEmbedError('Invalid color', 'qwertyuiop') }
            ]
        },
        {
            code: '{buildembed;timestamp:2022-01-01}',
            expected: '{"timestamp":"2022-01-01T00:00:00.000Z"}'
        },
        {
            code: '{buildembed;timestamp:now}',
            expected: () => `{"timestamp":"${moment.tz('Etc/UTC').toDate().toISOString()}"}`,
            retries: 5
        },
        {
            code: '{buildembed;timestamp:abc}',
            expected: '`Invalid embed: Invalid timestamp`',
            setup() {
                moment.suppressDeprecationWarnings = true;
            },
            errors: [
                { error: new InvalidEmbedError('Invalid timestamp', 'abc') }
            ],
            teardown() {
                moment.suppressDeprecationWarnings = false;
            }
        },
        {
            code: '{buildembed;title:{testdata;256};description:{testdata;4096};footer.text:{testdata;2048}}',
            subtags: [new TestDataSubtag(testData)],
            expected: '`Invalid embed: Embed too long`',
            errors: [
                { error: new InvalidEmbedError('Embed too long', `{"title":"${testData[256]}","description":"${testData[4096]}","footer":{"text":"${testData[2048]}"}}`) }
            ]
        },
        {
            code: '{buildembed;;title:abc}',
            expected: '{"title":"abc"}'
        },
        {
            code: '{buildembed;qwerty:123}',
            expected: '`Invalid embed: Unknown key \'qwerty\'`',
            errors: [
                { error: new InvalidEmbedError('Unknown key \'qwerty\'') }
            ]
        }
    ]
});
