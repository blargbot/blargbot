import { randChoose } from "../../utils/index";
import { IValueResolverTransform } from "../FormatStringCompiler";

export const rand: IValueResolverTransform = {
    transform(_compiler, _, ...choices) {
        return () => randChoose(choices);
    }
};
