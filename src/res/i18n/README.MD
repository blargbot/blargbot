# Blargbot translation

Translation in blargbot is handled by a custom template string handler. Each string can contain many replacements, which are structured like:

```bnf
<replacement> ::= "{" <replacement-details> "}"
<replacement-details> ::= <path> <replacement-args>
<path> ::= "" | <path-segments> | "~" <path-segments>
<path-segments> ::= <path-segment> | <path-segment> "." <path-segments>
<path-segment> ::= <text>
<replacement-args> ::= "" | <transformers> | <default> | <transformers> <default>
<transformers> ::= "#" <transformer> | "#" <transformer> <transformers>
<transformer> ::= <transformer-name> | <transformer-name> "()" | <transformer-name> "(" <transformer-args> ")"
<transformer-name> ::= <text>
<transformer-args> ::= <transformer-arg> | <transformer-arg> "|" <transformer-args>
<transformer-arg> ::= <text>
<default> ::= "=" <text>
```

This leads to 3 parts of a replacement: the `<path>`, a collection of `<transformers>` and an optional `<default>` value.

1. First, the `<path>` is followed to get a value to display. If the path starts with `~` then this will look for the value starting at the root value, rather than the current value (see the `map` transformer below)

2. Once a value is obtained, it is passed to the first transformer if given. The result of this transformer is then passed to the next transformer and so on.

3. After all the transformers have processed the value, if it ends up being empty then it is replaced by the `<default>` value, if one is given.

## Escaping

At all points, any special characters (`{`, `}`, `#` etc) can be added by adding a `\` before it. This will prevent it from being processed. This is only needed when that character would have a meaning in that position without a `\`.

## Transformers

There are several transformers available:

### - `map(<template>)`

The `map` transformer works by looping over a collection of values, and passing each element to the given `<template>`. Within this template, all paths which do not start with `~` will be relative to the current element. Typically this would be followed by a `#join()` transform, to join the results into a single value

<details>
  <summary>Example</summary>

  ```txt
  {values#map(`{name}`)#join()}
  ```
  
  applied to
  
  ```json
  {  
      "values": [
          { "name": "value1" },
          { "name": "value2" },
          { "name": "value3" },
      ]
  }
  ```
  
  would produce
  
  ```txt
  `value1``value2``value3`
  ```

</details>

### - `join(<separators...>)`

The `join` transformer works by taking a collection of elements and joining them together using the given separators. Separators are used in order, with any missing separators being filled in by the first separator.

<details>
  <summary>Example</summary>

  ```txt
  {values#join(a|b|c)}
  {values#join(, | or )}
  {values#join(, |, and )}
  ```
  
  applied to
  
  ```json
  {  
      "values": [1,2,3,4,5,6,7,8]
  }
  ```
  
  would produce
  
  ```txt
  1a2a3a4a5a6b7c8
  1, 2, 3, 4, 5, 6, 7 or 8
  1, 2, 3, 4, 5, 6, 7, and 8
  ```

</details>

### - `bool(<ifTruthy>|<ifFalsy?>)`

The `bool` transformer works by checking if the value is `truthy` or `falsy`, and returning the appropriate value. Within this template, all paths which do not start with `~` will be relative to the current value.

A value is truthy if:

- it is `true`
- it is an `object`
- it is some non-empty text
- it is a non-zero number

otherwise, the value is considered `falsy`

<details>
  <summary>Example</summary>

  ```txt
  value 1 {value1#bool(is truthy|is falsy)}
  value 2 {value2#bool(is truthy|is falsy)}
  ```
  
  applied to
  
  ```json
  {  
      "value1": "some text",
      "value2": 0
  }
  ```
  
  would produce
  
  ```txt
  value 1 is truthy
  value 2 is falsy
  ```

</details>

### - `plural(<cases...>|<default>)`

The `plural` transformer picks its output based on the value of the input. If the input value is a collection of values, then its length is used, otherwise it is treated as a number. Each of the `<cases>` should be structured as: 

```bnf
<cases> ::= <key> ":" <template>
<template> ::= <text>
<key> ::= <whole-number> | "<" | ">"
```

If the value (or length if its a collection) matches the `<key>` of one of the `<cases>`, then that cases `<template>` is used. Otherwise, the values plurality is checked using the current languages plurality rules. This will then look for a template for one of the following values:

- `0` if the plurality is `zero`
- `1` if the plurality is `one`
- `2` if the plurality is `two`
- `<` if the plurality is `few`
- `>` if the plurality is `many`

If no template is found matching any of these, then the `<default>` template is used.

<details>
  <summary>Example (using english plurality rules)</summary>

  ```txt
  {value1#plural(0:{} = None|1:{} = A single|{} = Many)}
  {value2#plural(0:{} = None|1:{} = A single|{} = Many)}
  {value3#plural(0:{} = None|1:{} = A single|{} = Many)}
  ```
  
  applied to
  
  ```json
  {  
      "value1": 0,
      "value2": 1,
      "value3": 2,
  }
  ```
  
  would produce
  
  ```txt
  0 = None
  1 = A single
  2 = Many
  ```

</details>
