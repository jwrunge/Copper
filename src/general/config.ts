import { hashAny } from "./hash";

export let copperConfig = {
    hashFunc: hashAny,
    bindAttr: "cp-bind",
    evalAttr: "cp-eval",
    ifAttr: "cp-if",
    eachEl: "cp-each",
    transitioningClass: "cp-transitioning",
    transitionInClass: "cp-in",
    transitionOutClass: "cp-out",
}

export function updateConfig(config: Partial<typeof copperConfig>) {
    copperConfig = {...copperConfig, ...config};
}