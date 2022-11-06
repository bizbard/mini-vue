import { hasChange, isArray, isObject } from "../utils";
import { track, trigger } from "./effect";

const proxyMap = new WeakMap()
export function reactive(target) {
    if (isObject(target)) {
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
            track(target, key)
            // 深层代理，只有被副作用依赖，才会被递归式地代理
            return isObject(res) ? reactive(res) : res
        },
        set(target, key, value, receiver) {
            let oldLength = target.length
            const oldValue = target[key]
            const res = Reflect.set(target, key, value, receiver)
            // 如果响应式的值确切改变，副作用才生效
            if (hasChange(oldValue, value)) {
                trigger(target, key)
                // 如果响应式对象是数组，手动更新一次key（length）
                if (isArray(target) && hasChange(oldLength, target.length)) {
                    trigger(target, 'length')
                }
            }
            return res
        }
    })

    proxyMap.set(target, proxy)

    return proxy
}

export function isReactive(target) {
    return !!(target && target.__isReactive)
}