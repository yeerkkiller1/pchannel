import { PChan } from "./pChan";

export function PChanFromArray<T>(...values: T[]): PChan<T> {
    let chan = new PChan<T>();
    for(let value of values) {
        chan.SendValue(value);
    }
    chan.Close();
    return chan;
}

export function PChanFromGenerator<T>(
    generator: () => IterableIterator<T>
): PChan<T> {
    let output = new PChan<T>();
    let iterator = generator();
    try {
        for(let value of iterator) {
            output.SendValue(value);
        }
    } catch(e) {
        output.SendError(e);
    }
    output.Close();
    return output;
}