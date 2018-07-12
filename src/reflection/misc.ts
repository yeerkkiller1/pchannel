export let g = Function('return this')();

export function IsEmpty<T>(obj: {[key: string]: T}): boolean {
    for(var key in obj) {
        return false;
    }
    return true;
}

export function Range(start: number, end: number): number[] {
    let values: number[] = [];
    for(let i = start; i < end; i++) {
        values.push(i);
    }
    return values;
}