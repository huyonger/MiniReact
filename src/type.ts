type MiniElement = {
    type: string | Function,
    props: {
        children: Array<MiniElement | MiniTextElement>
    }
}

type MiniTextElement = {
    type: "TEXT_ELEMENT",
    props: {
        nodeValue: string | number,
        children: Array<MiniElement | MiniTextElement>
    }
}

type MiniNode = {
    dom: HTMLElement | Text | null,
    props: {
        children: Array<MiniElement | MiniTextElement>
    },
    oldNode: MiniNode | null,
    type: string | number | Function | null,
    parent: MiniNode | null
    child: MiniNode | null
    sibling: MiniNode | null
    effectTag: "UPDATE" | "PLACEMENT" | "DELETION" | null
    hooks?: Array<{ state: any, queue: Array<any> }>
}

export {
    MiniElement,
    MiniTextElement,
    MiniNode
}