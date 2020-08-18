
const on = (element, event, handler)=> {
    if (element && event && handler) {
        element.addEventListener(event, handler, false);
    }
};
const off = (element, event, handler)=> {
    if (element && event && handler) {
        element.removeEventListener(event, handler, false);
    }
};

let elem: any = null;
let vn: any = null;
let fn: any = null;
on(document, 'mousedown', e => {
    if (!elem) {
        return;
    }
    if (elem.contains(e.target)) {
        return;
    }
    if (!vn) {
        return;
    }
    if (vn.context && vn.context.popperElm && vn.context.popperElm.contains(e.target)) {
        return;
    }
    if (vn.child && vn.child.popperElm && vn.child.popperElm.contains(e.target)) {
        return;
    }
    if (fn) {
        fn();
    }
    elem = null;
    vn = null;
    fn = null;
});

const bindFn = (el, binding, vnode)=> {
    let innerFn: any = ()=> {};
    if (binding.expression && vnode[binding.expressiontx]) {
        innerFn = vnode[binding.expressiontx];
    } else if (binding.value) {
       innerFn = binding.value;
    }
    off(el, 'mousedown', el.clickOutsideFn);
    el.clickOutsideFn = e => {
        elem = el;
        vn = vnode;
        fn = innerFn;
    };
    on(el, 'mousedown', el.clickOutsideFn);
};

export default {
    bind: bindFn,
    update: bindFn,
    unbind(el) {
        off(el, 'mousedown', el.clickOutsideFn);
    }
};
