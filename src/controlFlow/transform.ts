import { pchan, PChanReceive, PChanSend, PChan } from "./pChan";

export type TransformedChannel<Input, Output> = (input: Input) => Promise<Output>;

/** Creates a channel that transforms the input, to the output, by calling the tranform function, but only in serial.
 *      I guess this is more like a real channel? Or it could be called a two way channel?
 */
export function TransformChannel<Input, Output>(
    transform: (input: Input) => Promise<Output>,
    afterClose?: () => void,
): TransformedChannel<Input, Output> & {
    Close(): void;
} {
    let inputChan = pchan<Input>();
    let outputChan = pchan<Output>();

    (async () => {
        while(!inputChan.IsClosed() || inputChan.HasValues()) {
            let input;
            try {
                input = await inputChan.GetPromise();
                let output = await transform(input);
                outputChan.SendValue(output);
            } catch (e) {
                outputChan.SendError(e);
            }
        }

        outputChan.Close();

        if(afterClose) {
            afterClose();
        }
    })();

    let acceptInput = (input: Input): Promise<Output> => {
        inputChan.SendValue(input);
        return outputChan.GetPromise();
    };

    return Object.assign(acceptInput, {
        Close() {
            inputChan.Close();
        }
    });
}

export type TransformedChannelAsync<Input, Output> = (input: PChanReceive<Input>) => PChanReceive<Output>;

/** Wraps a function (presumably an infinite loop) with logic to nicely bundle it up into something which transform an input
 *      channel into an output channel. Either channel being closed, or the main loop exiting closes everything.
 * 
 * TODO: Add a while(true) transform mode, where we put some code in a while true loop, allowing errors to be caught,
 *      printed, and then the loop to be run again with new data.
 */
export function TransformChannelAsync<Input, Output>(
    main: (
        params: {
            inputChan: PChanReceive<Input>;
            outputChan: PChanSend<Output>;
        }
    ) => Promise<void>
): TransformedChannelAsync<Input, Output> {
    return function channelFnc(input: PChanReceive<Input>): PChanReceive<Output> {
        // parsing start codes like this takes about 1.5ms per frame on a 5 dollar digital ocean instance. Which... should be fast enough.
        let output = new PChan<Output>();

        let closed = false;
        input.OnClosed.then(() => {
            if(closed) return;
            closed = true;
            if(!output.IsClosed()) {
                output.Close();
            }
        });
        output.OnClosed.then(() => {
            if(closed) return;
            closed = true;
            if(!input.IsClosed()) {
                input.Close();
            }
        });

        main({
            inputChan: input,
            outputChan: output,
        }).then(result => {
            if(!input.IsClosed()) {
                input.Close();
            }
        }).catch(error => {
            if(!input.IsClosedError(error)) {
                console.error(`TransformChannelAsync main loop ended with an error ${String(error)}`);
            }
            if(!input.IsClosed()) {
                input.Close();
            }
        });

        return output;
    }
}