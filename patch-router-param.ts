const Layer = require("express/lib/router/layer");
const Router = require("express/lib/router");

function copyFnProps(oldFn: Function & Dictionary, newFn: Function & Dictionary) {
	for (const key of Object.keys(oldFn)) {
		newFn[key] = oldFn[key];
	}
	return newFn;
}
function wrap(fn: Function) {
	const newFn = function (...args: Array<any>) {
		const argsLength = args.length;
		const returnValue = fn.apply(this, args);
		const next = args[argsLength === 5 ? 2 : argsLength - 1] || Function.prototype;
		returnValue?.catch?.((err: any) => next(err));
		return returnValue;
	};
	Object.defineProperty(newFn, "length", { value: fn.length });
	return copyFnProps(fn, newFn);
}
function patchRouterParam() {
	const originalParam = Router.prototype.constructor.param;
	Router.prototype.constructor.param = function param(name: string, fn: Function) {
		fn = wrap(fn);
		return originalParam.call(this, name, fn);
	};
}

Object.defineProperty(Layer.prototype, "handle", {
	enumerable: true,
	get() {
		return this.__handle;
	},
	set(fn) {
		fn = wrap(fn);
		this.__handle = fn;
	}
});
patchRouterParam();