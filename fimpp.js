const punc = ['.', '!', ',', '?', ';', ':'];
const keywords = {
    switch: [`in regards to`],
    switchEnd: [`that's what i did`],
    switchDefault: [`if all else fails`],
    else: [`or else`, `otherwise`],
    case: [`on the`],
    caseSuffix: [`hoof`, `nd hoof`, `rd hoof`, `st hoof`, `th hoof`],
    ifEnd: [`that's what i would do`],
    elseEnd: [`that's what i would do`],
    if: [`if`, `when`],
    ifSuffix: [`then`],
    reportDef: [`dear`],
    importInterface: [`and`],
    reportEnd: [`your faithful student`],
    reportImport: [`remember when i wrote about`],
    paragraphDef: [`i learned`],
    mainParagraphDef: [`today i learned`],
    paragraphEnd: [`that's all about`],
    paragraphParams: [`using`],
    paragraphReturn: [`then you get`],
    paragraphRun: [`i remember`, `i would`],
    variableInit: [`has`, `is`, `like`, `likes`, `was`],
    constantInit: [`always has`, `always is`, `always like`, `always likes`, `always was`],
    doWhileEnd: [`i did this while`, `i did this as long as`],
    doWhile: [`here's what i did`],
    whileEnd: [`that's what i did`],
    while: [`as long as`, `while`],
    output: [`i said`, `i sang`, `i wrote`],
    input: [`i asked`],
    inputStream: [`i heard`, `i read`],
    assignment: [`are now`, `become`, `becomes`, `is now`, `now likes`, `now like`]
};

const operators = {
    add: {
        infix: [`added to`, `and`, `plus`],
        prefix: [`add`],
        prefixInfix: [`and`]
    },
    divide: {
        infix: [`divided by`],
        prefix: [`divide`],
        prefixInfix: [`and`, `by`]
    },
    multiply: {
        infix: [`multiplied with`, `times`],
        prefix: [`multiply`, `the product of`],
        prefixInfix: [`and`, `by`]
    },
    subtract: {
        infix: [`minus`, `without`],
        prefix: [`subtract`, `the difference between`],
        prefixInfix: [`and`, `from`]
    },
    dec: [`got one less`],
    inc: [`got one more`],
    and: [`and`],
    or: [`or`],
    xor: [`either`],
    xorInfix: [`or`],
    not: [`not`],
    equal: [`had`, `has`, `is`, `was`, `were`],
    inequal: [`hadn't`, `had not`, `hasn't`, `has not`, `isn't`, `is not`, `wasn't`, `was not`, `weren't`, `were not`],
    greaterThan: [`had more than`, `has more than`, `is greater than`,
        `is more than`, `was greater than`, `was more than`, `was greater than`, `were more than`
    ],
    greaterThanOrEqual: [`had no less than`, `has no less than`, `is no less than`, `isn't less than`,
        `was no less than`, `was not less than`, `wasn't less than`, `were no less than`, `were not less than`, `weren't less than`
    ],
    lessThan: [`had less than`, `has less than`, `is less than`, `was less than`, `were less than`],
    lessThanOrEqual: [`had no more than`, `has no more than`, `is no greater than`, `is no more than`,
        `is not greater than`, `is not more than`, `isn't greater than`, `isn't more than`,
        `was no greater than`, `was no more than`, `was not greater than`, `was not more than`,
        `wasn't greater than`, `wasn't more than`, `were no greater than`, `were no more than`,
        `were not greater than`, `were not more than`, `weren't greater than`, `weren't more than`
    ]
};

const literals = {
    booleanTrue: [`correct`, `right`, `true`, `yes`],
    booleanFalse: [`false`, `incorrect`, `no`, `wrong`],
    null: [`nothing`]
};

const datatypes = {
    boolean: [`argument`, `the argument`, `an argument`, `logic`, `the logic`],
    booleanArray: [`arguments`, `the arguments`, `logics`, `the logics`],
    number: [`a number`, `number`, `the number`],
    numberArray: [`many numbers`, `numbers`, `the numbers`],
    character: [`a character`, `a letter`, `character`, `letter`, `the character`, `the letter`],
    string: [`a phrase`, `a quote`, `a sentence`, `a word`, `characters`, `letters`, `phrase`, `quote`, `sentence`, `the characters`, `the letters`, `the phrase`, `the quote`, `the sentence`, `the word`, `word`],
    stringArray: [`many phrases`, `many quotes`, `many sentences`, `many words`, `phrases`, `phrases`, `quotes`, `sentences`, `sentences`, `the phrases`, `the quotes`, `the sentences`, `the words`, `words`]
};

const VariableType = {
    FUNCTION: 1,
    NUMBER: 2,
    BOOLEAN: 3,
    CHARACTER: 4,
    STRING: 5,
    NUMBER_ARRAY: 6,
    BOOLEAN_ARRAY: 7,
    CHARACTER_ARRAY: 8,
    STRING_ARRAY: 9,
    properties: {
        1: {
            name: "function"
        },
        2: {
            name: "number"
        },
        3: {
            name: "boolean"
        },
        4: {
            name: "character"
        }

    }
};

class Letter {
    constructor(letter) {
        // An object containing both functions and variables
        this.variables = {};
        // A function is defined as follows
    };
}