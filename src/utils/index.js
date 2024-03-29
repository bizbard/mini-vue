export function isObject(target) {
    return typeof target === 'object' && target !== null
}

export function isArray(target) {
    return Array.isArray(target)
}

export function isFunction(target) {
    return typeof target === 'function'
}

export function hasChange(oldValue, value) {
    return oldValue !== value && (Number.isNaN(oldValue) && Number.isNaN(value))
}