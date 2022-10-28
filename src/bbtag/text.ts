import { FormatString, IFormattable } from '@blargbot/formatting';

import { Subtag } from './Subtag';

export const templates = FormatString.defineTree('bbtag', t => ({
    debug: {
        summary: t<{ active: number; committed: number; database: number; total: number; }>()(`\`\`\`js
         Execution Time: {active#duration(MS)}ms
    Variables Committed: {committed}
Database Execution Time: {database#duration(MS)}ms
   Total Execution Time: {total#duration(MS)}ms
\`\`\``)
    },
    limits: {
        rules: {
            useCount: {
                default: t<{ count: number; }>()('Maximum {count} uses'),
                requests: t<{ count: number; }>()('Maximum {count} requests'),
                loops: t<{ count: number; }>()('Maximum {count} loops')
            },
            staffOnly: {
                default: t('Authorizer must be staff')
            },
            disabled: {
                default: t<{ subtagName: string; }>()('\\{{subtagName}\\} is disabled')
            },
            disabledIn: {
                default: t<{ subtagNames: Iterable<string>; }>()('Cannot be used in the arguments to {subtagNames#map(\\{{}\\})#join(, | or )}')
            }
        }
    },
    analysis: {
        unnamed: t('Unnamed subtag'),
        dynamic: t('Dynamic subtag'),
        deprecated: t<Subtag>()('\\{{name}\\} is deprecated. Use `\\{{deprecated}\\}` instead')
    },
    subtag: {
        types: {
            simple: {
                name: t('Simple'),
                description: t('Subtags that require no arguments.')
            },
            misc: {
                name: t('Miscellaneous'),
                description: t('Miscellaneous subtags for general things.')
            },
            array: {
                name: t('Array'),
                description: t('Subtags designed specifically for arrays.')
            },
            json: {
                name: t('JSON'),
                description: t('Subtags designed for JSON objects.')
            },
            math: {
                name: t('Math'),
                description: t('Subtags designed for mathematical purposes.')
            },
            loops: {
                name: t('Loops'),
                description: t('Subtags that iterate over arrays/strings.')
            },
            bot: {
                name: t('Blargbot'),
                description: t('Subtags that integrate with blargbot\'s custom functions.')
            },
            message: {
                name: t('Message'),
                description: t('Subtags that interact with messages.')
            },
            channel: {
                name: t('Channel'),
                description: t('Subtags that interact with channels.')
            },
            thread: {
                name: t('Thread'),
                description: t('Subtags that interact with threads.')
            },
            user: {
                name: t('User'),
                description: t('Subtags that interact with users.')
            },
            role: {
                name: t('Role'),
                description: t('Subtags that interact with roles.')
            },
            guild: {
                name: t('Guild'),
                description: t('Subtags that interact with guilds.')
            }
        },
        variables: {
            server: {
                name: t('Server'),
                description: t('Server variables (also referred to as Guild variables) are commonly used if you wish to store data on a per server level. They are however stored in 2 separate \'pools\', one for tags and one for custom commands, meaning they cannot be used to pass data between the two\nThis makes then very useful for communicating data between tags that are intended to be used within 1 server at a time.')
            },
            author: {
                name: t('Author'),
                description: t('Author variables are stored against the author of the tag, meaning that only tags made by you can access or edit your author variables.\nThese are very useful when you have a set of tags that are designed to be used by people between servers, effectively allowing servers to communicate with each other.')
            },
            global: {
                name: t('Global'),
                description: t('Global variables are completely public, anyone can read **OR EDIT** your global variables.\nThese are very useful if you like pain.')
            },
            temporary: {
                name: t('Temporary'),
                description: t('Temporary variables are never stored to the database, meaning they are by far the fastest variable type.\nIf you are working with data which you only need to store for later use within the same tag call, then you should use temporary variables over any other type')
            },
            local: {
                name: t('Local'),
                description: t('Local variables are the default variable type, only usable if your variable name doesn\'t start with one of the other prefixes. These variables are only accessible by the tag that created them, meaning there is no possibility to share the values with any other tag.\nThese are useful if you are intending to create a single tag which is usable anywhere, as the variables are not confined to a single server, just a single tag')
            }
        }
    },
    subtags: {
        concat: {
            default: {
                description: t('Takes `values` and joins them together to form a single array. If `values` is an array, it\'s flattened into the resulting array.'),
                exampleOut: t('Two arrays: ["this","is","an","array"]\nStrings and an array: ["a","b","c", 1, 2, 3]'),
                exampleCode: t('Two arrays: \\{concat;["this", "is"];["an", "array"]\\}\nStrings and an array: \\{concat;a;b;c;[1, 2, 3]\\}')
            }
        },
        filter: {
            default: {
                description: t<{ disabled: Iterable<string>; }>()('For every element in `array`, a variable called `variable` will be set and `code` will be executed. Returns a new array containing all the elements that returned the value `true`.\n\n While inside the `code` parameter, none of the following subtags may be used: {disabled#map(`\\{{}\\}`)#join(, )}'),
                exampleOut: t('["apples","apple juice"]'),
                exampleCode: t('\\{set;~array;apples;apple juice;grapefruit\\}\n\\{filter;~element;~array;\\{bool;\\{get;~element\\};startswith;apple\\}\\}')
            }
        },
        isArray: {
            default: {
                description: t('Determines whether `text` is a valid array.'),
                exampleOut: t('true false'),
                exampleCode: t('\\{isarray;["array?"]\\} \\{isarray;array?\\}')
            }
        },
        join: {
            default: {
                description: t('Joins the elements of `array` together with `text` as the separator.'),
                exampleOut: t('this!is!an!array'),
                exampleCode: t('\\{join;["this", "is", "an", "array"];!\\}')
            }
        },
        map: {
            default: {
                description: t('Provides a way to populate an array by executing a function on each of its elements, more info [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)\nFor every element in `array`, a variable called `variable` will be set to the current element. The output of `function` will be the new value of the element. This will return the new array, and will not modify the original.'),
                exampleOut: t('["APPLES","ORANGES","PEARS"]'),
                exampleCode: t('\\{map;~item;["apples","oranges","pears"];\\{upper;\\{get;~item\\}\\}\\}')
            }
        },
        pop: {
            default: {
                description: t('Returns the last element in `array`. If provided a variable, this will remove the last element from `array`as well.'),
                exampleOut: t('array'),
                exampleCode: t('\\{pop;["this", "is", "an", "array"]\\}')
            }
        },
        push: {
            default: {
                description: t('Pushes `values` onto the end of `array`. If provided a variable, this will update the original variable. Otherwise, it will simply output the new array.'),
                exampleOut: t('["this","is","an","array"]'),
                exampleCode: t('\\{push;["this", "is", "an"];array\\}')
            }
        },
        shift: {
            default: {
                description: t('Returns the first element in `array`. If used with a variable this will remove the first element from `array` as well.'),
                exampleOut: t('this'),
                exampleCode: t('\\{shift;["this", "is", "an", "array"]\\}')
            }
        },
        shuffle: {
            args: {
                description: t('Shuffles the `\\{args\\}` the user provided.'),
                exampleIn: t('one two three'),
                exampleOut: t('three one two'),
                exampleCode: t('\\{shuffle\\} \\{args;0\\} \\{args;1\\} \\{args;2\\}')
            },
            array: {
                description: t('Shuffles the `\\{args\\}` the user provided, or the elements of `array`. If used with a variable this will modify the original array'),
                exampleOut: t('[5,3,2,6,1,4]'),
                exampleCode: t('\\{shuffle;[1,2,3,4,5,6]\\}')
            }
        },
        slice: {
            default: {
                description: t('Grabs elements between the zero-indexed `start` and `end` points (inclusive) from `array`.'),
                exampleOut: t('["is","an","array"]'),
                exampleCode: t('\\{slice;["this", "is", "an", "array"];1\\}')
            }
        },
        sort: {
            default: {
                description: t('Sorts the `array` in ascending order. If `descending` is provided, sorts in descending order. If provided a variable, will modify the original `array`.'),
                exampleOut: t('[1,2,3,4,5]'),
                exampleCode: t('\\{sort;[3, 2, 5, 1, 4]\\}')
            }
        },
        splice: {
            description: t('If used with a variable this will modify the original array.\nReturns an array of removed items.'),
            delete: {
                description: t('Removes `deleteCount` elements from `array` starting at `start`.'),
                exampleOut: t('["is"]'),
                exampleCode: t('\\{splice;["this", "is", "an", "array"];1;1\\}')
            },
            replace: {
                description: t('Removes `deleteCount` elements from `array` starting at `start`. Then, adds each `item` at that position in `array`. Returns the removed items.'),
                exampleOut: t('["is"] \\{"v":["this","was","an","array"],"n":"~array"\\}'),
                exampleCode: t('\\{set;~array;["this", "is", "an", "array"]\\} \\{splice;\\{get;~array\\};1;1;was\\} \\{get;~array\\}')
            }
        },
        split: {
            default: {
                description: t('Splits `text` using `splitter`, and the returns an array.'),
                exampleOut: t('["Hello!","This","is","a","sentence."]'),
                exampleCode: t('\\{split;Hello! This is a sentence.;\\{space\\}\\}')
            }
        },
        apply: {
            default: {
                description: t('Executes `subtag`, using the `args` as parameters. If `args` is an array, it will get deconstructed to it\'s individual elements.'),
                exampleOut: t('3'),
                exampleCode: t('\\{apply;randomInt;[1,4]\\}')
            }
        },
        args: {
            all: {
                description: t('Gets the whole user input'),
                exampleIn: t('Hello world! BBtag is so cool'),
                exampleOut: t('You said Hello world! BBtag is so cool'),
                exampleCode: t('You said \\{args\\}')
            },
            indexed: {
                description: t('Gets a word from the user input at the `index` position'),
                exampleIn: t('Hello world! BBtag is so cool'),
                exampleOut: t('world!'),
                exampleCode: t('\\{args;1\\}')
            },
            range: {
                description: t('Gets all the words in the user input from `start` up to `end`. If `end` is `n` then all words after `start` will be returned'),
                exampleIn: t('Hello world! BBtag is so cool'),
                exampleOut: t('BBtag is'),
                exampleCode: t('\\{args;2;4\\}')
            }
        },
        commandName: {
            default: {
                description: t('Gets the name of the current tag or custom command.'),
                exampleIn: t('b!cc test'),
                exampleOut: t('This command is test'),
                exampleCode: t('This command is \\{commandName\\}')
            }
        },
        commit: {
            description: t('For optimization reasons, variables are not stored in the database immediately when you use `\\{set\\}`. Instead they are cached, and will be saved to the database when the tag finishes. If you have some `variables` that you need to be saved to the database immediately, use this to force an update right now.\nThis comes at a slight performance cost, so use only when needed.\n`variables` defaults to all values accessed up to this point.\n`\\{rollback\\}` is the counterpart to this.'),
            all: {
                description: t('Commit all variables'),
                exampleOut: t('Hello!'),
                exampleCode: t('\\{set;var;Hello!\\}\n\\{commit\\}\n\\{set;var;GoodBye!\\}\n\\{rollback\\}\n\\{get;var\\}')
            },
            variables: {
                description: t('Commit provided `variables`'),
                exampleOut: t('Hello!'),
                exampleCode: t('\\{set;var;Hello!\\}\n\\{commit;var\\}\n\\{set;var;GoodBye!\\}\n\\{rollback;var\\}\n\\{get;var\\}')
            }
        },
        debug: {
            default: {
                description: t('Adds the specified text to the debug output. This output is only shown via `tag debug`, `ccommand debug`, `tag test debug` and `ccommand test debug`.The line number is also included in the debug entry'),
                exampleOut: t('(in debug output)[10]current value 1'),
                exampleCode: t('\\{debug;current value;\\{get;~i\\}\\}')
            }
        },
        dump: {
            default: {
                description: t('Dumps the provided text to a blargbot output page. These expire after 7 days.'),
                exampleOut: t('https://blargbot.xyz/output/1111111111111111'),
                exampleCode: t('\\{dump;Hello, world!\\}')
            }
        },
        execTag: {
            default: {
                description: t('Executes the `name` tag, giving it `args` as the input. Useful for modules.\n`\\{execTag\\}` executes the tag as if its code was in the root command.'),
                exampleOut: t('Let me do a tag for you. User#1111 has paid their respects. Total respects given: 5'),
                exampleCode: t('Let me do a tag for you. \\{execTag;f\\}')
            }
        },
        execCustomCommand: {
            default: {
                description: t('Executes the `name` custom command, giving it `args` as the input. Useful for modules.\n`\\{execCustomCommand\\}` executes the command as if its code was in the root command.'),
                exampleOut: t('Let me do a command for you. User#1111 has paid their respects. Total respects given: 5'),
                exampleCode: t('Let me do a command for you. \\{execCustomCommand;f\\}')
            }
        },
        fallback: {
            clear: {
                description: t('Should any tag fail to parse, it will be replaced with `message` instead of an error.'),
                exampleOut: t('This tag failed'),
                exampleCode: t('\\{fallback;This tag failed\\} \\{abc\\}')
            },
            set: {
                description: t('Clears the current fallback text.'),
                exampleOut: t('This tag failed  `Unknown subtag xyz`'),
                exampleCode: t('\\{fallback;This tag failed\\} \\{abc\\} \\{fallback\\} \\{xyz\\}')
            }
        },
        flag: {
            default: {
                description: t('Returns the value of the specified case-sensitive flag code. Use `_` to get the values without a flag.'),
                exampleIn: t('Hello, -a world!'),
                exampleOut: t('world! Hello,'),
                exampleCode: t('\\{flag;a\\} \\{flag;_\\}')
            }
        },
        flagsArray: {
            default: {
                description: t('Returns an array of all flags provided.'),
                exampleIn: t('Hello -dc world'),
                exampleOut: t('["_","d","c"]'),
                exampleCode: t('\\{flagsArray\\}')
            }
        },
        flagSet: {
            default: {
                description: t('Returns `true` or `false`, depending on whether the specified case-sensitive flag code has been set or not.'),
                exampleIn: t('Hello, -a world!'),
                exampleOut: t('true false'),
                exampleCode: t('\\{flagSet;a\\} \\{flagSet;_\\}')
            }
        },
        function: {
            default: {
                description: t('Defines a function called `name`. Functions are called in the same way as subtags, however they are prefixed with `func.`. While inside the `code` block of a function, you may use the `params`, `paramsArray` and `paramsLength` subtags to access the values passed to the function. These function identically to their `args` counterparts. \n\nPlease note that there is a recursion limit of 200 which is also shared by `\\{execTag\\}`, `\\{execCustomCommand\\}` and `\\{inject\\}`.'),
                exampleOut: t('["1","2","3","4"]'),
                exampleCode: t('\\{function;test;\\{paramsArray\\}\\} \\{func.test;1;2;3;4\\}')
            }
        },
        get: {
            value: {
                description: t<{ scopes: Iterable<{ prefix: string; name: IFormattable<string>; }>; }>()('Returns the stored variable `varName`.\nYou can use a character prefix to determine the scope of your variable.\nValid scopes are: {scopes#map({prefix#bool(`{}`|no prefix)} ({name}))#join(, | and )}. For more information, use `b!t docs variable` or `b!cc docs variable`'),
                exampleOut: t('This is local var1\nThis is temporary var2'),
                exampleCode: t('\\{set;var1;This is local var1\\}\n\\{set;~var2;This is temporary var2\\}\n\\{get;var1\\}\n\\{get;~var2\\}')
            },
            index: {
                description: t('When variable `name` is an array this will return the element at index `index`. If `index` is empty the entire array will be returned. If variable is not an array it will return the whole variable.'),
                exampleOut: t('def'),
                exampleCode: t('\\{set;myArray;["abc","def","ghi"]\\}\\{get;myArray;1\\}')
            }
        },
        inject: {
            default: {
                description: t('Executes any arbitrary BBTag that is within `code` and returns the result. Useful for making dynamic code, or as a testing tool (`\\{inject;\\{args\\}\\}`)'),
                exampleOut: t('Random Number: 3'),
                exampleCode: t('Random Number: \\{inject;\\{lb\\}randomInt\\{semi\\}1\\{semi\\}4\\{rb\\}\\}')
            }
        },
        lock: {
            default: {
                description: t('Provides read/write locking functionality for bbtag. This is a very advanced feature, so it is recommended that you first [read about the concept of locks](https://en.wikipedia.org/wiki/Lock_(computer_science)).\n\nIn simple terms, a lock allows commands running at the same time to cooperate and wait for each other to finish what they are doing before "releasing the lock" and letting other commands use that lock. This can be used to secure against data being edited by 2 things at the same time, which can cause inconsistencies.\n\nThere can be multiple `read` locks held at once or a single `write` lock. This means that if all your command is doing is reading some data then as long as nothing is writing to it, it will be allowed, otherwise the command will wait until it can acquire a lock.\n\n`mode` must be either `read` or `write`.\n`key` can be anything. This follows the same scoping rules as variables do.\n`code` will be run once the lock is acquired'),
                exampleOut: t('\nStart\nMiddle\nEnd\nStart\nMiddle\nEnd\nThis order is guaranteed always. Without a lock it isn\'t'),
                exampleCode: t('\n\\{//;in 2 command run in quick succession\\}\n\\{lock;write;key;\n  \\{void;\n    \\{send;\\{channelId\\};Start\\}\n    \\{send;\\{channelId\\};Middle\\}\n    \\{send;\\{channelId\\};End\\}\n  \\}\n\\}\nThis order is guaranteed always. Without a lock it isn\'t')
            }
        },
        modLog: {
            description: t('If `moderator` is not provided or left empty, it will default to blargbot.'),
            default: {
                description: t('Creates a custom modLog entry with the given `action` and `user` with `reason`. `color` can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number. .'),
                exampleOut: t('You did a bad! (modLog entry with white embed colour and reason \'They did a bad!\''),
                exampleCode: t('You did a bad! \\{modLog;Bad;\\{userId\\};;They did a bad;#ffffff\\}')
            }
        },
        nsfw: {
            default: {
                description: t('Marks the output as being NSFW, and only to be sent in NSFW channels. A requirement for any tag with NSFW content. `message` is the error to show'),
                exampleOut: t('This command is not safe!'),
                exampleCode: t('This command is not safe! \\{nsfw\\}')
            }
        },
        params: {
            all: {
                description: t('Gets the whole input given to the current function call'),
                exampleOut: t('You gave the parameters `Hello world! BBtag is so cool`'),
                exampleCode: t('\\{func;test;You gave the parameters `\\{params\\}`\\}\n\\{func.test;Hello world!;BBtag is so cool\\}')
            },
            indexed: {
                description: t('Gets a parameter passed to the current function call'),
                exampleOut: t('The first parameter is `Hello world!`'),
                exampleCode: t('\\{func;test;The first parameter is `\\{params;0\\}`\\}\n\\{func.test;Hello world!;BBtag is so cool\\}')
            },
            range: {
                description: t('Gets all the parameters given from `start` up to `end`. If `end` is `n` then all parameters after `start` will be returned'),
                exampleOut: t('C D'),
                exampleCode: t('\\{func;test;The first parameter is `\\{params;2;4\\}`\\}\n\\{func.test;A;B;C;D;E;F\\}')
            }
        },
        paramsArray: {
            default: {
                description: t('Gets the parameters passed to the current function as an array'),
                exampleOut: t('["a","b","c","d"]'),
                exampleCode: t('\\{func.test;\\{paramsArray\\}\\}\n\\{func.test;a;b;c;d\\}')
            }
        },
        paramsLength: {
            default: {
                description: t('Gets the number of parameters passed to the current function'),
                exampleOut: t('["a","b","c","d"]'),
                exampleCode: t('\\{func.test;\\{paramsLength\\}\\}\n\\{func.test;a;b;c;d\\}')
            }
        },
        prefix: {
            default: {
                description: t('Gets the command prefix used to call this bbtag.'),
                exampleOut: t('Your prefix is b!'),
                exampleCode: t('Your prefix is \\{prefix\\}')
            }
        },
        quiet: {
            default: {
                description: t('Tells any subtags that rely on a `quiet` field to be/not be quiet based on `isQuiet. `isQuiet` must be a boolean'),
                exampleOut: t('cat'),
                exampleCode: t('\\{quiet\\} \\{userMention;cat\\}')
            }
        },
        reason: {
            default: {
                description: t('Sets the reason for the next API call (ex. roleAdd, roleRemove, ban, etc.). If `reason` is empty the reason will be empty'),
                exampleOut: t('("This will show up in the audit logs" showed up)'),
                exampleCode: t('\\{reason;This will show up in the audit logs!\\}\\{roleAdd;111111111111\\}')
            }
        },
        request: {
            description: t('Only certain whitelisted domains can be used for `url`. See [here](https://blargbot.xyz/domains) for the list.The output is a JSON object with the following structure. It is recommended to use \\{jsonGet\\} to navigate it.\n```json\n\\{\n  "body": \\{\\}, // the body of the request\n  "status": 200, // the HTTP status code\n  "statusText": "OK", // the human readable translation of the status code\n  "date": "Thu, 1 Jan 1970 00:00:00 GMT", // the date sent in the headers\n  "contentType": "application/json", // the content type of the response\n  "url": "https://fancy.url/here" // the url that was requested\n\\}\n```'),
            default: {
                description: t('Performs a HTTP request to `url`, with provided `options` and `data`.`options` is a JSON object with the following structure. It is recommended to use \\{jsonSet\\} to create it.\n```json\n\\{\n  "method": "GET|POST|PUT|PATCH|DELETE", // defaults to GET\n  "headers": \\{ "key": "value" \\}\n\\}\n```If the method is GET and a JSON object is provided for `data`, it will be formatted as query strings.'),
                exampleOut: t('Stupid cat updated!'),
                exampleCode: t('\\{jGet;\\{request;https://example.com/update/user;\\{jset;;method;POST\\};\\{jset;;user;Stupid cat\\}\\};body\\}')
            }
        },
        return: {
            default: {
                description: t('Stops execution of the tag and returns what has been parsed. If `force` is `true` then it will also return from any tags calling this tag.'),
                exampleOut: t('This will display.'),
                exampleCode: t('This will display. \\{return\\} This will not.')
            }
        },
        rollback: {
            description: t('For optimization reasons, variables are not stored in the database immediately when you use `\\{set\\}`. Instead they are cached, and will be saved to the database when the tag finishes. If you have some `variables` that you don\'t want to be changed, you can use this to revert them back to their value at the start of the tag, or the most recent `\\{commit\\}`.\n`variables` defaults to all values accessed up to this point.\n`\\{commit\\}` is the counterpart to this.'),
            all: {
                description: t('Rollback all variables'),
                exampleOut: t('Hello!'),
                exampleCode: t('\\{set;var;Hello!\\}\n\\{commit\\}\n\\{set;var;GoodBye!\\}\n\\{rollback\\}\n\\{get;var\\}')
            },
            variables: {
                description: t('Rollback provided `variables`'),
                exampleOut: t('Hello!'),
                exampleCode: t('\\{set;var;Hello!\\}\n\\{commit;var\\}\n\\{set;var;GoodBye!\\}\n\\{rollback;var\\}\n\\{get;var\\}')
            }
        },
        set: {
            clear: {
                description: t('Sets the `name` variable to nothing.'),
                exampleOut: t('(returns nothing)'),
                exampleCode: t('\\{set;~var;something\\}\n\\{set;~var\\}\n\\{get;~var\\}')
            },
            value: {
                description: t<{ scopes: Iterable<{ prefix: string; name: IFormattable<string>; }>; }>()('Stores `value` under `name`. These variables are saved between sessions. You can use a character prefix to determine the scope of your variable.\nValid scopes are: {scopes#map({prefix#bool(`{}`|no prefix)} ({name}))#join(, | and )}.\nFor performance reasons, variables are not immediately stored to the database. See `\\{commit\\}` and `\\{rollback\\}`for more information, or use `b!t docs variable` or `b!cc docs variable`'),
                exampleOut: t('This is local var1\nThis is temporary var2'),
                exampleCode: t('\\{set;var1;This is local var1\\}\n\\{set;~var2;This is temporary var2\\}\n\\{get;var1\\}\n\\{get;~var2\\}')
            },
            array: {
                description: t('Stores an array under `name`.\nWhen getting the array, you\'ll notice it retrieved an object, In this object `v` is the array itself, and `n` is the `name` of the variable. If the array itself needs to be returned instead of object, in for example `\\{jSet;;array;\\{get;~array\\}\\}`, you can use `\\{slice;<arrayName>;0\\}`. In array subtags `\\{get\\} will work as intended.`'),
                exampleOut: t('\\{"v":["this","is","an","array"],"n":"var3"\\}'),
                exampleCode: t('\\{set;var3;this;is;an;array\\}\n\\{get;var3\\}')
            }
        },
        sleep: {
            default: {
                description: t('Pauses the current tag for the specified amount of time. Maximum is 5 minutes'),
                exampleOut: t('(After 10s) Hi!'),
                exampleCode: t('\\{sleep;10s\\}\\{send;\\{channelId\\};Hi!\\}')
            }
        },
        subtagExists: {
            default: {
                description: t('Checks to see if `subtag` exists.'),
                exampleOut: t('true false'),
                exampleCode: t('\\{subtagExists;ban\\} \\{subtagExists;AllenKey\\}')
            }
        },
        suppressLookup: {
            default: {
                description: t('Sets whether error messages in the lookup system (query canceled, nothing found) should be suppressed. `value` must be a boolean'),
                exampleOut: t(''),
                exampleCode: t('\\{suppressLookup\\}')
            }
        },
        throw: {
            default: {
                description: t('Throws `error`.'),
                exampleOut: t('`Custom Error`'),
                exampleCode: t('\\{throw;Custom Error\\}')
            }
        },
        timer: {
            default: {
                description: t('Executes `code` after `duration`. Three timers are allowed per custom command, with no recursive timers.'),
                exampleOut: t('(after 20 seconds:) Hello!'),
                exampleCode: t('\\{timer;Hello!;20s\\}')
            }
        },
        channelCategories: {
            default: {
                description: t('Returns an array of category ids on the current guild.'),
                exampleOut: t('This guild has 7 categories.'),
                exampleCode: t('This guild has \\{length;\\{categories\\}\\} categories.')
            }
        },
        channelCategory: {
            current: {
                description: t('Returns the category id of the current channel.'),
                exampleOut: t('111111111111111'),
                exampleCode: t('\\{channelCategory\\}')
            },
            channel: {
                description: t('Returns the category id of the provided `channel`. If the provided `channel` is a category this returns nothing. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.'),
                exampleOut: t('111111111111111\n(nothing is returned here)'),
                exampleCode: t('\\{channelCategory;cool channel\\}\n\\{channelCategory;cool category\\}')
            }
        },
        channelCreate: {
            description: t('`type` is either `text`, `voice`, `category`, `news` or `store`.\n'),
            default: {
                description: t('Creates a channel with the specified `options` of type `type``options` is a JSON object, containing any or all of the following properties:\n- `topic`\n- `nsfw`\n- `parentId`\n- `reason` (displayed in audit log)\n- `rateLimitPerUser`\n- `bitrate` (voice)\n- `userLimit` (voice)\nReturns the new channel\'s id.'),
                exampleOut: t('22222222222222222'),
                exampleCode: t('\\{channelCreate;super-channel;;\\{json;\\{"parentId":"11111111111111111"\\}\\}\\}')
            }
        },
        channelDelete: {
            default: {
                description: t('Deletes the provided `channel`.'),
                exampleOut: t(''),
                exampleCode: t('\\{channelDelete;11111111111111111\\}')
            }
        },
        channelEdit: {
            default: {
                description: t('Edits a channel with the given information.\n`options` is a JSON object, containing any or all of the following properties:\n- `name`\n- `topic`\n- `nsfw`\n- `parentId`\n- `reason` (displayed in audit log)\n- `rateLimitPerUser`\n- `bitrate` (voice)\n- `userLimit` (voice)\nReturns the channel\'s id.'),
                exampleOut: t('11111111111111111'),
                exampleCode: t('\\{channelEdit;11111111111111111;\\{j;\\{"name": "super-cool-channel"\\}\\}\\}')
            }
        },
        channelId: {
            current: {
                description: t('Returns the id of the current channel.'),
                exampleOut: t('111111111111111'),
                exampleCode: t('\\{channelId\\}')
            },
            channel: {
                description: t('Returns the id of the given channel. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.'),
                exampleOut: t('111111111111111\n(nothing is returned here)'),
                exampleCode: t('\\{channelId;cool channel\\}\n\\{channelId;some channel that doesn\'t exist;true\\}')
            }
        },
        channelIsCategory: {
            default: {
                description: t('Checks if `channel` is a category. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.'),
                exampleOut: t('true\n(nothing is returned here)'),
                exampleCode: t('\\{channelIsCategory;cool category\\}\n\\{channelIsCategory;category that doesn\'t exist\\}')
            }
        },
        channelIsNsfw: {
            current: {
                description: t('Checks if the current channel is a NSFW channel.'),
                exampleOut: t('fluffy bunnies'),
                exampleCode: t('\\{if;\\{channelIsNsfw\\};Spooky nsfw stuff;fluffy bunnies\\}')
            },
            channel: {
                description: t('Checks if `channel` is a NSFW channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.'),
                exampleOut: t('true'),
                exampleCode: t('\\{channelIsNsfw;SFW Cat pics\\}')
            }
        },
        channelIsText: {
            current: {
                description: t('Checks if the current channel is a text channel.'),
                exampleOut: t('Yeah you can write stuff here'),
                exampleCode: t('\\{if;\\{channelIsText\\};Yeah you can write stuff here;How did you even call the command?\\}')
            },
            channel: {
                description: t('Checks if `channel` is a text channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.'),
                exampleOut: t('true'),
                exampleCode: t('\\{channelIsText;feature discussions\\}')
            }
        },
        channelIsThread: {
            current: {
                description: t('Checks if the current channel is a thread channel.'),
                exampleOut: t('Cool, this is a thread channel!'),
                exampleCode: t('\\{if;\\{channelIsThread\\};Cool, this is a thread channel!;Boo, this is a regular text channel\\}')
            },
            channel: {
                description: t('Checks if `channel` is a thread channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.'),
                exampleOut: t('true'),
                exampleCode: t('\\{channelIsThread;blargbot podcast\\}')
            }
        },
        channelIsVoice: {
            current: {
                description: t('Checks if the current channel is a voice channel.'),
                exampleOut: t('Yeah you can write stuff here'),
                exampleCode: t('\\{if;\\{channelIsVoice\\};How did you even call the command?;Yeah you can write stuff here\\}')
            },
            channel: {
                description: t('Checks if `channel` is a voice channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.'),
                exampleOut: t('true'),
                exampleCode: t('\\{channelIsVoice;blargbot podcast\\}')
            }
        },
        channelName: {
            current: {
                description: t('Returns the name of the current channel.'),
                exampleOut: t('This channel\'s name is test-channel'),
                exampleCode: t('This channel\'s name is \\{channelName\\}')
            },
            channel: {
                description: t('Returns the name of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.'),
                exampleOut: t('cooler-test-channel'),
                exampleCode: t('\\{channelName;111111111111111\\}')
            }
        },
        channelPosition: {
            description: t('The position is the index per channel type (text, voice or category) in the channel list.'),
            current: {
                description: t('Returns the position of the current channel.'),
                exampleOut: t('This channel is in position 1'),
                exampleCode: t('This channel is in position \\{channelPosition\\}')
            },
            channel: {
                description: t('Returns the position of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.'),
                exampleOut: t('The position of test-channel is 0'),
                exampleCode: t('The position of test-channel is \\{channelPosition;test-channel\\}')
            }
        },
        channels: {
            current: {
                description: t('Returns an array of channel ids in the current guild'),
                exampleOut: t('This guild has \\{length;\\{channels\\}\\} channels.'),
                exampleCode: t('This guild has \\{length;\\{channels\\}\\} channels.')
            },
            channel: {
                description: t('Returns an array of channel ids in within the given `category`. If `category` is not a category, returns an empty array. If `category` cannot be found returns `No channel found`, or nothing if `quiet` is `true`.'),
                exampleOut: t('Category cat-channels has 6 channels.'),
                exampleCode: t('Category cat-channels has \\{length;\\{channels;cat-channels\\}\\} channels.')
            }
        },
        channelSetPermissions: {
            current: {
                description: t('Deletes the permission overwrites of `memberId|roleId` in `channel`.\nReturns the channel\'s id.'),
                exampleOut: t('11111111111111111'),
                exampleCode: t('\\{channelSetPermissions;11111111111111111;member;222222222222222222\\}')
            },
            channel: {
                description: t('Sets the permissions of a `member` or `role` in `channel`\n`type` is either `member` or `role`, and `memberId|roleId` corresponds to the id of the member or role.\nProvide `allow` and `deny` as numbers, which can be calculated [here](https://discordapi.com/permissions.html). Returns the channel\'s id.'),
                exampleOut: t('11111111111111111'),
                exampleCode: t('\\{channelSetPermissions;11111111111111111;member;222222222222222222;1024;2048\\}')
            }
        },
        channelSetPosition: {
            default: {
                description: t('Moves a channel to the provided position.'),
                exampleOut: t(''),
                exampleCode: t('\\{channelSetPosition;11111111111111111;5\\}')
            }
        },
        channelType: {
            description: t<{ types: Iterable<string>; }>()('Possible results: {types#map(`{}`)#join(, )}'),
            current: {
                description: t('Returns the type the current channel.'),
                exampleOut: t('text'),
                exampleCode: t('\\{channelType\\}')
            },
            channel: {
                description: t('Returns the type the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.'),
                exampleOut: t('voice\n(nothing is returned here)'),
                exampleCode: t('\\{channelType;cool channel\\}\n\\{channelType;some channel that doesn\'t exist;true\\}')
            }
        },
        lastMessageId: {
            description: t('Returns nothing if the channel doesn\'t have any messages.'),
            current: {
                description: t('Returns the messageId of the last message in the current channel.'),
                exampleOut: t('1111111111111111'),
                exampleCode: t('\\{lastMessageId\\}')
            },
            channel: {
                description: t('Returns the messageId of the last message in `channel`.'),
                exampleOut: t('2222222222222222'),
                exampleCode: t('\\{lastMessageId;1111111111111111\\}')
            }
        },
        slowMode: {
            clearCurrent: {
                description: t('Removes slow mode for the current channel.'),
                exampleOut: t('(slow mode is now disabled)'),
                exampleCode: t('\\{slowMode\\}')
            },
            clearChannel: {
                description: t('Removes slow mode for the given `channel`'),
                exampleOut: t('(disabled slow mode in testing-grounds)'),
                exampleCode: t('\\{slowMode;testing-grounds\\}')
            },
            setCurrent: {
                description: t('Enables slow mode in the current channel and set the cooldown to `time`.'),
                exampleOut: t('(set slow mode to 10 seconds)'),
                exampleCode: t('\\{slowMode;10\\}')
            },
            setChannel: {
                description: t('Enables slow mode in `channel` and set the cooldown to `time`.'),
                exampleOut: t('(set slow mode cooldown to 10 seconds in testing-grounds)\n(set slow mode to 50s in the current channel)'),
                exampleCode: t('\\{slowMode;testing-grounds;10\\}\n\\{slowMode;50;doesn\'t matter\\}')
            }
        },
        emojiCreate: {
            default: {
                description: t('Creates a emoji with the given name and image. `image` is either a link to an image, or a base64 encoded data url (`data:<content-type>;base64,<base64-data>`). You may need to use \\{semi\\} for the latter.`roles`, if provided, will restrict the emoji\'s usage to the specified roles. Must be an array of roles.Returns the new emojis\'s id.'),
                exampleOut: t('11111111111111111'),
                exampleCode: t('\\{emojiCreate;fancy_emote;https://some.cool/image.png;["Cool gang"]\\}')
            }
        },
        emojiDelete: {
            default: {
                description: t('Deletes an emoji with the provided `id`'),
                exampleOut: t(''),
                exampleCode: t('\\{emojiDelete;11111111111111111\\}')
            }
        },
        emojis: {
            description: t('Please note that Discord will remove all the emojis from a message which contains an emoji that blargbot can\'t use. For example, blargbot can\'t use a role-restricted emoji if it doesn\'t have the role. Learn more [here](https://discordapp.com/developers/docs/resources/emoji).'),
            all: {
                description: t('Returns an array of emojis in the current guild.'),
                exampleOut: t('This guild has 23 emojis.'),
                exampleCode: t('This guild has \\{length;\\{emojis\\}\\} emojis.')
            },
            forRole: {
                description: t('Returns an array of emojis whitelisted for the provided `role`'),
                exampleOut: t('Cool gang has 6 emojis.'),
                exampleCode: t('Cool gang has \\{length;\\{emojis;Cool gang\\}\\} emojis.')
            }
        },
        guildBans: {
            default: {
                description: t('Returns an array of banned users in the current guild.'),
                exampleOut: t('This guild has 123 banned users.'),
                exampleCode: t('This guild has \\{length;\\{guildBans\\}\\} banned users.')
            }
        },
        guildCreatedAt: {
            default: {
                description: t('Returns the date the current guild was created, in UTC+0. If a `format` code is specified, the date is formatted accordingly. Leave blank for default formatting. See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information.'),
                exampleOut: t('This guild was created on 2016/01/01 01:00:00'),
                exampleCode: t('This guild was created on \\{guildCreatedAt;YYYY/MM/DD HH:mm:ss\\}')
            }
        },
        guildFeatures: {
            default: {
                description: t('Returns an array of guild feature strings. For a full list click [this link](https://discord.com/developers/docs/resources/guild#guild-object-guild-features).'),
                exampleOut: t('["COMMUNITY","COMMERCE","NEWS","PREVIEW_ENABLED","WELCOME_SCREEN_ENABLED","MEMBER_VERIFICATION_GATE_ENABLED","THREADS_ENABLED"]'),
                exampleCode: t('\\{guildFeatures\\}')
            }
        },
        guildIcon: {
            default: {
                description: t('Returns the icon of the current guild. If it doesn\'t exist returns nothing.'),
                exampleOut: t('The guild\'s icon is (icon url)'),
                exampleCode: t('The guild\'s icon is \\{guildIcon\\}')
            }
        },
        guildId: {
            default: {
                description: t('Returns the id of the current guild.'),
                exampleOut: t('The guild\'s id is 1234567890123456'),
                exampleCode: t('The guild\'s id is \\{guildId\\}')
            }
        },
        guildMembers: {
            default: {
                description: t('Returns an array of user ids of the members on the current guild.'),
                exampleOut: t('This guild has 123 members.'),
                exampleCode: t('This guild has \\{length;\\{guildMembers\\}\\} members.')
            }
        },
        guildName: {
            default: {
                description: t('Returns the name of the current guild.'),
                exampleOut: t('This guild\'s name is TestGuild.'),
                exampleCode: t('This guild\'s name is \\{guildName\\}.')
            }
        },
        guildOwnerId: {
            default: {
                description: t('Returns the id of the guild\'s owner.'),
                exampleOut: t('The owner\'s id is 1234567890123456.'),
                exampleCode: t('The owner\'s id is \\{guildOwnerId\\}.')
            }
        },
        guildSetIcon: {
            default: {
                description: t('Updates the current guild\'s icon with the provided image. `image` is either a link to an image, or a base64 encoded data url (`data:<content-type>;base64,<base64-data>`). You may need to use \\{semi\\} for the latter.'),
                exampleOut: t(''),
                exampleCode: t('\\{guildSetIcon;https://some.cool/image.png\\}')
            }
        },
        guildSize: {
            default: {
                description: t('Returns the number of members on the current guild.'),
                exampleOut: t('This guild has 123 members.'),
                exampleCode: t('This guild has \\{guildSize\\} members.')
            }
        },
        json: {
            default: {
                description: t('Defines a raw JSON object. Usage of subtags is disabled in `input`, inside `input` all brackets are required to match.'),
                exampleOut: t('\\{\n  "key": "value"\n\\}'),
                exampleCode: t('\\{json;\\{\n  "key": "value"\n\\}\\}')
            }
        },
        jsonClean: {
            default: {
                description: t('Using the `input` as a base, cleans up the JSON file structure, parsing stringified nested objects/arrays. Will not mutate the original object.'),
                exampleOut: t('\\{"test":[]\\}'),
                exampleCode: t('\\{jsonClean;\\{j;\\{"test":"[]"\\}\\}\\}')
            }
        },
        jsonGet: {
            parse: {
                description: t('Gets a json value. Works with arrays too!\n`input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.'),
                exampleOut: t('one'),
                exampleCode: t('\\{jsonGet;\\{j;\\{\n  "array": [\n    "zero",\n    \\{ "value": "one" \\},\n    "two"\n  ]\n\\}\\};array.1.value\\}')
            },
            path: {
                description: t('Navigates the path of a JSON object. Works with arrays too!\n`input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n`path` is a dot-noted series of properties.'),
                exampleOut: t('one'),
                exampleCode: t('\\{jsonGet;\\{j;\\{\n  "array": [\n    "zero",\n    \\{ "value": "one" \\},\n    "two"\n  ]\n\\}\\};array.1.value\\}')
            }
        },
        jsonKeys: {
            default: {
                description: t('Retrieves all keys from provided the JSON object. `object` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n`path` is a dot-noted series of properties.'),
                exampleOut: t('["key","key2"]'),
                exampleCode: t('\\{set;~json;\\{json;\\{"key": "value", "key2" : "value2"\\}\\}\n\\{jsonKeys;~json\\}')
            }
        },
        jsonSet: {
            delete: {
                description: t('Deletes the value at `path`. `input` can be a JSON object or array'),
                exampleOut: t('\\{\\}'),
                exampleCode: t('\\{set;~json;\\{json;\\{"key" : "value"\\}\\}\\}\n\\{jsonSet;~json;key\\}\n\\{get;~json\\}')
            },
            set: {
                description: t('Using the `input` as a base, navigates the provided dot-notated `path` and assigns the `value`. `input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.If `create` is not empty, will create/convert any missing keys.'),
                exampleOut: t('\\{"path":\\{"to":\\{"key":"value"\\}\\}\\}'),
                exampleCode: t('\\{jsonSet;;path.to.key;value;create\\}')
            },
            create: {
                description: t('Using the `input` as a base, navigates the provided dot-notated `path` and assigns the `value`. `input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.If `create` is not empty, will create/convert any missing keys.'),
                exampleOut: t('\\{"path":\\{"to":\\{"key":"value"\\}\\}\\}'),
                exampleCode: t('\\{jsonSet;;path.to.key;value;create\\}')
            }
        },
        jsonSort: {
            default: {
                description: t('Sorts an array of objects based on the provided `path`.\n`path` is a dot-noted series of properties.\nIf `descending` is provided, sorts in descending order.\nIf provided a variable, will modify the original `array`.'),
                exampleOut: t('[\n  "\\{\\"points\\":3,\\"name\\":\\"UNO\\"\\}",\n  "\\{\\"points\\":6,\\"name\\":\\"Stupid cat\\"\\}",\n  "\\{\\"points\\":10,\\"name\\":\\"Blargbot\\"\\}",\n  "\\{\\"points\\":12,\\"name\\":\\"Winner\\"\\}"\n]'),
                exampleCode: t('\\{set;~array;\\{json;[\n  \\{"points" : 10, "name" : "Blargbot"\\},\n  \\{"points" : 3, "name" : "UNO"\\},\n  \\{"points" : 6, "name" : "Stupid cat"\\},\n  \\{"points" : 12, "name" : "Winner"\\}\n]\\}\\}\n\\{jsonStringify;\\{jsonSort;\\{slice;\\{get;~array\\};0\\};points\\};2\\}')
            }
        },
        jsonStringify: {
            default: {
                description: t('Pretty-prints the provided JSON `input` with the provided `indent`.'),
                exampleOut: t('[\n    "one",\n    "two",\n    "three"\n]'),
                exampleCode: t('\\{jsonStringify;["one","two","three"]\\}')
            }
        },
        jsonValues: {
            default: {
                description: t('Retrieves all values from provided the JSON object. `object` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n`path` is a dot-noted series of properties.'),
                exampleOut: t('["value","value2"]'),
                exampleCode: t('\\{set;~json;\\{json;\\{"key": "value", "key2" : "value2"\\}\\}\n\\{jsonValues;~json\\}')
            }
        },
        for: {
            default: {
                description: t('To start, `variable` is set to `initial`. Then, the tag will loop, first checking `variable` against `limit` using `comparison`. If the check succeeds, `code` will be run before `variable` being incremented by `increment` and the cycle repeating.\nThis is very useful for repeating an action (or similar action) a set number of times. Edits to `variable` inside `code` will be ignored'),
                exampleOut: t('0,1,2,3,4,5,6,7,8,9,'),
                exampleCode: t('\\{for;~index;0;<;10;\\{get;~index\\},\\}')
            }
        },
        forEach: {
            default: {
                description: t('For every element in `array`, a variable called `variable` will be set and then `code` will be run.\nIf `element` is not an array, it will iterate over each character instead.'),
                exampleOut: t('I like apples\nI like oranges\nI like c#'),
                exampleCode: t('\\{set;~array;apples;oranges;c#\\}\n\\{forEach;~element;~array;I like \\{get;~element\\}\\{newline\\}\\}')
            }
        },
        repeat: {
            default: {
                description: t('Repeatedly executes `code` `amount` times.'),
                exampleOut: t('eeeeeeeeee'),
                exampleCode: t('\\{repeat;e;10\\}')
            }
        },
        while: {
            value: {
                description: t('This will continuously execute `code` for as long as `boolean` returns `true`.'),
                exampleOut: t('10'),
                exampleCode: t('\\{set;~x;0\\}\n\\{set;~end;false\\}\n\\{while;\\{get;~end\\};\n\t\\{if;\\{increment;~x\\};==;10;\n\t\t\\{set;~end;true\\}\n\t\\}\n\\}\n\\{get;~end\\}')
            },
            condition: {
                description: t<{ operators: Iterable<string>; }>()('This will continuously execute `code` for as long as the condition returns `true`. The condition is as follows:\nIf `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. Valid evaluators are {operators#map(`{}`)#join(, | and )}.'),
                exampleOut: t('1,2,3,4,5,6,7,8,9,10,11,'),
                exampleCode: t('\\{set;~x;0\\}\n\\{while;\\{get;~x\\};<=;10;\\{increment;~x\\},\\}')
            }
        },
        absolute: {
            value: {
                description: t('Gets the absolute value of `number`'),
                exampleOut: t('535'),
                exampleCode: t('\\{absolute;-535\\}')
            },
            array: {
                description: t('Gets the absolute value of each `numbers` and returns an array containing the results'),
                exampleOut: t('[535, 123, 42]'),
                exampleCode: t('\\{absolute;-535;123;-42\\}')
            }
        },
        base: {
            default: {
                description: t('Converts `integer` from a base `origin` number into a base `radix` number. `radix` and `origin` must be between 2 and 36.'),
                exampleOut: t('255'),
                exampleCode: t('\\{base;FF;16;10\\}')
            }
        },
        decrement: {
            default: {
                description: t('Decreases `varName`\'s value by `1`. '),
                exampleOut: t('-1,-2,-3,-4,-5,-6,-7,-8,-9,-10'),
                exampleCode: t('\\{set;~counter;0\\} \\{repeat;\\{decrement;~counter\\},;10\\}')
            },
            count: {
                description: t('Decreases `varName`\'s value by `amount`. `floor` is a boolean, and if it is `true` then the value will be rounded down.'),
                exampleOut: t('-2,-4,-6,-8,-10,-12,-14,-16,-18,-20'),
                exampleCode: t('\\{set;~counter;0\\} \\{repeat;\\{decrement;~counter;-2\\},;10\\}')
            }
        },
        increment: {
            default: {
                description: t('Increases `varName`\'s value by `1`. '),
                exampleOut: t('1,2,3,4,5,6,7,8,9,10'),
                exampleCode: t('\\{set;~counter;0\\} \\{repeat;\\{increment;~counter\\},;10\\}')
            },
            count: {
                description: t('Increases `varName`\'s value by `amount`. `floor` is a boolean, and if it is `true` then the value will be rounded down.'),
                exampleOut: t('2,4,6,8,10,12,14,16,18,20'),
                exampleCode: t('\\{set;~counter;0\\} \\{repeat;\\{increment;~counter;-2\\},;10\\}')
            }
        },
        math: {
            default: {
                description: t<{ operators: Iterable<string>; }>()('Accepts multiple `values` and returns the result of `operator` on them. Valid operators are {operators#map(`{}`)#join(, | and )}\nSee `\\{operators\\}` for a shorter way of performing numeric operations.'),
                exampleOut: t('2 + 3 + 6 - 2 = 9'),
                exampleCode: t('2 + 3 + 6 - 2 = \\{math;-;\\{math;+;2;3;6\\};2\\}')
            }
        },
        max: {
            default: {
                description: t('Returns the largest entry out of `numbers`. If an array is provided, it will be expanded to its individual values.'),
                exampleOut: t('65'),
                exampleCode: t('\\{max;50;2;65\\}')
            }
        },
        min: {
            default: {
                description: t('Returns the smallest entry out of `numbers`. If an array is provided, it will be expanded to its individual values.'),
                exampleOut: t('2'),
                exampleCode: t('\\{min;50;2;65\\}')
            }
        },
        numberFormat: {
            description: t('If `roundTo` is not provided, but the number does have decimals, rounds to `3` by default. Any precision for decimals will be lost e.g: `100.000000000`becomes `100` and `100.3100000000` becomes `100.31`'),
            default: {
                description: t('Rounds `number` to `roundTo` digits. `roundTo` can be left empty.'),
                exampleOut: t('123456.79\n123000\n100.1'),
                exampleCode: t('\\{numberFormat;123456.789;2\\}\n\\{numberFormat;123456.789;-3\\}\n\\{numberFormat;100.10000;\\}')
            },
            separator: {
                description: t('Rounds `number` to `roundTo` digits. Uses `decimal` as the decimal separator and `thousands` for the thousands separator. To skip `roundTo` or `decimal` leave them empty.'),
                exampleOut: t('3,1415\n100.000'),
                exampleCode: t('\\{numberFormat;3.1415;4;,\\}\n\\{numberFormat;100000;;;.\\}')
            }
        },
        parseFloat: {
            default: {
                description: t('Returns an floating point number from `text`. If it wasn\'t a number, returns `NaN`.'),
                exampleOut: t('NaN 12.34 1.2'),
                exampleCode: t('\\{parseFloat;abcd\\} \\{parseFloat;12.34\\} \\{parseFloat;1.2cd\\}')
            }
        },
        parseInt: {
            default: {
                description: t('Returns an integer from `text`. If it wasn\'t a number, returns `NaN`.'),
                exampleOut: t('NaN 1234 12'),
                exampleCode: t('\\{parseInt;abcd\\} \\{parseInt;1234\\} \\{parseInt;12cd\\}')
            }
        },
        randomInt: {
            default: {
                description: t('Chooses a random whole number between `min` and `max` (inclusive).'),
                exampleOut: t('You rolled a 5.'),
                exampleCode: t('You rolled a \\{randomInt;1;6\\}.')
            }
        },
        round: {
            default: {
                description: t('Rounds `number` to the nearest whole number.'),
                exampleOut: t('1'),
                exampleCode: t('\\{round;1.23\\}')
            }
        },
        roundDown: {
            default: {
                description: t('Rounds `number` down.'),
                exampleOut: t('1'),
                exampleCode: t('\\{roundDown;1.23\\}')
            }
        },
        roundUp: {
            default: {
                description: t('Rounds `number` up.'),
                exampleOut: t('2'),
                exampleCode: t('\\{roundUp;1.23\\}')
            }
        },
        delete: {
            description: t('Only custom commands can delete other messages.'),
            trigger: {
                description: t('Deletes the message that invoked the command'),
                exampleOut: t('(the message got deleted idk how to do examples for this)'),
                exampleCode: t('\\{//;The message that triggered this will be deleted\\} \\{delete\\}')
            },
            inCurrent: {
                description: t('Deletes the specified `messageId` from the current channel.'),
                exampleOut: t('(the message `111111111111111111` got deleted idk how to do examples for this)'),
                exampleCode: t('\\{//;The message with id `111111111111111111` will be deleted\\}\n\\{delete;111111111111111111\\}')
            },
            inOther: {
                description: t('Deletes the specified `messageId` from channel `channel`.'),
                exampleOut: t('(the message `2222222222222222` from channel `1111111111111111` got deleted)'),
                exampleCode: t('\\{//;The message with id `2222222222222222` from channel `1111111111111111` will be deleted\\}\n\\{delete;111111111111111111;2222222222222222\\}')
            }
        },
        edit: {
            description: t('`text` and `embed` can both be set to `_delete` to remove either the message content or embed.Please note that `embed` is the JSON for an embed object or an array of embed objects, don\'t put `\\{embed\\}` there, as nothing will show. Only messages created by the bot may be edited.'),
            inCurrentText: {
                description: t('Edits `messageId` in the current channel to say `text`'),
                exampleOut: t(''),
                exampleCode: t('\\{edit;111111111111111111;\\{embedBuild;title:Hello world\\}\\}')
            },
            inCurrentEmbed: {
                description: t('Edits `messageId` in the current channel to say `embed`'),
                exampleOut: t(''),
                exampleCode: t('\\{edit;111111111111111111;\\{embedBuild;title:Hello world\\}\\}')
            },
            inCurrentFull: {
                description: t('Edits `messageId` in the current channel to say `text` and `embed`'),
                exampleOut: t(''),
                exampleCode: t('\\{edit;111111111111111111;Hello world;\\{embedBuild;title:Foo bar\\}\\}')
            },
            inOtherText: {
                description: t('Edits `messageId` in `channelId` to say `text`'),
                exampleOut: t(''),
                exampleCode: t('\\{edit;111111111111111111;222222222222222222;Hello world\\}')
            },
            inOtherEmbed: {
                description: t('Edits `messageId` in `channelId` to say `embed`'),
                exampleOut: t(''),
                exampleCode: t('\\{edit;111111111111111111;222222222222222222;Hello world\\}')
            },
            inOtherFull: {
                description: t('Edits `messageId` in `channelId` to say `text` and `embed`'),
                exampleOut: t(''),
                exampleCode: t('\\{edit;111111111111111111;222222222222222222;Hello world;\\{embedBuild;title:Foo bar\\}\\}')
            }
        },
        embed: {
            default: {
                description: t('Takes whatever input you pass to `embed` and attempts to form an embed from it. `embed` must be a valid json embed object. Multiple embeds can be provided.\nThis subtag works well with `\\{embedBuild\\}`. If attempting to use inside of a `\\{send\\}`, `\\{edit\\}` or `\\{dm\\}`, you should not include `\\{embed\\}`, and instead just pass the content direct to `\\{send\\}`/`\\{edit\\}`/`\\{dm\\}`\nYou can find information about embeds [here (embed structure)](https://discordapp.com/developers/docs/resources/channel#embed-object) and [here (embed limits)](https://discordapp.com/developers/docs/resources/channel#embed-limits) as well as a useful tool for testing embeds [here](https://leovoel.github.io/embed-visualizer/)'),
                exampleOut: t('(an embed with "Hello!" as the title)'),
                exampleCode: t('\\{embed;\\{lb\\}"title":"Hello!"\\{rb\\}\\}')
            }
        },
        embedBuild: {
            description: t<{ keys: Iterable<string>; }>()('This tag is designed to allow you to generate embed code for `\\{webhook\\}` and `\\{embed\\}` with much less effort.\nThis tag uses a key/value system, with each entry in `values` looking like `key:value`.\n\nValid keys are:\n{keys#map(`{}`)#join(, )}\n\nYou can find information about embeds [here (embed structure)](https://discordapp.com/developers/docs/resources/channel#embed-object) and [here (embed limits)](https://discordapp.com/developers/docs/resources/channel#embed-limits) as well as a useful tool for testing embeds [here](https://leovoel.github.io/embed-visualizer/)'),
            default: {
                description: t('Builds the embed json'),
                exampleOut: t('\\{"title":"hello!","description":"I am an example embed","fields":[\\{"name":"Field 1","value":"This is the first field!"\\},\\{"name":"Field 2","value":"This is the next field and is inline!","inline":true\\}]\\}'),
                exampleCode: t('\\{embedBuild;\n  title:hello!;\n  description:I am an example embed;\n  fields.name:Field 1;\n  fields.value:This is the first field!;\n  fields.name:Field 2;\n  fields.value:This is the next field and is inline!;\n  fields.inline:true\n\\}')
            }
        },
        everyoneMention: {
            default: {
                description: t('Returns the mention of `@everyone`.\nThis requires the `disableeveryone` setting to be false. If `mention` is set to `true`, `@everyone` will ping, else it will be silent.'),
                exampleOut: t('@everyone'),
                exampleCode: t('\\{everyoneMention\\}')
            }
        },
        file: {
            default: {
                description: t('Sets the output attachment to the provided `file` and `filename`. If `file` starts with `buffer:`, the following text will be parsed as base64 to a raw buffer - useful for uploading images.'),
                exampleOut: t('(a file labeled readme.txt containing "Hello, world!")'),
                exampleCode: t('\\{file;Hello, world!;readme.txt\\}')
            }
        },
        hereMention: {
            default: {
                description: t('Returns the mention of `@here`.\nThis requires the `disableeveryone` setting to be false. If `mention` is set to `true`, `@here` will ping, else it will be silent.'),
                exampleOut: t('@here'),
                exampleCode: t('\\{hereMention\\}')
            }
        },
        messageAttachments: {
            trigger: {
                description: t('Returns an array of attachments of the invoking message.'),
                exampleOut: t('You sent the attachments "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"'),
                exampleCode: t('You sent the attachments "\\{messageAttachments\\}"')
            },
            inCurrent: {
                description: t('Returns an array of attachments of `messageId` in the current channel'),
                exampleOut: t('Someone sent a message with attachments: "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"'),
                exampleCode: t('Someone sent a message with attachments: "\\{messageAttachments;1111111111111\\}"')
            },
            inOther: {
                description: t('Returns an array of attachments of `messageId` from `channel`. If `quiet` is provided and `channel` cannot be found, this will return an empty array.'),
                exampleOut: t('Someone sent a message in #support with attachments: "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"'),
                exampleCode: t('Someone sent a message in #support with attachments: "\\{messageAttachments;support;1111111111111\\}"')
            }
        },
        messageEditTime: {
            description: t('If the message is not edited, this will return the current time instead.\n\n**Note:** there are plans to change this behaviour, but due to backwards-compatibility this remains unchanged.'),
            trigger: {
                description: t('Returns the edit time of the executing message in `format`'),
                exampleOut: t('The edit timestamp of your message is "1628782144703"'),
                exampleCode: t('The edit timestamp of your message is "\\{messageEditTime\\}"')
            },
            inCurrent: {
                description: t('Returns the edit time of `messageId` in `format`'),
                exampleOut: t('The edit timestamp of message 11111111111111 is "1628782144703"'),
                exampleCode: t('The edit timestamp of message 11111111111111 is "\\{messageEditTime;11111111111111\\}')
            },
            inOther: {
                description: t('Returns the edit time of `messageId` from `channel` in `format`.'),
                exampleOut: t('Message 11111111111111 in #support was edited at 18:09'),
                exampleCode: t('Message 11111111111111 in #support was edited at \\{messageEditTime;support;11111111111111;HH:mm\\}')
            }
        },
        messageEmbeds: {
            trigger: {
                description: t('Returns an array of embeds of the invoking message.'),
                exampleOut: t('You sent an embed: "[\\{"title":"Hello!"\\}]"'),
                exampleCode: t('You sent an embed: "\\{messageEmbeds\\}"')
            },
            inCurrent: {
                description: t('Returns an array of embeds of `messageId` in the current channel'),
                exampleOut: t('Someone sent a message with attachments: "[\\{"title":"Hello!"\\}]"'),
                exampleCode: t('Someone sent a message with embeds: "\\{messageEmbeds;1111111111111\\}"')
            },
            inOther: {
                description: t('Returns an array of embeds of `messageId` from `channel`. If `quiet` is provided and `channel` cannot be found, this will return an empty array.'),
                exampleOut: t('Someone sent a message in #support with embeds: "[\\{"title":"Hello!"\\}]"'),
                exampleCode: t('Someone sent a message in #support with embeds: "\\{messageEmbeds;support;1111111111111\\}"')
            }
        },
        messageId: {
            default: {
                description: t('Returns the id of the invoking message.'),
                exampleOut: t('The message id was 111111111111111111'),
                exampleCode: t('The message id was \\{messageId\\}')
            }
        },
        messageReply: {
            trigger: {
                description: t('Returns the id of the invoking message\'s parent message.'),
                exampleOut: t('You replied to the message 1111111111111'),
                exampleCode: t('You replied to the message \\{messageReply\\}')
            },
            inCurrent: {
                description: t('Returns the id of the parent message of the provided `message`.'),
                exampleOut: t('Someone replied to the message 1111111111111'),
                exampleCode: t('Someone replied to the message \\{messageReply;2222222222222\\}')
            },
            inOther: {
                description: t('Returns the id of the parent message of the provided `message`.'),
                exampleOut: t('Someone replied to the message 1111111111111'),
                exampleCode: t('Someone replied to the message \\{messageReply;general;2222222222222\\}')
            }
        },
        messageSender: {
            trigger: {
                description: t('Returns the id of the author of the executing message.'),
                exampleOut: t('That was sent by "1111111111111"'),
                exampleCode: t('That was sent by "\\{messageSender\\}"')
            },
            inCurrent: {
                description: t('Returns the id of the author of `messageId` in the current channel.'),
                exampleOut: t('Message 1111111111111 was sent by 2222222222222'),
                exampleCode: t('Message 1111111111111 was sent by \\{messageSender;1111111111111\\}')
            },
            inOther: {
                description: t('Returns the id of the author of `messageId` in `channel`. If `quiet` is provided and `channel` cannot be found, this will return nothing.'),
                exampleOut: t('Message 1111111111111 in #support was sent by 2222222222222'),
                exampleCode: t('Message 1111111111111 in #support was sent by \\{messageSender;support;1111111111111\\}')
            }
        },
        messageText: {
            trigger: {
                description: t('Returns the text of the executing message.'),
                exampleCode: t('You sent "b!t test You sent "\\{messageText\\}""`'),
                exampleOut: t('You sent "text"')
            },
            inCurrent: {
                description: t('Returns the text of `messageId` in the current channel.'),
                exampleOut: t('Message 1111111111111 contained: "Hello world!"'),
                exampleCode: t('Message 1111111111111 contained: "\\{messageText;1111111111111\\}"')
            },
            inOther: {
                description: t('Returns the text of `messageId` in `channel`. If `quiet` is provided and `channel` cannot be found, this will return nothing.'),
                exampleOut: t('Message 1111111111111 in #support contained: "Spooky Stuff"'),
                exampleCode: t('Message 1111111111111 in #support contained: "\\{messageText;support;1111111111111\\}"')
            }
        },
        messageTime: {
            trigger: {
                description: t('Returns the send time of the executing message in `format`'),
                exampleOut: t('The send timestamp of your message is "1628782144703"'),
                exampleCode: t('The send timestamp of your message is "\\{messageTime\\}"')
            },
            inCurrent: {
                description: t('Returns the send time of `messageId` in `format`'),
                exampleOut: t('The send timestamp of message 11111111111111 is "1628782144703"'),
                exampleCode: t('The send timestamp of message 11111111111111 is "\\{messageTime;11111111111111\\}')
            },
            inOther: {
                description: t('Returns the send time of `messageId` from `channel` in `format`.'),
                exampleOut: t('Message 11111111111111 in #support was sent at 18:09'),
                exampleCode: t('Message 11111111111111 in #support was sent at \\{messageTime;support;11111111111111;HH:mm\\}')
            }
        },
        messageType: {
            description: t('For more info about message types, visit the [discord docs]().'),
            trigger: {
                description: t('Returns the message type of the executing message.'),
                exampleOut: t('0'),
                exampleCode: t('\\{messageType\\}')
            },
            other: {
                description: t('`channel` defaults to the current channel.\n\nReturns the message type of `messageId` in `channel`'),
                exampleOut: t('19\n0'),
                exampleCode: t('\\{messageType;12345678912345;123465145791\\}\n\\{messageType;1234567891234\\}')
            }
        },
        output: {
            default: {
                description: t('Forces an early send of the default output message, using `text` as the text to show. If this is used then there will be no output sent once the tag finishes. Only 1 `\\{output\\}` may be used per tag/cc. If a second `\\{output\\}` is used then the result of the first `\\{output\\}` will be returned instead.\nThe message id of the output that was sent will be returned.'),
                exampleOut: t('Hello!'),
                exampleCode: t('\\{output;Hello!\\}')
            }
        },
        reactionAdd: {
            description: t('Please note that to be able to add a reaction, I must be on the server that you got that reaction from. If I am not, then I will return an error if you are trying to apply the reaction to another message.'),
            output: {
                description: t('Adds `reactions` to the output message of this tag.'),
                exampleOut: t('This will have reactions! (reacted with 🤔 and 👀)'),
                exampleCode: t('This will have reactions! \\{reactionAdd;🤔;👀\\}')
            },
            inCurrent: {
                description: t('Adds `reactions` to `messageId` in the current channel.'),
                exampleOut: t('(11111111111111111 now has reactions 🤔 and 👀)'),
                exampleCode: t('\\{reactionAdd;11111111111111111;🤔;👀\\}')
            },
            inOther: {
                description: t('Adds `reactions` to `messageId` in `channelId`. `channelId` must be an id, use of `\\{channelId\\} is advised`.'),
                exampleOut: t('(22222222222222222 in 11111111111111111 now has reactions 🤔 and 👀)'),
                exampleCode: t('\\{reactionAdd;11111111111111111;22222222222222222;🤔;👀\\}')
            }
        },
        reaction: {
            default: {
                description: t('Gets the reaction that triggered \\{waitReaction\\}'),
                exampleOut: t('["111111111111111","12345678912345","3333333333333","✅"]'),
                exampleCode: t('\\{waitReaction;11111111111111111;\\{bool;\\{reaction\\};==;✅\\}\\}')
            }
        },
        reactionUser: {
            default: {
                description: t('Gets the user whose reaction that triggered \\{waitReaction\\}'),
                exampleOut: t('["111111111111111","12345678912345","3333333333333","✅"]'),
                exampleCode: t('\\{waitReaction;11111111111111111;\\{bool;\\{reactionUser\\};==;3333333333333\\}\\}')
            }
        },
        reactionList: {
            reactions: {
                description: t('Returns an array of reactions on `messageId` in `channelId`.'),
                exampleOut: t('["🤔", "👀"]'),
                exampleCode: t('\\{reactionList;111111111111111111\\}')
            },
            users: {
                description: t('Returns an array of users who reacted `reactions` on `messageId` in `channelId`. A user only needs to react to one reaction to be included in the resulting array.'),
                exampleOut: t('["278237925009784832", "134133271750639616"]\n["134133271750639616"]'),
                exampleCode: t('\\{reactionList;111111111111111111;🤔;👀\\}\n\\{reactionList;222222222222222222;111111111111111111;👀\\}')
            }
        },
        reactionRemove: {
            all: {
                description: t('Removes all reactions of the executing user from `messageId` in `channel`.'),
                exampleOut: t('(removed all reactions on 12345678901234)'),
                exampleCode: t('\\{reactionRemove;12345678901234\\}')
            },
            user: {
                description: t('Removes `reactions` `user` reacted on `messageId` in `channel`.'),
                exampleOut: t('(removed the 🤔 reaction on 12345678901234 from user 111111111111111111)'),
                exampleCode: t('\\{reactionRemove;12345678901234;111111111111111111;🤔\\}')
            }
        },
        reactionRemoveAll: {
            default: {
                description: t('Removes all reactions from `messageId`.\n`channelId` defaults to the current channel.'),
                exampleOut: t('(removed all the reactions)'),
                exampleCode: t('\\{reactionRemoveAll;12345678901234;:thinking:\\}')
            }
        },
        send: {
            description: t('If `embed` is an array, multiple embeds will be added to the message payload.'),
            full: {
                description: t('Sends `message` and `embed` to `channel` with an attachment, and returns the message id. `channel` is either an id or channel mention. If `fileContent` starts with `buffer:` then the following text will be parsed as base64 to a raw buffer.\n**Note:** `embed` is the JSON for an embed, don\'t put the `\\{embed\\}` subtag there, as nothing will show'),
                exampleOut: t('23946728937462847243'),
                exampleCode: t('\\{send;\\{channelId\\};Hello there!;\\{embedBuild;title:This is a cool embed\\};Wow, look at this text file!;test.txt\\}')
            },
            textAndEmbed: {
                description: t('Sends `message` and `embed` to `channel`, and returns the message id. `channel` is either an id or channel mention.\n**Note:** `embed` is the JSON for an embed, don\'t put the `\\{embed\\}` subtag there, as nothing will show'),
                exampleOut: t('349587638464585678545'),
                exampleCode: t('\\{send;\\{channelId\\};Hello there!;\\{embedBuild;title:This is a cool embed\\}\\}')
            },
            textOrEmbed: {
                description: t('Sends `content` to `channel`, and returns the message id. `channel` is either an id or channel mention.\n**Note:** `content` is the text to send or the JSON for an embed, don\'t put the `\\{embed\\}` subtag there, as nothing will show'),
                exampleOut: t('9458678957457694324'),
                exampleCode: t('\\{send;\\{channelId\\};\\{embedBuild;title:This is a cool embed\\}')
            }
        },
        waitMessage: {
            description: t<{ disabled: Iterable<string>; }>()('Pauses the command until one of the given users sends a message in any of the given channels. When a message is sent, `condition` will be run to determine if the message can be accepted. If no message has been accepted within `timeout` then the subtag returns `Wait timed out`, otherwise it returns an array containing the channel id, then the message id. \n\n`channels` defaults to the current channel.\n`users` defaults to the current user.\n`condition` must return `true` or `false`\n`timeout` is a number of seconds. This is limited to 300\n\n While inside the `condition` parameter, none of the following subtags may be used: {disabled#map(`{}`)#join(, )}\nAlso, the current message becomes the users message that is to be checked. This means that `\\{channelId\\}`, `\\{messageId\\}`, `\\{userId\\}` and all related subtags will change their values.'),
            default: {
                description: t('Pauses the command until the executing user sends a message in the current channel.'),
                exampleOut: t('["111111111111111","2222222222222"]'),
                exampleCode: t('\\{waitMessage\\}')
            },
            filtered: {
                description: t('Pauses the command until `condition` returns true when one of `userIds` sends a message in one of `channelIds`.'),
                exampleOut: t('["111111111111111", "103347843934212096"]'),
                exampleCode: t('\\{waitMessage;111111111111111;\\{userId;stupid cat\\};\\{bool;\\{username\\};startswith;stupid\\};50\\}')
            }
        },
        waitReaction: {
            description: t<{ disabled: Iterable<string>; }>()('Pauses the command until one of the given `users` adds any given `reaction` on any of the given `messages`. When a `reaction` is added, `condition` will be run to determine if the reaction can be accepted. If no reaction has been accepted within `timeout` then the subtag returns `Wait timed out`, otherwise it returns an array containing the channel id, the message id, the user id and the reaction, in that order. \n\n`userIds` defaults to the current user if left blank or omitted.\n`reactions` defaults to any reaction if left blank or omitted.\n`condition` must return `true` or `false`\n`timeout` is a number of seconds. This is limited to 300\n\n While inside the `condition` parameter, none of the following subtags may be used: {disabled#map(`{}`)#join(, )}\nAlso, the current message becomes the message the reaction was added to, and the user becomes the person who sent the message. This means that `\\{channelId\\}`, `\\{messageId\\}`, `\\{userId\\}` and all related subtags will change their values.\nFinally, while inside the `condition` parameter, you can use the temporary subtag `\\{reaction\\}` to get the current reaction and the `\\{reactionUser\\}` temporary subtag to get the user who reacted.\n`messages`, `users` and `reactions` can either be single values eg: `\\{waitReaction;1234567891234;stupid cat;🤔\\}`, or they can be arrays eg: `\\{waitReaction;["1234567891234","98765432219876"];stupid cat;["🤔"]\\}'),
            default: {
                description: t('Waits for any reaction on `messages` from the executing user or `userIds` if provided.'),
                exampleIn: t('(reaction is added)'),
                exampleOut: t('["111111111111111","12345678912345","3333333333333","🤔"]'),
                exampleCode: t('\\{waitReaction;12345678912345;stupid cat\\}')
            },
            filtered: {
                description: t('Waits for any of `reactions` on `messages` from `userIds`, if `condition` returns `true` this will return the response array. If no reaction was matched within `timeout`, `Wait timed out` will be returned.'),
                exampleIn: t('(some random user reacted with 🤔)\n(blargbot reacted with 🤔)'),
                exampleOut: t('["111111111111111","12345678912345","134133271750639616","🤔"]'),
                exampleCode: t('\\{waitReaction;12345678912345;["\\{userId;stupid cat\\}","\\{userId;blargbot\\}"];["🤔", "👀"];;120\\}')
            }
        },
        webhook: {
            description: t('Please assign your webhook credentials to private variables! Do not leave them in your code.\n`embed` can be an array of embed objects.'),
            empty: {
                description: t('Executes a webhook.'),
                exampleOut: t('Error executing webhook: Cannot send an empty message'),
                exampleCode: t('\\{webhook;1111111111111111;t.OK-en\\}')
            },
            default: {
                description: t('Executes a webhook. If `embed` is provided it must be provided in a raw JSON format, properly escaped for BBTag. Using `\\{json\\}` is advised.'),
                exampleOut: t('(in the webhook channel) This is the webhook content! (and with an embed with the title "This is the embed title" idk how to make this example)'),
                exampleCode: t('\\{webhook;1111111111111111;t.OK-en;This is the webhook content!;\\{json;\\{"title":"This is the embed title!"\\}\\}\\}')
            },
            withUser: {
                description: t('Executes a webhook. `avatarURL` must be a valid URL.'),
                exampleOut: t('(in the webhook channel) Some content! (sent by "Not blargbot" with blargbot\'s pfp'),
                exampleCode: t('\\{webhook;1111111111111111;t.OK-en;Some content!;;Not blargbot;\\{userAvatar;blargbot\\}\\}')
            },
            withFile: {
                description: t('Executes a webhook. If file starts with buffer:, the following text will be parsed as base64 to a raw buffer.'),
                exampleOut: t('(in the webhook channel a file labeled readme.txt containing "Hello, world!")'),
                exampleCode: t('\\{webhook;1111111111111111;t.OK-en;;;;;Hello, world!;readme.txt\\}')
            }
        },
        base64Decode: {
            default: {
                description: t('Converts the provided base64 to a UTF-8 string.'),
                exampleOut: t('Fancy!'),
                exampleCode: t('\\{base64decode;RmFuY3kh\\}')
            }
        },
        base64Encode: {
            default: {
                description: t('Converts the provided text to base64.'),
                exampleOut: t('RmFuY3kh!'),
                exampleCode: t('\\{base64decode;Fancy!\\}')
            }
        },
        bool: {
            default: {
                description: t<{ operators: Iterable<string>; }>()('Evaluates `arg1` and `arg2` using the `evaluator` and returns `true` or `false`. Valid evaluators are {operators#map(`{}`)#join(, | and )}\nThe positions of `evaluator` and `arg1` can be swapped.'),
                exampleOut: t('true'),
                exampleCode: t('\\{bool;5;<=;10\\}')
            }
        },
        brainfuck: {
            default: {
                description: t('Interprets `code` as brainfuck, using `input` as the text for `,`.'),
                exampleOut: t('Hello World!'),
                exampleCode: t('\\{brainfuck;-[------->+<]>-.-[->+++++<]>++.+++++++..+++.[--->+<]>-----.---[->+++<]>.-[--->+<]>---.+++.------.--------.-[--->+<]>.\\}')
            }
        },
        capitalize: {
            ignoreRest: {
                description: t('Capitalizes the first letter of `text`, leaves the rest of the text untouched.'),
                exampleOut: t('Hello world!\nHELLO world'),
                exampleCode: t('\\{capitalize;hello world!\\}\n\\{capitalize;hELLO world\\}')
            },
            restLower: {
                description: t('Capitalizes the first letter of `text`, and converts the rest to lowercase.'),
                exampleOut: t('Hello world\nHello world\nFoo bar'),
                exampleCode: t('\\{capitalize;hELLO WORLD;true\\}\n\\{capitalize;hello WORLD;anything goes here\\}\n\\{capitalize;foo BAR;\\}')
            }
        },
        choose: {
            default: {
                description: t('Chooses from the given `options`, where `choice` is the index of the option to select.'),
                exampleOut: t('I feel like eating pie today.'),
                exampleCode: t('I feel like eating \\{choose;1;cake;pie;pudding\\} today.')
            }
        },
        clean: {
            default: {
                description: t('Removes all duplicated whitespace from `text`, meaning a cleaner output.'),
                exampleOut: t('Hello!\nIm here to help'),
                exampleCode: t('\\{clean;Hello!  \n\n  Im     here    to help\\}')
            }
        },
        color: {
            description: t('If `inputFormat` is omitted or left empty, the format of `color` is automatically calculated, but might be inaccurate. For accuracy and known `color` formats use `inputFormat`. It converts all ways between `rgb`, `hsl`, `hsv`, `hwb`, `cmyk`, `ansi16`, `hex` strings, and CSS `keyword`s (will round to closest).'),
            default: {
                description: t('Converts a color to `outputFormat`.'),
                exampleOut: t('[66,134,244]'),
                exampleCode: t('\\{color;#4286f4;RGB\\}')
            },
            convert: {
                description: t('Converts a color of `inputFormat` to `outputFormat`. If `inputFormat` is left empty, it will be automatically calculated.'),
                exampleOut: t('#4286f4'),
                exampleCode: t('\\{color;[66,134,244];hex;RGB\\}')
            }
        },
        comment: {
            default: {
                description: t('Does nothing. Your code is simply ignored.'),
                exampleOut: t('This is a sentence.'),
                exampleCode: t('This is a sentence. \\{//;This is a comment.\\}')
            }
        },
        decancer: {
            default: {
                description: t('Returns the decancered version of `text`.'),
                exampleOut: t('haha im so edgy'),
                exampleCode: t('\\{decancer;ḩ̸̪̓̍a̶̗̤̎́h̵͉͓͗̀ā̷̜̼̄ ̷̧̓í̴̯̎m̵͚̜̽ ̸̛̝ͅs̴͚̜̈o̴̦̗̊ ̷͎͋ȩ̵͐d̶͎̂̇g̴̲͓̀͝y̶̠̓̿\\}')
            }
        },
        escapeBBTag: {
            default: {
                description: t('Returns `input` without resolving any BBTagThis effectively returns the characters `\\{`, `\\}` and `;` as is, without the use of `\\{rb\\}`, `\\{lb\\}` and `\\{semi\\}`.\n**NOTE:** Brackets inside code must come in pairs. A `\\{` has to be followed by a `\\}` somewhere and a `\\} has to have a \\{` before it'),
                exampleOut: t('\\{set;~index;1\\}'),
                exampleCode: t('\\{escapeBBTag;\\{set;~index;1\\}\\}')
            }
        },
        hash: {
            basic: {
                description: t('Returns the numeric hash of `text`, based on the unicode value of each individual character. This results in seemingly randomly generated numbers that are constant for each specific query.\nNOTE: This hash isn\'t a particularly robust one, it is a quick implementation that was thrown together. To use a proper hash function, specify the `algorithm`'),
                exampleOut: t('The hash of brown is 94011702.'),
                exampleCode: t('The hash of brown is \\{hash;brown\\}.')
            },
            secure: {
                description: t<{ methods: Iterable<string>; }>()('Performs a hash on the given `text`. If the `text` starts with `buffer:` then it will first be decoded as a base64 string. If it starts with `text:` then it will be treated as plaintext. The hash result will be returned as a hex number.\nSupported `algorithm`s are: {methods#map(`{}`)#join(, )}'),
                exampleOut: t('The hash of brown is 5eb67f9f8409b9c3f739735633cbdf92121393d0e13bd0f464b1b2a6a15ad2dc'),
                exampleCode: t('\\{hash;sha256;brown\\}')
            }
        },
        htmlDecode: {
            default: {
                description: t('Decodes html entities from `text`.'),
                exampleOut: t('<hello, world>'),
                exampleCode: t('\\{htmlDecode;&lt;hello, world&gt;\\}')
            }
        },
        htmlEncode: {
            default: {
                description: t('Encodes `text` with escaped html entities.'),
                exampleOut: t('&lt;hello, world&gt;'),
                exampleCode: t('\\{htmlEncode;<hello, world>\\}')
            }
        },
        if: {
            description: t<{ operators: Iterable<string>; }>()('If `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. If they are not provided, `value1` is read as `true` or `false`. If the resulting value is `true` then the tag returns `then`, otherwise it returns `else`.\nValid evaluators are {operators#map(`{}`)#join(, | and )}.'),
            value: {
                description: t('If `boolean` is `true`, return `then`, else do nothing.'),
                exampleOut: t('This is a custom command!'),
                exampleCode: t('\\{if;\\{isCustomCommand\\};This is a custom command!\\}')
            },
            valueElse: {
                description: t('If `boolean` is `true`, return `then`, else execute `else`'),
                exampleOut: t('This isn\'t a custom command!'),
                exampleCode: t('\\{if;\\{isCustomCommand\\};This is a custom command!;This isn\'t a custom command!\\}')
            },
            conditionThen: {
                description: t('`Value1` is evaluated against `value2` using `evaluator`, if the resulting value is `true` then the tag returns `then`.'),
                exampleOut: t('Hi stupid cat!'),
                exampleCode: t('\\{if;\\{userId\\};==;103347843934212096;Hi stupid cat!\\}')
            },
            conditionElse: {
                description: t('`Value1` is evaluated against `value2` using `evaluator`, if the resulting value is `true` then the tag returns `then`, otherwise it returns `else`'),
                exampleOut: t('Who are you stranger?'),
                exampleCode: t('\\{if;\\{userId\\};==;103347843934212096;Hi stupid cat!;Who are you stranger?\\}')
            }
        },
        indexOf: {
            default: {
                description: t('Finds the index of `searchFor` in `text|array`, after `start`. `text|array` can either be plain text or an array. If it\'s not found, returns -1.'),
                exampleOut: t('The index of "o" in "hello world" is 4'),
                exampleCode: t('The index of "o" in "hello world" is \\{indexof;hello world;o\\}')
            }
        },
        lang: {
            default: {
                description: t('Specifies which `language` should be used when viewing the raw of this tag'),
                exampleOut: t('This will be displayed with js!.'),
                exampleCode: t('This will be displayed with js! \\{lang;js\\}.')
            }
        },
        length: {
            default: {
                description: t('Gives the amount of characters in `value`, or the number of elements if it is an array.'),
                exampleIn: t('Hello'),
                exampleOut: t('What you said is 5 chars long.'),
                exampleCode: t('What you said is \\{length;\\{args\\}\\} chars long.')
            }
        },
        logic: {
            default: {
                description: t<{ operators: Iterable<string>; }>()('Accepts 1 or more boolean `values` (`true` or `false`) and returns the result of `operator` on them. Valid logic operators are {operators#map(`{}`)#join(, | and )}.See `\\{operators\\}` for a shorter way of performing logic operations.'),
                exampleOut: t('false'),
                exampleCode: t('\\{logic;&&;true;false\\}')
            }
        },
        lower: {
            default: {
                description: t('Returns `text` as lowercase.'),
                exampleOut: t('this will become lowercase'),
                exampleCode: t('\\{lower;THIS WILL BECOME LOWERCASE\\}')
            }
        },
        md5: {
            default: {
                description: t('Converts the provided text to md5.'),
                exampleOut: t('71d97a11f770a34d7f8cf1f1d8749d85'),
                exampleCode: t('\\{md5;Woosh whap phew!\\}')
            }
        },
        newline: {
            default: {
                description: t('Will be replaced by `count` newline characters (\\n).'),
                exampleOut: t('Hello,\nworld!'),
                exampleCode: t('Hello,\\{newline\\}world!')
            }
        },
        operator: {
            ['%']: {
                description: t('Returns the remainder after dividing each pair of `value`s.'),
                exampleOut: t('4 1 0'),
                exampleCode: t('\\{%;24;5\\} \\{%;24;5;3\\} \\{%;19;5;4\\}')
            },
            ['*']: {
                description: t('Returns the result from multiplying all the `value`s together'),
                exampleOut: t('24'),
                exampleCode: t('\\{*;1;2;3;4\\}')
            },
            ['+']: {
                description: t('Returns the result from summing all the `values`s together'),
                exampleOut: t('10'),
                exampleCode: t('\\{+;1;2;3;4\\}')
            },
            ['-']: {
                description: t('Returns the result from subtracting all the `value`s from the first'),
                exampleOut: t('-2'),
                exampleCode: t('\\{-;4;3;2;1\\}')
            },
            ['/']: {
                description: t('Returns the result from dividing the first `value` by all the rest'),
                exampleOut: t('5 2'),
                exampleCode: t('\\{/;5\\} \\{/;120;5;4;3\\}')
            },
            ['^']: {
                description: t('Returns the result of raising the first `value` to the power of all the rest'),
                exampleOut: t('8 256'),
                exampleCode: t('\\{^;2;3\\} \\{^;2;2;2;2\\}')
            },
            ['<']: {
                description: t('Returns `true` if each `value` is less than the value after it, otherwise `false`'),
                exampleOut: t('false false false true'),
                exampleCode: t('\\{<;a\\} \\{<;a;b;c;c\\} \\{<;1;2;3;4;2\\} \\{<;a;b;c;d\\}')
            },
            ['<=']: {
                description: t('Returns `true` if each `value` is less than or equal to the value after it, otherwise `false`'),
                exampleOut: t('false true false true'),
                exampleCode: t('\\{<=;a\\} \\{<=;a;b;c;c\\} \\{<;1;2;3;4;2\\} \\{<=;a;b;c;d\\}')
            },
            ['!=']: {
                description: t('Returns `true` if all pairs of `value`s are not equal'),
                exampleOut: t('true true false'),
                exampleCode: t('\\{!=;a;b;c\\} \\{!=;a;b;a\\} \\{!=;a;a;b\\}')
            },
            ['==']: {
                description: t('Returns `true` if all `value`s are equal, otherwise `false`'),
                exampleOut: t('false false false true'),
                exampleCode: t('\\{==;a;b;c\\} \\{==;a;b;a\\} \\{==;a;a;b\\} \\{==;a;a;a;a;a\\}')
            },
            ['>']: {
                description: t('Returns `true` if each `value` is greater than the value after it, otherwise `false`'),
                exampleOut: t('false false false true'),
                exampleCode: t('\\{>;a\\} \\{>;c;c;b;a\\} \\{>;2;4;3;2;1\\} \\{>;d;c;b;a\\}')
            },
            ['>=']: {
                description: t('Returns `true` if each `value` is greater than or equal to the value after it, otherwise `false`'),
                exampleOut: t('false true false true'),
                exampleCode: t('\\{>=;a\\} \\{>=;c;c;b;a\\} \\{>=;2;4;3;2;1\\} \\{>=;d;c;b;a\\}')
            },
            ['!']: {
                description: t('Inverts a boolean `value`. All values after the first one are ignored.'),
                exampleOut: t('false true'),
                exampleCode: t('\\{!;true\\} \\{!;false\\}')
            },
            ['&&']: {
                description: t('Returns `true` if all of the `value`s are `true`, otherwise `false`'),
                exampleOut: t('true false'),
                exampleCode: t('\\{&&;true;true\\} \\{&&;true;false;true\\}')
            },
            ['||']: {
                description: t('Returns `true` if any of the `value`s are `true`, otherwise `false`'),
                exampleOut: t('false true'),
                exampleCode: t('\\{||;false;false\\} \\{||;true;false;true\\}')
            },
            ['xor']: {
                description: t('Returns `true` if exactly 1 of the `value`s are `true`, otherwise `false`'),
                exampleOut: t('false false true'),
                exampleCode: t('\\{^;false;false\\} \\{^;true;false;true\\} \\{^;false;true;false\\}')
            },
            ['contains']: {
                description: t('Returns `true` if the first `value` contains all the rest. If the first `value` is an array then the array must contain all the remaining values.'),
                exampleOut: t('true false'),
                exampleCode: t('\\{contains;abcdefghi;abc\\} \\{contains;["abc","def","ghi"];","\\}')
            },
            ['includes']: {
                description: t('Returns `true` if the first `value` contains all the rest. If the first `value` is an array then the array must contain all the remaining values.'),
                exampleOut: t('true false'),
                exampleCode: t('\\{includes;abcdefghi;abc\\} \\{includes;["abc","def","ghi"];","\\}')
            },
            ['endswith']: {
                description: t('Returns `true` if the first `value` ends with all the rest. If the first `value` is an array then the last element must equal all the remaining values.'),
                exampleOut: t('true false'),
                exampleCode: t('\\{endswith;abcdefghi;ghi;hi\\} \\{endswith;["abc","def","ghi"];"]\\}')
            },
            ['startswith']: {
                description: t('Returns `true` if the first `value` starts with all the rest. If the first `value` is an array then the first element must equal all the remaining values.'),
                exampleOut: t('true false'),
                exampleCode: t('\\{startswith;abcdefghi;a;abcd;abc\\} \\{startswith;["abc","def","ghi"];["\\}')
            }
        },
        pad: {
            default: {
                description: t('Places `text` on top of `back` with it being aligned to the opposite of `direction`. If `text` is longer than `back` then it will simply overlap'),
                exampleOut: t('000ABC'),
                exampleCode: t('\\{pad;left;000000;ABC\\}')
            }
        },
        randomChoose: {
            array: {
                description: t('Picks one random entry from `choiceArray`.'),
                exampleOut: t('I feel like eating pie today'),
                exampleCode: t('I feel like eating \\{randomChoose;["pie", "cake", "pudding"]\\} today')
            },
            args: {
                description: t('Picks one random entry from `choices`'),
                exampleOut: t('I feel like eating pudding today.'),
                exampleCode: t('I feel like eating \\{randomChoose;cake;pie;pudding\\} today')
            }
        },
        randomString: {
            default: {
                description: t('Creates a random string with characters from `chars` that is `length` characters long.'),
                exampleOut: t('kgzyqcvda'),
                exampleCode: t('\\{randomString;abcdefghijklmnopqrstuvwxyz;9\\}')
            }
        },
        realPad: {
            default: {
                description: t('Pads `text` using space until it has `length` characters. Spaces are added on the right side.'),
                exampleOut: t('Hello      world!'),
                exampleCode: t('\\{realPad;Hello;10\\} world!')
            },
            withDirection: {
                description: t('Pads `text` using `filler` until it has `length` characters. `filler` is applied to the  `direction` of `text`.'),
                exampleOut: t('000ABC'),
                exampleCode: t('\\{realPad;ABC;6;0;left\\}')
            }
        },
        regexMatch: {
            default: {
                description: t('Returns an array of everything in `text` that matches `regex`. Any bbtag in `regex` will not be resolved. Please consider using `\\{apply\\}` for a dynamic regex. `regex` will only succeed to compile if it is deemed a safe regular expression (safe regexes do not run in exponential time for any input)'),
                exampleOut: t('["1", "25"]'),
                exampleCode: t('\\{regexMatch;I have $1 and 25 cents;/\\d+/g\\}')
            }
        },
        regexReplace: {
            description: t('Any bbtag in `regex` will not be resolved. Please consider using `\\{apply\\}` for a dynamic regex. `regex` will only succeed to compile if it is deemed a safe regular expression (safe regexes do not run in exponential time for any input)'),
            output: {
                description: t('Replaces the `regex` phrase with `replaceWith`. This is executed on the output of the containing tag.'),
                exampleOut: t('I like to eat pie.'),
                exampleCode: t('I like to eat cheese. \\{regexReplace;/cheese/;pie\\}')
            },
            text: {
                description: t('Replace the `regex` phrase with `replaceWith`. This is executed on `text`.'),
                exampleOut: t('I likn ta cansumn chnnsn.'),
                exampleCode: t('I like \\{regexReplace;to consume;/o/gi;a\\} cheese. \\{regexReplace;/e/gi;n\\}')
            }
        },
        regexSplit: {
            default: {
                description: t('Splits the given text using the given `regex` as the split rule. Any bbtag in `regex` will not be resolved. Please consider using `\\{apply\\}` for a dynamic regex. `regex` will only succeed to compile if it is deemed a safe regular expression (safe regexes do not run in exponential time for any input)'),
                exampleOut: t('["Hello","there","I","am","hungry"]'),
                exampleCode: t('\\{regexSplit;Hello      there, I       am hungry;/[\\s,]+/\\}')
            }
        },
        regexTest: {
            default: {
                description: t('Tests if the `regex` phrase matches the `text`, and returns a boolean (true/false). Any bbtag in `regex` will not be resolved. Please consider using `\\{apply\\}` for a dynamic regex. `regex` will only succeed to compile if it is deemed a safe regular expression (safe regexes do not run in exponential time for any input)'),
                exampleOut: t('true false'),
                exampleCode: t('\\{regexTest;apple;/p+/i\\} \\{regexTest;banana;/p+/i\\}')
            }
        },
        replace: {
            output: {
                description: t('Replaces the first occurrence of `phrase` with `replaceWith`. This is executed on the output from the containing tag.'),
                exampleOut: t('Bye world!'),
                exampleCode: t('Hello world! \\{replace;Hello;Bye\\}')
            },
            text: {
                description: t('Replaces the first occurrence of `phrase` in `text` with `replaceWith`.'),
                exampleOut: t('I like to nom ham. ham'),
                exampleCode: t('I like \\{replace;to eat;eat;nom\\} cheese. \\{replace;cheese;ham\\}')
            }
        },
        reverse: {
            default: {
                description: t('Reverses the order of `text`. If `text` is an array, the array will be reversed. If `\\{get\\}` is used with an array, this will modify the original array.'),
                exampleOut: t('emordnilap'),
                exampleCode: t('\\{reverse;palindrome\\}')
            }
        },
        space: {
            default: {
                description: t('Will be replaced by `count` spaces. If `count` is less than `0`, no spaces will be returned.'),
                exampleOut: t('Hello,    world!'),
                exampleCode: t('Hello,\\{space;4\\}world!')
            }
        },
        substring: {
            default: {
                description: t('Returns all text from `text` between the `start` and `end`. `end` defaults to the length of text.'),
                exampleOut: t('Hello r!'),
                exampleCode: t('Hello \\{substring;world;2;3\\}!')
            }
        },
        switch: {
            default: {
                description: t('Compares `value` against each `case` and executes the first `then` that matches. If no matches are found, `default` is executed. Each `case` can optionally be an array to allow matching against multiple values.'),
                exampleIn: t('hit Danny'),
                exampleOut: t('Got it, i\'ll hit Danny for you!'),
                exampleCode: t('\\{switch;\\{args;0\\};\n  hi;Hello!;\n  ["punch","bop","hit"];Got it, i\'ll hit \\{args;1\\} for you!;\n  I don\'t know how to do that!\n\\}')
            }
        },
        time: {
            description: t('If you provide `time`, you should also provide `parseFormat` to ensure it is being interpreted correctly.\nSee the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more format information.\nSee [here](http://momentjs.com/docs/#/parsing/) for parsing documentation. See [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) for a list of timezone codes.'),
            default: {
                description: t('`time` is in `fromTimezone` and converted to `toTimezone` using `format`.'),
                exampleOut: t('Time Berlin (as toTimezone): 23:33\nBerlin from UTC 12:00: 13:00\nBerlin (as fromTimezone): 23:33\nBerlin (as fromTimezone and empty toTimezone): 21:33\nNew York from Berlin (12:00 in Berlin): 06:00'),
                exampleCode: t('Berlin (as toTimezone): \\{time;HH:mm;;;;Europe/Berlin\\}\nBerlin from UTC 12:00: \\{time;HH:mm;12:00;HH:mm;;Europe/Berlin\\}\nBerlin (as fromTimezone): \\{time;HH:mm;;;Europe/Berlin\\}\nBerlin (as fromTimezone and empty toTimezone): \\{time;HH:mm;;;Europe/Berlin;\\}\nNew York from Berlin (12:00 in Berlin): \\{time;HH:mm;12:00;HH:mm;Europe/Berlin;America/New_York\\}')
            }
        },
        trim: {
            default: {
                description: t('Trims whitespace and newlines before and after `text`.'),
                exampleOut: t('Hello beautiful World'),
                exampleCode: t('Hello \\{trim;\\{space;10\\}beautiful\\{space;10\\}\\} World')
            }
        },
        unindent: {
            default: {
                description: t('Unindents text (or code!). If no level is provided, attempts to guess the indentation level past the first line.'),
                exampleOut: t('```\nhello\nworld\n```'),
                exampleCode: t('```\n\\{unindent;\n  hello\n  world\n\\}\n```')
            }
        },
        upper: {
            default: {
                description: t('Returns `text` as uppercase.'),
                exampleOut: t('THIS WILL BECOME UPPERCASE'),
                exampleCode: t('\\{upper;this will become uppercase\\}')
            }
        },
        uriDecode: {
            default: {
                description: t('Decodes `text` from URI format.'),
                exampleOut: t('Hello world!'),
                exampleCode: t('\\{uriDecode;Hello%20world\\}')
            }
        },
        uriEncode: {
            default: {
                description: t('Encodes `text` in URI format. Useful for constructing links.'),
                exampleOut: t('Hello%20world!'),
                exampleCode: t('\\{uriEncode;Hello world!\\}')
            }
        },
        void: {
            default: {
                description: t('Executes `code` but does not return the output from it. Useful for silent functionality'),
                exampleOut: t(''),
                exampleCode: t('\\{void;This won\'t be output!\\}')
            }
        },
        roleAdd: {
            description: t('`role` can be either a roleId or role mention.'),
            target: {
                description: t('Gives the executing user `role`. Returns `true` if role was given, else an error will be shown.'),
                exampleOut: t('Have a role! true'),
                exampleCode: t('Have a role! \\{roleAdd;11111111111111111\\}')
            },
            other: {
                description: t('Gives `user` the chosen `role`. Returns `true` if role was given, else an error will be shown. If `quiet` is specified, if a user can\'t be found it will simply return `false`'),
                exampleOut: t('Stupid cat have a role! true'),
                exampleCode: t('Stupid cat have a role! \\{roleAdd;Bot;Stupid cat\\}')
            }
        },
        roleColor: {
            default: {
                description: t('Returns `role`\'s hex color code. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.'),
                exampleOut: t('The admin role id is: #1b1b1b.'),
                exampleCode: t('The admin role color is: #\\{roleColor;admin\\}.')
            }
        },
        roleCreate: {
            default: {
                description: t('`color` can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number. Provide `permissions` as a number, which can be calculated [here](https://discordapi.com/permissions.html) `hoisted` is if the role should be displayed separately from other roles.\nReturns the new role\'s id.'),
                exampleOut: t('1298731238361728931'),
                exampleCode: t('\\{roleCreate;myNewRole;red\\}')
            }
        },
        roleDelete: {
            default: {
                description: t('Deletes `role`. If `quiet` is specified, if `role` can\'t be found it will return nothing.\nWarning: this subtag is able to delete roles managed by integrations.'),
                exampleOut: t('(rip no more super cool roles for anyone)'),
                exampleCode: t('\\{roleDelete;Super Cool Role!\\}')
            }
        },
        roleId: {
            default: {
                description: t('Returns `role`\'s id. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.'),
                exampleOut: t('The admin role id is: 123456789123456.'),
                exampleCode: t('The admin role id is: \\{roleId;admin\\}.')
            }
        },
        roleMembers: {
            default: {
                description: t('Returns an array of members in `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.'),
                exampleOut: t('The admins are: ["11111111111111111","22222222222222222"].'),
                exampleCode: t('The admins are: \\{roleMembers;Admin\\}.')
            }
        },
        roleMention: {
            default: {
                description: t('Returns a mention of `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.'),
                exampleOut: t('The admin role will be mentioned: @Administrator'),
                exampleCode: t('The admin role will be mentioned: \\{roleMention;Admin\\}')
            }
        },
        roleName: {
            default: {
                description: t('Returns `role`\'s name. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.'),
                exampleOut: t('The admin role name is: Administrator.'),
                exampleCode: t('The admin role name is: \\{roleName;admin\\}.')
            }
        },
        rolePermissions: {
            default: {
                description: t('Returns `role`\'s permission number. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.'),
                exampleOut: t('The admin role\'s permissions are: 8.'),
                exampleCode: t('The admin role\'s permissions are: \\{rolePermissions;admin\\}.')
            }
        },
        rolePosition: {
            default: {
                description: t('Returns the position of `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.\n**Note**: the highest role will have the highest position, and the lowest role will have the lowest position and therefore return `0` (`@everyone`).'),
                exampleOut: t('The position of Mayor is 10'),
                exampleCode: t('The position of Mayor is \\{rolePosition;Mayor\\}')
            }
        },
        roleRemove: {
            description: t('`role` can be either a roleId or role mention.'),
            target: {
                description: t('Removes `role` from the executing user. Returns `true` if role was removed, else an error will be shown.'),
                exampleOut: t('No more role! true'),
                exampleCode: t('No more role! \\{roleRemove;11111111111111111\\}')
            },
            other: {
                description: t('Remove the chosen `role` from  `user`. Returns `true` if role was removed, else an error will be shown. If `quiet` is specified, if a user can\'t be found it will simply return `false`'),
                exampleOut: t('Stupid cat no more role! true'),
                exampleCode: t('Stupid cat no more role! \\{roleRemove;Bot;Stupid cat\\}')
            }
        },
        roles: {
            guild: {
                description: t('Returns an array of roles on the current guild.'),
                exampleOut: t('The roles on this guild are: ["11111111111111111","22222222222222222"].'),
                exampleCode: t('The roles on this guild are: \\{roles\\}.')
            },
            user: {
                description: t('Returns `user`\'s roles in the current guild. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Stupid cat has the roles: ["11111111111111111","22222222222222222"]'),
                exampleCode: t('Stupid cat has the roles: \\{roles;Stupid cat\\}')
            }
        },
        roleSetColor: {
            clear: {
                description: t('Sets the color of `role` to \'#000000\'. This is transparent.'),
                exampleOut: t('The admin role is now colourless.'),
                exampleCode: t('The admin role is now colourless. \\{roleSetColor;admin\\}')
            },
            set: {
                description: t('Sets the `color` of `role`.If `quiet` is specified, if `role` can\'t be found it will simply return nothing'),
                exampleOut: t('The admin role is now white.'),
                exampleCode: t('The admin role is now white. \\{roleSetColor;admin;white\\}')
            }
        },
        roleSetMentionable: {
            enable: {
                description: t('Set `role` to mentionable.'),
                exampleOut: t('The admin role is now mentionable.'),
                exampleCode: t('The admin role is now mentionable. \\{roleSetMentionable;admin\\}')
            },
            set: {
                description: t('Sets whether `role` can be mentioned. `value` can be either `true` to set the role as mentionable, or anything else to set it to unmentionable. If `quiet` is specified, if `role` can\'t be found it will simply return nothing'),
                exampleOut: t('The admin role is no longer mentionable.'),
                exampleCode: t('The admin role is no longer mentionable. \\{roleSetMentionable;admin;false\\}')
            }
        },
        roleSetName: {
            default: {
                description: t('Sets the name of `role`.If `quiet` is specified, if `role` can\'t be found it will simply return nothing'),
                exampleOut: t('The admin role is now called administrator.'),
                exampleCode: t('The admin role is now called administrator. \\{roleSetName;admin;administrator\\}')
            }
        },
        roleSetPermissions: {
            clear: {
                description: t('Removes all perms from `role`'),
                exampleOut: t('(perms have been changed)'),
                exampleCode: t('\\{roleSetPermissions;Support\\}')
            },
            set: {
                description: t('Sets the permissions of `role` with the provided `permissions` number. This will not apply any permissions the authorizer can\'t grant. Additionally, this will completely overwrite the role\'s existing permissions. If `quiet` is specified, if `role` can\'t be found it will simply return nothing'),
                exampleOut: t('The admin role now has the administrator permission.'),
                exampleCode: t('The admin role now has the administrator permission. \\{roleSetPermissions;admin;8\\}')
            }
        },
        roleSetPosition: {
            default: {
                description: t('Sets the position of `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.'),
                exampleOut: t('The admin role is now at position 3.'),
                exampleCode: t('The admin role is now at position 3. \\{roleSetPosition;admin;3\\}')
            }
        },
        roleSize: {
            default: {
                description: t('Returns the amount of people in role `role`'),
                exampleOut: t('There are 5 people in the role!'),
                exampleCode: t('There are \\{roleSize;11111111111111111\\} people in the role!')
            }
        },
        argsArray: {
            default: {
                description: t('Gets user input as an array.'),
                exampleIn: t('Hello world!'),
                exampleOut: t('Your input was ["Hello","world!"]'),
                exampleCode: t('Your input was \\{argsArray\\}')
            }
        },
        argsLength: {
            default: {
                description: t('Return the number of arguments the user provided.'),
                exampleIn: t('I am saying things.'),
                exampleOut: t('You said 4 words.'),
                exampleCode: t('You said \\{argsLength\\} words.')
            }
        },
        isCustomCommand: {
            default: {
                description: t('Checks if the tag is being run from within a cc. Returns a boolean (`true` or `false`)'),
                exampleOut: t('Boo, this only works in cc\'s'),
                exampleCode: t('\\{if;\\{isCustomCommand\\};\\{dm;\\{userId\\};You have mail!\\};Boo, this only works in cc\'s\\}')
            }
        },
        lb: {
            description: t('Will be replaced by `\\{` on execution.'),
            default: {
                description: t('Returns `\\{`'),
                exampleOut: t('This is a bracket! \\{'),
                exampleCode: t('This is a bracket! \\{lb\\}')
            }
        },
        rb: {
            default: {
                description: t('Returns `\\}`'),
                exampleOut: t('This is a bracket! \\}'),
                exampleCode: t('This is a bracket! \\{rb\\}')
            }
        },
        semi: {
            default: {
                description: t('Returns `;`'),
                exampleOut: t('This is a semicolon! ;'),
                exampleCode: t('This is a semicolon! \\{semi\\}')
            }
        },
        tagAuthor: {
            default: {
                description: t('Returns the user id of the tag/cc author'),
                exampleOut: t('This tag was created by stupid cat'),
                exampleCode: t('This tag was created by \\{username;\\{tagAuthor\\}\\}')
            }
        },
        tagAuthorizer: {
            default: {
                description: t('Returns the user id of the tag/cc authorizer'),
                exampleOut: t('stupid cat authorized this tag!'),
                exampleCode: t('\\{username;\\{tagAuthorizer\\}\\} authorized this tag!')
            }
        },
        zws: {
            default: {
                description: t('Returns a single zero width space (unicode 200B)'),
                exampleOut: t('​'),
                exampleCode: t('\\{zws\\}')
            }
        },
        ban: {
            description: t('`daysToDelete` is the number of days to delete messages for. `duration`'),
            default: {
                description: t('Bans `user`. If the ban is successful `true` will be returned, else it will return an error.'),
                exampleOut: t('true'),
                exampleCode: t('\\{ban;Stupid cat;4\\}')
            },
            withReason: {
                description: t('Bans `user` for duration `timeToUnban` with `reason`.'),
                exampleOut: t('true (stupid cat will be unbanned after 30d)'),
                exampleCode: t('\\{ban;Stupid cat;;Not clicking enough kittens;30d\\}')
            },
            noPerms: {
                description: t('Bans `user` for duration `timeToUnban` with `reason`. If `noPerms` is provided and not an empty string, do not check if the command executor is actually able to ban people.Only provide this if you know what you\'re doing.'),
                exampleOut: t('true (anyone can use this cc regardless of perms)'),
                exampleCode: t('\\{ban;Stupid cat;;For being stupid;;anythingcangohere\\}')
            }
        },
        dm: {
            text: {
                description: t('DMs `user` the given `message`. You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.'),
                exampleOut: t('DM: Hello\nEmbed: You\'re cool'),
                exampleCode: t('\\{dm;stupid cat;Hello;\\{embedBuild;title:You\'re cool\\}\\}')
            },
            embed: {
                description: t('DMs `user` the given `embed`. You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.\nPlease note that `embed` is the JSON for an embed object, don\'t put the `\\{embed\\}` subtag there, as nothing will show.'),
                exampleOut: t('DM: Hello\nEmbed: You\'re cool'),
                exampleCode: t('\\{dm;stupid cat;Hello;\\{embedBuild;title:You\'re cool\\}\\}')
            },
            full: {
                description: t('DMs `user` the given `message` and `embed`. You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.\nPlease note that `embed` is the JSON for an embed object, don\'t put the `\\{embed\\}` subtag there, as nothing will show.'),
                exampleOut: t('DM: Hello\nEmbed: You\'re cool'),
                exampleCode: t('\\{dm;stupid cat;Hello;\\{embedBuild;title:You\'re cool\\}\\}')
            }
        },
        isStaff: {
            target: {
                description: t('Checks if the tag author is staff'),
                exampleOut: t('The author is a staff member!'),
                exampleCode: t('\\{if;\\{isStaff\\};The author is a staff member!;The author is not a staff member :(\\}')
            },
            user: {
                description: t('Checks if `user` is a member of staff. If the `user` cannot be found `false` will be returned.'),
                exampleOut: t('You are not a staff member :('),
                exampleCode: t('\\{if;\\{isStaff;\\{userId\\}\\};You are a staff member!;You are not a staff member :(\\}')
            }
        },
        isUserBoosting: {
            target: {
                description: t('Returns `true` if the executing user is boosting the guild and `false` if not.'),
                exampleOut: t('You should consider boosting'),
                exampleCode: t('\\{if;\\{isUserBoosting\\};Yes you are boosting;You should consider boosting\\}')
            },
            user: {
                description: t('Returns `true` if the `user` is boosting the guild and `false` if not. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('stupid cat is boosting!'),
                exampleCode: t('\\{if;\\{isUserBoosting;stupid cat\\};stupid cat is boosting!; no boosting here :(\\}')
            }
        },
        kick: {
            description: t('If the kick is successful, `Success` will be returned, otherwise the error will be given. '),
            default: {
                description: t('Kicks `user`.'),
                exampleOut: t('Success @stupid cat was kicked!'),
                exampleCode: t('\\{kick;stupid cat\\} @stupid cat was kicked!')
            },
            withReason: {
                description: t('Kicks `user`. If `noPerms` is provided and not an empty string, do not check if the command executor is actually able to kick people. Only provide this if you know what you\'re doing.'),
                exampleOut: t('Success @stupid cat was kicked, because I can!'),
                exampleCode: t('\\{kick;stupid cat;because I can\\} @stupid cat was kicked!')
            }
        },
        pardon: {
            description: t('`user` defaults to the executing user. Returns the new warning count'),
            default: {
                description: t('Gives `user` one pardon.'),
                exampleOut: t('Be pardoned! 0'),
                exampleCode: t('Be pardoned! \\{pardon\\}')
            },
            withReason: {
                description: t('Gives `user` `count` pardons with `reason`.'),
                exampleOut: t('Be pardoned 9001 times, Stupid cat! 0'),
                exampleCode: t('Be pardoned 9001 times, Stupid cat! \\{pardon;Stupid cat;9001\\}')
            }
        },
        randomUser: {
            default: {
                description: t('Returns the id of a random user on the current guild.'),
                exampleOut: t('abalabahaha is a lovely person! stupid cat isn\'t as good.'),
                exampleCode: t('\\{username;\\{randomUser\\}\\} is a lovely person! \\{username;\\{randomUser\\}\\} isn\'t as good.')
            }
        },
        timeout: {
            description: t('If the timeout is successful, `Success` will be returned, otherwise the error will be given. '),
            default: {
                description: t('Times out `user` for the specified amount of time. Maximum is 28 days.'),
                exampleOut: t('Success @stupid cat was timed out for 1 day!'),
                exampleCode: t('\\{timeout;stupid cat;1d\\} @stupid cat was timed out for 1 day!')
            },
            withReason: {
                description: t('Times out `user` for the specified amount of time. Maximum is 28 days.If `noPerms` is provided and not an empty string, do not check if the command executor is actually able to time out people. Only provide this if you know what you\'re doing.'),
                exampleOut: t('Success @stupid cat was timed out for 1 day, because I can!'),
                exampleCode: t('\\{timeout;stupid cat;1d;because I can\\} @stupid cat was timed out for 1 day!')
            }
        },
        unban: {
            default: {
                description: t('Unbans `user`.'),
                exampleOut: t('@user was unbanned!'),
                exampleCode: t('\\{unban;@user\\} @user was unbanned!')
            },
            withReason: {
                description: t('Unbans `user` with the given `reason`.If `noPerms` is provided and not an empty string, do not check if the command executor is actually able to ban people. Only provide this if you know what you\'re doing.'),
                exampleOut: t('true @stupid cat has been unbanned'),
                exampleCode: t('\\{unban;@stupid cat;I made a mistake\\} @stupid cat has been unbanned')
            }
        },
        userActivity: {
            description: t('If no game is being played, this will return \'nothing\''),
            target: {
                description: t('Returns the name of the activity the executing user is currently doing. '),
                exampleOut: t('You are listening to bad music'),
                exampleCode: t('You are listening to \\{userActivity\\}')
            },
            user: {
                description: t('Returns the name of the activity `user` is currently doing. If `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Stupid cat is playing nothing'),
                exampleCode: t('Stupid cat is playing \\{userActivity;Stupid cat\\}')
            }
        },
        userActivityType: {
            description: t<{ types: Iterable<string>; }>()('Activity types can be any of {types#map(`{}`)#join(, | or )}'),
            target: {
                description: t('Returns the type of activity the executing user is currently doing (playing, streaming).'),
                exampleOut: t('You are streaming right now!'),
                exampleCode: t('You are \\{userActivityType\\} right now!')
            },
            user: {
                description: t('Returns the activity type `user` is currently doing. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Stupid cat is streaming cats'),
                exampleCode: t('Stupid cat is \\{userActivityType;Stupid cat\\} cats')
            }
        },
        userAvatar: {
            description: t('If no game is being played, this will return \'nothing\''),
            target: {
                description: t('Returns the avatar of the executing user.'),
                exampleOut: t('Your avatar is (avatar url)'),
                exampleCode: t('Your avatar is \\{userAvatar\\}')
            },
            user: {
                description: t('Returns the avatar of `user`. If `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Stupid cat\'s avatar is (avatar url)'),
                exampleCode: t('Stupid cat\'s avatar is \\{userAvatar;Stupid cat\\}')
            }
        },
        userBoostDate: {
            description: t('See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information about formats. If user is not boosting the guild, returns `User not boosting`'),
            target: {
                description: t('Returns the date that the executing user started boosting the guild using `format` for the output, in UTC+0.'),
                exampleOut: t('Your account started boosting this guild on 2020/02/27 00:00:00'),
                exampleCode: t('Your account started boosting this guild on \\{userBoostDate;YYYY/MM/DD HH:mm:ss\\}')
            },
            user: {
                description: t('Returns the date that `user` started boosting the current guild using `format` for the output, in UTC+0. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Stupid cat started boosting this guild on 2020/02/27 00:00:00'),
                exampleCode: t('Stupid cat started boosting this guild on \\{userBoostDate;YYYY/MM/DD HH:mm:ss;stupid cat\\}')
            }
        },
        userCreatedAt: {
            target: {
                description: t('Returns the account creation date of the executing user in `format`.'),
                exampleOut: t('Your account was created on 2017-02-06T18:58:10+00:00'),
                exampleCode: t('Your account was created on \\{userCreatedAt\\}')
            },
            user: {
                description: t('Returns the account creation date of `user` in `format`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Stupid cat\'s account was created on 2015-10-13T04:27:26Z'),
                exampleCode: t('Stupid cat\'s account was created on \\{userCreatedAt;;Stupid cat\\}')
            }
        },
        userDiscriminator: {
            description: t('If no game is being played, this will return \'nothing\''),
            target: {
                description: t('Returns the discriminator of the executing user.'),
                exampleOut: t('Your discriminator is 1234'),
                exampleCode: t('Your discriminator is \\{userDiscriminator\\}')
            },
            user: {
                description: t('Returns `user`\'s discriminator. If `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Stupid cat\'s discriminator is 8160'),
                exampleCode: t('Stupid cat\'s discriminator is \\{userDiscriminator;Stupid cat\\}')
            }
        },
        userHasRole: {
            description: t('This subtag checks if a user has *any* of the provided `roleIds`. Use `\\{userHasRoles\\}` to check if a user has *all* of the provided `roleIds`. `roleIds` can be an array of role ids, or a single role id. For a list of roles and their corresponding ids, use `b!roles`\nReturns a boolean.'),
            target: {
                description: t('Checks if the executing user has *any* of the provided `roleIds`.'),
                exampleOut: t('You are a moderator'),
                exampleCode: t('\\{if;\\{userHasRole;\\{roleId;moderator\\}\\};You are a moderator; You are not a moderator\\}')
            },
            user: {
                description: t('Checks if `user` has *any* of the provided `roleIds`. If `quiet` is specified, if `user` or any `roleId` can\'t be found it will simply return `false`.'),
                exampleOut: t('Stupid cat is a moderator'),
                exampleCode: t('\\{if;\\{userHasRole;\\{userId;moderator\\};Stupid cat\\};Stupid cat is a moderator;Stupid cat is not a moderator\\}')
            }
        },
        userHasRoles: {
            description: t('This subtag checks if a user has *all* of the provided `roleIds`. Use `\\{userHasRole\\}` to check if a user has *any* of the provided `roleIds`. `roleIds` can be an array of role ids, or a single role id. For a list of roles and their corresponding ids, use `b!roles`\nReturns a boolean.'),
            target: {
                description: t('Checks if the executing user has *all* of the provided `roleIds`.'),
                exampleOut: t('You are not a moderator and admin'),
                exampleCode: t('\\{if;\\{userHasRoles;["\\{roleId;moderator\\}","\\{roleId;admin\\}"];You are a moderator and admin; You are not a moderator and admin\\}')
            },
            user: {
                description: t('Checks if `user` has *all* of the provided `roleIds`. If `quiet` is specified, if `user` or any `roleId` can\'t be found it will simply return `false`.'),
                exampleOut: t('Stupid cat is a moderator and admin'),
                exampleCode: t('\\{if;\\{userHasRoles;["\\{roleId;moderator\\}","\\{roleId;admin\\}"];Stupid cat\\};Stupid cat is a moderator and admin;Stupid cat is not a moderator and admin\\}')
            }
        },
        userId: {
            target: {
                description: t('Returns the user id of the executing user.'),
                exampleOut: t('Your id is 123456789123456'),
                exampleCode: t('Your id is \\{userId\\}')
            },
            user: {
                description: t('Returns `user`\'s id. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('This is Stupid cat\'s user id 103347843934212096'),
                exampleCode: t('This is Stupid cat\'s user id \\{userId;Stupid cat\\}')
            }
        },
        userIsBot: {
            target: {
                description: t('Returns whether the executing user is a bot.'),
                exampleOut: t('Are you a bot? false'),
                exampleCode: t('Are you a bot? \\{userIsBot\\}')
            },
            user: {
                description: t('Returns whether a `user` is a bot. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Is Stupid cat a bot? false'),
                exampleCode: t('Is Stupid cat a bot? \\{userIsBot;Stupid cat\\}')
            }
        },
        userJoinedAt: {
            description: t('For a list of formats see the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information.'),
            target: {
                description: t('Returns the date that the executing user joined the guild, using `format` for the output, in UTC+0.\n'),
                exampleOut: t('Your account joined this guild on 2016/01/01 01:00:00.'),
                exampleCode: t('Your account joined this guild on \\{userJoinedAt;YYYY/MM/DD HH:mm:ss\\}')
            },
            user: {
                description: t('Returns the date that `user` joined the current guild using `format` for the output, in UTC+0. if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Stupid cat joined this guild on 2016/06/19 23:30:30'),
                exampleCode: t('Stupid cat joined this guild on \\{userJoinedAt;YYYY/MM/DD HH:mm:ss;Stupid cat\\}')
            }
        },
        userMention: {
            target: {
                description: t('Mentions the executing user.'),
                exampleOut: t('Hello, @user!'),
                exampleCode: t('Hello, \\{userMention\\}!')
            },
            user: {
                description: t('Mentions `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Hello, @Stupid cat!'),
                exampleCode: t('Hello, \\{userMention;stupid cat\\}!')
            }
        },
        userName: {
            target: {
                description: t('Returns the username of the executing user.'),
                exampleOut: t('Your username is Cool Dude 1337!'),
                exampleCode: t('Your username is \\{userName\\}!')
            },
            user: {
                description: t('Returns `user`\'s username. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Stupid cat\'s username is Stupid cat!'),
                exampleCode: t('Stupid cat\'s username is \\{userName;Stupid cat\\}!')
            }
        },
        userNickname: {
            target: {
                description: t('Returns the nickname of the executing user.'),
                exampleOut: t('Your nick is Cool Dude 1337!'),
                exampleCode: t('Your nick is \\{userNickname\\}!')
            },
            user: {
                description: t('Returns `user`\'s nickname. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Stupid cat\'s nickname is Secretly Awoken'),
                exampleCode: t('Stupid cat\'s nickname is \\{userNickname;Stupid cat\\}!')
            }
        },
        userRoles: {
            target: {
                description: t('Returns the roles of the executing user.'),
                exampleOut: t('Your roles are ["1111111111111111","2222222222222222"]!'),
                exampleCode: t('Your roles are \\{userRoles\\}!')
            },
            user: {
                description: t('Returns `user`\'s roles as an array. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Stupid cat\'s roles are ["1111111111111111","2222222222222222", "3333333333333333"]'),
                exampleCode: t('Stupid cat\'s roles are \\{userRoles;stupid cat\\}')
            }
        },
        userSetNickname: {
            default: {
                description: t('Sets `user`\'s nickname to `nick`. Leave `nick` blank to reset their nickname.'),
                exampleOut: t(''),
                exampleCode: t('\\{userSetNickname;super cool nickname\\}\n\\{//;Reset the the nickname\\}\n\\{userSetNickname;\\}')
            }
        },
        userSetRoles: {
            description: t('`roleArray` must be an array formatted like `["role1", "role2"]`'),
            target: {
                description: t('Sets the roles of the current user to `roleArray`.'),
                exampleOut: t('true'),
                exampleCode: t('\\{userSetRoles;["1111111111111"]\\}')
            },
            user: {
                description: t('Sets the roles of `user` to `roleArray`. If quiet is provided, all errors will return `false`.'),
                exampleOut: t('true'),
                exampleCode: t('\\{userSetRoles;["1111111111111"];stupid cat\\}')
            }
        },
        userStatus: {
            description: t('Returned status can be one of `online`, `idle`, `dnd` or `offline`'),
            target: {
                description: t('Returns the status of the user.'),
                exampleOut: t('You are currently online'),
                exampleCode: t('You are currently \\{userStatus\\}')
            },
            user: {
                description: t('Returns the status of `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('Stupid cat is currently online'),
                exampleCode: t('Stupid cat is currently \\{userStatus;stupid cat\\}')
            }
        },
        userTimeout: {
            description: t('See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information about formats. If user has never been timed out in the guild, returns `User not timed out`'),
            target: {
                description: t('Returns the executing user\'s timeout date using `format` for the output, in UTC+0.'),
                exampleOut: t('You have been timed out until 2021/01/01 00:00:00'),
                exampleCode: t('You have been timed out until \\{userTimeout;YYYY/MM/DD HH:mm:ss\\}')
            },
            user: {
                description: t('Returns a `user`\'s timeout date using `format` for the output, in UTC+0. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.'),
                exampleOut: t('stupid cat is timed out until 2021/01/01 00:00:00'),
                exampleCode: t('stupid cat is timed out until \\{userTimeout;YYYY/MM/DD HH:mm:ss;stupid cat\\}')
            }
        },
        userTimeZone: {
            target: {
                description: t('Returns the set timezone of the user executing the containing tag.'),
                exampleOut: t('UTC'),
                exampleCode: t('\\{userTimeZone\\}')
            },
            user: {
                description: t('Returns the set timezone code of the specified `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.If the user has no set timezone, the output will be UTC.'),
                exampleOut: t('Discord official\'s timezone is Europe/Berlin'),
                exampleCode: t('Discord official\'s timezone is \\{userTimeZone;Discord official\\}')
            }
        },
        warn: {
            description: t('`user` defaults to the executing user.'),
            default: {
                description: t('Gives `user` one warning. This will return the amount of warnings `user` has after executing.'),
                exampleOut: t('Be warned! 1'),
                exampleCode: t('Be warned! \\{warn\\}')
            },
            withReason: {
                description: t('Gives `user` `count` warnings.'),
                exampleOut: t('Be warned Stupid cat! 9001'),
                exampleCode: t('Be warned Stupid cat! \\{warn;Stupid cat;9001;For being too cool\\}')
            }
        },
        warnings: {
            default: {
                description: t('Gets the number of warnings `user` has. `user` defaults to the user who executed the containing tag.'),
                exampleOut: t('You have 0 warning(s)!'),
                exampleCode: t('You have \\{warnings\\} warning(s)!')
            }
        }
    }
}));

export default templates;
