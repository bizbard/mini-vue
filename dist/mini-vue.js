/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/reactive/effect.js":
/*!********************************!*\
  !*** ./src/reactive/effect.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "effect": () => (/* binding */ effect),
/* harmony export */   "track": () => (/* binding */ track),
/* harmony export */   "trigger": () => (/* binding */ trigger)
/* harmony export */ });
// 副作用嵌套导致外部的副作用函数丢失
const effectStack = []

let activeEffect

function effect(fn, options = {}) {
    const effectFn = () => {
        try {
            activeEffect = effectFn
            effectStack.push(activeEffect)
            return fn()
        } finally {
            effectStack.pop()
            activeEffect = effectStack[effectStack.length - 1]
        }
    }
    if (!options.lazy) {
        effectFn()
    }
    effectFn.scheduler = options.scheduler
    return effectFn
}

// targetMap用于存储副作用，并建立副作用与依赖的对应关系。一个副作用可能依赖多个响应式对象，一个响应式对象可能依赖多个属性。同一个属性又可能被多个副作用依赖。
const targetMap = new WeakMap()
function track(target, key) {
    if (!activeEffect) {
        return
    }
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
    }

    let deps = depsMap.get(key)
    if (!deps) {
        depsMap.set(key, (deps = new Set()))
    }

    deps.add(activeEffect)
}

function trigger(target, key) {
    const depsMap = targetMap.get(target)
    if (!depsMap) {
        return
    }
    const deps = depsMap.get(key)
    if (!deps) {
        return
    }
    deps.forEach((effectFn) => {
        // 调值程序优先执行，否则再执行副作用本身
        if (effectFn.scheduler) {
            effectFn.scheduler(effectFn)
        } else {
            effectFn()
        }
    });
}

/***/ }),

/***/ "./src/reactive/reactive.js":
/*!**********************************!*\
  !*** ./src/reactive/reactive.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "reactive": () => (/* binding */ reactive),
/* harmony export */   "isReactive": () => (/* binding */ isReactive)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect */ "./src/reactive/effect.js");



const proxyMap = new WeakMap()
function reactive(target) {
    if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(target)) {
        return target
    }
    // 对象被多层代理包裹
    if (isReactive(target)) {
        return target
    }
    // 同一个对象被重复代理
    if (proxyMap.has(target)) {
        return proxyMap.get(target)
    }

    const proxy = new Proxy(target, {
        get(target, key, receiver) {
            if (key === '__isReactive') {
                return true
            }
            const res = Reflect.get(target, key, receiver)
            ;(0,_effect__WEBPACK_IMPORTED_MODULE_1__.track)(target, key)
            // 深层代理，只有被副作用依赖，才会被递归式地代理
            return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(res) ? reactive(res) : res
        },
        set(target, key, value, receiver) {
            let oldLength = target.length
            const oldValue = target[key]
            const res = Reflect.set(target, key, value, receiver)
            // 如果响应式的值确切改变，副作用才生效
            if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChange)(oldValue, value)) {
                (0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(target, key)
                // 如果响应式对象是数组，手动更新一次key（length）
                if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(target) && (0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChange)(oldLength, target.length)) {
                    (0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(target, 'length')
                }
            }
            return res
        }
    })

    proxyMap.set(target, proxy)

    return proxy
}

function isReactive(target) {
    return !!(target && target.__isReactive)
}

/***/ }),

/***/ "./src/reactive/ref.js":
/*!*****************************!*\
  !*** ./src/reactive/ref.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ref": () => (/* binding */ ref),
/* harmony export */   "isRef": () => (/* binding */ isRef)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect */ "./src/reactive/effect.js");
/* harmony import */ var _reactive__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reactive */ "./src/reactive/reactive.js");




function ref(value) {
    if (isRef(value)) {
        return value
    }
    return new RefImpl(value)
}

function isRef(value) {
    return !!(value && value.__isRef)
}

class RefImpl {
    constructor(value) {
        this.__isRef = true
        this._value = convert(value)
    }

    get value() {
        (0,_effect__WEBPACK_IMPORTED_MODULE_1__.track)(this, 'value')
        return this._value
    }

    set value(newValue) {
        if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChange)(newValue, this._value)) {
            this._value = convert(newValue)
            console.log(newValue);
            (0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(this, 'value')
        }
    }
}

function convert(value) {
    return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(value) ? (0,_reactive__WEBPACK_IMPORTED_MODULE_2__.reactive)(value) : value
}

/***/ }),

/***/ "./src/utils/index.js":
/*!****************************!*\
  !*** ./src/utils/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isObject": () => (/* binding */ isObject),
/* harmony export */   "isArray": () => (/* binding */ isArray),
/* harmony export */   "hasChange": () => (/* binding */ hasChange)
/* harmony export */ });
function isObject(target) {
    return typeof target === 'object' && target !== null
}

function isArray(target) {
    return Array.isArray(target)
}

function hasChange(oldValue, value) {
    return oldValue !== value && (Number.isNaN(oldValue) && Number.isNaN(value))
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
const { effect } = __webpack_require__(/*! ./reactive/effect */ "./src/reactive/effect.js");
// const { reactive } = require("./reactive/reactive");
const { ref } = __webpack_require__(/*! ./reactive/ref */ "./src/reactive/ref.js");
// const { computed } = require("./reactive/computed");

// 1.
// const observed = (window.observed = reactive({
//     count: 0
// }))

// effect(() => {
//     console.log('observed.count is:', observed.count);
// })

// 2.
// const observed = (window.observed = reactive([1, 2, 3]))
// effect(() => {
//     console.log('index 4 is:', observed[4]);
// })
// effect(() => {
//     console.log('length is:', observed.length);
// })

// 3.
// const observed = (window.observed = reactive({
//     count1: 0,
//     count2: 10,
// }))
// effect(() => {
//     effect(() => {
//         console.log('count2 is:', observed.count2);
//     })
//     console.log('count1 is:', observed.count1);
// })

// 4.
const foo = (window.foo = ref(1))
effect(() => {
    console.log('foo:', foo.value);
})

// 5.
// const num = (window.num = ref(0))
// // eslint-disable-next-line no-unused-vars
// const c = (window.c = computed(() => {
//     console.log('calculate c.value');
//     return num.value * 2
// }))

})();

/******/ })()
;