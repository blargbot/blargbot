import { InvalidEmbedError } from '@bbtag/blargbot';
import { EmbedBuildSubtag } from '@bbtag/blargbot/subtags';
import moment from 'moment-timezone';

import { makeTestDataSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const testData = {
    '256': new Array(256).fill('a').join(''),
    '257': new Array(257).fill('a').join(''),
    '1024': new Array(1024).fill('a').join(''),
    '1025': new Array(1025).fill('a').join(''),
    '2048': new Array(2048).fill('a').join(''),
    '2049': new Array(2049).fill('a').join(''),
    '4096': new Array(4096).fill('a').join(''),
    '4097': new Array(4097).fill('a').join('')
};

runSubtagTests({
    subtag: EmbedBuildSubtag,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{buildembed;title}',
            expected: '`Invalid embed: Missing \':\'`',
            errors: [
                { start: 0, end: 18, error: new InvalidEmbedError('Missing \':\'', 'title') }
            ]
        },
        {
            code: '{buildembed;title: abc}',
            expected: '{"title":"abc"}'
        },
        {
            code: '{buildembed;title:{testdata;256}}',
            subtags: [makeTestDataSubtag(testData)],
            expected: /^{"title":"a{256}"}$/
        },
        {
            code: '{buildembed;title:{testdata;257}}',
            subtags: [makeTestDataSubtag(testData)],
            expected: '`Invalid embed: Title too long`',
            errors: [
                { start: 0, end: 33, error: new InvalidEmbedError('Title too long', testData[257]) }
            ]
        },
        {
            code: '{buildembed;description: abc}',
            expected: '{"description":"abc"}'
        },
        {
            code: '{buildembed;description:{testdata;4096}}',
            subtags: [makeTestDataSubtag(testData)],
            expected: /^{"description":"a{4096}"}$/
        },
        {
            code: '{buildembed;description:{testdata;4097}}',
            subtags: [makeTestDataSubtag(testData)],
            expected: '`Invalid embed: Description too long`',
            errors: [
                { start: 0, end: 40, error: new InvalidEmbedError('Description too long', testData[4097]) }
            ]
        },
        {
            code: '{buildembed;footer.text: abc}',
            expected: '{"footer":{"text":"abc"}}'
        },
        {
            code: '{buildembed;footer.text:{testdata;2048}}',
            subtags: [makeTestDataSubtag(testData)],
            expected: /^{"footer":{"text":"a{2048}"}}$/
        },
        {
            code: '{buildembed;footer.text:{testdata;2049}}',
            subtags: [makeTestDataSubtag(testData)],
            expected: '`Invalid embed: Footer text too long`',
            errors: [
                { start: 0, end: 40, error: new InvalidEmbedError('Footer text too long', testData[2049]) }
            ]
        },
        {
            code: '{buildembed;author.name: abc}',
            expected: '{"author":{"name":"abc"}}'
        },
        {
            code: '{buildembed;author.name:{testdata;256}}',
            subtags: [makeTestDataSubtag(testData)],
            expected: /^{"author":{"name":"a{256}"}}$/
        },
        {
            code: '{buildembed;author.name:{testdata;257}}',
            subtags: [makeTestDataSubtag(testData)],
            expected: '`Invalid embed: Author name too long`',
            errors: [
                { start: 0, end: 39, error: new InvalidEmbedError('Author name too long', testData[257]) }
            ]
        },
        {
            code: '{buildembed;fields.name: abc;fields.value: def}',
            expected: '{"fields":[{"name":"abc","value":"def"}]}'
        },
        {
            code: '{buildembed;fields.name:{testdata;256};fields.value: def}',
            subtags: [makeTestDataSubtag(testData)],
            expected: /^{"fields":\[{"name":"a{256}","value":"def"}]}$/
        },
        {
            code: `{buildembed;${new Array(25).fill('fields.name: abc;fields.value: def').join(';')}}`,
            expected: /^{"fields":\[(?:{"name":"abc","value":"def"},?){25}]}$/
        },
        {
            code: `{buildembed;${new Array(25).fill('fields.name: abc;fields.value: def').join(';')};fields.name: abc}`,
            expected: '`Invalid embed: Too many fields`',
            errors: [
                { start: 0, end: 904, error: new InvalidEmbedError('Too many fields') }
            ]
        },
        {
            code: '{buildembed;fields.name:{testdata;257};fields.value: def}',
            subtags: [makeTestDataSubtag(testData)],
            expected: '`Invalid embed: Field name too long`',
            errors: [
                { start: 0, end: 57, error: new InvalidEmbedError('Field name too long', testData[257]) }
            ]
        },
        {
            code: '{buildembed;fields.name:abc}',
            expected: '`Invalid embed: Field missing value`',
            errors: [
                { start: 0, end: 28, error: new InvalidEmbedError('Field missing value', 'Field at index 0') }
            ]
        },
        {
            code: '{buildembed;fields.name: ;fields.value:def}',
            expected: '`Invalid embed: Field missing name`',
            errors: [
                { start: 0, end: 43, error: new InvalidEmbedError('Field missing name', 'Field at index 0') }
            ]
        },
        {
            code: '{buildembed;fields.name: abc;fields.value:{testdata;1024}}',
            subtags: [makeTestDataSubtag(testData)],
            expected: /^{"fields":\[{"name":"abc","value":"a{1024}"}]}$/
        },
        {
            code: '{buildembed;fields.name: abc;fields.value:{testdata;1025}}',
            subtags: [makeTestDataSubtag(testData)],
            expected: '`Invalid embed: Field value too long`',
            errors: [
                { start: 0, end: 58, error: new InvalidEmbedError('Field value too long', testData[1025]) }
            ]
        },
        {
            code: '{buildembed;fields.value:abc}',
            expected: '`Invalid embed: Field name not specified`',
            errors: [
                { start: 0, end: 29, error: new InvalidEmbedError('Field name not specified') }
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
                { start: 0, end: 65, error: new InvalidEmbedError('Inline must be a boolean', 'xyz') }
            ]
        },
        {
            code: '{buildembed;fields.inline:xyz}',
            expected: '`Invalid embed: Field name not specified`',
            errors: [
                { start: 0, end: 30, error: new InvalidEmbedError('Field name not specified') }
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
                { start: 0, end: 20, error: new InvalidEmbedError('Invalid url', 'abc') }
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
                { start: 0, end: 32, error: new InvalidEmbedError('Invalid footer.icon_url', 'abc') }
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
                { start: 0, end: 30, error: new InvalidEmbedError('Invalid thumbnail.url', 'abc') }
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
                { start: 0, end: 26, error: new InvalidEmbedError('Invalid image.url', 'abc') }
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
                { start: 0, end: 27, error: new InvalidEmbedError('Invalid author.url', 'abc') }
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
                { start: 0, end: 32, error: new InvalidEmbedError('Invalid author.icon_url', 'abc') }
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
                { start: 0, end: 29, error: new InvalidEmbedError('Invalid color', 'qwertyuiop') }
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
                { start: 0, end: 26, error: new InvalidEmbedError('Invalid timestamp', 'abc') }
            ],
            teardown() {
                moment.suppressDeprecationWarnings = false;
            }
        },
        {
            code: '{buildembed;title:{testdata;256};description:{testdata;4096};footer.text:{testdata;2048}}',
            subtags: [makeTestDataSubtag(testData)],
            expected: '`Invalid embed: Embed too long`',
            errors: [
                { start: 0, end: 89, error: new InvalidEmbedError('Embed too long', `{"title":"${testData[256]}","description":"${testData[4096]}","footer":{"text":"${testData[2048]}"}}`) }
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
                { start: 0, end: 23, error: new InvalidEmbedError('Unknown key \'qwerty\'') }
            ]
        }
    ]
});
