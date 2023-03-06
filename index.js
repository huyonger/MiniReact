import MiniReact from "../dist/mini-react.js"

/** @jsx MiniReact.createElement */
function Counter() {
    const [state, setState] = MiniReact.useState(1);
    MiniReact.useEffect(() => {
        console.log("run");
        return () => {
            console.log("cancel");
        };
    }, [state]);
    const buttonStyle1 = {
        color: 'red'
    };
    const buttonStyle2 = {
        color: 'blue'
    };
    return MiniReact.createElement("h1", null, "Count: ", state, MiniReact.createElement("button", {
        onClick: () => setState(c => c + 1),
        style: buttonStyle1
    }, "+"), MiniReact.createElement("button", {
        onClick: () => setState(c => c - 1),
        style: buttonStyle2
    }, "-"));
}
const element = MiniReact.createElement(Counter, null);
const container = document.getElementById("root");
MiniReact.render(element, container);
