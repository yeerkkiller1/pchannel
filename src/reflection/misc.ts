export let g = Function('return this')();

export function IsEmpty<T>(obj: {[key: string]: T}): boolean {
    for(var key in obj) {
        return false;
    }
    return true;
}