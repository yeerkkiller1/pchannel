/// <reference path="./src.d.ts" />

import { ThrowIfNotImplementsData, AnyOrder, ObjectExact, Opt, Throws, ThrowsAsync } from "./reflection/assert";
import { IsNumber, IsInteger, IsPrimitive, CanHaveChildren, IsArray } from "./reflection/type";
import { IsEmpty } from "./reflection/misc";
import { SetTimeoutAsync } from "./controlFlow/promise";
import { pchan, PChan, SetDefaultTimeout } from "./controlFlow/pChan";

// Redeclare all types, so we don't expose our internal modules


const _ThrowIfNotImplementsData: (proposedData: Types.AnyAll, dataContract: Types.AnyAll) => void = ThrowIfNotImplementsData;
const _AnyOrder: <T extends Types.AnyAll>(value: T) => T = AnyOrder;
const _ObjectExact: <T extends Types.AnyAll>(value: T) => T = ObjectExact;
const _Opt: <T extends Types.AnyAll>(value: T) => T = Opt;

const _IsNumber: (str: string) => boolean = IsNumber;
const _IsInteger: (num: number) => boolean = IsInteger;
const _IsPrimitive: (value: Types.AnyAll) => value is Types.Primitive = IsPrimitive;
const _CanHaveChildren: (value: Types.AnyAll) => value is Types.Dictionary = CanHaveChildren;
const _IsArray: (obj: Types.AnyAll) => obj is Types.Arr = IsArray;
const _IsEmpty: <T>(obj: {[key: string]: T}) => boolean = IsEmpty;

const _SetTimeoutAsync: (time: number) => Promise<void> = SetTimeoutAsync;
const _Throws: (code: () => void) => void = Throws;
const _ThrowsAsync: (code: () => Promise<void>) => Promise<void> = ThrowsAsync;

let _g: any = Function('return this')();

export {
    _ThrowIfNotImplementsData as ThrowIfNotImplementsData,
    _AnyOrder as AnyOrder,
    _ObjectExact as ObjectExact,
    _Opt as Opt,

    _IsNumber as IsNumber,
    _IsInteger as IsInteger,
    _IsPrimitive as IsPrimitive,
    _CanHaveChildren as CanHaveChildren,
    _IsArray as IsArray,
    _IsEmpty as IsEmpty,

    _SetTimeoutAsync as SetTimeoutAsync,
    _Throws as Throws,
    _ThrowsAsync as ThrowsAsync,

    pchan,
    PChan,
    SetDefaultTimeout,

    _g as g
};