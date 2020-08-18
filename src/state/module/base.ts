import Vue from 'vue';

export default class BaseModule<T> {
    public data!: T;

    constructor(data: T) {
        this.data = Vue.observable(data);
    }
}
