import { Subtag, SubtagType, textTemplates } from '@bbtag/blargbot';
import * as coreTransformers from '@blargbot/core/formatting/index.js';
import { transformers, util } from '@blargbot/formatting';
import { quickMock } from '@blargbot/test-util/quickMock.js';
import { runFormatTreeTests } from '@blargbot/test-util/runFormatTreeTests.js';
import mocha from 'mocha';

@Subtag.id('')
class TestSubtag extends Subtag {
    public override execute: Subtag['execute'] = () => {
        throw new Error('Method not implemented');
    };
}
const subtag = (): Subtag => new TestSubtag({
    category: SubtagType.MISC,
    signatures: []
});

mocha.describe('BBTag format strings', () => {
    runFormatTreeTests(textTemplates, {
        transformers: {
            ...transformers,
            ...coreTransformers
        }
    }, {
        debug: {
            summary: [
                {
                    name: 'default',
                    input: [{ active: 123, committed: 45, database: 678, total: 90 }],
                    expected: `\`\`\`js
         Execution Time: 123ms
    Variables Committed: 45
Database Execution Time: 678ms
   Total Execution Time: 90ms
\`\`\``
                }
            ]
        },
        limits: {
            rules: {
                useCount: {
                    default: [
                        {
                            name: 'default',
                            input: [{ count: 123 }],
                            expected: 'Maximum 123 uses'
                        }
                    ],
                    requests: [
                        {
                            name: 'default',
                            input: [{ count: 456 }],
                            expected: 'Maximum 456 requests'
                        }
                    ],
                    loops: [
                        {
                            name: 'default',
                            input: [{ count: 789 }],
                            expected: 'Maximum 789 loops'
                        }
                    ]
                },
                staffOnly: {
                    default: 'Authorizer must be staff'
                },
                disabled: {
                    default: [
                        {
                            name: 'default',
                            input: [{ subtagName: 'abc' }],
                            expected: '{abc} is disabled'
                        }
                    ]
                },
                disabledIn: {
                    default: [
                        {
                            name: '3+ names',
                            input: [{ subtagNames: ['abc', 'def', 'ghi'] }],
                            expected: 'Cannot be used in the arguments to {abc}, {def} or {ghi}'
                        },
                        {
                            name: '2 names',
                            input: [{ subtagNames: ['abc', 'def'] }],
                            expected: 'Cannot be used in the arguments to {abc} or {def}'
                        },
                        {
                            name: '1 name',
                            input: [{ subtagNames: ['abc'] }],
                            expected: 'Cannot be used in the arguments to {abc}'
                        }
                    ]
                }
            }
        },
        analysis: {
            unnamed: 'Unnamed subtag',
            dynamic: 'Dynamic subtag',
            deprecated: [
                {
                    name: 'default',
                    input: [quickMock(subtag, { id: 'abc', deprecated: 'def' })],
                    expected: '{abc} is deprecated. Use `{def}` instead'
                }
            ]
        },
        subtag: {
            types: {
                simple: {
                    name: 'Simple',
                    description: 'Subtags that require no arguments.'
                },
                misc: {
                    name: 'Miscellaneous',
                    description: 'Miscellaneous subtags for general things.'
                },
                array: {
                    name: 'Array',
                    description: 'Subtags designed specifically for arrays.'
                },
                json: {
                    name: 'JSON',
                    description: 'Subtags designed for JSON objects.'
                },
                math: {
                    name: 'Math',
                    description: 'Subtags designed for mathematical purposes.'
                },
                loops: {
                    name: 'Loops',
                    description: 'Subtags that iterate over arrays/strings.'
                },
                bot: {
                    name: 'Blargbot',
                    description: 'Subtags that integrate with blargbot\'s custom functions.'
                },
                message: {
                    name: 'Message',
                    description: 'Subtags that interact with messages.'
                },
                channel: {
                    name: 'Channel',
                    description: 'Subtags that interact with channels.'
                },
                thread: {
                    name: 'Thread',
                    description: 'Subtags that interact with threads.'
                },
                user: {
                    name: 'User',
                    description: 'Subtags that interact with users.'
                },
                role: {
                    name: 'Role',
                    description: 'Subtags that interact with roles.'
                },
                guild: {
                    name: 'Guild',
                    description: 'Subtags that interact with guilds.'
                }
            },
            variables: {
                server: {
                    name: 'Server variables',
                    description: 'Server variables (also referred to as Guild variables) are commonly used if you wish to store data on a per server level. They are however stored in 2 separate \'pools\', one for tags and one for custom commands, meaning they cannot be used to pass data between the two\nThis makes then very useful for communicating data between tags that are intended to be used within 1 server at a time.'
                },
                author: {
                    name: 'Author variables',
                    description: 'Author variables are stored against the author of the tag, meaning that only tags made by you can access or edit your author variables.\nThese are very useful when you have a set of tags that are designed to be used by people between servers, effectively allowing servers to communicate with each other.'
                },
                global: {
                    name: 'Global variables',
                    description: 'Global variables are completely public, anyone can read **OR EDIT** your global variables.\nThese are very useful if you like pain.'
                },
                temporary: {
                    name: 'Temporary variables',
                    description: 'Temporary variables are never stored to the database, meaning they are by far the fastest variable type.\nIf you are working with data which you only need to store for later use within the same tag call, then you should use temporary variables over any other type'
                },
                local: {
                    name: 'Local variables',
                    description: 'Local variables are the default variable type, only usable if your variable name doesn\'t start with one of the other prefixes. These variables are only accessible by the tag that created them, meaning there is no possibility to share the values with any other tag.\nThese are useful if you are intending to create a single tag which is usable anywhere, as the variables are not confined to a single server, just a single tag'
                }
            }
        },
        subtags: {
            concat: {
                default: {
                    description: 'Takes `values` and joins them together to form a single array. If `values` is an array, it\'s flattened into the resulting array.',
                    exampleOut: 'Two arrays: ["this","is","an","array"]\nStrings and an array: ["a","b","c", 1, 2, 3]',
                    exampleCode: 'Two arrays: {concat;["this", "is"];["an", "array"]}\nStrings and an array: {concat;a;b;c;[1, 2, 3]}'
                }
            },
            filter: {
                default: {
                    description: [
                        {
                            name: 'default',
                            input: [{ disabled: ['abc', 'def', 'ghi'] }],
                            expected: 'For every element in `array`, a variable called `variable` will be set and `code` will be executed. Returns a new array containing all the elements that returned the value `true`.\n\n While inside the `code` parameter, none of the following subtags may be used: `{abc}`, `{def}`, `{ghi}`'
                        },
                        {
                            name: 'default',
                            input: [{ disabled: ['abc', 'def'] }],
                            expected: 'For every element in `array`, a variable called `variable` will be set and `code` will be executed. Returns a new array containing all the elements that returned the value `true`.\n\n While inside the `code` parameter, none of the following subtags may be used: `{abc}`, `{def}`'
                        },
                        {
                            name: 'default',
                            input: [{ disabled: ['abc'] }],
                            expected: 'For every element in `array`, a variable called `variable` will be set and `code` will be executed. Returns a new array containing all the elements that returned the value `true`.\n\n While inside the `code` parameter, none of the following subtags may be used: `{abc}`'
                        }
                    ],
                    exampleOut: '["apples","apple juice"]',
                    exampleCode: '{set;~array;apples;apple juice;grapefruit}\n{filter;~element;~array;{bool;{get;~element};startswith;apple}}'
                }
            },
            isArray: {
                default: {
                    description: 'Determines whether `text` is a valid array.',
                    exampleOut: 'true false',
                    exampleCode: '{isarray;["array?"]} {isarray;array?}'
                }
            },
            join: {
                default: {
                    description: 'Joins the elements of `array` together with `text` as the separator.',
                    exampleOut: 'this!is!an!array',
                    exampleCode: '{join;["this", "is", "an", "array"];!}'
                }
            },
            map: {
                default: {
                    description: 'Provides a way to populate an array by executing a function on each of its elements, more info [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)\nFor every element in `array`, a variable called `variable` will be set to the current element. The output of `function` will be the new value of the element. This will return the new array, and will not modify the original.',
                    exampleOut: '["APPLES","ORANGES","PEARS"]',
                    exampleCode: '{map;~item;["apples","oranges","pears"];{upper;{get;~item}}}'
                }
            },
            pop: {
                default: {
                    description: 'Returns the last element in `array`. If provided a variable, this will remove the last element from `array`as well.',
                    exampleOut: 'array',
                    exampleCode: '{pop;["this", "is", "an", "array"]}'
                }
            },
            push: {
                default: {
                    description: 'Pushes `values` onto the end of `array`. If provided a variable, this will update the original variable. Otherwise, it will simply output the new array.',
                    exampleOut: '["this","is","an","array"]',
                    exampleCode: '{push;["this", "is", "an"];array}'
                }
            },
            shift: {
                default: {
                    description: 'Returns the first element in `array`. If used with a variable this will remove the first element from `array` as well.',
                    exampleOut: 'this',
                    exampleCode: '{shift;["this", "is", "an", "array"]}'
                }
            },
            shuffle: {
                args: {
                    description: 'Shuffles the `{args}` the user provided.',
                    exampleIn: 'one two three',
                    exampleOut: 'three one two',
                    exampleCode: '{shuffle} {args;0} {args;1} {args;2}'
                },
                array: {
                    description: 'Shuffles the `{args}` the user provided, or the elements of `array`. If used with a variable this will modify the original array',
                    exampleOut: '[5,3,2,6,1,4]',
                    exampleCode: '{shuffle;[1,2,3,4,5,6]}'
                }
            },
            slice: {
                default: {
                    description: 'Grabs elements between the zero-indexed `start` and `end` points (inclusive) from `array`.',
                    exampleOut: '["is","an","array"]',
                    exampleCode: '{slice;["this", "is", "an", "array"];1}'
                }
            },
            sort: {
                default: {
                    description: 'Sorts the `array` in ascending order. If `descending` is provided, sorts in descending order. If provided a variable, will modify the original `array`.',
                    exampleOut: '[1,2,3,4,5]',
                    exampleCode: '{sort;[3, 2, 5, 1, 4]}'
                }
            },
            splice: {
                description: 'If used with a variable this will modify the original array.\nReturns an array of removed items.',
                delete: {
                    description: 'Removes `deleteCount` elements from `array` starting at `start`.',
                    exampleOut: '["is"]',
                    exampleCode: '{splice;["this", "is", "an", "array"];1;1}'
                },
                replace: {
                    description: 'Removes `deleteCount` elements from `array` starting at `start`. Then, adds each `item` at that position in `array`. Returns the removed items.',
                    exampleOut: '["is"] {"v":["this","was","an","array"],"n":"~array"}',
                    exampleCode: '{set;~array;["this", "is", "an", "array"]} {splice;{get;~array};1;1;was} {get;~array}'
                }
            },
            split: {
                default: {
                    description: 'Splits `text` using `splitter`, and the returns an array.',
                    exampleOut: '["Hello!","This","is","a","sentence."]',
                    exampleCode: '{split;Hello! This is a sentence.;{space}}'
                }
            },
            apply: {
                default: {
                    description: 'Executes `subtag`, using the `args` as parameters. If `args` is an array, it will get deconstructed to it\'s individual elements.',
                    exampleOut: '3',
                    exampleCode: '{apply;randomInt;[1,4]}'
                }
            },
            args: {
                all: {
                    description: 'Gets the whole user input',
                    exampleIn: 'Hello world! BBtag is so cool',
                    exampleOut: 'You said Hello world! BBtag is so cool',
                    exampleCode: 'You said {args}'
                },
                indexed: {
                    description: 'Gets a word from the user input at the `index` position',
                    exampleIn: 'Hello world! BBtag is so cool',
                    exampleOut: 'world!',
                    exampleCode: '{args;1}'
                },
                range: {
                    description: 'Gets all the words in the user input from `start` up to `end`. If `end` is `n` then all words after `start` will be returned',
                    exampleIn: 'Hello world! BBtag is so cool',
                    exampleOut: 'BBtag is',
                    exampleCode: '{args;2;4}'
                }
            },
            commandName: {
                default: {
                    description: 'Gets the name of the current tag or custom command.',
                    exampleIn: 'b!cc test',
                    exampleOut: 'This command is test',
                    exampleCode: 'This command is {commandName}'
                }
            },
            commit: {
                description: 'For optimization reasons, variables are not stored in the database immediately when you use `{set}`. Instead they are cached, and will be saved to the database when the tag finishes. If you have some `variables` that you need to be saved to the database immediately, use this to force an update right now.\nThis comes at a slight performance cost, so use only when needed.\n`variables` defaults to all values accessed up to this point.\n`{rollback}` is the counterpart to this.',
                all: {
                    description: 'Commit all variables',
                    exampleOut: 'Hello!',
                    exampleCode: '{set;var;Hello!}\n{commit}\n{set;var;GoodBye!}\n{rollback}\n{get;var}'
                },
                variables: {
                    description: 'Commit provided `variables`',
                    exampleOut: 'Hello!',
                    exampleCode: '{set;var;Hello!}\n{commit;var}\n{set;var;GoodBye!}\n{rollback;var}\n{get;var}'
                }
            },
            debug: {
                default: {
                    description: 'Adds the specified text to the debug output. This output is only shown via `tag debug`, `ccommand debug`, `tag test debug` and `ccommand test debug`.The line number is also included in the debug entry',
                    exampleOut: '(in debug output)[10]current value 1',
                    exampleCode: '{debug;current value;{get;~i}}'
                }
            },
            dump: {
                default: {
                    description: 'Dumps the provided text to a blargbot output page. These expire after 7 days.',
                    exampleOut: 'https://blargbot.xyz/output/1111111111111111',
                    exampleCode: '{dump;Hello, world!}'
                }
            },
            execTag: {
                default: {
                    description: 'Executes the `name` tag, giving it `args` as the input. Useful for modules.\n`{execTag}` executes the tag as if its code was in the root command.',
                    exampleOut: 'Let me do a tag for you. User#1111 has paid their respects. Total respects given: 5',
                    exampleCode: 'Let me do a tag for you. {execTag;f}'
                }
            },
            execCustomCommand: {
                default: {
                    description: 'Executes the `name` custom command, giving it `args` as the input. Useful for modules.\n`{execCustomCommand}` executes the command as if its code was in the root command.',
                    exampleOut: 'Let me do a command for you. User#1111 has paid their respects. Total respects given: 5',
                    exampleCode: 'Let me do a command for you. {execCustomCommand;f}'
                }
            },
            fallback: {
                clear: {
                    description: 'Should any tag fail to parse, it will be replaced with `message` instead of an error.',
                    exampleOut: 'This tag failed',
                    exampleCode: '{fallback;This tag failed} {abc}'
                },
                set: {
                    description: 'Clears the current fallback text.',
                    exampleOut: 'This tag failed  `Unknown subtag xyz`',
                    exampleCode: '{fallback;This tag failed} {abc} {fallback} {xyz}'
                }
            },
            flag: {
                default: {
                    description: 'Returns the value of the specified case-sensitive flag code. Use `_` to get the values without a flag.',
                    exampleIn: 'Hello, -a world!',
                    exampleOut: 'world! Hello,',
                    exampleCode: '{flag;a} {flag;_}'
                }
            },
            flagsArray: {
                default: {
                    description: 'Returns an array of all flags provided.',
                    exampleIn: 'Hello -dc world',
                    exampleOut: '["_","d","c"]',
                    exampleCode: '{flagsArray}'
                }
            },
            flagSet: {
                default: {
                    description: 'Returns `true` or `false`, depending on whether the specified case-sensitive flag code has been set or not.',
                    exampleIn: 'Hello, -a world!',
                    exampleOut: 'true false',
                    exampleCode: '{flagSet;a} {flagSet;_}'
                }
            },
            function: {
                default: {
                    description: 'Defines a function called `name`. Functions are called in the same way as subtags, however they are prefixed with `func.`. While inside the `code` block of a function, you may use the `params`, `paramsArray` and `paramsLength` subtags to access the values passed to the function. These function identically to their `args` counterparts. \n\nPlease note that there is a recursion limit of 200 which is also shared by `{execTag}`, `{execCustomCommand}` and `{inject}`.',
                    exampleOut: '["1","2","3","4"]',
                    exampleCode: '{function;test;{paramsArray}} {func.test;1;2;3;4}'
                }
            },
            get: {
                value: {
                    description: [
                        {
                            name: 'default',
                            input: [{
                                scopes: [
                                    { prefix: 'x', name: util.literal('Test scope') },
                                    { prefix: '', name: util.literal('Default scope') },
                                    { prefix: 'aaaa', name: util.literal('aaaa') }
                                ]
                            }],
                            expected: 'Returns the stored variable `varName`.\nYou can use a character prefix to determine the scope of your variable.\nValid scopes are: `x` (Test scope), no prefix (Default scope) and `aaaa` (aaaa). For more information, use `b!t docs variable` or `b!cc docs variable`'
                        }
                    ],
                    exampleOut: 'This is local var1\nThis is temporary var2',
                    exampleCode: '{set;var1;This is local var1}\n{set;~var2;This is temporary var2}\n{get;var1}\n{get;~var2}'
                },
                index: {
                    description: 'When variable `name` is an array this will return the element at index `index`. If `index` is empty the entire array will be returned. If variable is not an array it will return the whole variable.',
                    exampleOut: 'def',
                    exampleCode: '{set;myArray;["abc","def","ghi"]}{get;myArray;1}'
                }
            },
            inject: {
                default: {
                    description: 'Executes any arbitrary BBTag that is within `code` and returns the result. Useful for making dynamic code, or as a testing tool (`{inject;{args}}`)',
                    exampleOut: 'Random Number: 3',
                    exampleCode: 'Random Number: {inject;{lb}randomInt{semi}1{semi}4{rb}}'
                }
            },
            lock: {
                default: {
                    description: 'Provides read/write locking functionality for bbtag. This is a very advanced feature, so it is recommended that you first [read about the concept of locks](https://en.wikipedia.org/wiki/Lock_(computer_science)).\n\nIn simple terms, a lock allows commands running at the same time to cooperate and wait for each other to finish what they are doing before "releasing the lock" and letting other commands use that lock. This can be used to secure against data being edited by 2 things at the same time, which can cause inconsistencies.\n\nThere can be multiple `read` locks held at once or a single `write` lock. This means that if all your command is doing is reading some data then as long as nothing is writing to it, it will be allowed, otherwise the command will wait until it can acquire a lock.\n\n`mode` must be either `read` or `write`.\n`key` can be anything. This follows the same scoping rules as variables do.\n`code` will be run once the lock is acquired',
                    exampleOut: '\nStart\nMiddle\nEnd\nStart\nMiddle\nEnd\nThis order is guaranteed always. Without a lock it isn\'t',
                    exampleCode: '\n{//;in 2 command run in quick succession}\n{lock;write;key;\n  {void;\n    {send;{channelId};Start}\n    {send;{channelId};Middle}\n    {send;{channelId};End}\n  }\n}\nThis order is guaranteed always. Without a lock it isn\'t'
                }
            },
            modLog: {
                description: 'If `moderator` is not provided or left empty, it will default to blargbot.',
                default: {
                    description: 'Creates a custom modLog entry with the given `action` and `user` with `reason`. `color` can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number. .',
                    exampleOut: 'You did a bad! (modLog entry with white embed colour and reason \'They did a bad!\')',
                    exampleCode: 'You did a bad! {modLog;Bad;{userId};;They did a bad;#ffffff}'
                }
            },
            nsfw: {
                default: {
                    description: 'Marks the output as being NSFW, and only to be sent in NSFW channels. A requirement for any tag with NSFW content. `message` is the error to show',
                    exampleOut: 'This command is not safe!',
                    exampleCode: 'This command is not safe! {nsfw}'
                }
            },
            params: {
                all: {
                    description: 'Gets the whole input given to the current function call',
                    exampleOut: 'You gave the parameters `Hello world! BBtag is so cool`',
                    exampleCode: '{func;test;You gave the parameters `{params}`}\n{func.test;Hello world!;BBtag is so cool}'
                },
                indexed: {
                    description: 'Gets a parameter passed to the current function call',
                    exampleOut: 'The first parameter is `Hello world!`',
                    exampleCode: '{func;test;The first parameter is `{params;0}`}\n{func.test;Hello world!;BBtag is so cool}'
                },
                range: {
                    description: 'Gets all the parameters given from `start` up to `end`. If `end` is `n` then all parameters after `start` will be returned',
                    exampleOut: 'C D',
                    exampleCode: '{func;test;The first parameter is `{params;2;4}`}\n{func.test;A;B;C;D;E;F}'
                }
            },
            paramsArray: {
                default: {
                    description: 'Gets the parameters passed to the current function as an array',
                    exampleOut: '["a","b","c","d"]',
                    exampleCode: '{func.test;{paramsArray}}\n{func.test;a;b;c;d}'
                }
            },
            paramsLength: {
                default: {
                    description: 'Gets the number of parameters passed to the current function',
                    exampleOut: '["a","b","c","d"]',
                    exampleCode: '{func.test;{paramsLength}}\n{func.test;a;b;c;d}'
                }
            },
            prefix: {
                default: {
                    description: 'Gets the command prefix used to call this bbtag.',
                    exampleOut: 'Your prefix is b!',
                    exampleCode: 'Your prefix is {prefix}'
                }
            },
            quiet: {
                default: {
                    description: 'Tells any subtags that rely on a `quiet` field to be/not be quiet based on `isQuiet. `isQuiet` must be a boolean',
                    exampleOut: 'cat',
                    exampleCode: '{quiet} {userMention;cat}'
                }
            },
            reason: {
                default: {
                    description: 'Sets the reason for the next API call (ex. roleAdd, roleRemove, ban, etc.). If `reason` is empty the reason will be empty',
                    exampleOut: '("This will show up in the audit logs" showed up)',
                    exampleCode: '{reason;This will show up in the audit logs!}{roleAdd;111111111111}'
                }
            },
            request: {
                description: 'Only certain whitelisted domains can be used for `url`. See [here](https://blargbot.xyz/domains) for the list.The output is a JSON object with the following structure. It is recommended to use {jsonGet} to navigate it.\n```json\n{\n  "body": {}, // the body of the request\n  "status": 200, // the HTTP status code\n  "statusText": "OK", // the human readable translation of the status code\n  "date": "Thu, 1 Jan 1970 00:00:00 GMT", // the date sent in the headers\n  "contentType": "application/json", // the content type of the response\n  "url": "https://fancy.url/here" // the url that was requested\n}\n```',
                default: {
                    description: 'Performs a HTTP request to `url`, with provided `options` and `data`.`options` is a JSON object with the following structure. It is recommended to use {jsonSet} to create it.\n```json\n{\n  "method": "GET|POST|PUT|PATCH|DELETE", // defaults to GET\n  "headers": { "key": "value" }\n}\n```If the method is GET and a JSON object is provided for `data`, it will be formatted as query strings.',
                    exampleOut: 'Stupid cat updated!',
                    exampleCode: '{jGet;{request;https://example.com/update/user;{jset;;method;POST};{jset;;user;Stupid cat}};body}'
                }
            },
            return: {
                default: {
                    description: 'Stops execution of the tag and returns what has been parsed. If `force` is `true` then it will also return from any tags calling this tag.',
                    exampleOut: 'This will display.',
                    exampleCode: 'This will display. {return} This will not.'
                }
            },
            rollback: {
                description: 'For optimization reasons, variables are not stored in the database immediately when you use `{set}`. Instead they are cached, and will be saved to the database when the tag finishes. If you have some `variables` that you don\'t want to be changed, you can use this to revert them back to their value at the start of the tag, or the most recent `{commit}`.\n`variables` defaults to all values accessed up to this point.\n`{commit}` is the counterpart to this.',
                all: {
                    description: 'Rollback all variables',
                    exampleOut: 'Hello!',
                    exampleCode: '{set;var;Hello!}\n{commit}\n{set;var;GoodBye!}\n{rollback}\n{get;var}'
                },
                variables: {
                    description: 'Rollback provided `variables`',
                    exampleOut: 'Hello!',
                    exampleCode: '{set;var;Hello!}\n{commit;var}\n{set;var;GoodBye!}\n{rollback;var}\n{get;var}'
                }
            },
            set: {
                clear: {
                    description: 'Sets the `name` variable to nothing.',
                    exampleOut: '(returns nothing)',
                    exampleCode: '{set;~var;something}\n{set;~var}\n{get;~var}'
                },
                value: {
                    description: [
                        {
                            name: 'default',
                            input: [{
                                scopes: [
                                    { prefix: 'x', name: util.literal('Test scope') },
                                    { prefix: '', name: util.literal('Default scope') },
                                    { prefix: 'aaaa', name: util.literal('aaaa') }
                                ]
                            }],
                            expected: 'Stores `value` under `name`. These variables are saved between sessions. You can use a character prefix to determine the scope of your variable.\nValid scopes are: `x` (Test scope), no prefix (Default scope) and `aaaa` (aaaa).\nFor performance reasons, variables are not immediately stored to the database. See `{commit}` and `{rollback}`for more information, or use `b!t docs variable` or `b!cc docs variable`'
                        }
                    ],
                    exampleOut: 'This is local var1\nThis is temporary var2',
                    exampleCode: '{set;var1;This is local var1}\n{set;~var2;This is temporary var2}\n{get;var1}\n{get;~var2}'
                },
                array: {
                    description: 'Stores an array under `name`.\nWhen getting the array, you\'ll notice it retrieved an object, In this object `v` is the array itself, and `n` is the `name` of the variable. If the array itself needs to be returned instead of object, in for example `{jSet;;array;{get;~array}}`, you can use `{slice;<arrayName>;0}`. In array subtags `{get} will work as intended.`',
                    exampleOut: '{"v":["this","is","an","array"],"n":"var3"}',
                    exampleCode: '{set;var3;this;is;an;array}\n{get;var3}'
                }
            },
            sleep: {
                default: {
                    description: 'Pauses the current tag for the specified amount of time. Maximum is 5 minutes',
                    exampleOut: '(After 10s) Hi!',
                    exampleCode: '{sleep;10s}{send;{channelId};Hi!}'
                }
            },
            subtagExists: {
                default: {
                    description: 'Checks to see if `subtag` exists.',
                    exampleOut: 'true false',
                    exampleCode: '{subtagExists;ban} {subtagExists;AllenKey}'
                }
            },
            suppressLookup: {
                default: {
                    description: 'Sets whether error messages in the lookup system (query canceled, nothing found) should be suppressed. `value` must be a boolean',
                    exampleOut: '',
                    exampleCode: '{suppressLookup}'
                }
            },
            throw: {
                default: {
                    description: 'Throws `error`.',
                    exampleOut: '`Custom Error`',
                    exampleCode: '{throw;Custom Error}'
                }
            },
            timer: {
                default: {
                    description: 'Executes `code` after `duration`. Three timers are allowed per custom command, with no recursive timers.',
                    exampleOut: '(after 20 seconds:) Hello!',
                    exampleCode: '{timer;Hello!;20s}'
                }
            },
            channelCategories: {
                default: {
                    description: 'Returns an array of category ids on the current guild.',
                    exampleOut: 'This guild has 7 categories.',
                    exampleCode: 'This guild has {length;{categories}} categories.'
                }
            },
            channelCategory: {
                current: {
                    description: 'Returns the category id of the current channel.',
                    exampleOut: '111111111111111',
                    exampleCode: '{channelCategory}'
                },
                channel: {
                    description: 'Returns the category id of the provided `channel`. If the provided `channel` is a category this returns nothing. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleOut: '111111111111111\n(nothing is returned here)',
                    exampleCode: '{channelCategory;cool channel}\n{channelCategory;cool category}'
                }
            },
            channelCreate: {
                description: '`type` is either `text`, `voice`, `category`, `news` or `store`.\n',
                default: {
                    description: 'Creates a channel with the specified `options` of type `type``options` is a JSON object, containing any or all of the following properties:\n- `topic`\n- `nsfw`\n- `parentId`\n- `reason` (displayed in audit log)\n- `rateLimitPerUser`\n- `bitrate` (voice)\n- `userLimit` (voice)\nReturns the new channel\'s id.',
                    exampleOut: '22222222222222222',
                    exampleCode: '{channelCreate;super-channel;;{json;{"parentId":"11111111111111111"}}}'
                }
            },
            channelDelete: {
                default: {
                    description: 'Deletes the provided `channel`.',
                    exampleOut: '',
                    exampleCode: '{channelDelete;11111111111111111}'
                }
            },
            channelEdit: {
                default: {
                    description: 'Edits a channel with the given information.\n`options` is a JSON object, containing any or all of the following properties:\n- `name`\n- `topic`\n- `nsfw`\n- `parentId`\n- `reason` (displayed in audit log)\n- `rateLimitPerUser`\n- `bitrate` (voice)\n- `userLimit` (voice)\nReturns the channel\'s id.',
                    exampleOut: '11111111111111111',
                    exampleCode: '{channelEdit;11111111111111111;{j;{"name": "super-cool-channel"}}}'
                }
            },
            channelId: {
                current: {
                    description: 'Returns the id of the current channel.',
                    exampleOut: '111111111111111',
                    exampleCode: '{channelId}'
                },
                channel: {
                    description: 'Returns the id of the given channel. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleOut: '111111111111111\n(nothing is returned here)',
                    exampleCode: '{channelId;cool channel}\n{channelId;some channel that doesn\'t exist;true}'
                }
            },
            channelIsCategory: {
                default: {
                    description: 'Checks if `channel` is a category. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleOut: 'true\n(nothing is returned here)',
                    exampleCode: '{channelIsCategory;cool category}\n{channelIsCategory;category that doesn\'t exist}'
                }
            },
            channelIsNsfw: {
                current: {
                    description: 'Checks if the current channel is a NSFW channel.',
                    exampleOut: 'fluffy bunnies',
                    exampleCode: '{if;{channelIsNsfw};Spooky nsfw stuff;fluffy bunnies}'
                },
                channel: {
                    description: 'Checks if `channel` is a NSFW channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleOut: 'true',
                    exampleCode: '{channelIsNsfw;SFW Cat pics}'
                }
            },
            channelIsText: {
                current: {
                    description: 'Checks if the current channel is a text channel.',
                    exampleOut: 'Yeah you can write stuff here',
                    exampleCode: '{if;{channelIsText};Yeah you can write stuff here;How did you even call the command?}'
                },
                channel: {
                    description: 'Checks if `channel` is a text channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleOut: 'true',
                    exampleCode: '{channelIsText;feature discussions}'
                }
            },
            channelIsThread: {
                current: {
                    description: 'Checks if the current channel is a thread channel.',
                    exampleOut: 'Cool, this is a thread channel!',
                    exampleCode: '{if;{channelIsThread};Cool, this is a thread channel!;Boo, this is a regular text channel}'
                },
                channel: {
                    description: 'Checks if `channel` is a thread channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleOut: 'true',
                    exampleCode: '{channelIsThread;blargbot podcast}'
                }
            },
            channelIsVoice: {
                current: {
                    description: 'Checks if the current channel is a voice channel.',
                    exampleOut: 'Yeah you can write stuff here',
                    exampleCode: '{if;{channelIsVoice};How did you even call the command?;Yeah you can write stuff here}'
                },
                channel: {
                    description: 'Checks if `channel` is a voice channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleOut: 'true',
                    exampleCode: '{channelIsVoice;blargbot podcast}'
                }
            },
            channelName: {
                current: {
                    description: 'Returns the name of the current channel.',
                    exampleOut: 'This channel\'s name is test-channel',
                    exampleCode: 'This channel\'s name is {channelName}'
                },
                channel: {
                    description: 'Returns the name of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleOut: 'cooler-test-channel',
                    exampleCode: '{channelName;111111111111111}'
                }
            },
            channelPosition: {
                description: 'The position is the index per channel type (text, voice or category) in the channel list.',
                current: {
                    description: 'Returns the position of the current channel.',
                    exampleOut: 'This channel is in position 1',
                    exampleCode: 'This channel is in position {channelPosition}'
                },
                channel: {
                    description: 'Returns the position of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleOut: 'The position of test-channel is 0',
                    exampleCode: 'The position of test-channel is {channelPosition;test-channel}'
                }
            },
            channels: {
                current: {
                    description: 'Returns an array of channel ids in the current guild',
                    exampleOut: 'This guild has {length;{channels}} channels.',
                    exampleCode: 'This guild has {length;{channels}} channels.'
                },
                channel: {
                    description: 'Returns an array of channel ids in within the given `category`. If `category` is not a category, returns an empty array. If `category` cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleOut: 'Category cat-channels has 6 channels.',
                    exampleCode: 'Category cat-channels has {length;{channels;cat-channels}} channels.'
                }
            },
            channelSetPermissions: {
                current: {
                    description: 'Deletes the permission overwrites of `memberId|roleId` in `channel`.\nReturns the channel\'s id.',
                    exampleOut: '11111111111111111',
                    exampleCode: '{channelSetPermissions;11111111111111111;member;222222222222222222}'
                },
                channel: {
                    description: 'Sets the permissions of a `member` or `role` in `channel`\n`type` is either `member` or `role`, and `memberId|roleId` corresponds to the id of the member or role.\nProvide `allow` and `deny` as numbers, which can be calculated [here](https://discordapi.com/permissions.html). Returns the channel\'s id.',
                    exampleOut: '11111111111111111',
                    exampleCode: '{channelSetPermissions;11111111111111111;member;222222222222222222;1024;2048}'
                }
            },
            channelSetPosition: {
                default: {
                    description: 'Moves a channel to the provided position.',
                    exampleOut: '',
                    exampleCode: '{channelSetPosition;11111111111111111;5}'
                }
            },
            channelType: {
                description: [
                    {
                        name: 'default',
                        input: [{ types: ['abc', 'def', 'ghi'] }],
                        expected: 'Possible results: `abc`, `def`, `ghi`'
                    }
                ],
                current: {
                    description: 'Returns the type the current channel.',
                    exampleOut: 'text',
                    exampleCode: '{channelType}'
                },
                channel: {
                    description: 'Returns the type the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleOut: 'voice\n(nothing is returned here)',
                    exampleCode: '{channelType;cool channel}\n{channelType;some channel that doesn\'t exist;true}'
                }
            },
            lastMessageId: {
                description: 'Returns nothing if the channel doesn\'t have any messages.',
                current: {
                    description: 'Returns the messageId of the last message in the current channel.',
                    exampleOut: '1111111111111111',
                    exampleCode: '{lastMessageId}'
                },
                channel: {
                    description: 'Returns the messageId of the last message in `channel`.',
                    exampleOut: '2222222222222222',
                    exampleCode: '{lastMessageId;1111111111111111}'
                }
            },
            slowMode: {
                clearCurrent: {
                    description: 'Removes slow mode for the current channel.',
                    exampleOut: '(slow mode is now disabled)',
                    exampleCode: '{slowMode}'
                },
                clearChannel: {
                    description: 'Removes slow mode for the given `channel`',
                    exampleOut: '(disabled slow mode in testing-grounds)',
                    exampleCode: '{slowMode;testing-grounds}'
                },
                setCurrent: {
                    description: 'Enables slow mode in the current channel and set the cooldown to `time`.',
                    exampleOut: '(set slow mode to 10 seconds)',
                    exampleCode: '{slowMode;10}'
                },
                setChannel: {
                    description: 'Enables slow mode in `channel` and set the cooldown to `time`.',
                    exampleOut: '(set slow mode cooldown to 10 seconds in testing-grounds)\n(set slow mode to 50s in the current channel)',
                    exampleCode: '{slowMode;testing-grounds;10}\n{slowMode;50;doesn\'t matter}'
                }
            },
            emojiCreate: {
                default: {
                    description: 'Creates a emoji with the given name and image. `image` is either a link to an image, or a base64 encoded data url (`data:<content-type>;base64,<base64-data>`). You may need to use {semi} for the latter.`roles`, if provided, will restrict the emoji\'s usage to the specified roles. Must be an array of roles.Returns the new emojis\'s id.',
                    exampleOut: '11111111111111111',
                    exampleCode: '{emojiCreate;fancy_emote;https://some.cool/image.png;["Cool gang"]}'
                }
            },
            emojiDelete: {
                default: {
                    description: 'Deletes an emoji with the provided `id`',
                    exampleOut: '',
                    exampleCode: '{emojiDelete;11111111111111111}'
                }
            },
            emojis: {
                description: 'Please note that Discord will remove all the emojis from a message which contains an emoji that blargbot can\'t use. For example, blargbot can\'t use a role-restricted emoji if it doesn\'t have the role. Learn more [here](https://discordapp.com/developers/docs/resources/emoji).',
                all: {
                    description: 'Returns an array of emojis in the current guild.',
                    exampleOut: 'This guild has 23 emojis.',
                    exampleCode: 'This guild has {length;{emojis}} emojis.'
                },
                forRole: {
                    description: 'Returns an array of emojis whitelisted for the provided `role`',
                    exampleOut: 'Cool gang has 6 emojis.',
                    exampleCode: 'Cool gang has {length;{emojis;Cool gang}} emojis.'
                }
            },
            guildBans: {
                default: {
                    description: 'Returns an array of banned users in the current guild.',
                    exampleOut: 'This guild has 123 banned users.',
                    exampleCode: 'This guild has {length;{guildBans}} banned users.'
                }
            },
            guildCreatedAt: {
                default: {
                    description: 'Returns the date the current guild was created, in UTC+0. If a `format` code is specified, the date is formatted accordingly. Leave blank for default formatting. See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information.',
                    exampleOut: 'This guild was created on 2016/01/01 01:00:00',
                    exampleCode: 'This guild was created on {guildCreatedAt;YYYY/MM/DD HH:mm:ss}'
                }
            },
            guildFeatures: {
                default: {
                    description: 'Returns an array of guild feature strings. For a full list click [this link](https://discord.com/developers/docs/resources/guild#guild-object-guild-features).',
                    exampleOut: '["COMMUNITY","COMMERCE","NEWS","PREVIEW_ENABLED","WELCOME_SCREEN_ENABLED","MEMBER_VERIFICATION_GATE_ENABLED","THREADS_ENABLED"]',
                    exampleCode: '{guildFeatures}'
                }
            },
            guildIcon: {
                default: {
                    description: 'Returns the icon of the current guild. If it doesn\'t exist returns nothing.',
                    exampleOut: 'The guild\'s icon is (icon url)',
                    exampleCode: 'The guild\'s icon is {guildIcon}'
                }
            },
            guildId: {
                default: {
                    description: 'Returns the id of the current guild.',
                    exampleOut: 'The guild\'s id is 1234567890123456',
                    exampleCode: 'The guild\'s id is {guildId}'
                }
            },
            guildMembers: {
                default: {
                    description: 'Returns an array of user ids of the members on the current guild.',
                    exampleOut: 'This guild has 123 members.',
                    exampleCode: 'This guild has {length;{guildMembers}} members.'
                }
            },
            guildName: {
                default: {
                    description: 'Returns the name of the current guild.',
                    exampleOut: 'This guild\'s name is TestGuild.',
                    exampleCode: 'This guild\'s name is {guildName}.'
                }
            },
            guildOwnerId: {
                default: {
                    description: 'Returns the id of the guild\'s owner.',
                    exampleOut: 'The owner\'s id is 1234567890123456.',
                    exampleCode: 'The owner\'s id is {guildOwnerId}.'
                }
            },
            guildSetIcon: {
                default: {
                    description: 'Updates the current guild\'s icon with the provided image. `image` is either a link to an image, or a base64 encoded data url (`data:<content-type>;base64,<base64-data>`). You may need to use {semi} for the latter.',
                    exampleOut: '',
                    exampleCode: '{guildSetIcon;https://some.cool/image.png}'
                }
            },
            guildSize: {
                default: {
                    description: 'Returns the number of members on the current guild.',
                    exampleOut: 'This guild has 123 members.',
                    exampleCode: 'This guild has {guildSize} members.'
                }
            },
            json: {
                default: {
                    description: 'Defines a raw JSON object. Usage of subtags is disabled in `input`, inside `input` all brackets are required to match.',
                    exampleOut: '{\n  "key": "value"\n}',
                    exampleCode: '{json;{\n  "key": "value"\n}}'
                }
            },
            jsonClean: {
                default: {
                    description: 'Using the `input` as a base, cleans up the JSON file structure, parsing stringified nested objects/arrays. Will not mutate the original object.',
                    exampleOut: '{"test":[]}',
                    exampleCode: '{jsonClean;{j;{"test":"[]"}}}'
                }
            },
            jsonGet: {
                parse: {
                    description: 'Gets a json value. Works with arrays too!\n`input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.',
                    exampleOut: 'one',
                    exampleCode: '{jsonGet;{j;{\n  "array": [\n    "zero",\n    { "value": "one" },\n    "two"\n  ]\n}};array.1.value}'
                },
                path: {
                    description: 'Navigates the path of a JSON object. Works with arrays too!\n`input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n`path` is a dot-noted series of properties.',
                    exampleOut: 'one',
                    exampleCode: '{jsonGet;{j;{\n  "array": [\n    "zero",\n    { "value": "one" },\n    "two"\n  ]\n}};array.1.value}'
                }
            },
            jsonKeys: {
                default: {
                    description: 'Retrieves all keys from provided the JSON object. `object` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n`path` is a dot-noted series of properties.',
                    exampleOut: '["key","key2"]',
                    exampleCode: '{set;~json;{json;{"key": "value", "key2" : "value2"}}\n{jsonKeys;~json}'
                }
            },
            jsonSet: {
                delete: {
                    description: 'Deletes the value at `path`. `input` can be a JSON object or array',
                    exampleOut: '{}',
                    exampleCode: '{set;~json;{json;{"key" : "value"}}}\n{jsonSet;~json;key}\n{get;~json}'
                },
                set: {
                    description: 'Using the `input` as a base, navigates the provided dot-notated `path` and assigns the `value`. `input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.If `create` is not empty, will create/convert any missing keys.',
                    exampleOut: '{"path":{"to":{"key":"value"}}}',
                    exampleCode: '{jsonSet;;path.to.key;value;create}'
                },
                create: {
                    description: 'Using the `input` as a base, navigates the provided dot-notated `path` and assigns the `value`. `input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.If `create` is not empty, will create/convert any missing keys.',
                    exampleOut: '{"path":{"to":{"key":"value"}}}',
                    exampleCode: '{jsonSet;;path.to.key;value;create}'
                }
            },
            jsonSort: {
                default: {
                    description: 'Sorts an array of objects based on the provided `path`.\n`path` is a dot-noted series of properties.\nIf `descending` is provided, sorts in descending order.\nIf provided a variable, will modify the original `array`.',
                    exampleOut: '[\n  "{\\"points\\":3,\\"name\\":\\"UNO\\"}",\n  "{\\"points\\":6,\\"name\\":\\"Stupid cat\\"}",\n  "{\\"points\\":10,\\"name\\":\\"Blargbot\\"}",\n  "{\\"points\\":12,\\"name\\":\\"Winner\\"}"\n]',
                    exampleCode: '{set;~array;{json;[\n  {"points" : 10, "name" : "Blargbot"},\n  {"points" : 3, "name" : "UNO"},\n  {"points" : 6, "name" : "Stupid cat"},\n  {"points" : 12, "name" : "Winner"}\n]}}\n{jsonStringify;{jsonSort;{slice;{get;~array};0};points};2}'
                }
            },
            jsonStringify: {
                default: {
                    description: 'Pretty-prints the provided JSON `input` with the provided `indent`.',
                    exampleOut: '[\n    "one",\n    "two",\n    "three"\n]',
                    exampleCode: '{jsonStringify;["one","two","three"]}'
                }
            },
            jsonValues: {
                default: {
                    description: 'Retrieves all values from provided the JSON object. `object` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n`path` is a dot-noted series of properties.',
                    exampleOut: '["value","value2"]',
                    exampleCode: '{set;~json;{json;{"key": "value", "key2" : "value2"}}\n{jsonValues;~json}'
                }
            },
            for: {
                default: {
                    description: 'To start, `variable` is set to `initial`. Then, the tag will loop, first checking `variable` against `limit` using `comparison`. If the check succeeds, `code` will be run before `variable` being incremented by `increment` and the cycle repeating.\nThis is very useful for repeating an action (or similar action) a set number of times. Edits to `variable` inside `code` will be ignored',
                    exampleOut: '0,1,2,3,4,5,6,7,8,9,',
                    exampleCode: '{for;~index;0;<;10;{get;~index},}'
                }
            },
            forEach: {
                default: {
                    description: 'For every element in `array`, a variable called `variable` will be set and then `code` will be run.\nIf `element` is not an array, it will iterate over each character instead.',
                    exampleOut: 'I like apples\nI like oranges\nI like c#',
                    exampleCode: '{set;~array;apples;oranges;c#}\n{forEach;~element;~array;I like {get;~element}{newline}}'
                }
            },
            repeat: {
                default: {
                    description: 'Repeatedly executes `code` `amount` times.',
                    exampleOut: 'eeeeeeeeee',
                    exampleCode: '{repeat;e;10}'
                }
            },
            while: {
                value: {
                    description: 'This will continuously execute `code` for as long as `boolean` returns `true`.',
                    exampleOut: '10',
                    exampleCode: '{set;~x;0}\n{set;~end;false}\n{while;{get;~end};\n\t{if;{increment;~x};==;10;\n\t\t{set;~end;true}\n\t}\n}\n{get;~end}'
                },
                condition: {
                    description: [
                        {
                            name: 'default',
                            input: [{ operators: ['===', '!==', '>=', '>', '<=', '<'] }],
                            expected: 'This will continuously execute `code` for as long as the condition returns `true`. The condition is as follows:\nIf `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. Valid evaluators are `===`, `!==`, `>=`, `>`, `<=` and `<`.'
                        }
                    ],
                    exampleOut: '1,2,3,4,5,6,7,8,9,10,11,',
                    exampleCode: '{set;~x;0}\n{while;{get;~x};<=;10;{increment;~x},}'
                }
            },
            absolute: {
                value: {
                    description: 'Gets the absolute value of `number`',
                    exampleOut: '535',
                    exampleCode: '{absolute;-535}'
                },
                array: {
                    description: 'Gets the absolute value of each `numbers` and returns an array containing the results',
                    exampleOut: '[535, 123, 42]',
                    exampleCode: '{absolute;-535;123;-42}'
                }
            },
            base: {
                default: {
                    description: 'Converts `integer` from a base `origin` number into a base `radix` number. `radix` and `origin` must be between 2 and 36.',
                    exampleOut: '255',
                    exampleCode: '{base;FF;16;10}'
                }
            },
            decrement: {
                default: {
                    description: 'Decreases `varName`\'s value by `1`. ',
                    exampleOut: '-1,-2,-3,-4,-5,-6,-7,-8,-9,-10',
                    exampleCode: '{set;~counter;0} {repeat;{decrement;~counter},;10}'
                },
                count: {
                    description: 'Decreases `varName`\'s value by `amount`. `floor` is a boolean, and if it is `true` then the value will be rounded down.',
                    exampleOut: '-2,-4,-6,-8,-10,-12,-14,-16,-18,-20',
                    exampleCode: '{set;~counter;0} {repeat;{decrement;~counter;-2},;10}'
                }
            },
            increment: {
                default: {
                    description: 'Increases `varName`\'s value by `1`. ',
                    exampleOut: '1,2,3,4,5,6,7,8,9,10',
                    exampleCode: '{set;~counter;0} {repeat;{increment;~counter},;10}'
                },
                count: {
                    description: 'Increases `varName`\'s value by `amount`. `floor` is a boolean, and if it is `true` then the value will be rounded down.',
                    exampleOut: '2,4,6,8,10,12,14,16,18,20',
                    exampleCode: '{set;~counter;0} {repeat;{increment;~counter;-2},;10}'
                }
            },
            math: {
                default: {
                    description: [
                        {
                            name: 'default',
                            input: [{ operators: ['+', '-', '*', '/', '^', '%'] }],
                            expected: 'Accepts multiple `values` and returns the result of `operator` on them. Valid operators are `+`, `-`, `*`, `/`, `^` and `%`\nSee `{operators}` for a shorter way of performing numeric operations.'
                        }
                    ],
                    exampleOut: '2 + 3 + 6 - 2 = 9',
                    exampleCode: '2 + 3 + 6 - 2 = {math;-;{math;+;2;3;6};2}'
                }
            },
            max: {
                default: {
                    description: 'Returns the largest entry out of `numbers`. If an array is provided, it will be expanded to its individual values.',
                    exampleOut: '65',
                    exampleCode: '{max;50;2;65}'
                }
            },
            min: {
                default: {
                    description: 'Returns the smallest entry out of `numbers`. If an array is provided, it will be expanded to its individual values.',
                    exampleOut: '2',
                    exampleCode: '{min;50;2;65}'
                }
            },
            numberFormat: {
                description: 'If `roundTo` is not provided, but the number does have decimals, rounds to `3` by default. Any precision for decimals will be lost e.g: `100.000000000`becomes `100` and `100.3100000000` becomes `100.31`',
                default: {
                    description: 'Rounds `number` to `roundTo` digits. `roundTo` can be left empty.',
                    exampleOut: '123456.79\n123000\n100.1',
                    exampleCode: '{numberFormat;123456.789;2}\n{numberFormat;123456.789;-3}\n{numberFormat;100.10000;}'
                },
                separator: {
                    description: 'Rounds `number` to `roundTo` digits. Uses `decimal` as the decimal separator and `thousands` for the thousands separator. To skip `roundTo` or `decimal` leave them empty.',
                    exampleOut: '3,1415\n100.000',
                    exampleCode: '{numberFormat;3.1415;4;,}\n{numberFormat;100000;;;.}'
                }
            },
            parseFloat: {
                default: {
                    description: 'Returns an floating point number from `text`. If it wasn\'t a number, returns `NaN`.',
                    exampleOut: 'NaN 12.34 1.2',
                    exampleCode: '{parseFloat;abcd} {parseFloat;12.34} {parseFloat;1.2cd}'
                }
            },
            parseInt: {
                default: {
                    description: 'Returns an integer from `text`. If it wasn\'t a number, returns `NaN`.',
                    exampleOut: 'NaN 1234 12',
                    exampleCode: '{parseInt;abcd} {parseInt;1234} {parseInt;12cd}'
                }
            },
            randomInt: {
                default: {
                    description: 'Chooses a random whole number between `min` and `max` (inclusive).',
                    exampleOut: 'You rolled a 5.',
                    exampleCode: 'You rolled a {randomInt;1;6}.'
                }
            },
            round: {
                default: {
                    description: 'Rounds `number` to the nearest whole number.',
                    exampleOut: '1',
                    exampleCode: '{round;1.23}'
                }
            },
            roundDown: {
                default: {
                    description: 'Rounds `number` down.',
                    exampleOut: '1',
                    exampleCode: '{roundDown;1.23}'
                }
            },
            roundUp: {
                default: {
                    description: 'Rounds `number` up.',
                    exampleOut: '2',
                    exampleCode: '{roundUp;1.23}'
                }
            },
            delete: {
                description: 'Only custom commands can delete other messages.',
                trigger: {
                    description: 'Deletes the message that invoked the command',
                    exampleOut: '(the message got deleted idk how to do examples for this)',
                    exampleCode: '{//;The message that triggered this will be deleted} {delete}'
                },
                inCurrent: {
                    description: 'Deletes the specified `messageId` from the current channel.',
                    exampleOut: '(the message `111111111111111111` got deleted idk how to do examples for this)',
                    exampleCode: '{//;The message with id `111111111111111111` will be deleted}\n{delete;111111111111111111}'
                },
                inOther: {
                    description: 'Deletes the specified `messageId` from channel `channel`.',
                    exampleOut: '(the message `2222222222222222` from channel `1111111111111111` got deleted)',
                    exampleCode: '{//;The message with id `2222222222222222` from channel `1111111111111111` will be deleted}\n{delete;111111111111111111;2222222222222222}'
                }
            },
            edit: {
                description: '`text` and `embed` can both be set to `_delete` to remove either the message content or embed.Please note that `embed` is the JSON for an embed object or an array of embed objects, don\'t put `{embed}` there, as nothing will show. Only messages created by the bot may be edited.',
                inCurrentText: {
                    description: 'Edits `messageId` in the current channel to say `text`',
                    exampleOut: '',
                    exampleCode: '{edit;111111111111111111;{embedBuild;title:Hello world}}'
                },
                inCurrentEmbed: {
                    description: 'Edits `messageId` in the current channel to say `embed`',
                    exampleOut: '',
                    exampleCode: '{edit;111111111111111111;{embedBuild;title:Hello world}}'
                },
                inCurrentFull: {
                    description: 'Edits `messageId` in the current channel to say `text` and `embed`',
                    exampleOut: '',
                    exampleCode: '{edit;111111111111111111;Hello world;{embedBuild;title:Foo bar}}'
                },
                inOtherText: {
                    description: 'Edits `messageId` in `channelId` to say `text`',
                    exampleOut: '',
                    exampleCode: '{edit;111111111111111111;222222222222222222;Hello world}'
                },
                inOtherEmbed: {
                    description: 'Edits `messageId` in `channelId` to say `embed`',
                    exampleOut: '',
                    exampleCode: '{edit;111111111111111111;222222222222222222;Hello world}'
                },
                inOtherFull: {
                    description: 'Edits `messageId` in `channelId` to say `text` and `embed`',
                    exampleOut: '',
                    exampleCode: '{edit;111111111111111111;222222222222222222;Hello world;{embedBuild;title:Foo bar}}'
                }
            },
            embed: {
                default: {
                    description: 'Takes whatever input you pass to `embed` and attempts to form an embed from it. `embed` must be a valid json embed object. Multiple embeds can be provided.\nThis subtag works well with `{embedBuild}`. If attempting to use inside of a `{send}`, `{edit}` or `{dm}`, you should not include `{embed}`, and instead just pass the content direct to `{send}`/`{edit}`/`{dm}`\nYou can find information about embeds [here (embed structure)](https://discordapp.com/developers/docs/resources/channel#embed-object) and [here (embed limits)](https://discordapp.com/developers/docs/resources/channel#embed-limits) as well as a useful tool for testing embeds [here](https://leovoel.github.io/embed-visualizer/)',
                    exampleOut: '(an embed with "Hello!" as the title)',
                    exampleCode: '{embed;{lb}"title":"Hello!"{rb}}'
                }
            },
            embedBuild: {
                description: [
                    {
                        name: 'default',
                        input: [{ keys: ['abc', 'def', 'ghi'] }],
                        expected: 'This tag is designed to allow you to generate embed code for `{webhook}` and `{embed}` with much less effort.\nThis tag uses a key/value system, with each entry in `values` looking like `key:value`.\n\nValid keys are:\n`abc`, `def`, `ghi`\n\nYou can find information about embeds [here (embed structure)](https://discordapp.com/developers/docs/resources/channel#embed-object) and [here (embed limits)](https://discordapp.com/developers/docs/resources/channel#embed-limits) as well as a useful tool for testing embeds [here](https://leovoel.github.io/embed-visualizer/)'
                    }
                ],
                default: {
                    description: 'Builds the embed json',
                    exampleOut: '{"title":"hello!","description":"I am an example embed","fields":[{"name":"Field 1","value":"This is the first field!"},{"name":"Field 2","value":"This is the next field and is inline!","inline":true}]}',
                    exampleCode: '{embedBuild;\n  title:hello!;\n  description:I am an example embed;\n  fields.name:Field 1;\n  fields.value:This is the first field!;\n  fields.name:Field 2;\n  fields.value:This is the next field and is inline!;\n  fields.inline:true\n}'
                }
            },
            everyoneMention: {
                default: {
                    description: 'Returns the mention of `@everyone`.\nThis requires the `disableeveryone` setting to be false. If `mention` is set to `true`, `@everyone` will ping, else it will be silent.',
                    exampleOut: '@everyone',
                    exampleCode: '{everyoneMention}'
                }
            },
            file: {
                default: {
                    description: 'Sets the output attachment to the provided `file` and `filename`. If `file` starts with `buffer:`, the following text will be parsed as base64 to a raw buffer - useful for uploading images.',
                    exampleOut: '(a file labeled readme.txt containing "Hello, world!")',
                    exampleCode: '{file;Hello, world!;readme.txt}'
                }
            },
            hereMention: {
                default: {
                    description: 'Returns the mention of `@here`.\nThis requires the `disableeveryone` setting to be false. If `mention` is set to `true`, `@here` will ping, else it will be silent.',
                    exampleOut: '@here',
                    exampleCode: '{hereMention}'
                }
            },
            messageAttachments: {
                trigger: {
                    description: 'Returns an array of attachments of the invoking message.',
                    exampleOut: 'You sent the attachments "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    exampleCode: 'You sent the attachments "{messageAttachments}"'
                },
                inCurrent: {
                    description: 'Returns an array of attachments of `messageId` in the current channel',
                    exampleOut: 'Someone sent a message with attachments: "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    exampleCode: 'Someone sent a message with attachments: "{messageAttachments;1111111111111}"'
                },
                inOther: {
                    description: 'Returns an array of attachments of `messageId` from `channel`. If `quiet` is provided and `channel` cannot be found, this will return an empty array.',
                    exampleOut: 'Someone sent a message in #support with attachments: "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    exampleCode: 'Someone sent a message in #support with attachments: "{messageAttachments;support;1111111111111}"'
                }
            },
            messageEditTime: {
                description: 'If the message is not edited, this will return the current time instead.\n\n**Note:** there are plans to change this behaviour, but due to backwards-compatibility this remains unchanged.',
                trigger: {
                    description: 'Returns the edit time of the executing message in `format`',
                    exampleOut: 'The edit timestamp of your message is "1628782144703"',
                    exampleCode: 'The edit timestamp of your message is "{messageEditTime}"'
                },
                inCurrent: {
                    description: 'Returns the edit time of `messageId` in `format`',
                    exampleOut: 'The edit timestamp of message 11111111111111 is "1628782144703"',
                    exampleCode: 'The edit timestamp of message 11111111111111 is "{messageEditTime;11111111111111}'
                },
                inOther: {
                    description: 'Returns the edit time of `messageId` from `channel` in `format`.',
                    exampleOut: 'Message 11111111111111 in #support was edited at 18:09',
                    exampleCode: 'Message 11111111111111 in #support was edited at {messageEditTime;support;11111111111111;HH:mm}'
                }
            },
            messageEmbeds: {
                trigger: {
                    description: 'Returns an array of embeds of the invoking message.',
                    exampleOut: 'You sent an embed: "[{"title":"Hello!"}]"',
                    exampleCode: 'You sent an embed: "{messageEmbeds}"'
                },
                inCurrent: {
                    description: 'Returns an array of embeds of `messageId` in the current channel',
                    exampleOut: 'Someone sent a message with attachments: "[{"title":"Hello!"}]"',
                    exampleCode: 'Someone sent a message with embeds: "{messageEmbeds;1111111111111}"'
                },
                inOther: {
                    description: 'Returns an array of embeds of `messageId` from `channel`. If `quiet` is provided and `channel` cannot be found, this will return an empty array.',
                    exampleOut: 'Someone sent a message in #support with embeds: "[{"title":"Hello!"}]"',
                    exampleCode: 'Someone sent a message in #support with embeds: "{messageEmbeds;support;1111111111111}"'
                }
            },
            messageId: {
                default: {
                    description: 'Returns the id of the invoking message.',
                    exampleOut: 'The message id was 111111111111111111',
                    exampleCode: 'The message id was {messageId}'
                }
            },
            messageReply: {
                trigger: {
                    description: 'Returns the id of the invoking message\'s parent message.',
                    exampleOut: 'You replied to the message 1111111111111',
                    exampleCode: 'You replied to the message {messageReply}'
                },
                inCurrent: {
                    description: 'Returns the id of the parent message of the provided `message`.',
                    exampleOut: 'Someone replied to the message 1111111111111',
                    exampleCode: 'Someone replied to the message {messageReply;2222222222222}'
                },
                inOther: {
                    description: 'Returns the id of the parent message of the provided `message`.',
                    exampleOut: 'Someone replied to the message 1111111111111',
                    exampleCode: 'Someone replied to the message {messageReply;general;2222222222222}'
                }
            },
            messageSender: {
                trigger: {
                    description: 'Returns the id of the author of the executing message.',
                    exampleOut: 'That was sent by "1111111111111"',
                    exampleCode: 'That was sent by "{messageSender}"'
                },
                inCurrent: {
                    description: 'Returns the id of the author of `messageId` in the current channel.',
                    exampleOut: 'Message 1111111111111 was sent by 2222222222222',
                    exampleCode: 'Message 1111111111111 was sent by {messageSender;1111111111111}'
                },
                inOther: {
                    description: 'Returns the id of the author of `messageId` in `channel`. If `quiet` is provided and `channel` cannot be found, this will return nothing.',
                    exampleOut: 'Message 1111111111111 in #support was sent by 2222222222222',
                    exampleCode: 'Message 1111111111111 in #support was sent by {messageSender;support;1111111111111}'
                }
            },
            messageText: {
                trigger: {
                    description: 'Returns the text of the executing message.',
                    exampleOut: 'You sent "text"',
                    exampleCode: 'You sent "b!t test You sent "{messageText}""`'
                },
                inCurrent: {
                    description: 'Returns the text of `messageId` in the current channel.',
                    exampleOut: 'Message 1111111111111 contained: "Hello world!"',
                    exampleCode: 'Message 1111111111111 contained: "{messageText;1111111111111}"'
                },
                inOther: {
                    description: 'Returns the text of `messageId` in `channel`. If `quiet` is provided and `channel` cannot be found, this will return nothing.',
                    exampleOut: 'Message 1111111111111 in #support contained: "Spooky Stuff"',
                    exampleCode: 'Message 1111111111111 in #support contained: "{messageText;support;1111111111111}"'
                }
            },
            messageTime: {
                trigger: {
                    description: 'Returns the send time of the executing message in `format`',
                    exampleOut: 'The send timestamp of your message is "1628782144703"',
                    exampleCode: 'The send timestamp of your message is "{messageTime}"'
                },
                inCurrent: {
                    description: 'Returns the send time of `messageId` in `format`',
                    exampleOut: 'The send timestamp of message 11111111111111 is "1628782144703"',
                    exampleCode: 'The send timestamp of message 11111111111111 is "{messageTime;11111111111111}'
                },
                inOther: {
                    description: 'Returns the send time of `messageId` from `channel` in `format`.',
                    exampleOut: 'Message 11111111111111 in #support was sent at 18:09',
                    exampleCode: 'Message 11111111111111 in #support was sent at {messageTime;support;11111111111111;HH:mm}'
                }
            },
            messageType: {
                description: 'For more info about message types, visit the [discord docs](https://discord.com/developers/docs/resources/channel#message-object-message-types).',
                trigger: {
                    description: 'Returns the message type of the executing message.',
                    exampleOut: '0',
                    exampleCode: '{messageType}'
                },
                other: {
                    description: '`channel` defaults to the current channel.\n\nReturns the message type of `messageId` in `channel`',
                    exampleOut: '19\n0',
                    exampleCode: '{messageType;12345678912345;123465145791}\n{messageType;1234567891234}'
                }
            },
            output: {
                default: {
                    description: 'Forces an early send of the default output message, using `text` as the text to show. If this is used then there will be no output sent once the tag finishes. Only 1 `{output}` may be used per tag/cc. If a second `{output}` is used then the result of the first `{output}` will be returned instead.\nThe message id of the output that was sent will be returned.',
                    exampleOut: 'Hello!',
                    exampleCode: '{output;Hello!}'
                }
            },
            reactionAdd: {
                description: 'Please note that to be able to add a reaction, I must be on the server that you got that reaction from. If I am not, then I will return an error if you are trying to apply the reaction to another message.',
                output: {
                    description: 'Adds `reactions` to the output message of this tag.',
                    exampleOut: 'This will have reactions! (reacted with 🤔 and 👀)',
                    exampleCode: 'This will have reactions! {reactionAdd;🤔;👀}'
                },
                inCurrent: {
                    description: 'Adds `reactions` to `messageId` in the current channel.',
                    exampleOut: '(11111111111111111 now has reactions 🤔 and 👀)',
                    exampleCode: '{reactionAdd;11111111111111111;🤔;👀}'
                },
                inOther: {
                    description: 'Adds `reactions` to `messageId` in `channelId`. `channelId` must be an id, use of `{channelId} is advised`.',
                    exampleOut: '(22222222222222222 in 11111111111111111 now has reactions 🤔 and 👀)',
                    exampleCode: '{reactionAdd;11111111111111111;22222222222222222;🤔;👀}'
                }
            },
            reaction: {
                default: {
                    description: 'Gets the reaction that triggered {waitReaction}',
                    exampleOut: '["111111111111111","12345678912345","3333333333333","✅"]',
                    exampleCode: '{waitReaction;11111111111111111;{bool;{reaction};==;✅}}'
                }
            },
            reactionUser: {
                default: {
                    description: 'Gets the user whose reaction that triggered {waitReaction}',
                    exampleOut: '["111111111111111","12345678912345","3333333333333","✅"]',
                    exampleCode: '{waitReaction;11111111111111111;{bool;{reactionUser};==;3333333333333}}'
                }
            },
            reactionList: {
                reactions: {
                    description: 'Returns an array of reactions on `messageId` in `channelId`.',
                    exampleOut: '["🤔", "👀"]',
                    exampleCode: '{reactionList;111111111111111111}'
                },
                users: {
                    description: 'Returns an array of users who reacted `reactions` on `messageId` in `channelId`. A user only needs to react to one reaction to be included in the resulting array.',
                    exampleOut: '["278237925009784832", "134133271750639616"]\n["134133271750639616"]',
                    exampleCode: '{reactionList;111111111111111111;🤔;👀}\n{reactionList;222222222222222222;111111111111111111;👀}'
                }
            },
            reactionRemove: {
                all: {
                    description: 'Removes all reactions of the executing user from `messageId` in `channel`.',
                    exampleOut: '(removed all reactions on 12345678901234)',
                    exampleCode: '{reactionRemove;12345678901234}'
                },
                user: {
                    description: 'Removes `reactions` `user` reacted on `messageId` in `channel`.',
                    exampleOut: '(removed the 🤔 reaction on 12345678901234 from user 111111111111111111)',
                    exampleCode: '{reactionRemove;12345678901234;111111111111111111;🤔}'
                }
            },
            reactionRemoveAll: {
                default: {
                    description: 'Removes all reactions from `messageId`.\n`channelId` defaults to the current channel.',
                    exampleOut: '(removed all the reactions)',
                    exampleCode: '{reactionRemoveAll;12345678901234;:thinking:}'
                }
            },
            send: {
                description: 'If `embed` is an array, multiple embeds will be added to the message payload.',
                full: {
                    description: 'Sends `message` and `embed` to `channel` with an attachment, and returns the message id. `channel` is either an id or channel mention. If `fileContent` starts with `buffer:` then the following text will be parsed as base64 to a raw buffer.\n**Note:** `embed` is the JSON for an embed, don\'t put the `{embed}` subtag there, as nothing will show',
                    exampleOut: '23946728937462847243',
                    exampleCode: '{send;{channelId};Hello there!;{embedBuild;title:This is a cool embed};Wow, look at this text file!;test.txt}'
                },
                textAndEmbed: {
                    description: 'Sends `message` and `embed` to `channel`, and returns the message id. `channel` is either an id or channel mention.\n**Note:** `embed` is the JSON for an embed, don\'t put the `{embed}` subtag there, as nothing will show',
                    exampleOut: '349587638464585678545',
                    exampleCode: '{send;{channelId};Hello there!;{embedBuild;title:This is a cool embed}}'
                },
                textOrEmbed: {
                    description: 'Sends `content` to `channel`, and returns the message id. `channel` is either an id or channel mention.\n**Note:** `content` is the text to send or the JSON for an embed, don\'t put the `{embed}` subtag there, as nothing will show',
                    exampleOut: '9458678957457694324',
                    exampleCode: '{send;{channelId};{embedBuild;title:This is a cool embed}'
                }
            },
            waitMessage: {
                description: [
                    {
                        name: 'default',
                        input: [{ disabled: ['abc', 'def', 'ghi'] }],
                        expected: 'Pauses the command until one of the given users sends a message in any of the given channels. When a message is sent, `condition` will be run to determine if the message can be accepted. If no message has been accepted within `timeout` then the subtag returns `Wait timed out`, otherwise it returns an array containing the channel id, then the message id. \n\n`channels` defaults to the current channel.\n`users` defaults to the current user.\n`condition` must return `true` or `false`\n`timeout` is a number of seconds. This is limited to 300\n\n While inside the `condition` parameter, none of the following subtags may be used: `abc`, `def`, `ghi`\nAlso, the current message becomes the users message that is to be checked. This means that `{channelId}`, `{messageId}`, `{userId}` and all related subtags will change their values.'
                    }
                ],
                default: {
                    description: 'Pauses the command until the executing user sends a message in the current channel.',
                    exampleOut: '["111111111111111","2222222222222"]',
                    exampleCode: '{waitMessage}'
                },
                filtered: {
                    description: 'Pauses the command until `condition` returns true when one of `userIds` sends a message in one of `channelIds`.',
                    exampleOut: '["111111111111111", "103347843934212096"]',
                    exampleCode: '{waitMessage;111111111111111;{userId;stupid cat};{bool;{username};startswith;stupid};50}'
                }
            },
            waitReaction: {
                description: [
                    {
                        name: 'default',
                        input: [{ disabled: ['abc', 'def', 'ghi'] }],
                        expected: 'Pauses the command until one of the given `users` adds any given `reaction` on any of the given `messages`. When a `reaction` is added, `condition` will be run to determine if the reaction can be accepted. If no reaction has been accepted within `timeout` then the subtag returns `Wait timed out`, otherwise it returns an array containing the channel id, the message id, the user id and the reaction, in that order. \n\n`userIds` defaults to the current user if left blank or omitted.\n`reactions` defaults to any reaction if left blank or omitted.\n`condition` must return `true` or `false`\n`timeout` is a number of seconds. This is limited to 300\n\n While inside the `condition` parameter, none of the following subtags may be used: `abc`, `def`, `ghi`\nAlso, the current message becomes the message the reaction was added to, and the user becomes the person who sent the message. This means that `{channelId}`, `{messageId}`, `{userId}` and all related subtags will change their values.\nFinally, while inside the `condition` parameter, you can use the temporary subtag `{reaction}` to get the current reaction and the `{reactionUser}` temporary subtag to get the user who reacted.\n`messages`, `users` and `reactions` can either be single values eg: `{waitReaction;1234567891234;stupid cat;🤔}`, or they can be arrays eg: `{waitReaction;["1234567891234","98765432219876"];stupid cat;["🤔"]}'
                    }
                ],
                default: {
                    description: 'Waits for any reaction on `messages` from the executing user or `userIds` if provided.',
                    exampleIn: '(reaction is added)',
                    exampleOut: '["111111111111111","12345678912345","3333333333333","🤔"]',
                    exampleCode: '{waitReaction;12345678912345;stupid cat}'
                },
                filtered: {
                    description: 'Waits for any of `reactions` on `messages` from `userIds`, if `condition` returns `true` this will return the response array. If no reaction was matched within `timeout`, `Wait timed out` will be returned.',
                    exampleIn: '(some random user reacted with 🤔)\n(blargbot reacted with 🤔)',
                    exampleOut: '["111111111111111","12345678912345","134133271750639616","🤔"]',
                    exampleCode: '{waitReaction;12345678912345;["{userId;stupid cat}","{userId;blargbot}"];["🤔", "👀"];;120}'
                }
            },
            webhook: {
                description: 'Please assign your webhook credentials to private variables! Do not leave them in your code.\n`embed` can be an array of embed objects.',
                empty: {
                    description: 'Executes a webhook.',
                    exampleOut: 'Error executing webhook: Cannot send an empty message',
                    exampleCode: '{webhook;1111111111111111;t.OK-en}'
                },
                default: {
                    description: 'Executes a webhook. If `embed` is provided it must be provided in a raw JSON format, properly escaped for BBTag. Using `{json}` is advised.',
                    exampleOut: '(in the webhook channel) This is the webhook content! (and with an embed with the title "This is the embed title" idk how to make this example)',
                    exampleCode: '{webhook;1111111111111111;t.OK-en;This is the webhook content!;{json;{"title":"This is the embed title!"}}}'
                },
                withUser: {
                    description: 'Executes a webhook. `avatarURL` must be a valid URL.',
                    exampleOut: '(in the webhook channel) Some content! (sent by "Not blargbot" with blargbot\'s pfp',
                    exampleCode: '{webhook;1111111111111111;t.OK-en;Some content!;;Not blargbot;{userAvatar;blargbot}}'
                },
                withFile: {
                    description: 'Executes a webhook. If file starts with buffer:, the following text will be parsed as base64 to a raw buffer.',
                    exampleOut: '(in the webhook channel a file labeled readme.txt containing "Hello, world!")',
                    exampleCode: '{webhook;1111111111111111;t.OK-en;;;;;Hello, world!;readme.txt}'
                }
            },
            base64Decode: {
                default: {
                    description: 'Converts the provided base64 to a UTF-8 string.',
                    exampleOut: 'Fancy!',
                    exampleCode: '{base64decode;RmFuY3kh}'
                }
            },
            base64Encode: {
                default: {
                    description: 'Converts the provided text to base64.',
                    exampleOut: 'RmFuY3kh!',
                    exampleCode: '{base64decode;Fancy!}'
                }
            },
            bool: {
                default: {
                    description: [
                        {
                            name: 'default',
                            input: [{ operators: ['===', '!==', '>=', '>', '<=', '<'] }],
                            expected: 'Evaluates `arg1` and `arg2` using the `evaluator` and returns `true` or `false`. Valid evaluators are `===`, `!==`, `>=`, `>`, `<=` and `<`\nThe positions of `evaluator` and `arg1` can be swapped.'
                        }
                    ],
                    exampleOut: 'true',
                    exampleCode: '{bool;5;<=;10}'
                }
            },
            brainfuck: {
                default: {
                    description: 'Interprets `code` as brainfuck, using `input` as the text for `,`.',
                    exampleOut: 'Hello World!',
                    exampleCode: '{brainfuck;-[------->+<]>-.-[->+++++<]>++.+++++++..+++.[--->+<]>-----.---[->+++<]>.-[--->+<]>---.+++.------.--------.-[--->+<]>.}'
                }
            },
            capitalize: {
                ignoreRest: {
                    description: 'Capitalizes the first letter of `text`, leaves the rest of the text untouched.',
                    exampleOut: 'Hello world!\nHELLO world',
                    exampleCode: '{capitalize;hello world!}\n{capitalize;hELLO world}'
                },
                restLower: {
                    description: 'Capitalizes the first letter of `text`, and converts the rest to lowercase.',
                    exampleOut: 'Hello world\nHello world\nFoo bar',
                    exampleCode: '{capitalize;hELLO WORLD;true}\n{capitalize;hello WORLD;anything goes here}\n{capitalize;foo BAR;}'
                }
            },
            choose: {
                default: {
                    description: 'Chooses from the given `options`, where `choice` is the index of the option to select.',
                    exampleOut: 'I feel like eating pie today.',
                    exampleCode: 'I feel like eating {choose;1;cake;pie;pudding} today.'
                }
            },
            clean: {
                default: {
                    description: 'Removes all duplicated whitespace from `text`, meaning a cleaner output.',
                    exampleOut: 'Hello!\nIm here to help',
                    exampleCode: '{clean;Hello!  \n\n  Im     here    to help}'
                }
            },
            color: {
                description: 'If `inputFormat` is omitted or left empty, the format of `color` is automatically calculated, but might be inaccurate. For accuracy and known `color` formats use `inputFormat`. It converts all ways between `rgb`, `hsl`, `hsv`, `hwb`, `cmyk`, `ansi16`, `hex` strings, and CSS `keyword`s (will round to closest).',
                default: {
                    description: 'Converts a color to `outputFormat`.',
                    exampleOut: '[66,134,244]',
                    exampleCode: '{color;#4286f4;RGB}'
                },
                convert: {
                    description: 'Converts a color of `inputFormat` to `outputFormat`. If `inputFormat` is left empty, it will be automatically calculated.',
                    exampleOut: '#4286f4',
                    exampleCode: '{color;[66,134,244];hex;RGB}'
                }
            },
            comment: {
                default: {
                    description: 'Does nothing. Your code is simply ignored.',
                    exampleOut: 'This is a sentence.',
                    exampleCode: 'This is a sentence. {//;This is a comment.}'
                }
            },
            decancer: {
                default: {
                    description: 'Returns the decancered version of `text`.',
                    exampleOut: 'haha im so edgy',
                    exampleCode: '{decancer;ḩ̸̪̓̍a̶̗̤̎́h̵͉͓͗̀ā̷̜̼̄ ̷̧̓í̴̯̎m̵͚̜̽ ̸̛̝ͅs̴͚̜̈o̴̦̗̊ ̷͎͋ȩ̵͐d̶͎̂̇g̴̲͓̀͝y̶̠̓̿}'
                }
            },
            escapeBBTag: {
                default: {
                    description: 'Returns `input` without resolving any BBTagThis effectively returns the characters `{`, `}` and `;` as is, without the use of `{rb}`, `{lb}` and `{semi}`.\n**NOTE:** Brackets inside code must come in pairs. A `{` has to be followed by a `}` somewhere and a `} has to have a {` before it',
                    exampleOut: '{set;~index;1}',
                    exampleCode: '{escapeBBTag;{set;~index;1}}'
                }
            },
            hash: {
                basic: {
                    description: 'Returns the numeric hash of `text`, based on the unicode value of each individual character. This results in seemingly randomly generated numbers that are constant for each specific query.\nNOTE: This hash isn\'t a particularly robust one, it is a quick implementation that was thrown together. To use a proper hash function, specify the `algorithm`',
                    exampleOut: 'The hash of brown is 94011702.',
                    exampleCode: 'The hash of brown is {hash;brown}.'
                },
                secure: {
                    description: [
                        {
                            name: 'default',
                            input: [{ methods: ['abc', 'def', 'ghi'] }],
                            expected: 'Performs a hash on the given `text`. If the `text` starts with `buffer:` then it will first be decoded as a base64 string. If it starts with `text:` then it will be treated as plaintext. The hash result will be returned as a hex number.\nSupported `algorithm`s are: `abc`, `def`, `ghi`'
                        }
                    ],
                    exampleOut: 'The hash of brown is 5eb67f9f8409b9c3f739735633cbdf92121393d0e13bd0f464b1b2a6a15ad2dc',
                    exampleCode: '{hash;sha256;brown}'
                }
            },
            htmlDecode: {
                default: {
                    description: 'Decodes html entities from `text`.',
                    exampleOut: '<hello, world>',
                    exampleCode: '{htmlDecode;&lt;hello, world&gt;}'
                }
            },
            htmlEncode: {
                default: {
                    description: 'Encodes `text` with escaped html entities.',
                    exampleOut: '&lt;hello, world&gt;',
                    exampleCode: '{htmlEncode;<hello, world>}'
                }
            },
            if: {
                description: [
                    {
                        name: 'default',
                        input: [{ operators: ['===', '!==', '>=', '>', '<=', '<'] }],
                        expected: 'If `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. If they are not provided, `value1` is read as `true` or `false`. If the resulting value is `true` then the tag returns `then`, otherwise it returns `else`.\nValid evaluators are `===`, `!==`, `>=`, `>`, `<=` and `<`.'
                    }
                ],
                value: {
                    description: 'If `boolean` is `true`, return `then`, else do nothing.',
                    exampleOut: 'This is a custom command!',
                    exampleCode: '{if;{isCustomCommand};This is a custom command!}'
                },
                valueElse: {
                    description: 'If `boolean` is `true`, return `then`, else execute `else`',
                    exampleOut: 'This isn\'t a custom command!',
                    exampleCode: '{if;{isCustomCommand};This is a custom command!;This isn\'t a custom command!}'
                },
                conditionThen: {
                    description: '`Value1` is evaluated against `value2` using `evaluator`, if the resulting value is `true` then the tag returns `then`.',
                    exampleOut: 'Hi stupid cat!',
                    exampleCode: '{if;{userId};==;103347843934212096;Hi stupid cat!}'
                },
                conditionElse: {
                    description: '`Value1` is evaluated against `value2` using `evaluator`, if the resulting value is `true` then the tag returns `then`, otherwise it returns `else`',
                    exampleOut: 'Who are you stranger?',
                    exampleCode: '{if;{userId};==;103347843934212096;Hi stupid cat!;Who are you stranger?}'
                }
            },
            indexOf: {
                default: {
                    description: 'Finds the index of `searchFor` in `text|array`, after `start`. `text|array` can either be plain text or an array. If it\'s not found, returns -1.',
                    exampleOut: 'The index of "o" in "hello world" is 4',
                    exampleCode: 'The index of "o" in "hello world" is {indexof;hello world;o}'
                }
            },
            lang: {
                default: {
                    description: 'Specifies which `language` should be used when viewing the raw of this tag',
                    exampleOut: 'This will be displayed with js!.',
                    exampleCode: 'This will be displayed with js! {lang;js}.'
                }
            },
            length: {
                default: {
                    description: 'Gives the amount of characters in `value`, or the number of elements if it is an array.',
                    exampleIn: 'Hello',
                    exampleOut: 'What you said is 5 chars long.',
                    exampleCode: 'What you said is {length;{args}} chars long.'
                }
            },
            logic: {
                default: {
                    description: [
                        {
                            name: 'default',
                            input: [{ operators: ['||', '&&', '^', '!'] }],
                            expected: 'Accepts 1 or more boolean `values` (`true` or `false`) and returns the result of `operator` on them. Valid logic operators are `||`, `&&`, `^` and `!`.See `{operators}` for a shorter way of performing logic operations.'
                        }
                    ],
                    exampleOut: 'false',
                    exampleCode: '{logic;&&;true;false}'
                }
            },
            lower: {
                default: {
                    description: 'Returns `text` as lowercase.',
                    exampleOut: 'this will become lowercase',
                    exampleCode: '{lower;THIS WILL BECOME LOWERCASE}'
                }
            },
            md5: {
                default: {
                    description: 'Converts the provided text to md5.',
                    exampleOut: '71d97a11f770a34d7f8cf1f1d8749d85',
                    exampleCode: '{md5;Woosh whap phew!}'
                }
            },
            newline: {
                default: {
                    description: 'Will be replaced by `count` newline characters (\\n).',
                    exampleOut: 'Hello,\nworld!',
                    exampleCode: 'Hello,{newline}world!'
                }
            },
            operator: {
                ['%']: {
                    description: 'Returns the remainder after dividing each pair of `value`s.',
                    exampleOut: '4 1 0',
                    exampleCode: '{%;24;5} {%;24;5;3} {%;19;5;4}'
                },
                ['*']: {
                    description: 'Returns the result from multiplying all the `value`s together',
                    exampleOut: '24',
                    exampleCode: '{*;1;2;3;4}'
                },
                ['+']: {
                    description: 'Returns the result from summing all the `values`s together',
                    exampleOut: '10',
                    exampleCode: '{+;1;2;3;4}'
                },
                ['-']: {
                    description: 'Returns the result from subtracting all the `value`s from the first',
                    exampleOut: '-2',
                    exampleCode: '{-;4;3;2;1}'
                },
                ['/']: {
                    description: 'Returns the result from dividing the first `value` by all the rest',
                    exampleOut: '5 2',
                    exampleCode: '{/;5} {/;120;5;4;3}'
                },
                ['^']: {
                    description: 'Returns the result of raising the first `value` to the power of all the rest',
                    exampleOut: '8 256',
                    exampleCode: '{^;2;3} {^;2;2;2;2}'
                },
                ['<']: {
                    description: 'Returns `true` if each `value` is less than the value after it, otherwise `false`',
                    exampleOut: 'false false false true',
                    exampleCode: '{<;a} {<;a;b;c;c} {<;1;2;3;4;2} {<;a;b;c;d}'
                },
                ['<=']: {
                    description: 'Returns `true` if each `value` is less than or equal to the value after it, otherwise `false`',
                    exampleOut: 'false true false true',
                    exampleCode: '{<=;a} {<=;a;b;c;c} {<;1;2;3;4;2} {<=;a;b;c;d}'
                },
                ['!=']: {
                    description: 'Returns `true` if all pairs of `value`s are not equal',
                    exampleOut: 'true true false',
                    exampleCode: '{!=;a;b;c} {!=;a;b;a} {!=;a;a;b}'
                },
                ['==']: {
                    description: 'Returns `true` if all `value`s are equal, otherwise `false`',
                    exampleOut: 'false false false true',
                    exampleCode: '{==;a;b;c} {==;a;b;a} {==;a;a;b} {==;a;a;a;a;a}'
                },
                ['>']: {
                    description: 'Returns `true` if each `value` is greater than the value after it, otherwise `false`',
                    exampleOut: 'false false false true',
                    exampleCode: '{>;a} {>;c;c;b;a} {>;2;4;3;2;1} {>;d;c;b;a}'
                },
                ['>=']: {
                    description: 'Returns `true` if each `value` is greater than or equal to the value after it, otherwise `false`',
                    exampleOut: 'false true false true',
                    exampleCode: '{>=;a} {>=;c;c;b;a} {>=;2;4;3;2;1} {>=;d;c;b;a}'
                },
                ['!']: {
                    description: 'Inverts a boolean `value`. All values after the first one are ignored.',
                    exampleOut: 'false true',
                    exampleCode: '{!;true} {!;false}'
                },
                ['&&']: {
                    description: 'Returns `true` if all of the `value`s are `true`, otherwise `false`',
                    exampleOut: 'true false',
                    exampleCode: '{&&;true;true} {&&;true;false;true}'
                },
                ['||']: {
                    description: 'Returns `true` if any of the `value`s are `true`, otherwise `false`',
                    exampleOut: 'false true',
                    exampleCode: '{||;false;false} {||;true;false;true}'
                },
                ['xor']: {
                    description: 'Returns `true` if exactly 1 of the `value`s are `true`, otherwise `false`',
                    exampleOut: 'false false true',
                    exampleCode: '{^;false;false} {^;true;false;true} {^;false;true;false}'
                },
                ['contains']: {
                    description: 'Returns `true` if the first `value` contains all the rest. If the first `value` is an array then the array must contain all the remaining values.',
                    exampleOut: 'true false',
                    exampleCode: '{contains;abcdefghi;abc} {contains;["abc","def","ghi"];","}'
                },
                ['includes']: {
                    description: 'Returns `true` if the first `value` contains all the rest. If the first `value` is an array then the array must contain all the remaining values.',
                    exampleOut: 'true false',
                    exampleCode: '{includes;abcdefghi;abc} {includes;["abc","def","ghi"];","}'
                },
                ['endswith']: {
                    description: 'Returns `true` if the first `value` ends with all the rest. If the first `value` is an array then the last element must equal all the remaining values.',
                    exampleOut: 'true false',
                    exampleCode: '{endswith;abcdefghi;ghi;hi} {endswith;["abc","def","ghi"];"]}'
                },
                ['startswith']: {
                    description: 'Returns `true` if the first `value` starts with all the rest. If the first `value` is an array then the first element must equal all the remaining values.',
                    exampleOut: 'true false',
                    exampleCode: '{startswith;abcdefghi;a;abcd;abc} {startswith;["abc","def","ghi"];["}'
                },
                ['??']: {
                    description: 'Returns the first non-empty value given.',
                    exampleOut: 'abc def',
                    exampleCode: '{??;abc;;123} {??;;;;\n;def;aaaa}'
                }
            },
            pad: {
                default: {
                    description: 'Places `text` on top of `back` with it being aligned to the opposite of `direction`. If `text` is longer than `back` then it will simply overlap',
                    exampleOut: '000ABC',
                    exampleCode: '{pad;left;000000;ABC}'
                }
            },
            randomChoose: {
                array: {
                    description: 'Picks one random entry from `choiceArray`.',
                    exampleOut: 'I feel like eating pie today',
                    exampleCode: 'I feel like eating {randomChoose;["pie", "cake", "pudding"]} today'
                },
                args: {
                    description: 'Picks one random entry from `choices`',
                    exampleOut: 'I feel like eating pudding today.',
                    exampleCode: 'I feel like eating {randomChoose;cake;pie;pudding} today'
                }
            },
            randomString: {
                default: {
                    description: 'Creates a random string with characters from `chars` that is `length` characters long.',
                    exampleOut: 'kgzyqcvda',
                    exampleCode: '{randomString;abcdefghijklmnopqrstuvwxyz;9}'
                }
            },
            realPad: {
                default: {
                    description: 'Pads `text` using space until it has `length` characters. Spaces are added on the right side.',
                    exampleOut: 'Hello      world!',
                    exampleCode: '{realPad;Hello;10} world!'
                },
                withDirection: {
                    description: 'Pads `text` using `filler` until it has `length` characters. `filler` is applied to the  `direction` of `text`.',
                    exampleOut: '000ABC',
                    exampleCode: '{realPad;ABC;6;0;left}'
                }
            },
            regexMatch: {
                default: {
                    description: 'Returns an array of everything in `text` that matches `regex`. Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. `regex` will only succeed to compile if it is deemed a safe regular expression (safe regexes do not run in exponential time for any input)',
                    exampleOut: '["1", "25"]',
                    exampleCode: '{regexMatch;I have $1 and 25 cents;/\\d+/g}'
                }
            },
            regexReplace: {
                description: 'Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. `regex` will only succeed to compile if it is deemed a safe regular expression (safe regexes do not run in exponential time for any input)',
                output: {
                    description: 'Replaces the `regex` phrase with `replaceWith`. This is executed on the output of the containing tag.',
                    exampleOut: 'I like to eat pie.',
                    exampleCode: 'I like to eat cheese. {regexReplace;/cheese/;pie}'
                },
                text: {
                    description: 'Replace the `regex` phrase with `replaceWith`. This is executed on `text`.',
                    exampleOut: 'I likn ta cansumn chnnsn.',
                    exampleCode: 'I like {regexReplace;to consume;/o/gi;a} cheese. {regexReplace;/e/gi;n}'
                }
            },
            regexSplit: {
                default: {
                    description: 'Splits the given text using the given `regex` as the split rule. Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. `regex` will only succeed to compile if it is deemed a safe regular expression (safe regexes do not run in exponential time for any input)',
                    exampleOut: '["Hello","there","I","am","hungry"]',
                    exampleCode: '{regexSplit;Hello      there, I       am hungry;/[\\s,]+/}'
                }
            },
            regexTest: {
                default: {
                    description: 'Tests if the `regex` phrase matches the `text`, and returns a boolean (true/false). Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. `regex` will only succeed to compile if it is deemed a safe regular expression (safe regexes do not run in exponential time for any input)',
                    exampleOut: 'true false',
                    exampleCode: '{regexTest;apple;/p+/i} {regexTest;banana;/p+/i}'
                }
            },
            replace: {
                output: {
                    description: 'Replaces the first occurrence of `phrase` with `replaceWith`. This is executed on the output from the containing tag.',
                    exampleOut: 'Bye world!',
                    exampleCode: 'Hello world! {replace;Hello;Bye}'
                },
                text: {
                    description: 'Replaces the first occurrence of `phrase` in `text` with `replaceWith`.',
                    exampleOut: 'I like to nom ham. ham',
                    exampleCode: 'I like {replace;to eat;eat;nom} cheese. {replace;cheese;ham}'
                }
            },
            reverse: {
                default: {
                    description: 'Reverses the order of `text`. If `text` is an array, the array will be reversed. If `{get}` is used with an array, this will modify the original array.',
                    exampleOut: 'emordnilap',
                    exampleCode: '{reverse;palindrome}'
                }
            },
            space: {
                default: {
                    description: 'Will be replaced by `count` spaces. If `count` is less than `0`, no spaces will be returned.',
                    exampleOut: 'Hello,    world!',
                    exampleCode: 'Hello,{space;4}world!'
                }
            },
            substring: {
                default: {
                    description: 'Returns all text from `text` between the `start` and `end`. `end` defaults to the length of text.',
                    exampleOut: 'Hello r!',
                    exampleCode: 'Hello {substring;world;2;3}!'
                }
            },
            switch: {
                default: {
                    description: 'Compares `value` against each `case` and executes the first `then` that matches. If no matches are found, `default` is executed. Each `case` can optionally be an array to allow matching against multiple values.',
                    exampleIn: 'hit Danny',
                    exampleOut: 'Got it, i\'ll hit Danny for you!',
                    exampleCode: '{switch;{args;0};\n  hi;Hello!;\n  ["punch","bop","hit"];Got it, i\'ll hit {args;1} for you!;\n  I don\'t know how to do that!\n}'
                }
            },
            time: {
                description: 'If you provide `time`, you should also provide `parseFormat` to ensure it is being interpreted correctly.\nSee the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more format information.\nSee [here](http://momentjs.com/docs/#/parsing/) for parsing documentation. See [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) for a list of timezone codes.',
                default: {
                    description: '`time` is in `fromTimezone` and converted to `toTimezone` using `format`.',
                    exampleOut: 'Time Berlin (as toTimezone): 23:33\nBerlin from UTC 12:00: 13:00\nBerlin (as fromTimezone): 23:33\nBerlin (as fromTimezone and empty toTimezone): 21:33\nNew York from Berlin (12:00 in Berlin): 06:00',
                    exampleCode: 'Berlin (as toTimezone): {time;HH:mm;;;;Europe/Berlin}\nBerlin from UTC 12:00: {time;HH:mm;12:00;HH:mm;;Europe/Berlin}\nBerlin (as fromTimezone): {time;HH:mm;;;Europe/Berlin}\nBerlin (as fromTimezone and empty toTimezone): {time;HH:mm;;;Europe/Berlin;}\nNew York from Berlin (12:00 in Berlin): {time;HH:mm;12:00;HH:mm;Europe/Berlin;America/New_York}'
                }
            },
            trim: {
                default: {
                    description: 'Trims whitespace and newlines before and after `text`.',
                    exampleOut: 'Hello beautiful World',
                    exampleCode: 'Hello {trim;{space;10}beautiful{space;10}} World'
                }
            },
            unindent: {
                default: {
                    description: 'Unindents text (or code!). If no level is provided, attempts to guess the indentation level past the first line.',
                    exampleOut: '```\nhello\nworld\n```',
                    exampleCode: '```\n{unindent;\n  hello\n  world\n}\n```'
                }
            },
            upper: {
                default: {
                    description: 'Returns `text` as uppercase.',
                    exampleOut: 'THIS WILL BECOME UPPERCASE',
                    exampleCode: '{upper;this will become uppercase}'
                }
            },
            uriDecode: {
                default: {
                    description: 'Decodes `text` from URI format.',
                    exampleOut: 'Hello world!',
                    exampleCode: '{uriDecode;Hello%20world}'
                }
            },
            uriEncode: {
                default: {
                    description: 'Encodes `text` in URI format. Useful for constructing links.',
                    exampleOut: 'Hello%20world!',
                    exampleCode: '{uriEncode;Hello world!}'
                }
            },
            void: {
                default: {
                    description: 'Executes `code` but does not return the output from it. Useful for silent functionality',
                    exampleOut: '',
                    exampleCode: '{void;This won\'t be output!}'
                }
            },
            roleAdd: {
                description: '`role` can be either a roleId or role mention.',
                target: {
                    description: 'Gives the executing user `role`. Returns `true` if role was given, else an error will be shown.',
                    exampleOut: 'Have a role! true',
                    exampleCode: 'Have a role! {roleAdd;11111111111111111}'
                },
                other: {
                    description: 'Gives `user` the chosen `role`. Returns `true` if role was given, else an error will be shown. If `quiet` is specified, if a user can\'t be found it will simply return `false`',
                    exampleOut: 'Stupid cat have a role! true',
                    exampleCode: 'Stupid cat have a role! {roleAdd;Bot;Stupid cat}'
                }
            },
            roleColor: {
                default: {
                    description: 'Returns `role`\'s hex color code. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleOut: 'The admin role id is: #1b1b1b.',
                    exampleCode: 'The admin role color is: #{roleColor;admin}.'
                }
            },
            roleCreate: {
                default: {
                    description: '`color` can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number. Provide `permissions` as a number, which can be calculated [here](https://discordapi.com/permissions.html) `hoisted` is if the role should be displayed separately from other roles.\nReturns the new role\'s id.',
                    exampleOut: '1298731238361728931',
                    exampleCode: '{roleCreate;myNewRole;red}'
                }
            },
            roleDelete: {
                default: {
                    description: 'Deletes `role`. If `quiet` is specified, if `role` can\'t be found it will return nothing.\nWarning: this subtag is able to delete roles managed by integrations.',
                    exampleOut: '(rip no more super cool roles for anyone)',
                    exampleCode: '{roleDelete;Super Cool Role!}'
                }
            },
            roleId: {
                default: {
                    description: 'Returns `role`\'s id. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleOut: 'The admin role id is: 123456789123456.',
                    exampleCode: 'The admin role id is: {roleId;admin}.'
                }
            },
            roleMembers: {
                default: {
                    description: 'Returns an array of members in `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleOut: 'The admins are: ["11111111111111111","22222222222222222"].',
                    exampleCode: 'The admins are: {roleMembers;Admin}.'
                }
            },
            roleMention: {
                default: {
                    description: 'Returns a mention of `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleOut: 'The admin role will be mentioned: @Administrator',
                    exampleCode: 'The admin role will be mentioned: {roleMention;Admin}'
                }
            },
            roleName: {
                default: {
                    description: 'Returns `role`\'s name. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleOut: 'The admin role name is: Administrator.',
                    exampleCode: 'The admin role name is: {roleName;admin}.'
                }
            },
            rolePermissions: {
                default: {
                    description: 'Returns `role`\'s permission number. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleOut: 'The admin role\'s permissions are: 8.',
                    exampleCode: 'The admin role\'s permissions are: {rolePermissions;admin}.'
                }
            },
            rolePosition: {
                default: {
                    description: 'Returns the position of `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.\n**Note**: the highest role will have the highest position, and the lowest role will have the lowest position and therefore return `0` (`@everyone`).',
                    exampleOut: 'The position of Mayor is 10',
                    exampleCode: 'The position of Mayor is {rolePosition;Mayor}'
                }
            },
            roleRemove: {
                description: '`role` can be either a roleId or role mention.',
                target: {
                    description: 'Removes `role` from the executing user. Returns `true` if role was removed, else an error will be shown.',
                    exampleOut: 'No more role! true',
                    exampleCode: 'No more role! {roleRemove;11111111111111111}'
                },
                other: {
                    description: 'Remove the chosen `role` from  `user`. Returns `true` if role was removed, else an error will be shown. If `quiet` is specified, if a user can\'t be found it will simply return `false`',
                    exampleOut: 'Stupid cat no more role! true',
                    exampleCode: 'Stupid cat no more role! {roleRemove;Bot;Stupid cat}'
                }
            },
            roles: {
                guild: {
                    description: 'Returns an array of roles on the current guild.',
                    exampleOut: 'The roles on this guild are: ["11111111111111111","22222222222222222"].',
                    exampleCode: 'The roles on this guild are: {roles}.'
                },
                user: {
                    description: 'Returns `user`\'s roles in the current guild. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Stupid cat has the roles: ["11111111111111111","22222222222222222"]',
                    exampleCode: 'Stupid cat has the roles: {roles;Stupid cat}'
                }
            },
            roleSetColor: {
                clear: {
                    description: 'Sets the color of `role` to \'#000000\'. This is transparent.',
                    exampleOut: 'The admin role is now colourless.',
                    exampleCode: 'The admin role is now colourless. {roleSetColor;admin}'
                },
                set: {
                    description: 'Sets the `color` of `role`.If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleOut: 'The admin role is now white.',
                    exampleCode: 'The admin role is now white. {roleSetColor;admin;white}'
                }
            },
            roleSetMentionable: {
                enable: {
                    description: 'Set `role` to mentionable.',
                    exampleOut: 'The admin role is now mentionable.',
                    exampleCode: 'The admin role is now mentionable. {roleSetMentionable;admin}'
                },
                set: {
                    description: 'Sets whether `role` can be mentioned. `value` can be either `true` to set the role as mentionable, or anything else to set it to unmentionable. If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleOut: 'The admin role is no longer mentionable.',
                    exampleCode: 'The admin role is no longer mentionable. {roleSetMentionable;admin;false}'
                }
            },
            roleSetName: {
                default: {
                    description: 'Sets the name of `role`.If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleOut: 'The admin role is now called administrator.',
                    exampleCode: 'The admin role is now called administrator. {roleSetName;admin;administrator}'
                }
            },
            roleSetPermissions: {
                clear: {
                    description: 'Removes all perms from `role`',
                    exampleOut: '(perms have been changed)',
                    exampleCode: '{roleSetPermissions;Support}'
                },
                set: {
                    description: 'Sets the permissions of `role` with the provided `permissions` number. This will not apply any permissions the authorizer can\'t grant. Additionally, this will completely overwrite the role\'s existing permissions. If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleOut: 'The admin role now has the administrator permission.',
                    exampleCode: 'The admin role now has the administrator permission. {roleSetPermissions;admin;8}'
                }
            },
            roleSetPosition: {
                default: {
                    description: 'Sets the position of `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleOut: 'The admin role is now at position 3.',
                    exampleCode: 'The admin role is now at position 3. {roleSetPosition;admin;3}'
                }
            },
            roleSize: {
                default: {
                    description: 'Returns the amount of people in role `role`',
                    exampleOut: 'There are 5 people in the role!',
                    exampleCode: 'There are {roleSize;11111111111111111} people in the role!'
                }
            },
            argsArray: {
                default: {
                    description: 'Gets user input as an array.',
                    exampleIn: 'Hello world!',
                    exampleOut: 'Your input was ["Hello","world!"]',
                    exampleCode: 'Your input was {argsArray}'
                }
            },
            argsLength: {
                default: {
                    description: 'Return the number of arguments the user provided.',
                    exampleIn: 'I am saying things.',
                    exampleOut: 'You said 4 words.',
                    exampleCode: 'You said {argsLength} words.'
                }
            },
            isCustomCommand: {
                default: {
                    description: 'Checks if the tag is being run from within a cc. Returns a boolean (`true` or `false`)',
                    exampleOut: 'Boo, this only works in cc\'s',
                    exampleCode: '{if;{isCustomCommand};{dm;{userId};You have mail!};Boo, this only works in cc\'s}'
                }
            },
            lb: {
                description: 'Will be replaced by `{` on execution.',
                default: {
                    description: 'Returns `{`',
                    exampleOut: 'This is a bracket! {',
                    exampleCode: 'This is a bracket! {lb}'
                }
            },
            rb: {
                default: {
                    description: 'Returns `}`',
                    exampleOut: 'This is a bracket! }',
                    exampleCode: 'This is a bracket! {rb}'
                }
            },
            semi: {
                default: {
                    description: 'Returns `;`',
                    exampleOut: 'This is a semicolon! ;',
                    exampleCode: 'This is a semicolon! {semi}'
                }
            },
            tagAuthor: {
                default: {
                    description: 'Returns the user id of the tag/cc author',
                    exampleOut: 'This tag was created by stupid cat',
                    exampleCode: 'This tag was created by {username;{tagAuthor}}'
                }
            },
            tagAuthorizer: {
                default: {
                    description: 'Returns the user id of the tag/cc authorizer',
                    exampleOut: 'stupid cat authorized this tag!',
                    exampleCode: '{username;{tagAuthorizer}} authorized this tag!'
                }
            },
            zws: {
                default: {
                    description: 'Returns a single zero width space (unicode 200B)',
                    exampleOut: '​',
                    exampleCode: '{zws}'
                }
            },
            ban: {
                description: '`daysToDelete` is the number of days to delete messages for. `duration`',
                default: {
                    description: 'Bans `user`. If the ban is successful `true` will be returned, else it will return an error.',
                    exampleOut: 'true',
                    exampleCode: '{ban;Stupid cat;4}'
                },
                withReason: {
                    description: 'Bans `user` for duration `timeToUnban` with `reason`.',
                    exampleOut: 'true (stupid cat will be unbanned after 30d)',
                    exampleCode: '{ban;Stupid cat;;Not clicking enough kittens;30d}'
                },
                noPerms: {
                    description: 'Bans `user` for duration `timeToUnban` with `reason`. If `noPerms` is provided and not an empty string, do not check if the command executor is actually able to ban people.Only provide this if you know what you\'re doing.',
                    exampleOut: 'true (anyone can use this cc regardless of perms)',
                    exampleCode: '{ban;Stupid cat;;For being stupid;;anythingcangohere}'
                }
            },
            dm: {
                text: {
                    description: 'DMs `user` the given `message`. You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.',
                    exampleOut: 'DM: Hello\nEmbed: You\'re cool',
                    exampleCode: '{dm;stupid cat;Hello;{embedBuild;title:You\'re cool}}'
                },
                embed: {
                    description: 'DMs `user` the given `embed`. You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.\nPlease note that `embed` is the JSON for an embed object, don\'t put the `{embed}` subtag there, as nothing will show.',
                    exampleOut: 'DM: Hello\nEmbed: You\'re cool',
                    exampleCode: '{dm;stupid cat;Hello;{embedBuild;title:You\'re cool}}'
                },
                full: {
                    description: 'DMs `user` the given `message` and `embed`. You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.\nPlease note that `embed` is the JSON for an embed object, don\'t put the `{embed}` subtag there, as nothing will show.',
                    exampleOut: 'DM: Hello\nEmbed: You\'re cool',
                    exampleCode: '{dm;stupid cat;Hello;{embedBuild;title:You\'re cool}}'
                }
            },
            isStaff: {
                target: {
                    description: 'Checks if the tag author is staff',
                    exampleOut: 'The author is a staff member!',
                    exampleCode: '{if;{isStaff};The author is a staff member!;The author is not a staff member :(}'
                },
                user: {
                    description: 'Checks if `user` is a member of staff. If the `user` cannot be found `false` will be returned.',
                    exampleOut: 'You are not a staff member :(',
                    exampleCode: '{if;{isStaff;{userId}};You are a staff member!;You are not a staff member :(}'
                }
            },
            isUserBoosting: {
                target: {
                    description: 'Returns `true` if the executing user is boosting the guild and `false` if not.',
                    exampleOut: 'You should consider boosting',
                    exampleCode: '{if;{isUserBoosting};Yes you are boosting;You should consider boosting}'
                },
                user: {
                    description: 'Returns `true` if the `user` is boosting the guild and `false` if not. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'stupid cat is boosting!',
                    exampleCode: '{if;{isUserBoosting;stupid cat};stupid cat is boosting!; no boosting here :(}'
                }
            },
            kick: {
                description: 'If the kick is successful, `Success` will be returned, otherwise the error will be given. ',
                default: {
                    description: 'Kicks `user`.',
                    exampleOut: 'Success @stupid cat was kicked!',
                    exampleCode: '{kick;stupid cat} @stupid cat was kicked!'
                },
                withReason: {
                    description: 'Kicks `user`. If `noPerms` is provided and not an empty string, do not check if the command executor is actually able to kick people. Only provide this if you know what you\'re doing.',
                    exampleOut: 'Success @stupid cat was kicked, because I can!',
                    exampleCode: '{kick;stupid cat;because I can} @stupid cat was kicked!'
                }
            },
            pardon: {
                description: '`user` defaults to the executing user. Returns the new warning count',
                default: {
                    description: 'Gives `user` one pardon.',
                    exampleOut: 'Be pardoned! 0',
                    exampleCode: 'Be pardoned! {pardon}'
                },
                withReason: {
                    description: 'Gives `user` `count` pardons with `reason`.',
                    exampleOut: 'Be pardoned 9001 times, Stupid cat! 0',
                    exampleCode: 'Be pardoned 9001 times, Stupid cat! {pardon;Stupid cat;9001}'
                }
            },
            randomUser: {
                default: {
                    description: 'Returns the id of a random user on the current guild.',
                    exampleOut: 'abalabahaha is a lovely person! stupid cat isn\'t as good.',
                    exampleCode: '{username;{randomUser}} is a lovely person! {username;{randomUser}} isn\'t as good.'
                }
            },
            timeout: {
                description: 'If the timeout is successful, `Success` will be returned, otherwise the error will be given. ',
                default: {
                    description: 'Times out `user` for the specified amount of time. Maximum is 28 days.',
                    exampleOut: 'Success @stupid cat was timed out for 1 day!',
                    exampleCode: '{timeout;stupid cat;1d} @stupid cat was timed out for 1 day!'
                },
                withReason: {
                    description: 'Times out `user` for the specified amount of time. Maximum is 28 days.If `noPerms` is provided and not an empty string, do not check if the command executor is actually able to time out people. Only provide this if you know what you\'re doing.',
                    exampleOut: 'Success @stupid cat was timed out for 1 day, because I can!',
                    exampleCode: '{timeout;stupid cat;1d;because I can} @stupid cat was timed out for 1 day!'
                }
            },
            unban: {
                default: {
                    description: 'Unbans `user`.',
                    exampleOut: '@user was unbanned!',
                    exampleCode: '{unban;@user} @user was unbanned!'
                },
                withReason: {
                    description: 'Unbans `user` with the given `reason`.If `noPerms` is provided and not an empty string, do not check if the command executor is actually able to ban people. Only provide this if you know what you\'re doing.',
                    exampleOut: 'true @stupid cat has been unbanned',
                    exampleCode: '{unban;@stupid cat;I made a mistake} @stupid cat has been unbanned'
                }
            },
            userActivity: {
                description: 'If no game is being played, this will return \'nothing\'',
                target: {
                    description: 'Returns the name of the activity the executing user is currently doing. ',
                    exampleOut: 'You are listening to bad music',
                    exampleCode: 'You are listening to {userActivity}'
                },
                user: {
                    description: 'Returns the name of the activity `user` is currently doing. If `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Stupid cat is playing nothing',
                    exampleCode: 'Stupid cat is playing {userActivity;Stupid cat}'
                }
            },
            userActivityType: {
                description: [
                    {
                        name: 'default',
                        input: [{ types: ['abc', 'def', 'ghi'] }],
                        expected: 'Activity types can be any of `abc`, `def` or `ghi`'
                    }
                ],
                target: {
                    description: 'Returns the type of activity the executing user is currently doing (playing, streaming).',
                    exampleOut: 'You are streaming right now!',
                    exampleCode: 'You are {userActivityType} right now!'
                },
                user: {
                    description: 'Returns the activity type `user` is currently doing. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Stupid cat is streaming cats',
                    exampleCode: 'Stupid cat is {userActivityType;Stupid cat} cats'
                }
            },
            userAvatar: {
                description: 'If no game is being played, this will return \'nothing\'',
                target: {
                    description: 'Returns the avatar of the executing user.',
                    exampleOut: 'Your avatar is (avatar url)',
                    exampleCode: 'Your avatar is {userAvatar}'
                },
                user: {
                    description: 'Returns the avatar of `user`. If `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Stupid cat\'s avatar is (avatar url)',
                    exampleCode: 'Stupid cat\'s avatar is {userAvatar;Stupid cat}'
                }
            },
            userBoostDate: {
                description: 'See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information about formats. If user is not boosting the guild, returns `User not boosting`',
                target: {
                    description: 'Returns the date that the executing user started boosting the guild using `format` for the output, in UTC+0.',
                    exampleOut: 'Your account started boosting this guild on 2020/02/27 00:00:00',
                    exampleCode: 'Your account started boosting this guild on {userBoostDate;YYYY/MM/DD HH:mm:ss}'
                },
                user: {
                    description: 'Returns the date that `user` started boosting the current guild using `format` for the output, in UTC+0. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Stupid cat started boosting this guild on 2020/02/27 00:00:00',
                    exampleCode: 'Stupid cat started boosting this guild on {userBoostDate;YYYY/MM/DD HH:mm:ss;stupid cat}'
                }
            },
            userCreatedAt: {
                target: {
                    description: 'Returns the account creation date of the executing user in `format`.',
                    exampleOut: 'Your account was created on 2017-02-06T18:58:10+00:00',
                    exampleCode: 'Your account was created on {userCreatedAt}'
                },
                user: {
                    description: 'Returns the account creation date of `user` in `format`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Stupid cat\'s account was created on 2015-10-13T04:27:26Z',
                    exampleCode: 'Stupid cat\'s account was created on {userCreatedAt;;Stupid cat}'
                }
            },
            userDiscriminator: {
                description: 'If no game is being played, this will return \'nothing\'',
                target: {
                    description: 'Returns the discriminator of the executing user.',
                    exampleOut: 'Your discriminator is 1234',
                    exampleCode: 'Your discriminator is {userDiscriminator}'
                },
                user: {
                    description: 'Returns `user`\'s discriminator. If `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Stupid cat\'s discriminator is 8160',
                    exampleCode: 'Stupid cat\'s discriminator is {userDiscriminator;Stupid cat}'
                }
            },
            userHasRole: {
                description: 'This subtag checks if a user has *any* of the provided `roleIds`. Use `{userHasRoles}` to check if a user has *all* of the provided `roleIds`. `roleIds` can be an array of role ids, or a single role id. For a list of roles and their corresponding ids, use `b!roles`\nReturns a boolean.',
                target: {
                    description: 'Checks if the executing user has *any* of the provided `roleIds`.',
                    exampleOut: 'You are a moderator',
                    exampleCode: '{if;{userHasRole;{roleId;moderator}};You are a moderator; You are not a moderator}'
                },
                user: {
                    description: 'Checks if `user` has *any* of the provided `roleIds`. If `quiet` is specified, if `user` or any `roleId` can\'t be found it will simply return `false`.',
                    exampleOut: 'Stupid cat is a moderator',
                    exampleCode: '{if;{userHasRole;{userId;moderator};Stupid cat};Stupid cat is a moderator;Stupid cat is not a moderator}'
                }
            },
            userHasRoles: {
                description: 'This subtag checks if a user has *all* of the provided `roleIds`. Use `{userHasRole}` to check if a user has *any* of the provided `roleIds`. `roleIds` can be an array of role ids, or a single role id. For a list of roles and their corresponding ids, use `b!roles`\nReturns a boolean.',
                target: {
                    description: 'Checks if the executing user has *all* of the provided `roleIds`.',
                    exampleOut: 'You are not a moderator and admin',
                    exampleCode: '{if;{userHasRoles;["{roleId;moderator}","{roleId;admin}"];You are a moderator and admin; You are not a moderator and admin}'
                },
                user: {
                    description: 'Checks if `user` has *all* of the provided `roleIds`. If `quiet` is specified, if `user` or any `roleId` can\'t be found it will simply return `false`.',
                    exampleOut: 'Stupid cat is a moderator and admin',
                    exampleCode: '{if;{userHasRoles;["{roleId;moderator}","{roleId;admin}"];Stupid cat};Stupid cat is a moderator and admin;Stupid cat is not a moderator and admin}'
                }
            },
            userId: {
                target: {
                    description: 'Returns the user id of the executing user.',
                    exampleOut: 'Your id is 123456789123456',
                    exampleCode: 'Your id is {userId}'
                },
                user: {
                    description: 'Returns `user`\'s id. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'This is Stupid cat\'s user id 103347843934212096',
                    exampleCode: 'This is Stupid cat\'s user id {userId;Stupid cat}'
                }
            },
            userIsBot: {
                target: {
                    description: 'Returns whether the executing user is a bot.',
                    exampleOut: 'Are you a bot? false',
                    exampleCode: 'Are you a bot? {userIsBot}'
                },
                user: {
                    description: 'Returns whether a `user` is a bot. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Is Stupid cat a bot? false',
                    exampleCode: 'Is Stupid cat a bot? {userIsBot;Stupid cat}'
                }
            },
            userJoinedAt: {
                description: 'For a list of formats see the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information.',
                target: {
                    description: 'Returns the date that the executing user joined the guild, using `format` for the output, in UTC+0.\n',
                    exampleOut: 'Your account joined this guild on 2016/01/01 01:00:00.',
                    exampleCode: 'Your account joined this guild on {userJoinedAt;YYYY/MM/DD HH:mm:ss}'
                },
                user: {
                    description: 'Returns the date that `user` joined the current guild using `format` for the output, in UTC+0. if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Stupid cat joined this guild on 2016/06/19 23:30:30',
                    exampleCode: 'Stupid cat joined this guild on {userJoinedAt;YYYY/MM/DD HH:mm:ss;Stupid cat}'
                }
            },
            userMention: {
                target: {
                    description: 'Mentions the executing user.',
                    exampleOut: 'Hello, @user!',
                    exampleCode: 'Hello, {userMention}!'
                },
                user: {
                    description: 'Mentions `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Hello, @Stupid cat!',
                    exampleCode: 'Hello, {userMention;stupid cat}!'
                }
            },
            userName: {
                target: {
                    description: 'Returns the username of the executing user.',
                    exampleOut: 'Your username is Cool Dude 1337!',
                    exampleCode: 'Your username is {userName}!'
                },
                user: {
                    description: 'Returns `user`\'s username. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Stupid cat\'s username is Stupid cat!',
                    exampleCode: 'Stupid cat\'s username is {userName;Stupid cat}!'
                }
            },
            userNickname: {
                target: {
                    description: 'Returns the nickname of the executing user.',
                    exampleOut: 'Your nick is Cool Dude 1337!',
                    exampleCode: 'Your nick is {userNickname}!'
                },
                user: {
                    description: 'Returns `user`\'s nickname. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Stupid cat\'s nickname is Secretly Awoken',
                    exampleCode: 'Stupid cat\'s nickname is {userNickname;Stupid cat}!'
                }
            },
            userRoles: {
                target: {
                    description: 'Returns the roles of the executing user.',
                    exampleOut: 'Your roles are ["1111111111111111","2222222222222222"]!',
                    exampleCode: 'Your roles are {userRoles}!'
                },
                user: {
                    description: 'Returns `user`\'s roles as an array. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Stupid cat\'s roles are ["1111111111111111","2222222222222222", "3333333333333333"]',
                    exampleCode: 'Stupid cat\'s roles are {userRoles;stupid cat}'
                }
            },
            userSetNickname: {
                default: {
                    description: 'Sets `user`\'s nickname to `nick`. Leave `nick` blank to reset their nickname.',
                    exampleOut: '',
                    exampleCode: '{userSetNickname;super cool nickname}\n{//;Reset the the nickname}\n{userSetNickname;}'
                }
            },
            userSetRoles: {
                description: '`roleArray` must be an array formatted like `["role1", "role2"]`',
                target: {
                    description: 'Sets the roles of the current user to `roleArray`.',
                    exampleOut: 'true',
                    exampleCode: '{userSetRoles;["1111111111111"]}'
                },
                user: {
                    description: 'Sets the roles of `user` to `roleArray`. If quiet is provided, all errors will return `false`.',
                    exampleOut: 'true',
                    exampleCode: '{userSetRoles;["1111111111111"];stupid cat}'
                }
            },
            userStatus: {
                description: 'Returned status can be one of `online`, `idle`, `dnd` or `offline`',
                target: {
                    description: 'Returns the status of the user.',
                    exampleOut: 'You are currently online',
                    exampleCode: 'You are currently {userStatus}'
                },
                user: {
                    description: 'Returns the status of `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'Stupid cat is currently online',
                    exampleCode: 'Stupid cat is currently {userStatus;stupid cat}'
                }
            },
            userTimeout: {
                description: 'See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information about formats. If user has never been timed out in the guild, returns `User not timed out`',
                target: {
                    description: 'Returns the executing user\'s timeout date using `format` for the output, in UTC+0.',
                    exampleOut: 'You have been timed out until 2021/01/01 00:00:00',
                    exampleCode: 'You have been timed out until {userTimeout;YYYY/MM/DD HH:mm:ss}'
                },
                user: {
                    description: 'Returns a `user`\'s timeout date using `format` for the output, in UTC+0. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleOut: 'stupid cat is timed out until 2021/01/01 00:00:00',
                    exampleCode: 'stupid cat is timed out until {userTimeout;YYYY/MM/DD HH:mm:ss;stupid cat}'
                }
            },
            userTimeZone: {
                target: {
                    description: 'Returns the set timezone of the user executing the containing tag.',
                    exampleOut: 'UTC',
                    exampleCode: '{userTimeZone}'
                },
                user: {
                    description: 'Returns the set timezone code of the specified `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.If the user has no set timezone, the output will be UTC.',
                    exampleOut: 'Discord official\'s timezone is Europe/Berlin',
                    exampleCode: 'Discord official\'s timezone is {userTimeZone;Discord official}'
                }
            },
            warn: {
                description: '`user` defaults to the executing user.',
                default: {
                    description: 'Gives `user` one warning. This will return the amount of warnings `user` has after executing.',
                    exampleOut: 'Be warned! 1',
                    exampleCode: 'Be warned! {warn}'
                },
                withReason: {
                    description: 'Gives `user` `count` warnings.',
                    exampleOut: 'Be warned Stupid cat! 9001',
                    exampleCode: 'Be warned Stupid cat! {warn;Stupid cat;9001;For being too cool}'
                }
            },
            warnings: {
                default: {
                    description: 'Gets the number of warnings `user` has. `user` defaults to the user who executed the containing tag.',
                    exampleOut: 'You have 0 warning(s)!',
                    exampleCode: 'You have {warnings} warning(s)!'
                }
            }
        }
    });
});
