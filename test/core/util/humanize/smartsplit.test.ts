import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { humanize } from '@blargbot/core';

const smartSplit = humanize.smartSplit;

function assertRoundTrip(input: string[]): void {
    const encoded = smartSplit.inverse(input);
    const output = smartSplit(encoded);

    assert.deepStrictEqual(
        output,
        input,
        [
            'smartSplit inverse round-trip failed',
            `input:   ${JSON.stringify(input)}`,
            `encoded: ${JSON.stringify(encoded)}`,
            `output:  ${JSON.stringify(output)}`
        ].join('\n')
    );
}

await describe('smartSplit', async () => {
    await describe('basic splitting', async () => {
        await it('splits words separated by spaces', () => {
            assert.deepStrictEqual(
                smartSplit('one two three'),
                ['one', 'two', 'three']
            );
        });

        await it('ignores leading spaces', () => {
            assert.deepStrictEqual(
                smartSplit('  one two'),
                ['one', 'two']
            );
        });

        await it('ignores trailing spaces', () => {
            assert.deepStrictEqual(
                smartSplit('one two  '),
                ['one', 'two']
            );
        });

        await it('collapses consecutive spaces', () => {
            assert.deepStrictEqual(
                smartSplit('one   two    three'),
                ['one', 'two', 'three']
            );
        });

        await it('returns an empty array for an empty string', () => {
            assert.deepStrictEqual(
                smartSplit(''),
                []
            );
        });

        await it('returns an empty array for only spaces', () => {
            assert.deepStrictEqual(
                smartSplit('     '),
                []
            );
        });

        await it('preserves ordinary punctuation', () => {
            assert.deepStrictEqual(
                smartSplit('hello, world! foo-bar'),
                ['hello,', 'world!', 'foo-bar']
            );
        });

        await it('preserves non-space whitespace as literal content', () => {
            assert.deepStrictEqual(
                smartSplit('one\ttwo\nthree'),
                ['one\ttwo\nthree']
            );
        });
    });

    await describe('quoted values', async () => {
        await it('removes syntactic double quotes around a value', () => {
            assert.deepStrictEqual(
                smartSplit('"hello"'),
                ['hello']
            );
        });

        await it('removes syntactic double quotes around a value after another value', () => {
            assert.deepStrictEqual(
                smartSplit('one "two words" three'),
                ['one', 'two words', 'three']
            );
        });

        await it('allows spaces inside quoted values', () => {
            assert.deepStrictEqual(
                smartSplit('"one two three"'),
                ['one two three']
            );
        });

        await it('allows an empty quoted value', () => {
            assert.deepStrictEqual(
                smartSplit('""'),
                ['']
            );
        });

        await it('allows an empty quoted value between other values', () => {
            assert.deepStrictEqual(
                smartSplit('one "" two'),
                ['one', '', 'two']
            );
        });

        await it('allows multiple quoted values', () => {
            assert.deepStrictEqual(
                smartSplit('"one two" "three four"'),
                ['one two', 'three four']
            );
        });

        await it('removes superfluous quotes', () => {
            assert.deepStrictEqual(
                smartSplit('test "abc" 123'),
                ['test', 'abc', '123']
            );
        });

        await it('treats a quote inside an unquoted value as literal', () => {
            assert.deepStrictEqual(
                smartSplit('ab"cd'),
                ['ab"cd']
            );
        });

        await it('treats a quote in the middle of a value as literal', () => {
            assert.deepStrictEqual(
                smartSplit('abc"def"ghi'),
                ['abc"def"ghi']
            );
        });

        await it('preserves an unmatched opening quote as literal content', () => {
            assert.deepStrictEqual(
                smartSplit('"hello world'),
                ['"hello', 'world']
            );
        });

        await it('preserves an unmatched quote after a separator as literal content', () => {
            assert.deepStrictEqual(
                smartSplit('one "hello world'),
                ['one', '"hello', 'world']
            );
        });

        await it('handles a quoted value at the end of the input', () => {
            assert.deepStrictEqual(
                smartSplit('one "two words"'),
                ['one', 'two words']
            );
        });
    });

    await describe('escaped characters', async () => {
        await it('uses backslash to escape a space', () => {
            assert.deepStrictEqual(
                smartSplit('hello\\ world'),
                ['hello world']
            );
        });

        await it('uses backslash to escape a quote', () => {
            assert.deepStrictEqual(
                smartSplit('hello\\"world'),
                ['hello"world']
            );
        });

        await it('uses backslash to escape a backslash', () => {
            assert.deepStrictEqual(
                smartSplit('hello\\\\world'),
                ['hello\\world']
            );
        });

        await it('allows an escaped space at the beginning of a value', () => {
            assert.deepStrictEqual(
                smartSplit('\\ hello'),
                [' hello']
            );
        });

        await it('allows an escaped space at the end of a value', () => {
            assert.deepStrictEqual(
                smartSplit('hello\\ '),
                ['hello ']
            );
        });

        await it('allows multiple escaped spaces in one value', () => {
            assert.deepStrictEqual(
                smartSplit('hello\\ \\ world'),
                ['hello  world']
            );
        });

        await it('allows an escaped quote at the beginning of a value', () => {
            assert.deepStrictEqual(
                smartSplit('\\"hello'),
                ['"hello']
            );
        });

        await it('allows an escaped quote at the end of a value', () => {
            assert.deepStrictEqual(
                smartSplit('hello\\"'),
                ['hello"']
            );
        });

        await it('allows escaped syntax characters to be adjacent', () => {
            assert.deepStrictEqual(
                smartSplit('\\ \\"\\\\'),
                [' "\\']
            );
        });

        await it('does not treat an escaped space as a separator', () => {
            assert.deepStrictEqual(
                smartSplit('one\\ two three'),
                ['one two', 'three']
            );
        });

        await it('does not treat an escaped quote as quote syntax', () => {
            assert.deepStrictEqual(
                smartSplit('one \\"two\\" three'),
                ['one', '"two"', 'three']
            );
        });
    });

    await describe('escaped separators', async () => {
        await it('treats an escaped space as part of the value', () => {
            assert.deepStrictEqual(
                smartSplit('test\\ 123'),
                ['test 123']
            );
        });

        await it('treats a space after an escaped backslash as a separator', () => {
            assert.deepStrictEqual(
                smartSplit('test\\\\ 123'),
                ['test\\', '123']
            );
        });

        await it('treats two escaped backslashes followed by a space as a separator', () => {
            assert.deepStrictEqual(
                smartSplit('test\\\\\\\\ 123'),
                ['test\\\\', '123']
            );
        });

        await it('treats three backslashes before a space as an escaped space', () => {
            assert.deepStrictEqual(
                smartSplit('test\\\\\\ 123'),
                ['test\\ 123']
            );
        });

        await it('handles an escaped backslash between two values', () => {
            assert.deepStrictEqual(
                smartSplit('one\\\\ two'),
                ['one\\', 'two']
            );
        });

        await it('handles an escaped backslash followed by multiple separators', () => {
            assert.deepStrictEqual(
                smartSplit('one\\\\   two'),
                ['one\\', 'two']
            );
        });
    });

    await describe('quote and escape interactions', async () => {
        await it('allows escaped quotes inside quoted values', () => {
            assert.deepStrictEqual(
                smartSplit('"say \\"hello\\""'),
                ['say "hello"']
            );
        });

        await it('allows escaped backslashes inside quoted values', () => {
            assert.deepStrictEqual(
                smartSplit('"C:\\\\temp"'),
                ['C:\\temp']
            );
        });

        await it('allows escaped spaces inside quoted values', () => {
            assert.deepStrictEqual(
                smartSplit('"hello\\ world"'),
                ['hello world']
            );
        });

        await it('distinguishes escaped quotes from the closing quote', () => {
            assert.deepStrictEqual(
                smartSplit('"hello \\"world\\""'),
                ['hello "world"']
            );
        });

        await it('handles consecutive quoted and escaped values', () => {
            assert.deepStrictEqual(
                smartSplit('"one two" three\\ four "five six"'),
                ['one two', 'three four', 'five six']
            );
        });

        await it('preserves literal quotes adjacent to escaped characters', () => {
            assert.deepStrictEqual(
                smartSplit('\\" "foo" \\"'),
                ['"', 'foo', '"']
            );
        });
    });
});

await describe('smartSplit.inverse', async () => {
    await describe('serialization decisions', async () => {
        await it('joins values with a single space', () => {
            assert.equal(
                smartSplit.inverse(['one', 'two', 'three']),
                'one two three'
            );
        });

        await it('leaves ordinary values unquoted', () => {
            assert.equal(
                smartSplit.inverse(['hello']),
                'hello'
            );
        });

        await it('quotes values containing spaces', () => {
            assert.equal(
                smartSplit.inverse(['hello world']),
                '"hello world"'
            );
        });

        await it('represents an empty value with quotes', () => {
            assert.equal(
                smartSplit.inverse(['']),
                '""'
            );
        });

        await it('quotes a value consisting only of spaces', () => {
            assert.equal(
                smartSplit.inverse([' ']),
                '" "'
            );
        });

        await it('quotes values with leading spaces', () => {
            assert.equal(
                smartSplit.inverse([' hello']),
                '" hello"'
            );
        });

        await it('quotes values with trailing spaces', () => {
            assert.equal(
                smartSplit.inverse(['hello ']),
                '"hello "'
            );
        });

        await it('does not unnecessarily quote values without spaces', () => {
            assert.equal(
                smartSplit.inverse(['hello-world_123!']),
                'hello-world_123!'
            );
        });
    });

    await describe('escaping', async () => {
        await it('escapes double quotes', () => {
            assert.equal(
                smartSplit.inverse(['hello"world']),
                'hello\\"world'
            );
        });

        await it('escapes backslashes', () => {
            assert.equal(
                smartSplit.inverse(['hello\\world']),
                'hello\\\\world'
            );
        });

        await it('escapes every quote in a value', () => {
            assert.equal(
                smartSplit.inverse(['a"b"c']),
                'a\\"b\\"c'
            );
        });

        await it('escapes every backslash in a value', () => {
            assert.equal(
                smartSplit.inverse(['a\\b\\c']),
                'a\\\\b\\\\c'
            );
        });

        await it('escapes quotes and backslashes before adding surrounding quotes', () => {
            assert.equal(
                smartSplit.inverse(['a \\" b']),
                '"a \\\\\\" b"'
            );
        });

        await it('handles a value consisting only of a quote', () => {
            assert.equal(
                smartSplit.inverse(['"']),
                '\\"'
            );
        });

        await it('handles a value consisting only of a backslash', () => {
            assert.equal(
                smartSplit.inverse(['\\']),
                '\\\\'
            );
        });
    });

    await describe('round-trip boundary cases', async () => {
        await it('round-trips an empty value', () => {
            assertRoundTrip(['']);
        });

        await it('round-trips a value containing a space', () => {
            assertRoundTrip(['hello world']);
        });

        await it('round-trips a value containing a quote', () => {
            assertRoundTrip(['hello"world']);
        });

        await it('round-trips a value containing a backslash', () => {
            assertRoundTrip(['hello\\world']);
        });

        await it('round-trips a value ending in a quote', () => {
            assertRoundTrip(['hello"']);
        });

        await it('round-trips a value ending in a backslash', () => {
            assertRoundTrip(['hello\\']);
        });

        await it('round-trips a value containing a space and ending in a backslash', () => {
            assertRoundTrip(['hello \\']);
        });

        await it('round-trips a value containing a space and ending in a quote', () => {
            assertRoundTrip(['hello "']);
        });

        await it('round-trips an escaped backslash followed by a space', () => {
            assertRoundTrip(['test\\', '123']);
        });

        await it('round-trips several values containing escaped syntax', () => {
            assertRoundTrip([
                'test\\',
                'test ',
                'test"',
                'test\\"',
                'test\\ test',
                'test "test"'
            ]);
        });
    });

    await describe('adversarial values', async () => {
        await it('round-trips values made entirely from syntax characters', () => {
            assertRoundTrip([
                ' ',
                '  ',
                '"',
                '""',
                '\\',
                '\\\\',
                ' " ',
                ' \\ ',
                ' " \\ ',
                ' \\ " ',
                '\\"',
                '"\\',
                '\\\\"'
            ]);
        });

        await it('round-trips a mixture of particularly hostile values', () => {
            assertRoundTrip([
                '',
                ' ',
                '  ',
                '"',
                '\\',
                '\\"',
                '\\\\"',
                'hello world',
                'hello"world',
                'hello\\world',
                'hello "world"',
                'hello \\ world',
                'hello \\" world',
                ' " \\ '
            ]);
        });
    });

    await describe('short adversarial corpus', async () => {
        const alphabet = [' ', '"', '\\', 'a'];

        function* stringsOfLength(length: number): Generator<string> {
            if (length === 0) {
                yield '';
                return;
            }

            for (const prefix of stringsOfLength(length - 1)) {
                for (const char of alphabet) {
                    yield prefix + char;
                }
            }
        }

        function* interestingStrings(maxLength: number): Generator<string> {
            for (let length = 0; length <= maxLength; length++) {
                yield* stringsOfLength(length);
            }
        }

        await it('round-trips every short string containing syntax characters', () => {
            for (const value of interestingStrings(5)) {
                assertRoundTrip([value]);
            }
        });

        await it('round-trips pairs of short adversarial strings', () => {
            const values = [...interestingStrings(3)];

            for (const first of values) {
                for (const second of values) {
                    assertRoundTrip([first, second]);
                }
            }
        });
    });
});
