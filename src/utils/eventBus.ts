import Vue from 'vue';

class EventBus {
    private pubSubCache = {
        $$vuuid: 1,
        id_0: { // 全局列表
            $$vuuid: 1
        }
    };
    private messageCache = {
        $$vuuid: 1
    };

    public register(instance?: any) {
        try {
            instance.$$vuuid = instance.$$vuuid || this.pubSubCache.$$vuuid++;
            this.pubSubCache[`id_${instance.$$vuuid}`] = {
                $$vuuid: 1
            };
        } catch(e) {
            console.log(`can't register by ${instance}`);
        }
    }

    public unregister(instance?: any) {
        try {
            delete this.pubSubCache[`id_${instance.$$vuuid}`];
        } catch(e) {
            console.log(`can't unregister by ${instance}`);
        }
    }

    public on(type: string, handler: any, instance?: any) {
        try {
            instance.$$vuuid = instance.$$vuuid;
        } catch(e) {
            // 直接挂在全局
            instance = {
                $$vuuid: 0
            };
        }
        const handleList = this.pubSubCache[`id_${instance.$$vuuid}`];
        let cache = handleList[type] || (handleList[type] = {});
        handler.$$vuuid = handler.$$vuuid || handleList.$$vuuid++;
        cache[handler.$$vuuid] = handler;
        this.checkMessage(type);
    }

    private checkMessage(type: string) {
        if (this.messageCache[type]) {
            this.emit(type, ...this.messageCache[type]);
            delete this.messageCache[type];
        }
    }

    public once(type: string, handler: any, instance?: any) {
        handler.$$once = true;
        this.on(type, handler, instance);
    }

    public emit(type: string, ...params: any) {
        for(const k of Object.keys(this.pubSubCache)) {
            const handlelist = this.pubSubCache[k];
            let cache = handlelist[type];
            if (!cache) {
                continue;
            }
            for (const key of Object.keys(cache)) {
                const fn = cache[key];
                if (fn.$$once) {
                    this.off(type, fn, {
                        $$vuuid: k.replace('id_', '')
                    });
                }
                fn.call(this, ...params);
            }
        }
    }

    public stickyEmit(type: string, ...params: any) {
        let hasEmit = false;
        for(const k of Object.keys(this.pubSubCache)) {
            const handlelist = this.pubSubCache[k];
            let cache = handlelist[type];
            if (!cache) {
                continue;
            }
            for (const key of Object.keys(cache)) {
                const fn = cache[key];
                if (fn.$$once) {
                    this.off(type, fn, {
                        $$vuuid: k.replace('id_', '')
                    });
                }
                hasEmit = true;
                fn.call(this, ...params);
            }
        }
        if (!hasEmit) {
            this.messageCache[type] = params;
            return;
        }
        delete this.messageCache[type];
    }

    public off(type: string, handler: any, instance?: any) {
        try {
            instance.$$vuuid = instance.$$vuuid;
        } catch(e) {
            // 直接挂在全局
            instance = {
                $$vuuid: 0
            };
        }
        if (!handler || !handler.$$vuuid) {
            // 全部删除
            for(const k of Object.keys(this.pubSubCache)) {
                const handlelist = this.pubSubCache[k];
                delete handlelist[type];
            }
            return;
        }
        const handleList = this.pubSubCache[`id_${instance.$$vuuid}`];
        let cache = handleList[type] || (handleList[type] = {});
        if (!cache) {
            return;
        }
        if (handler.$$vuuid in cache) {
            delete cache[handler.$$vuuid];
        }
        if (Object.keys(cache).length <= 0) {
            delete handleList[type];
        }
    }
}

const bus = new EventBus();
Vue.prototype.$bus = bus;

export default bus;
