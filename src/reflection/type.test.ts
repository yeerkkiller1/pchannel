import { Throws, ThrowIfNotImplementsData } from "./assert";

describe("types for testing", () => {
    describe("throwIfNotImplementsData", () => {
        it("can throw", () => {
            Throws(() => {
                ThrowIfNotImplementsData({x: 5}, {x: 6});
            });
        });

        it("can throw when extra array element", () => {
            Throws(() => {
                ThrowIfNotImplementsData([1], []);
            });
        });

        it("can throw when missing array element", () => {
            Throws(() => {
                ThrowIfNotImplementsData([], [1]);
            });
        });

        it("can throw when array instead of object", () => {
            Throws(() => {
                ThrowIfNotImplementsData([], {});
            });
        });
        it("can throw when object instead of array", () => {
            Throws(() => {
                ThrowIfNotImplementsData({}, []);
            });
        });
    });
});