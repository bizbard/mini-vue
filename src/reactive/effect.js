// 副作用嵌套导致外部的副作用函数丢失
const effectStack = []

let activeEffect

export function effect(fn, options = {}) {
    const effectFn = () => {
        try {
            effectStack.push(activeEffect)
            activeEffect = effectFn
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
export function track(target, key) {
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

export function trigger(target, key) {
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