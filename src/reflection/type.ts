/** As in a real number, that can be expressed in javascript exactly (so not too big, or scientific notation). */
export function IsNumber(str: string): boolean {
    return (+str).toString() === str;
}

export function IsInteger(num: number): boolean {
    return Number.isSafeInteger(num);
}

export function IsPrimitive(value: Types.AnyAll): value is Types.Primitive {
    if(typeof value === "string") return true;
    if(typeof value === "number") return true;
    if(typeof value === "boolean") return true;
    if(typeof value === "undefined") return true;
    if(value === null) return true;
    return false;
}

/** As in, {} can have children. But null can't. Also, function(){} doesn't count. Yes, it can have children, but it is more likely a mistake. */
export function CanHaveChildren(value: Types.AnyAll): value is Types.Dictionary {
    return value && typeof value === "object" || false;
}

export function IsArray(obj: Types.AnyAll): obj is Types.Arr {
    return obj instanceof Array;
}