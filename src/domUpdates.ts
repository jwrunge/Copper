import { FetchOptions } from "./domRegistrar";

type DomWorkOrder = {
    in: HTMLElement,
    out: HTMLElement,
    relation: string,
    ops: Partial<FetchOptions>,
    done: (el: HTMLElement)=> void
};

let workArray: (DomWorkOrder | Function)[] = [];
let cancelAnimationFrame = false;

export function scheduleDomUpdate(update: DomWorkOrder | Function) {
    workArray.push(update);
    if(!cancelAnimationFrame) {
        cancelAnimationFrame = true;
        requestAnimationFrame(runDomUpdates);
    }
}

function runDomUpdates() {
    cancelAnimationFrame = false;

    console.log("RUNNING DOM UPDATES")
    
    //Loop through all work orders
    for(let order of workArray as DomWorkOrder[]) {
        if(typeof order === "function") (order as Function)();
        else {
            //Remove old children
            if(!order.relation || order.relation == "inner") {
                //Remove old children before appending
                applyTransition(order.out, "out", order.ops, ()=> {
                    let oldChildren = Array.from(order.out?.childNodes || []);
                    oldChildren.forEach(c=> c.remove());
                });

                //Append
                applyTransition(order.in, "in", order.ops, ()=> {
                    order.out?.appendChild(order.in);
                });
            }
            //Insert after old element before removing
            else applyTransition(order.in, "in", order.ops, ()=> {
                order.out?.after(order.in);
            });

            //Remove old element
            if(order.relation === "outer") applyTransition(order.out, "out", {}, ()=> {
                order.out?.remove();
            });

            order.done?.(order.in);
        }
    }

    workArray = [];
}

function applyTransition(el: HTMLElement, dir: "in" | "out", ops: Partial<FetchOptions>, fn: Function) {
    if(ops.transClass) el?.classList?.add(ops.transClass);
    el?.classList?.add("cu-trans");
    el?.classList?.add("in");
    ops[`${dir}StartHook`]?.(el);

    let wrapup = ()=> {
        if(ops.transClass) el?.classList?.remove(ops.transClass);
        el?.classList?.remove("cu-trans");
        el?.classList?.remove("out");
        ops[`${dir}EndHook`]?.(el);
    }
    
    if(ops[`${dir}Dur`]) {
        setTimeout(()=> {
            scheduleDomUpdate(()=> {
                el?.classList?.remove("in");
                el?.classList?.add("out");
                fn();
                wrapup();
            });
        }, 
        (ops[`${dir}Dur`] as number) + (dir == "in" ? ops.swapDelay || 0 : 0));
    }
    else {
        workArray.push(fn);
        ops[`${dir}EndHook`]?.(el);
        el?.classList?.remove("in");
        wrapup();
    }
}