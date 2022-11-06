const { effect } = require("./reactive/effect");
const { reactive } = require("./reactive/reactive");
const { ref } = require("./reactive/ref");
const { computed } = require("./reactive/computed");

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
// const foo = (window.foo = ref(1))
// effect(() => {
//     console.log('foo:', foo.value);
// })

// 5.
// const num = (window.num = ref(0))
// // eslint-disable-next-line no-unused-vars
// const c = (window.c = computed(() => {
//     console.log('calculate c.value');
//     return num.value * 2
// }))

// 6.
const num = (window.num = ref(0))
const c = (window.c = computed({
    get() {
        console.log('get');
        return num.value * 2
    },
    set(newVal) {
        num.value = newVal
    }
}))