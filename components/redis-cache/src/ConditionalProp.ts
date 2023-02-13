export type ConditionalProp<Name extends string, In, Out, AutoMappable> = ([In] extends [AutoMappable]
    ? { readonly [P in Name]?: (key: In) => Out; }
    : { readonly [P in Name]: (key: In) => Out; })
