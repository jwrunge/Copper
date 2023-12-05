import { hashAny } from "./hash";

export let copperConfig = {
    el: {
        str: "CU-STR",
        def: "CU-DEFAULT",
    },
    attr: {
        bind: "cu-bind",
        value: "cu-value",
        html: "cu-html",
        if: "cu-if",
        else: "cu-else",
        elseif: "cu-else-if",
        templ: "cu-template",
    },
    trans: {
        all: "cu-trans",
        in: "cu-in",
        out: "cu-out",
    },
    hash: hashAny,
}

export function updateConfig(config: Partial<typeof copperConfig>) {
    copperConfig = {...copperConfig, ...config};
}
