# BBTag
> Not to be confused with BBCode!

BBTag is a template-based programming language, designed to provide a powerful framework to create advanced custom commands.

## Terminology

A `tag` refers to a block of BBTag code, whether it be a public tag or a custom command.
A `subtag` refers to a BBTag component. Advanced `tags` are made of many `subtags`.
A `class` refers to a group of `subtags`.

## SubTags

Subtags are the basic building block of BBTag. They perform dynamic functions, whether it be getting the name of a user or doing math. Let's take a look at a subtag now:
```
{math.randint;1;10}
```
When run, this may return something like this:
```
6
```
As you can see, the `math.randint` subtag returns a random integer between the provided range.

### Anatomy of a SubTag

A subtag is made of various components. A syntax diagram may look something like this:
```
{[class.]name[![var]][;args]...}
```
Oh wow, ok. That's kinda confusing, but bear with me!

#### Classes

> `[class.]name`

Subtags are split into groups, called **classes**. Each class is designated a specific type of purpose. For example, the `math` class would contain subtags that deal with numbers. Likewise, the `user` class would contain subtags that give information about users. Classes provide a system of organization.

When using a subtag, the preferred usage would be `{class.name}`. This improves readability. However, explicitly stating the class is usually optional. BBTag knows that `{math.randint}` and `{randint}` are the same subtag. This is called **implicit classing**. The exception to this are subtags in the `general` class, which should be used *without* an explicit class.

However, you should be careful with implicit classing! Sometimes, classes may have subtags with the same name. For example, `{user.id}` and `{channel.id}` both have subtags with the name `id`. If you attempt to use implicit classing with a subtag that exists in multiple classes, it will return an error!

#### Piping

> `[![var]]`

Piping is a feature that allows you to redirect the output of a subtag, either to a variable or into a void. This can help to clean up your code.

For example, if for whatever reason you don't want a subtag to output anything, you can add a `!` after the subtag name to silence it. The following lines are equivalent:
```
{void;{math.randint;1;10}}
{math.randint!;1;10}
```
If you want to store the subtag's output to a variable, you can add `!variableName` after the subtag name. The following lines are equivalent:
```
{set;randomInteger;{math.randint;1;10}}
{math.randint!randomInteger;1;10}
```
Piping output is slightly faster to execute than using the full syntax.

#### Arguments

You can pass parameters into subtags. These are separated by semicolons `;`. Arguments are different per-subtag, and documentation on these can be found on the subtag page.

##### Named Arguments

Normally, the order of provided arguments is very important. However, you can use the named counterparts instead. For example, the usage of `{math.randint}` is `{math.randint;min;max}`. The names of the arguments are `min` and `max` respectively. The following usages are equivalent:
```
{math.randint;1;10}
{math.randint=
    {*min;1}
    {*max;10}
}
```
You cannot use both named arguments and ordered arguments in the same subtag.
