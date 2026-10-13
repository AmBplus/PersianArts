import "preact/compat";
import { render } from "preact";
export const createRoot = el => ({ render: v => render(v, el) });
export const flushSync = f => f();   // preact renders synchronously
