import { ThrowsAsync, ThrowIfNotImplementsData, Throws } from "../reflection/assert";
import { SetDefaultTimeout, PChan, pchan } from "./pChan";
import { SetTimeoutAsync } from "./promise";

import * as async_hooks from "async_hooks";

let asyncInfos: {
    [asyncId: number]: {
        err: { stack: string },
        // The trigger of the resource
        triggerAsyncId: number,
        // The async id of the resource
        asyncId: number,
        // The async id that is running
        curAsyncId: number,
    }
} = {};
async_hooks.createHook({
    init(asyncId, type, triggerAsyncId, resource) {
        let err: { stack: string } = {} as any;
        Error.captureStackTrace(err);

        asyncInfos[asyncId] = {
            err,
            triggerAsyncId,
            asyncId,
            curAsyncId: async_hooks.executionAsyncId(),
        };
    }
}).enable();
function getRealCallstack(id = async_hooks.executionAsyncId(), baseError: { stack: string } = new Error() as any) {
    let objs = [];

    while(id && asyncInfos[id]) {
        let obj = asyncInfos[id];
        objs.push(obj);
        id = obj.triggerAsyncId;
    }

    function shouldKeepCallSite(callSite: string) {
        callSite = callSite.trim();
        if(callSite.startsWith("at getRealCallstack")) {
            return false;
        }
        if(callSite.startsWith("at AsyncHook.")) {
            return false;
        }
        if(callSite.startsWith("at PromiseWrap.")) {
            return false;
        }
        if(callSite.startsWith("at <anonymous>")) {
            return false;
        }
        return true;
    }
    function filterStack(stack: string) {
        return stack
            .split("\n")
            .slice(1)
            .filter(shouldKeepCallSite)
            .join("\n")
            + "\n"
        ;
    }
    let stack = "";
    stack += filterStack(baseError.stack);
    for(let obj of objs) {
        if(obj.triggerAsyncId === obj.curAsyncId) {
            stack += "ASYNC\n" + filterStack(obj.err.stack);
        }
    }

    return stack;
}

function addAsyncStacksToError(error: { stack: string, executionAsyncId: number, message?: string }) {
    let id = error.executionAsyncId;
    error.stack = getRealCallstack(id, error);
    if(error.message) {
        error.stack = `Error: ${error.message}\n` + error.stack;
    } else {
        error.stack = `Error\n` + error.stack;
    }
    return error;
}

function itAsync(name: string, code: () => Promise<void>) {
    const topStackSpecialId = "IT_TOP_STACK_SPECIAL_ID_ADLASKDLAKSDH";
    return it(name, async function IT_TOP_STACK_SPECIAL_ID_ADLASKDLAKSDH () {
        try {
            await code();
        } catch(e) {
            if(!(e instanceof Error)) {
                throw new Error(`Non Error type thrown ${String(e)}`);
            }

            if(!("executionAsyncId" in e)) {
                throw e;
            }

            // We need to cutoff the callstack at our function, as our test runner uses infinite async recursion, which muddles the stack.
            let newError = addAsyncStacksToError(e);
            let index = newError.stack.indexOf(topStackSpecialId);
            while(index >= 0 && newError.stack[index] === '\n') {
                index--;
            }
            if(index >= 0) {
                newError.stack = newError.stack.slice(0, index);
            }
            console.log(newError.stack);
            throw newError;
        }
    });
}



// file.only
describe("pchan", () => {
    describe("throws", () => {
        it("throws on timeout", async () => {
            let test = pchan();

            await ThrowsAsync(async () => {
                await test.GetPromise();
            });
        });

        it("throws on double close", () => {
            let chan = pchan();
            chan.Close();
            Throws(() => {
                chan.Close();
            });
        });

        it("throws on sending on closed connection", () => {
            let chan = pchan();
            chan.Close();
            Throws(() => {
                chan.SendValue(1);
            });
            // Doesn't throw on sending an error, as an error on a closed connection is fine
            //  (and likely just sending the fact that a send failed, which makes sense, as the connection is closed).
            chan.SendError(1);
        });

        it("throws on getting on closed connection", async () => {
            let chan = pchan();
            chan.Close();
            await ThrowsAsync(async () => {
                await chan.GetPromise();
            });
        });
    });

    describe("misc", () => {
        it("SetDefaultTimeout", async () => {
            let chan!: PChan<number>;
            SetDefaultTimeout(undefined, () => {
                chan = pchan();
            });
            let p = chan.GetPromise();
            await SetTimeoutAsync(100);
            chan.SendValue(1);
            ThrowIfNotImplementsData(await p, 1);
        });
    });

    describe("send, receive", () => {
        it("handles buffered sends", async () => {
            let chan = pchan();
            chan.SendValue(1);
            chan.SendValue(2);
            ThrowIfNotImplementsData(await chan.GetPromise(), 1);
            ThrowIfNotImplementsData(await chan.GetPromise(), 2);
        });
        it("handles buffered gets", async () => {
            let chan = pchan();
            let p1 = chan.GetPromise();
            let p2 = chan.GetPromise();
            chan.SendValue(1);
            chan.SendValue(2);
            ThrowIfNotImplementsData(await p1, 1);
            ThrowIfNotImplementsData(await p2, 2);
        });

        it("handles sending errors", async () => {
            let chan = pchan();
            chan.SendError(1);
            chan.SendError(2);
            try {
                await chan.GetPromise();
                throw new Error(`Previous line should have thrown`);
            } catch(e) {
                ThrowIfNotImplementsData(e, 1);
            }
            try {
                await chan.GetPromise();
                throw new Error(`Previous line should have thrown`);
            } catch(e) {
                ThrowIfNotImplementsData(e, 2);
            }
        });

        it("handles sending errors buffered", async () => {
            let chan = pchan();
            let p1 = chan.GetPromise();
            let p2 = chan.GetPromise();
            chan.SendError(1);
            chan.SendError(2);
            try {
                await p1;
                throw new Error(`Previous line should have thrown`);
            } catch(e) {
                ThrowIfNotImplementsData(e, 1);
            }
            try {
                await p2;
                throw new Error(`Previous line should have thrown`);
            } catch(e) {
                ThrowIfNotImplementsData(e, 2);
            }
        });
    });

    describe("close", () => {
        it("IsClosed", () => {
            let x = pchan();
            x.Close();
            ThrowIfNotImplementsData(x.IsClosed(), true);
        });
        it("handles closing on gets", async () => {
            let chan = pchan();
            let p1 = chan.GetPromise();
            chan.Close();
            await ThrowsAsync(async () => {
                await p1;
            });
        });
    });

    describe("test", () => {
        itAsync("testtest", async () => {
            function a() {
                function b() {
                    throw new Error("test");
                }
                b();
            }
            //a();
            await SetTimeoutAsync(0);
            await (async function one() {
                await (async function two() {
                    await SetTimeoutAsync(0);

                    //todonext
                    // Ugh... every single time we get an error, it will be impossible to debug because of async/await stacks. So...
                    //  we need to fix them. AND async_hooks doesn't really help, as it doesn't distinguish promises and async/await, and we only
                    //  want to preserve the stack for async/await.
                    let err = new Error("something2");
                    throw err;
                    
                    console.log((new Error().stack as any).split("\n").length);
                })();
            })();
        });
    });
});