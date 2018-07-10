/// <reference path="./src.d.ts" />

import { ThrowIfNotImplementsData, AnyOrder, ObjectExact, Opt } from "./reflection/assert";
import { IsNumber, IsInteger, IsPrimitive, CanHaveChildren, IsArray } from "./reflection/type";
import { IsEmpty } from "./reflection/misc";
import { SetTimeoutAsync } from "./controlFlow/promise";
import { pchan, PChan } from "./controlFlow/pChan";

// Replace ws-class stuff with p-chan, and then make this expose a function call pChan, which is createPromiseStream, but:
//  - Supports closing the connection (and returns error promises on reading from a closed connection, and also errors out all promises
//    that are pending)
//  - that handles infinitely recursive Promise<T> resolve nesting, via using the Promise typings

export {
    ThrowIfNotImplementsData,
    AnyOrder,
    ObjectExact,
    Opt,

    IsNumber,
    IsInteger,
    IsPrimitive,
    CanHaveChildren,
    IsArray,
    IsEmpty,

    SetTimeoutAsync,

    pchan,
    PChan
};