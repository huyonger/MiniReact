import { camelCase2KebabcCase } from "./util.js";
/**
 * global variable
 */
let wipRoot = null;
let oldNode = null;
let nextUnitWork = null;
let deletions = [];
function render(element, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [element],
        },
        oldNode,
        type: null,
        parent: null,
        child: null,
        sibling: null,
        effectTag: null,
    };
    nextUnitWork = wipRoot;
}
let workLoop;
workLoop = function (deadLine) {
    let shouldYield = false;
    while (nextUnitWork && !shouldYield) {
        nextUnitWork = performUnitOfWork(nextUnitWork);
        shouldYield = deadLine.timeRemaining() < 1;
    }
    if (!nextUnitWork && wipRoot) {
        commitRoot();
    }
    requestIdleCallback(workLoop);
};
let commitRoot;
commitRoot = function () {
    deletions.forEach(commitWork);
    commitWork(wipRoot && wipRoot.child);
    oldNode = wipRoot;
    wipRoot = null;
};
let commitWork;
commitWork = function (fiber) {
    var _a;
    if (!fiber) {
        return;
    }
    let domParentFiber = fiber.parent;
    while (!(domParentFiber === null || domParentFiber === void 0 ? void 0 : domParentFiber.dom)) {
        domParentFiber = domParentFiber && (domParentFiber === null || domParentFiber === void 0 ? void 0 : domParentFiber.parent);
    }
    const domParentDom = domParentFiber.dom;
    if (fiber.effectTag === "PLACEMENT") {
        if (fiber.dom != null) {
            domParentDom.appendChild(fiber.dom);
        }
        runEffects(fiber);
    }
    else if (fiber.effectTag === "UPDATE") {
        cancelEffects(fiber);
        if (fiber.dom != null) {
            updateDom(fiber.dom, ((_a = fiber.oldNode) === null || _a === void 0 ? void 0 : _a.props) || {}, fiber.props);
        }
        runEffects(fiber);
    }
    else if (fiber.effectTag === "DELETION") {
        cancelEffects(fiber);
        commitDeletion(fiber, domParentDom);
    }
    commitWork(fiber.child);
    commitWork(fiber.sibling);
};
let commitDeletion;
commitDeletion = function (fiber, domParentDom) {
    if (fiber.dom) {
        domParentDom.removeChild(fiber.dom);
    }
    else {
        // @ts-ignore
        commitDeletion(fiber.child, domParentDom);
    }
};
const isEvent = (key) => key.startsWith("on");
const isStyleProperty = (key) => key === "style";
const isProperty = (key) => key !== "children" && !isEvent(key) && !isStyleProperty(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
let updateDom;
updateDom = function (dom, oldPops, props) {
    //Remove old or changed event listeners
    Object.keys(oldPops)
        .filter(isEvent)
        .filter((key) => !(key in props) || isNew(oldPops, props)(key))
        .forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        dom.removeEventListener(eventType, oldPops[name]);
    });
    // Remove old inline style
    if (Object.keys(oldPops).some(isStyleProperty)) {
        // @ts-ignore
        dom === null || dom === void 0 ? void 0 : dom.removeAttribute("style");
    }
    // Remove old properties
    Object.keys(oldPops)
        .filter(isProperty)
        .filter(isGone(oldPops, props))
        .forEach((name) => {
        // @ts-ignore
        dom[name] = "";
    });
    // Set new or changed properties
    Object.keys(props)
        .filter(isProperty)
        .filter(isNew(oldPops, props))
        .forEach((name) => {
        // @ts-ignore
        dom[name] = props[name];
    });
    // Add event listeners
    Object.keys(props)
        .filter(isEvent)
        .filter(isNew(oldPops, props))
        .forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        dom.addEventListener(eventType, props[name]);
    });
    // Set new inline style
    if (Object.keys(props).some(isStyleProperty)) {
        // @ts-ignore
        dom.setAttribute("style", Object.keys(props["style"]).map((key) => {
            return `${camelCase2KebabcCase(key)}:${props["style"][key]};`;
        }).join(" "));
    }
};
let performUnitOfWork;
performUnitOfWork = function (fiber) {
    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
        updateFunctionComponent(fiber);
    }
    else {
        updateHostComponent(fiber);
    }
    if (fiber.child) {
        return fiber.child;
    }
    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }
    return null;
};
let updateHostComponent;
updateHostComponent = function (fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }
    reconcileChildren(fiber, fiber.props.children);
};
let rootFiber = {};
let hookIndex = 0;
let updateFunctionComponent;
updateFunctionComponent = function (fiber) {
    rootFiber = fiber;
    hookIndex = 0;
    rootFiber.hooks = [];
    const children = [fiber.type instanceof Function && fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
};
let createDom;
createDom = function (fiber) {
    const dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);
    updateDom(dom, {}, fiber.props);
    return dom;
};
let reconcileChildren;
reconcileChildren = function (fiber, elements) {
    let index = 0;
    let oldFilber = fiber.oldNode && fiber.oldNode.child;
    let preSibling = null;
    while (index < elements.length || oldFilber) {
        const element = elements[index];
        let newFiber = null;
        const sameType = oldFilber && element && element.type === oldFilber.type;
        if (oldFilber && sameType) {
            newFiber = {
                type: oldFilber.type,
                props: element.props,
                dom: oldFilber.dom,
                oldNode: oldFilber,
                parent: fiber,
                child: null,
                sibling: null,
                effectTag: "UPDATE",
            };
        }
        if (element && !sameType) {
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                oldNode: null,
                parent: fiber,
                child: null,
                sibling: null,
                effectTag: "PLACEMENT",
            };
        }
        if (oldFilber && !sameType) {
            oldFilber.effectTag = "DELETION";
            deletions.push(oldFilber);
        }
        if (oldFilber) {
            oldFilber = oldFilber.sibling;
        }
        if (index === 0) {
            fiber.child = newFiber;
        }
        else if (element && preSibling) {
            preSibling.sibling = newFiber;
        }
        preSibling = newFiber;
        index++;
    }
};
requestIdleCallback(workLoop);
function createElement(type, props, ...children) {
    return {
        type,
        props: Object.assign(Object.assign({}, props), { children: children.map((child) => (typeof child === "object" ? child : createTextElement(child))) }),
    };
}
function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: [],
        },
    };
}
function useState(initial) {
    const oldHook = rootFiber.oldNode &&
        rootFiber.oldNode.hooks &&
        rootFiber.oldNode.hooks[hookIndex];
    const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: []
    };
    const actions = oldHook ? oldHook.queue : [];
    actions.forEach(action => {
        hook.state = action(hook.state);
    });
    const setState = action => {
        // @ts-ignore
        hook.queue.push(action);
        wipRoot = {
            dom: oldNode && oldNode.dom,
            // @ts-ignore
            props: oldNode && oldNode.props,
            oldNode: oldNode,
            type: null,
            parent: null,
            child: null,
            sibling: null,
            effectTag: null
        };
        nextUnitWork = wipRoot;
        deletions = [];
    };
    // @ts-ignore
    rootFiber.hooks.push(hook);
    hookIndex++;
    return [hook.state, setState];
}
function hasDepsChanged(prevDeps, nextDeps) {
    return !prevDeps ||
        !nextDeps ||
        prevDeps.length !== nextDeps.length ||
        prevDeps.some((dep, index) => dep !== nextDeps[index]);
}
function useEffect(effect, deps) {
    const oldHook = rootFiber.oldNode &&
        rootFiber.oldNode.hooks &&
        rootFiber.oldNode.hooks[hookIndex];
    const hasChanged = hasDepsChanged(
    // @ts-ignore
    oldHook ? oldHook.deps : undefined, deps);
    const hook = {
        tag: "effect",
        effect: hasChanged ? effect : null,
        // @ts-ignore
        cancel: hasChanged && oldHook && oldHook.cancel,
        deps,
    };
    // @ts-ignore
    rootFiber.hooks.push(hook);
    hookIndex++;
}
function cancelEffects(fiber) {
    if (fiber.hooks) {
        fiber.hooks
            .filter(hook => hook.tag === "effect" && hook.cancel)
            .forEach(effectHook => {
            effectHook.cancel();
        });
    }
}
function runEffects(fiber) {
    if (fiber.hooks) {
        fiber.hooks
            .filter(hook => hook.tag === "effect" && hook.effect)
            .forEach(effectHook => {
            effectHook.cancel = effectHook.effect();
        });
    }
}
const MiniReact = {
    render,
    createElement,
    useState,
    useEffect
};
export default MiniReact;
