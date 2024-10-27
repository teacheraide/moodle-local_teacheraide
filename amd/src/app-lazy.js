var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
define(["exports", "core/ajax"], function(exports, ajax) {
  "use strict";
  /**
  * @vue/shared v3.5.0-beta.3
  * (c) 2018-present Yuxi (Evan) You and Vue contributors
  * @license MIT
  **/
  /*! #__NO_SIDE_EFFECTS__ */
  // @__NO_SIDE_EFFECTS__
  function makeMap$2(str2, expectsLowerCase) {
    const set2 = new Set(str2.split(","));
    return (val) => set2.has(val);
  }
  const EMPTY_OBJ$1 = {};
  const NOOP$1 = () => {
  };
  const extend$2 = Object.assign;
  const remove$1 = (arr, el) => {
    const i = arr.indexOf(el);
    if (i > -1) {
      arr.splice(i, 1);
    }
  };
  const hasOwnProperty$3 = Object.prototype.hasOwnProperty;
  const hasOwn$3 = (val, key) => hasOwnProperty$3.call(val, key);
  const isArray$2 = Array.isArray;
  const isMap$1 = (val) => toTypeString$2(val) === "[object Map]";
  const isSet$2 = (val) => toTypeString$2(val) === "[object Set]";
  const isFunction$2 = (val) => typeof val === "function";
  const isString$2 = (val) => typeof val === "string";
  const isSymbol$2 = (val) => typeof val === "symbol";
  const isObject$2 = (val) => val !== null && typeof val === "object";
  const objectToString$2 = Object.prototype.toString;
  const toTypeString$2 = (value) => objectToString$2.call(value);
  const toRawType = (value) => {
    return toTypeString$2(value).slice(8, -1);
  };
  const isPlainObject$3 = (val) => toTypeString$2(val) === "[object Object]";
  const isIntegerKey = (key) => isString$2(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
  const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
  const def$2 = (obj, key, value, writable = false) => {
    Object.defineProperty(obj, key, {
      configurable: true,
      enumerable: false,
      writable,
      value
    });
  };
  /**
  * @vue/reactivity v3.5.0-beta.3
  * (c) 2018-present Yuxi (Evan) You and Vue contributors
  * @license MIT
  **/
  let activeEffectScope;
  class EffectScope {
    constructor(detached = false) {
      this.detached = detached;
      this._active = true;
      this.effects = [];
      this.cleanups = [];
      this._isPaused = false;
      this.parent = activeEffectScope;
      if (!detached && activeEffectScope) {
        this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
          this
        ) - 1;
      }
    }
    get active() {
      return this._active;
    }
    pause() {
      if (this._active) {
        this._isPaused = true;
        if (this.scopes) {
          for (let i = 0, l = this.scopes.length; i < l; i++) {
            this.scopes[i].pause();
          }
        }
        for (let i = 0, l = this.effects.length; i < l; i++) {
          this.effects[i].pause();
        }
      }
    }
    /**
     * Resumes the effect scope, including all child scopes and effects.
     */
    resume() {
      if (this._active) {
        if (this._isPaused) {
          this._isPaused = false;
          if (this.scopes) {
            for (let i = 0, l = this.scopes.length; i < l; i++) {
              this.scopes[i].resume();
            }
          }
          for (let i = 0, l = this.effects.length; i < l; i++) {
            this.effects[i].resume();
          }
        }
      }
    }
    run(fn) {
      if (this._active) {
        const currentEffectScope = activeEffectScope;
        try {
          activeEffectScope = this;
          return fn();
        } finally {
          activeEffectScope = currentEffectScope;
        }
      }
    }
    /**
     * This should only be called on non-detached scopes
     * @internal
     */
    on() {
      activeEffectScope = this;
    }
    /**
     * This should only be called on non-detached scopes
     * @internal
     */
    off() {
      activeEffectScope = this.parent;
    }
    stop(fromParent) {
      if (this._active) {
        let i, l;
        for (i = 0, l = this.effects.length; i < l; i++) {
          this.effects[i].stop();
        }
        for (i = 0, l = this.cleanups.length; i < l; i++) {
          this.cleanups[i]();
        }
        if (this.scopes) {
          for (i = 0, l = this.scopes.length; i < l; i++) {
            this.scopes[i].stop(true);
          }
        }
        if (!this.detached && this.parent && !fromParent) {
          const last = this.parent.scopes.pop();
          if (last && last !== this) {
            this.parent.scopes[this.index] = last;
            last.index = this.index;
          }
        }
        this.parent = void 0;
        this._active = false;
      }
    }
  }
  function effectScope(detached) {
    return new EffectScope(detached);
  }
  function getCurrentScope() {
    return activeEffectScope;
  }
  function onScopeDispose(fn, failSilently = false) {
    if (activeEffectScope) {
      activeEffectScope.cleanups.push(fn);
    }
  }
  let activeSub;
  const pausedQueueEffects = /* @__PURE__ */ new WeakSet();
  class ReactiveEffect {
    constructor(fn) {
      this.fn = fn;
      this.deps = void 0;
      this.depsTail = void 0;
      this.flags = 1 | 4;
      this.nextEffect = void 0;
      this.cleanup = void 0;
      this.scheduler = void 0;
      if (activeEffectScope && activeEffectScope.active) {
        activeEffectScope.effects.push(this);
      }
    }
    pause() {
      this.flags |= 64;
    }
    resume() {
      if (this.flags & 64) {
        this.flags &= ~64;
        if (pausedQueueEffects.has(this)) {
          pausedQueueEffects.delete(this);
          this.trigger();
        }
      }
    }
    /**
     * @internal
     */
    notify() {
      if (this.flags & 2 && !(this.flags & 32)) {
        return;
      }
      if (!(this.flags & 8)) {
        this.flags |= 8;
        this.nextEffect = batchedEffect;
        batchedEffect = this;
      }
    }
    run() {
      if (!(this.flags & 1)) {
        return this.fn();
      }
      this.flags |= 2;
      cleanupEffect(this);
      prepareDeps(this);
      const prevEffect = activeSub;
      const prevShouldTrack = shouldTrack;
      activeSub = this;
      shouldTrack = true;
      try {
        return this.fn();
      } finally {
        cleanupDeps(this);
        activeSub = prevEffect;
        shouldTrack = prevShouldTrack;
        this.flags &= ~2;
      }
    }
    stop() {
      if (this.flags & 1) {
        for (let link2 = this.deps; link2; link2 = link2.nextDep) {
          removeSub(link2);
        }
        this.deps = this.depsTail = void 0;
        cleanupEffect(this);
        this.onStop && this.onStop();
        this.flags &= ~1;
      }
    }
    trigger() {
      if (this.flags & 64) {
        pausedQueueEffects.add(this);
      } else if (this.scheduler) {
        this.scheduler();
      } else {
        this.runIfDirty();
      }
    }
    /**
     * @internal
     */
    runIfDirty() {
      if (isDirty(this)) {
        this.run();
      }
    }
    get dirty() {
      return isDirty(this);
    }
  }
  let batchDepth = 0;
  let batchedEffect;
  function startBatch() {
    batchDepth++;
  }
  function endBatch() {
    if (batchDepth > 1) {
      batchDepth--;
      return;
    }
    batchDepth--;
    let error;
    while (batchedEffect) {
      let e = batchedEffect;
      batchedEffect = void 0;
      while (e) {
        const next = e.nextEffect;
        e.nextEffect = void 0;
        e.flags &= ~8;
        if (e.flags & 1) {
          try {
            e.trigger();
          } catch (err) {
            if (!error) error = err;
          }
        }
        e = next;
      }
    }
    if (error) throw error;
  }
  function prepareDeps(sub) {
    for (let link2 = sub.deps; link2; link2 = link2.nextDep) {
      link2.version = -1;
      link2.prevActiveLink = link2.dep.activeLink;
      link2.dep.activeLink = link2;
    }
  }
  function cleanupDeps(sub) {
    let head;
    let tail = sub.depsTail;
    for (let link2 = tail; link2; link2 = link2.prevDep) {
      if (link2.version === -1) {
        if (link2 === tail) tail = link2.prevDep;
        removeSub(link2);
        removeDep(link2);
      } else {
        head = link2;
      }
      link2.dep.activeLink = link2.prevActiveLink;
      link2.prevActiveLink = void 0;
    }
    sub.deps = head;
    sub.depsTail = tail;
  }
  function isDirty(sub) {
    for (let link2 = sub.deps; link2; link2 = link2.nextDep) {
      if (link2.dep.version !== link2.version || link2.dep.computed && refreshComputed(link2.dep.computed) === false || link2.dep.version !== link2.version) {
        return true;
      }
    }
    if (sub._dirty) {
      return true;
    }
    return false;
  }
  function refreshComputed(computed2) {
    if (computed2.flags & 2) {
      return false;
    }
    if (computed2.flags & 4 && !(computed2.flags & 16)) {
      return;
    }
    computed2.flags &= ~16;
    if (computed2.globalVersion === globalVersion) {
      return;
    }
    computed2.globalVersion = globalVersion;
    const dep = computed2.dep;
    computed2.flags |= 2;
    if (dep.version > 0 && !computed2.isSSR && !isDirty(computed2)) {
      computed2.flags &= ~2;
      return;
    }
    const prevSub = activeSub;
    const prevShouldTrack = shouldTrack;
    activeSub = computed2;
    shouldTrack = true;
    try {
      prepareDeps(computed2);
      const value = computed2.fn();
      if (dep.version === 0 || hasChanged(value, computed2._value)) {
        computed2._value = value;
        dep.version++;
      }
    } catch (err) {
      dep.version++;
      throw err;
    } finally {
      activeSub = prevSub;
      shouldTrack = prevShouldTrack;
      cleanupDeps(computed2);
      computed2.flags &= ~2;
    }
  }
  function removeSub(link2) {
    const { dep, prevSub, nextSub } = link2;
    if (prevSub) {
      prevSub.nextSub = nextSub;
      link2.prevSub = void 0;
    }
    if (nextSub) {
      nextSub.prevSub = prevSub;
      link2.nextSub = void 0;
    }
    if (dep.subs === link2) {
      dep.subs = prevSub;
    }
    if (!dep.subs && dep.computed) {
      dep.computed.flags &= ~4;
      for (let l = dep.computed.deps; l; l = l.nextDep) {
        removeSub(l);
      }
    }
  }
  function removeDep(link2) {
    const { prevDep, nextDep } = link2;
    if (prevDep) {
      prevDep.nextDep = nextDep;
      link2.prevDep = void 0;
    }
    if (nextDep) {
      nextDep.prevDep = prevDep;
      link2.nextDep = void 0;
    }
  }
  let shouldTrack = true;
  const trackStack = [];
  function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
  }
  function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === void 0 ? true : last;
  }
  function cleanupEffect(e) {
    const { cleanup } = e;
    e.cleanup = void 0;
    if (cleanup) {
      const prevSub = activeSub;
      activeSub = void 0;
      try {
        cleanup();
      } finally {
        activeSub = prevSub;
      }
    }
  }
  let globalVersion = 0;
  class Dep {
    constructor(computed2) {
      this.computed = computed2;
      this.version = 0;
      this.activeLink = void 0;
      this.subs = void 0;
    }
    track(debugInfo) {
      if (!activeSub || !shouldTrack) {
        return;
      }
      let link2 = this.activeLink;
      if (link2 === void 0 || link2.sub !== activeSub) {
        link2 = this.activeLink = {
          dep: this,
          sub: activeSub,
          version: this.version,
          nextDep: void 0,
          prevDep: void 0,
          nextSub: void 0,
          prevSub: void 0,
          prevActiveLink: void 0
        };
        if (!activeSub.deps) {
          activeSub.deps = activeSub.depsTail = link2;
        } else {
          link2.prevDep = activeSub.depsTail;
          activeSub.depsTail.nextDep = link2;
          activeSub.depsTail = link2;
        }
        if (activeSub.flags & 4) {
          addSub(link2);
        }
      } else if (link2.version === -1) {
        link2.version = this.version;
        if (link2.nextDep) {
          const next = link2.nextDep;
          next.prevDep = link2.prevDep;
          if (link2.prevDep) {
            link2.prevDep.nextDep = next;
          }
          link2.prevDep = activeSub.depsTail;
          link2.nextDep = void 0;
          activeSub.depsTail.nextDep = link2;
          activeSub.depsTail = link2;
          if (activeSub.deps === link2) {
            activeSub.deps = next;
          }
        }
      }
      return link2;
    }
    trigger(debugInfo) {
      this.version++;
      globalVersion++;
      this.notify(debugInfo);
    }
    notify(debugInfo) {
      startBatch();
      try {
        if (false) ;
        for (let link2 = this.subs; link2; link2 = link2.prevSub) {
          link2.sub.notify();
        }
      } finally {
        endBatch();
      }
    }
  }
  function addSub(link2) {
    const computed2 = link2.dep.computed;
    if (computed2 && !link2.dep.subs) {
      computed2.flags |= 4 | 16;
      for (let l = computed2.deps; l; l = l.nextDep) {
        addSub(l);
      }
    }
    const currentTail = link2.dep.subs;
    if (currentTail !== link2) {
      link2.prevSub = currentTail;
      if (currentTail) currentTail.nextSub = link2;
    }
    link2.dep.subs = link2;
  }
  const targetMap = /* @__PURE__ */ new WeakMap();
  const ITERATE_KEY = Symbol(
    ""
  );
  const MAP_KEY_ITERATE_KEY = Symbol(
    ""
  );
  const ARRAY_ITERATE_KEY = Symbol(
    ""
  );
  function track(target, type2, key) {
    if (shouldTrack && activeSub) {
      let depsMap = targetMap.get(target);
      if (!depsMap) {
        targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
      }
      let dep = depsMap.get(key);
      if (!dep) {
        depsMap.set(key, dep = new Dep());
      }
      {
        dep.track();
      }
    }
  }
  function trigger(target, type2, key, newValue, oldValue, oldTarget) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
      globalVersion++;
      return;
    }
    let deps = [];
    if (type2 === "clear") {
      deps = [...depsMap.values()];
    } else {
      const targetIsArray = isArray$2(target);
      const isArrayIndex = targetIsArray && isIntegerKey(key);
      if (targetIsArray && key === "length") {
        const newLength = Number(newValue);
        depsMap.forEach((dep, key2) => {
          if (key2 === "length" || key2 === ARRAY_ITERATE_KEY || !isSymbol$2(key2) && key2 >= newLength) {
            deps.push(dep);
          }
        });
      } else {
        const push = (dep) => dep && deps.push(dep);
        if (key !== void 0) {
          push(depsMap.get(key));
        }
        if (isArrayIndex) {
          push(depsMap.get(ARRAY_ITERATE_KEY));
        }
        switch (type2) {
          case "add":
            if (!targetIsArray) {
              push(depsMap.get(ITERATE_KEY));
              if (isMap$1(target)) {
                push(depsMap.get(MAP_KEY_ITERATE_KEY));
              }
            } else if (isArrayIndex) {
              push(depsMap.get("length"));
            }
            break;
          case "delete":
            if (!targetIsArray) {
              push(depsMap.get(ITERATE_KEY));
              if (isMap$1(target)) {
                push(depsMap.get(MAP_KEY_ITERATE_KEY));
              }
            }
            break;
          case "set":
            if (isMap$1(target)) {
              push(depsMap.get(ITERATE_KEY));
            }
            break;
        }
      }
    }
    startBatch();
    for (const dep of deps) {
      {
        dep.trigger();
      }
    }
    endBatch();
  }
  function getDepFromReactive(object, key) {
    var _a2;
    return (_a2 = targetMap.get(object)) == null ? void 0 : _a2.get(key);
  }
  function reactiveReadArray(array) {
    const raw = toRaw(array);
    if (raw === array) return raw;
    track(raw, "iterate", ARRAY_ITERATE_KEY);
    return isShallow(array) ? raw : raw.map(toReactive);
  }
  function shallowReadArray(arr) {
    track(arr = toRaw(arr), "iterate", ARRAY_ITERATE_KEY);
    return arr;
  }
  const arrayInstrumentations = {
    __proto__: null,
    [Symbol.iterator]() {
      return iterator(this, Symbol.iterator, toReactive);
    },
    concat(...args) {
      return reactiveReadArray(this).concat(
        ...args.map((x) => reactiveReadArray(x))
      );
    },
    entries() {
      return iterator(this, "entries", (value) => {
        value[1] = toReactive(value[1]);
        return value;
      });
    },
    every(fn, thisArg) {
      return apply(this, "every", fn, thisArg, void 0, arguments);
    },
    filter(fn, thisArg) {
      return apply(this, "filter", fn, thisArg, (v) => v.map(toReactive), arguments);
    },
    find(fn, thisArg) {
      return apply(this, "find", fn, thisArg, toReactive, arguments);
    },
    findIndex(fn, thisArg) {
      return apply(this, "findIndex", fn, thisArg, void 0, arguments);
    },
    findLast(fn, thisArg) {
      return apply(this, "findLast", fn, thisArg, toReactive, arguments);
    },
    findLastIndex(fn, thisArg) {
      return apply(this, "findLastIndex", fn, thisArg, void 0, arguments);
    },
    // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
    forEach(fn, thisArg) {
      return apply(this, "forEach", fn, thisArg, void 0, arguments);
    },
    includes(...args) {
      return searchProxy(this, "includes", args);
    },
    indexOf(...args) {
      return searchProxy(this, "indexOf", args);
    },
    join(separator) {
      return reactiveReadArray(this).join(separator);
    },
    // keys() iterator only reads `length`, no optimisation required
    lastIndexOf(...args) {
      return searchProxy(this, "lastIndexOf", args);
    },
    map(fn, thisArg) {
      return apply(this, "map", fn, thisArg, void 0, arguments);
    },
    pop() {
      return noTracking(this, "pop");
    },
    push(...args) {
      return noTracking(this, "push", args);
    },
    reduce(fn, ...args) {
      return reduce(this, "reduce", fn, args);
    },
    reduceRight(fn, ...args) {
      return reduce(this, "reduceRight", fn, args);
    },
    shift() {
      return noTracking(this, "shift");
    },
    // slice could use ARRAY_ITERATE but also seems to beg for range tracking
    some(fn, thisArg) {
      return apply(this, "some", fn, thisArg, void 0, arguments);
    },
    splice(...args) {
      return noTracking(this, "splice", args);
    },
    toReversed() {
      return reactiveReadArray(this).toReversed();
    },
    toSorted(comparer) {
      return reactiveReadArray(this).toSorted(comparer);
    },
    toSpliced(...args) {
      return reactiveReadArray(this).toSpliced(...args);
    },
    unshift(...args) {
      return noTracking(this, "unshift", args);
    },
    values() {
      return iterator(this, "values", toReactive);
    }
  };
  function iterator(self2, method, wrapValue) {
    const arr = shallowReadArray(self2);
    const iter = arr[method]();
    if (arr !== self2 && !isShallow(self2)) {
      iter._next = iter.next;
      iter.next = () => {
        const result = iter._next();
        if (result.value) {
          result.value = wrapValue(result.value);
        }
        return result;
      };
    }
    return iter;
  }
  const arrayProto = Array.prototype;
  function apply(self2, method, fn, thisArg, wrappedRetFn, args) {
    const arr = shallowReadArray(self2);
    const needsWrap = arr !== self2 && !isShallow(self2);
    const methodFn = arr[method];
    if (methodFn !== arrayProto[method]) {
      const result2 = methodFn.apply(arr, args);
      return needsWrap ? toReactive(result2) : result2;
    }
    let wrappedFn = fn;
    if (arr !== self2) {
      if (needsWrap) {
        wrappedFn = function(item, index) {
          return fn.call(this, toReactive(item), index, self2);
        };
      } else if (fn.length > 2) {
        wrappedFn = function(item, index) {
          return fn.call(this, item, index, self2);
        };
      }
    }
    const result = methodFn.call(arr, wrappedFn, thisArg);
    return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
  }
  function reduce(self2, method, fn, args) {
    const arr = shallowReadArray(self2);
    let wrappedFn = fn;
    if (arr !== self2) {
      if (!isShallow(self2)) {
        wrappedFn = function(acc, item, index) {
          return fn.call(this, acc, toReactive(item), index, self2);
        };
      } else if (fn.length > 3) {
        wrappedFn = function(acc, item, index) {
          return fn.call(this, acc, item, index, self2);
        };
      }
    }
    return arr[method](wrappedFn, ...args);
  }
  function searchProxy(self2, method, args) {
    const arr = toRaw(self2);
    track(arr, "iterate", ARRAY_ITERATE_KEY);
    const res = arr[method](...args);
    if ((res === -1 || res === false) && isProxy(args[0])) {
      args[0] = toRaw(args[0]);
      return arr[method](...args);
    }
    return res;
  }
  function noTracking(self2, method, args = []) {
    pauseTracking();
    startBatch();
    const res = toRaw(self2)[method].apply(self2, args);
    endBatch();
    resetTracking();
    return res;
  }
  const isNonTrackableKeys = /* @__PURE__ */ makeMap$2(`__proto__,__v_isRef,__isVue`);
  const builtInSymbols = new Set(
    /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol$2)
  );
  function hasOwnProperty$2(key) {
    if (!isSymbol$2(key)) key = String(key);
    const obj = toRaw(this);
    track(obj, "has", key);
    return obj.hasOwnProperty(key);
  }
  class BaseReactiveHandler {
    constructor(_isReadonly = false, _isShallow = false) {
      this._isReadonly = _isReadonly;
      this._isShallow = _isShallow;
    }
    get(target, key, receiver) {
      const isReadonly2 = this._isReadonly, isShallow2 = this._isShallow;
      if (key === "__v_isReactive") {
        return !isReadonly2;
      } else if (key === "__v_isReadonly") {
        return isReadonly2;
      } else if (key === "__v_isShallow") {
        return isShallow2;
      } else if (key === "__v_raw") {
        if (receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveMap).get(target) || // receiver is not the reactive proxy, but has the same prototype
        // this means the receiver is a user proxy of the reactive proxy
        Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) {
          return target;
        }
        return;
      }
      const targetIsArray = isArray$2(target);
      if (!isReadonly2) {
        let fn;
        if (targetIsArray && (fn = arrayInstrumentations[key])) {
          return fn;
        }
        if (key === "hasOwnProperty") {
          return hasOwnProperty$2;
        }
      }
      const res = Reflect.get(
        target,
        key,
        // if this is a proxy wrapping a ref, return methods using the raw ref
        // as receiver so that we don't have to call `toRaw` on the ref in all
        // its class methods
        isRef$1(target) ? target : receiver
      );
      if (isSymbol$2(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
        return res;
      }
      if (!isReadonly2) {
        track(target, "get", key);
      }
      if (isShallow2) {
        return res;
      }
      if (isRef$1(res)) {
        return targetIsArray && isIntegerKey(key) ? res : res.value;
      }
      if (isObject$2(res)) {
        return isReadonly2 ? readonly(res) : reactive(res);
      }
      return res;
    }
  }
  class MutableReactiveHandler extends BaseReactiveHandler {
    constructor(isShallow2 = false) {
      super(false, isShallow2);
    }
    set(target, key, value, receiver) {
      let oldValue = target[key];
      if (!this._isShallow) {
        const isOldValueReadonly = isReadonly(oldValue);
        if (!isShallow(value) && !isReadonly(value)) {
          oldValue = toRaw(oldValue);
          value = toRaw(value);
        }
        if (!isArray$2(target) && isRef$1(oldValue) && !isRef$1(value)) {
          if (isOldValueReadonly) {
            return false;
          } else {
            oldValue.value = value;
            return true;
          }
        }
      }
      const hadKey = isArray$2(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn$3(target, key);
      const result = Reflect.set(target, key, value, receiver);
      if (target === toRaw(receiver)) {
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key, value);
        }
      }
      return result;
    }
    deleteProperty(target, key) {
      const hadKey = hasOwn$3(target, key);
      target[key];
      const result = Reflect.deleteProperty(target, key);
      if (result && hadKey) {
        trigger(target, "delete", key, void 0);
      }
      return result;
    }
    has(target, key) {
      const result = Reflect.has(target, key);
      if (!isSymbol$2(key) || !builtInSymbols.has(key)) {
        track(target, "has", key);
      }
      return result;
    }
    ownKeys(target) {
      track(
        target,
        "iterate",
        isArray$2(target) ? "length" : ITERATE_KEY
      );
      return Reflect.ownKeys(target);
    }
  }
  class ReadonlyReactiveHandler extends BaseReactiveHandler {
    constructor(isShallow2 = false) {
      super(true, isShallow2);
    }
    set(target, key) {
      return true;
    }
    deleteProperty(target, key) {
      return true;
    }
  }
  const mutableHandlers = /* @__PURE__ */ new MutableReactiveHandler();
  const readonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler();
  const shallowReactiveHandlers = /* @__PURE__ */ new MutableReactiveHandler(true);
  const shallowReadonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler(true);
  const toShallow = (value) => value;
  const getProto = (v) => Reflect.getPrototypeOf(v);
  function get(target, key, isReadonly2 = false, isShallow2 = false) {
    target = target["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (!isReadonly2) {
      if (hasChanged(key, rawKey)) {
        track(rawTarget, "get", key);
      }
      track(rawTarget, "get", rawKey);
    }
    const { has: has2 } = getProto(rawTarget);
    const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
    if (has2.call(rawTarget, key)) {
      return wrap(target.get(key));
    } else if (has2.call(rawTarget, rawKey)) {
      return wrap(target.get(rawKey));
    } else if (target !== rawTarget) {
      target.get(key);
    }
  }
  function has(key, isReadonly2 = false) {
    const target = this["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (!isReadonly2) {
      if (hasChanged(key, rawKey)) {
        track(rawTarget, "has", key);
      }
      track(rawTarget, "has", rawKey);
    }
    return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
  }
  function size(target, isReadonly2 = false) {
    target = target["__v_raw"];
    !isReadonly2 && track(toRaw(target), "iterate", ITERATE_KEY);
    return Reflect.get(target, "size", target);
  }
  function add(value, _isShallow = false) {
    if (!_isShallow && !isShallow(value) && !isReadonly(value)) {
      value = toRaw(value);
    }
    const target = toRaw(this);
    const proto = getProto(target);
    const hadKey = proto.has.call(target, value);
    if (!hadKey) {
      target.add(value);
      trigger(target, "add", value, value);
    }
    return this;
  }
  function set(key, value, _isShallow = false) {
    if (!_isShallow && !isShallow(value) && !isReadonly(value)) {
      value = toRaw(value);
    }
    const target = toRaw(this);
    const { has: has2, get: get2 } = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    }
    const oldValue = get2.call(target, key);
    target.set(key, value);
    if (!hadKey) {
      trigger(target, "add", key, value);
    } else if (hasChanged(value, oldValue)) {
      trigger(target, "set", key, value);
    }
    return this;
  }
  function deleteEntry(key) {
    const target = toRaw(this);
    const { has: has2, get: get2 } = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    }
    get2 ? get2.call(target, key) : void 0;
    const result = target.delete(key);
    if (hadKey) {
      trigger(target, "delete", key, void 0);
    }
    return result;
  }
  function clear() {
    const target = toRaw(this);
    const hadItems = target.size !== 0;
    const result = target.clear();
    if (hadItems) {
      trigger(target, "clear", void 0, void 0);
    }
    return result;
  }
  function createForEach(isReadonly2, isShallow2) {
    return function forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = toRaw(target);
      const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
      !isReadonly2 && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    };
  }
  function createIterableMethod(method, isReadonly2, isShallow2) {
    return function(...args) {
      const target = this["__v_raw"];
      const rawTarget = toRaw(target);
      const targetIsMap = isMap$1(rawTarget);
      const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
      const isKeyOnly = method === "keys" && targetIsMap;
      const innerIterator = target[method](...args);
      const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
      !isReadonly2 && track(
        rawTarget,
        "iterate",
        isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
      );
      return {
        // iterator protocol
        next() {
          const { value, done } = innerIterator.next();
          return done ? { value, done } : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        },
        // iterable protocol
        [Symbol.iterator]() {
          return this;
        }
      };
    };
  }
  function createReadonlyMethod(type2) {
    return function(...args) {
      return type2 === "delete" ? false : type2 === "clear" ? void 0 : this;
    };
  }
  function createInstrumentations() {
    const mutableInstrumentations2 = {
      get(key) {
        return get(this, key);
      },
      get size() {
        return size(this);
      },
      has,
      add,
      set,
      delete: deleteEntry,
      clear,
      forEach: createForEach(false, false)
    };
    const shallowInstrumentations2 = {
      get(key) {
        return get(this, key, false, true);
      },
      get size() {
        return size(this);
      },
      has,
      add(value) {
        return add.call(this, value, true);
      },
      set(key, value) {
        return set.call(this, key, value, true);
      },
      delete: deleteEntry,
      clear,
      forEach: createForEach(false, true)
    };
    const readonlyInstrumentations2 = {
      get(key) {
        return get(this, key, true);
      },
      get size() {
        return size(this, true);
      },
      has(key) {
        return has.call(this, key, true);
      },
      add: createReadonlyMethod("add"),
      set: createReadonlyMethod("set"),
      delete: createReadonlyMethod("delete"),
      clear: createReadonlyMethod("clear"),
      forEach: createForEach(true, false)
    };
    const shallowReadonlyInstrumentations2 = {
      get(key) {
        return get(this, key, true, true);
      },
      get size() {
        return size(this, true);
      },
      has(key) {
        return has.call(this, key, true);
      },
      add: createReadonlyMethod("add"),
      set: createReadonlyMethod("set"),
      delete: createReadonlyMethod("delete"),
      clear: createReadonlyMethod("clear"),
      forEach: createForEach(true, true)
    };
    const iteratorMethods = [
      "keys",
      "values",
      "entries",
      Symbol.iterator
    ];
    iteratorMethods.forEach((method) => {
      mutableInstrumentations2[method] = createIterableMethod(method, false, false);
      readonlyInstrumentations2[method] = createIterableMethod(method, true, false);
      shallowInstrumentations2[method] = createIterableMethod(method, false, true);
      shallowReadonlyInstrumentations2[method] = createIterableMethod(
        method,
        true,
        true
      );
    });
    return [
      mutableInstrumentations2,
      readonlyInstrumentations2,
      shallowInstrumentations2,
      shallowReadonlyInstrumentations2
    ];
  }
  const [
    mutableInstrumentations,
    readonlyInstrumentations,
    shallowInstrumentations,
    shallowReadonlyInstrumentations
  ] = /* @__PURE__ */ createInstrumentations();
  function createInstrumentationGetter(isReadonly2, shallow) {
    const instrumentations = shallow ? isReadonly2 ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly2 ? readonlyInstrumentations : mutableInstrumentations;
    return (target, key, receiver) => {
      if (key === "__v_isReactive") {
        return !isReadonly2;
      } else if (key === "__v_isReadonly") {
        return isReadonly2;
      } else if (key === "__v_raw") {
        return target;
      }
      return Reflect.get(
        hasOwn$3(instrumentations, key) && key in target ? instrumentations : target,
        key,
        receiver
      );
    };
  }
  const mutableCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(false, false)
  };
  const shallowCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(false, true)
  };
  const readonlyCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(true, false)
  };
  const shallowReadonlyCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(true, true)
  };
  const reactiveMap = /* @__PURE__ */ new WeakMap();
  const shallowReactiveMap = /* @__PURE__ */ new WeakMap();
  const readonlyMap = /* @__PURE__ */ new WeakMap();
  const shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
  function targetTypeMap(rawType) {
    switch (rawType) {
      case "Object":
      case "Array":
        return 1;
      case "Map":
      case "Set":
      case "WeakMap":
      case "WeakSet":
        return 2;
      default:
        return 0;
    }
  }
  function getTargetType(value) {
    return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
  }
  function reactive(target) {
    if (isReadonly(target)) {
      return target;
    }
    return createReactiveObject(
      target,
      false,
      mutableHandlers,
      mutableCollectionHandlers,
      reactiveMap
    );
  }
  function shallowReactive(target) {
    return createReactiveObject(
      target,
      false,
      shallowReactiveHandlers,
      shallowCollectionHandlers,
      shallowReactiveMap
    );
  }
  function readonly(target) {
    return createReactiveObject(
      target,
      true,
      readonlyHandlers,
      readonlyCollectionHandlers,
      readonlyMap
    );
  }
  function shallowReadonly(target) {
    return createReactiveObject(
      target,
      true,
      shallowReadonlyHandlers,
      shallowReadonlyCollectionHandlers,
      shallowReadonlyMap
    );
  }
  function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
    if (!isObject$2(target)) {
      return target;
    }
    if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) {
      return target;
    }
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    const targetType = getTargetType(target);
    if (targetType === 0) {
      return target;
    }
    const proxy = new Proxy(
      target,
      targetType === 2 ? collectionHandlers : baseHandlers
    );
    proxyMap.set(target, proxy);
    return proxy;
  }
  function isReactive(value) {
    if (isReadonly(value)) {
      return isReactive(value["__v_raw"]);
    }
    return !!(value && value["__v_isReactive"]);
  }
  function isReadonly(value) {
    return !!(value && value["__v_isReadonly"]);
  }
  function isShallow(value) {
    return !!(value && value["__v_isShallow"]);
  }
  function isProxy(value) {
    return value ? !!value["__v_raw"] : false;
  }
  function toRaw(observed) {
    const raw = observed && observed["__v_raw"];
    return raw ? toRaw(raw) : observed;
  }
  function markRaw(value) {
    if (Object.isExtensible(value)) {
      def$2(value, "__v_skip", true);
    }
    return value;
  }
  const toReactive = (value) => isObject$2(value) ? reactive(value) : value;
  const toReadonly = (value) => isObject$2(value) ? readonly(value) : value;
  function isRef$1(r) {
    return r ? r["__v_isRef"] === true : false;
  }
  function ref(value) {
    return createRef(value, false);
  }
  function createRef(rawValue, shallow) {
    if (isRef$1(rawValue)) {
      return rawValue;
    }
    return new RefImpl(rawValue, shallow);
  }
  class RefImpl {
    constructor(value, isShallow2) {
      this.dep = new Dep();
      this["__v_isRef"] = true;
      this["__v_isShallow"] = false;
      this._rawValue = isShallow2 ? value : toRaw(value);
      this._value = isShallow2 ? value : toReactive(value);
      this["__v_isShallow"] = isShallow2;
    }
    get value() {
      {
        this.dep.track();
      }
      return this._value;
    }
    set value(newValue) {
      const oldValue = this._rawValue;
      const useDirectValue = this["__v_isShallow"] || isShallow(newValue) || isReadonly(newValue);
      newValue = useDirectValue ? newValue : toRaw(newValue);
      if (hasChanged(newValue, oldValue)) {
        this._rawValue = newValue;
        this._value = useDirectValue ? newValue : toReactive(newValue);
        {
          this.dep.trigger();
        }
      }
    }
  }
  function unref(ref2) {
    return isRef$1(ref2) ? ref2.value : ref2;
  }
  const shallowUnwrapHandlers = {
    get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
    set: (target, key, value, receiver) => {
      const oldValue = target[key];
      if (isRef$1(oldValue) && !isRef$1(value)) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    }
  };
  function proxyRefs(objectWithRefs) {
    return isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
  }
  function toRefs(object) {
    const ret = isArray$2(object) ? new Array(object.length) : {};
    for (const key in object) {
      ret[key] = propertyToRef(object, key);
    }
    return ret;
  }
  class ObjectRefImpl {
    constructor(_object, _key, _defaultValue) {
      this._object = _object;
      this._key = _key;
      this._defaultValue = _defaultValue;
      this["__v_isRef"] = true;
      this._value = void 0;
    }
    get value() {
      const val = this._object[this._key];
      return this._value = val === void 0 ? this._defaultValue : val;
    }
    set value(newVal) {
      this._object[this._key] = newVal;
    }
    get dep() {
      return getDepFromReactive(toRaw(this._object), this._key);
    }
  }
  function propertyToRef(source, key, defaultValue) {
    const val = source[key];
    return isRef$1(val) ? val : new ObjectRefImpl(source, key, defaultValue);
  }
  class ComputedRefImpl {
    constructor(fn, setter, isSSR) {
      this.fn = fn;
      this.setter = setter;
      this._value = void 0;
      this.dep = new Dep(this);
      this.__v_isRef = true;
      this.deps = void 0;
      this.depsTail = void 0;
      this.flags = 16;
      this.globalVersion = globalVersion - 1;
      this.effect = this;
      this["__v_isReadonly"] = !setter;
      this.isSSR = isSSR;
    }
    /**
     * @internal
     */
    notify() {
      if (activeSub !== this) {
        this.flags |= 16;
        this.dep.notify();
      }
    }
    get value() {
      const link2 = this.dep.track();
      refreshComputed(this);
      if (link2) {
        link2.version = this.dep.version;
      }
      return this._value;
    }
    set value(newValue) {
      if (this.setter) {
        this.setter(newValue);
      }
    }
  }
  function computed$1(getterOrOptions, debugOptions, isSSR = false) {
    let getter;
    let setter;
    if (isFunction$2(getterOrOptions)) {
      getter = getterOrOptions;
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    const cRef = new ComputedRefImpl(getter, setter, isSSR);
    return cRef;
  }
  const INITIAL_WATCHER_VALUE = {};
  const cleanupMap = /* @__PURE__ */ new WeakMap();
  let activeWatcher = void 0;
  function onWatcherCleanup(cleanupFn, failSilently = false, owner = activeWatcher) {
    if (owner) {
      let cleanups = cleanupMap.get(owner);
      if (!cleanups) cleanupMap.set(owner, cleanups = []);
      cleanups.push(cleanupFn);
    }
  }
  function watch$1(source, cb, options = EMPTY_OBJ$1) {
    const { immediate, deep, once, scheduler, augmentJob, call } = options;
    const reactiveGetter = (source2) => {
      if (deep) return source2;
      if (isShallow(source2) || deep === false || deep === 0)
        return traverse(source2, 1);
      return traverse(source2);
    };
    let effect2;
    let getter;
    let cleanup;
    let boundCleanup;
    let forceTrigger = false;
    let isMultiSource = false;
    if (isRef$1(source)) {
      getter = () => source.value;
      forceTrigger = isShallow(source);
    } else if (isReactive(source)) {
      getter = () => reactiveGetter(source);
      forceTrigger = true;
    } else if (isArray$2(source)) {
      isMultiSource = true;
      forceTrigger = source.some((s) => isReactive(s) || isShallow(s));
      getter = () => source.map((s) => {
        if (isRef$1(s)) {
          return s.value;
        } else if (isReactive(s)) {
          return reactiveGetter(s);
        } else if (isFunction$2(s)) {
          return call ? call(s, 2) : s();
        } else ;
      });
    } else if (isFunction$2(source)) {
      if (cb) {
        getter = call ? () => call(source, 2) : source;
      } else {
        getter = () => {
          if (cleanup) {
            pauseTracking();
            try {
              cleanup();
            } finally {
              resetTracking();
            }
          }
          const currentEffect = activeWatcher;
          activeWatcher = effect2;
          try {
            return call ? call(source, 3, [boundCleanup]) : source(boundCleanup);
          } finally {
            activeWatcher = currentEffect;
          }
        };
      }
    } else {
      getter = NOOP$1;
    }
    if (cb && deep) {
      const baseGetter = getter;
      const depth = deep === true ? Infinity : deep;
      getter = () => traverse(baseGetter(), depth);
    }
    if (once) {
      if (cb) {
        const _cb = cb;
        cb = (...args) => {
          _cb(...args);
          effect2.stop();
        };
      } else {
        const _getter = getter;
        getter = () => {
          _getter();
          effect2.stop();
        };
      }
    }
    let oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;
    const job = (immediateFirstRun) => {
      if (!(effect2.flags & 1) || !effect2.dirty && !immediateFirstRun) {
        return;
      }
      if (cb) {
        const newValue = effect2.run();
        if (deep || forceTrigger || (isMultiSource ? newValue.some((v, i) => hasChanged(v, oldValue[i])) : hasChanged(newValue, oldValue))) {
          if (cleanup) {
            cleanup();
          }
          const currentWatcher = activeWatcher;
          activeWatcher = effect2;
          try {
            const args = [
              newValue,
              // pass undefined as the old value when it's changed for the first time
              oldValue === INITIAL_WATCHER_VALUE ? void 0 : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE ? [] : oldValue,
              boundCleanup
            ];
            call ? call(cb, 3, args) : (
              // @ts-expect-error
              cb(...args)
            );
            oldValue = newValue;
          } finally {
            activeWatcher = currentWatcher;
          }
        }
      } else {
        effect2.run();
      }
    };
    if (augmentJob) {
      augmentJob(job);
    }
    effect2 = new ReactiveEffect(getter);
    effect2.scheduler = scheduler ? () => scheduler(job, false) : job;
    boundCleanup = (fn) => onWatcherCleanup(fn, false, effect2);
    cleanup = effect2.onStop = () => {
      const cleanups = cleanupMap.get(effect2);
      if (cleanups) {
        if (call) {
          call(cleanups, 4);
        } else {
          for (const cleanup2 of cleanups) cleanup2();
        }
        cleanupMap.delete(effect2);
      }
    };
    if (cb) {
      if (immediate) {
        job(true);
      } else {
        oldValue = effect2.run();
      }
    } else if (scheduler) {
      scheduler(job.bind(null, true), true);
    } else {
      effect2.run();
    }
    const scope = getCurrentScope();
    const watchHandle = () => {
      effect2.stop();
      if (scope) {
        remove$1(scope.effects, effect2);
      }
    };
    watchHandle.pause = effect2.pause.bind(effect2);
    watchHandle.resume = effect2.resume.bind(effect2);
    watchHandle.stop = watchHandle;
    return watchHandle;
  }
  function traverse(value, depth = Infinity, seen) {
    if (depth <= 0 || !isObject$2(value) || value["__v_skip"]) {
      return value;
    }
    seen = seen || /* @__PURE__ */ new Set();
    if (seen.has(value)) {
      return value;
    }
    seen.add(value);
    depth--;
    if (isRef$1(value)) {
      traverse(value.value, depth, seen);
    } else if (isArray$2(value)) {
      for (let i = 0; i < value.length; i++) {
        traverse(value[i], depth, seen);
      }
    } else if (isSet$2(value) || isMap$1(value)) {
      value.forEach((v) => {
        traverse(v, depth, seen);
      });
    } else if (isPlainObject$3(value)) {
      for (const key in value) {
        traverse(value[key], depth, seen);
      }
      for (const key of Object.getOwnPropertySymbols(value)) {
        if (Object.prototype.propertyIsEnumerable.call(value, key)) {
          traverse(value[key], depth, seen);
        }
      }
    }
    return value;
  }
  /**
  * @vue/shared v3.5.0-beta.3
  * (c) 2018-present Yuxi (Evan) You and Vue contributors
  * @license MIT
  **/
  /*! #__NO_SIDE_EFFECTS__ */
  // @__NO_SIDE_EFFECTS__
  function makeMap$1(str2, expectsLowerCase) {
    const set2 = new Set(str2.split(","));
    return (val) => set2.has(val);
  }
  const EMPTY_OBJ = {};
  const EMPTY_ARR = [];
  const NOOP = () => {
  };
  const NO = () => false;
  const isOn$1 = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // uppercase letter
  (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);
  const isModelListener$1 = (key) => key.startsWith("onUpdate:");
  const extend$1 = Object.assign;
  const remove = (arr, el) => {
    const i = arr.indexOf(el);
    if (i > -1) {
      arr.splice(i, 1);
    }
  };
  const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
  const hasOwn$2 = (val, key) => hasOwnProperty$1.call(val, key);
  const isArray$1 = Array.isArray;
  const isMap = (val) => toTypeString$1(val) === "[object Map]";
  const isSet$1 = (val) => toTypeString$1(val) === "[object Set]";
  const isFunction$1 = (val) => typeof val === "function";
  const isString$1 = (val) => typeof val === "string";
  const isSymbol$1 = (val) => typeof val === "symbol";
  const isObject$1 = (val) => val !== null && typeof val === "object";
  const isPromise$1 = (val) => {
    return (isObject$1(val) || isFunction$1(val)) && isFunction$1(val.then) && isFunction$1(val.catch);
  };
  const objectToString$1 = Object.prototype.toString;
  const toTypeString$1 = (value) => objectToString$1.call(value);
  const isPlainObject$2 = (val) => toTypeString$1(val) === "[object Object]";
  const isReservedProp = /* @__PURE__ */ makeMap$1(
    // the leading comma is intentional so empty string "" is also included
    ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
  );
  const cacheStringFunction$1 = (fn) => {
    const cache = /* @__PURE__ */ Object.create(null);
    return (str2) => {
      const hit = cache[str2];
      return hit || (cache[str2] = fn(str2));
    };
  };
  const camelizeRE$1 = /-(\w)/g;
  const camelize$1 = cacheStringFunction$1(
    (str2) => {
      return str2.replace(camelizeRE$1, (_, c) => c ? c.toUpperCase() : "");
    }
  );
  const hyphenateRE$1 = /\B([A-Z])/g;
  const hyphenate$1 = cacheStringFunction$1(
    (str2) => str2.replace(hyphenateRE$1, "-$1").toLowerCase()
  );
  const capitalize$1 = cacheStringFunction$1((str2) => {
    return str2.charAt(0).toUpperCase() + str2.slice(1);
  });
  const toHandlerKey = cacheStringFunction$1(
    (str2) => {
      const s = str2 ? `on${capitalize$1(str2)}` : ``;
      return s;
    }
  );
  const invokeArrayFns$1 = (fns, ...arg) => {
    for (let i = 0; i < fns.length; i++) {
      fns[i](...arg);
    }
  };
  const def$1 = (obj, key, value, writable = false) => {
    Object.defineProperty(obj, key, {
      configurable: true,
      enumerable: false,
      writable,
      value
    });
  };
  const looseToNumber$1 = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? val : n;
  };
  let _globalThis;
  const getGlobalThis = () => {
    return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
  };
  function normalizeStyle(value) {
    if (isArray$1(value)) {
      const res = {};
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        const normalized = isString$1(item) ? parseStringStyle(item) : normalizeStyle(item);
        if (normalized) {
          for (const key in normalized) {
            res[key] = normalized[key];
          }
        }
      }
      return res;
    } else if (isString$1(value) || isObject$1(value)) {
      return value;
    }
  }
  const listDelimiterRE = /;(?![^(]*\))/g;
  const propertyDelimiterRE = /:([^]+)/;
  const styleCommentRE = /\/\*[^]*?\*\//g;
  function parseStringStyle(cssText) {
    const ret = {};
    cssText.replace(styleCommentRE, "").split(listDelimiterRE).forEach((item) => {
      if (item) {
        const tmp = item.split(propertyDelimiterRE);
        tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
      }
    });
    return ret;
  }
  function normalizeClass(value) {
    let res = "";
    if (isString$1(value)) {
      res = value;
    } else if (isArray$1(value)) {
      for (let i = 0; i < value.length; i++) {
        const normalized = normalizeClass(value[i]);
        if (normalized) {
          res += normalized + " ";
        }
      }
    } else if (isObject$1(value)) {
      for (const name in value) {
        if (value[name]) {
          res += name + " ";
        }
      }
    }
    return res.trim();
  }
  const isRef = (val) => {
    return !!(val && val["__v_isRef"] === true);
  };
  const toDisplayString = (val) => {
    return isString$1(val) ? val : val == null ? "" : isArray$1(val) || isObject$1(val) && (val.toString === objectToString$1 || !isFunction$1(val.toString)) ? isRef(val) ? toDisplayString(val.value) : JSON.stringify(val, replacer, 2) : String(val);
  };
  const replacer = (_key, val) => {
    if (isRef(val)) {
      return replacer(_key, val.value);
    } else if (isMap(val)) {
      return {
        [`Map(${val.size})`]: [...val.entries()].reduce(
          (entries, [key, val2], i) => {
            entries[stringifySymbol(key, i) + " =>"] = val2;
            return entries;
          },
          {}
        )
      };
    } else if (isSet$1(val)) {
      return {
        [`Set(${val.size})`]: [...val.values()].map((v) => stringifySymbol(v))
      };
    } else if (isSymbol$1(val)) {
      return stringifySymbol(val);
    } else if (isObject$1(val) && !isArray$1(val) && !isPlainObject$2(val)) {
      return String(val);
    }
    return val;
  };
  const stringifySymbol = (v, i = "") => {
    var _a2;
    return (
      // Symbol.description in es2019+ so we need to cast here to pass
      // the lib: es2016 check
      isSymbol$1(v) ? `Symbol(${(_a2 = v.description) != null ? _a2 : i})` : v
    );
  };
  /**
  * @vue/runtime-core v3.5.0-beta.3
  * (c) 2018-present Yuxi (Evan) You and Vue contributors
  * @license MIT
  **/
  const stack = [];
  let isWarning = false;
  function warn$1(msg, ...args) {
    if (isWarning) return;
    isWarning = true;
    pauseTracking();
    const instance = stack.length ? stack[stack.length - 1].component : null;
    const appWarnHandler = instance && instance.appContext.config.warnHandler;
    const trace = getComponentTrace();
    if (appWarnHandler) {
      callWithErrorHandling(
        appWarnHandler,
        instance,
        11,
        [
          // eslint-disable-next-line no-restricted-syntax
          msg + args.map((a) => {
            var _a2, _b;
            return (_b = (_a2 = a.toString) == null ? void 0 : _a2.call(a)) != null ? _b : JSON.stringify(a);
          }).join(""),
          instance && instance.proxy,
          trace.map(
            ({ vnode }) => `at <${formatComponentName(instance, vnode.type)}>`
          ).join("\n"),
          trace
        ]
      );
    } else {
      const warnArgs = [`[Vue warn]: ${msg}`, ...args];
      if (trace.length && // avoid spamming console during tests
      true) {
        warnArgs.push(`
`, ...formatTrace(trace));
      }
      console.warn(...warnArgs);
    }
    resetTracking();
    isWarning = false;
  }
  function getComponentTrace() {
    let currentVNode = stack[stack.length - 1];
    if (!currentVNode) {
      return [];
    }
    const normalizedStack = [];
    while (currentVNode) {
      const last = normalizedStack[0];
      if (last && last.vnode === currentVNode) {
        last.recurseCount++;
      } else {
        normalizedStack.push({
          vnode: currentVNode,
          recurseCount: 0
        });
      }
      const parentInstance = currentVNode.component && currentVNode.component.parent;
      currentVNode = parentInstance && parentInstance.vnode;
    }
    return normalizedStack;
  }
  function formatTrace(trace) {
    const logs = [];
    trace.forEach((entry, i) => {
      logs.push(...i === 0 ? [] : [`
`], ...formatTraceEntry(entry));
    });
    return logs;
  }
  function formatTraceEntry({ vnode, recurseCount }) {
    const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``;
    const isRoot = vnode.component ? vnode.component.parent == null : false;
    const open = ` at <${formatComponentName(
      vnode.component,
      vnode.type,
      isRoot
    )}`;
    const close2 = `>` + postfix;
    return vnode.props ? [open, ...formatProps(vnode.props), close2] : [open + close2];
  }
  function formatProps(props) {
    const res = [];
    const keys = Object.keys(props);
    keys.slice(0, 3).forEach((key) => {
      res.push(...formatProp(key, props[key]));
    });
    if (keys.length > 3) {
      res.push(` ...`);
    }
    return res;
  }
  function formatProp(key, value, raw) {
    if (isString$1(value)) {
      value = JSON.stringify(value);
      return raw ? value : [`${key}=${value}`];
    } else if (typeof value === "number" || typeof value === "boolean" || value == null) {
      return raw ? value : [`${key}=${value}`];
    } else if (isRef$1(value)) {
      value = formatProp(key, toRaw(value.value), true);
      return raw ? value : [`${key}=Ref<`, value, `>`];
    } else if (isFunction$1(value)) {
      return [`${key}=fn${value.name ? `<${value.name}>` : ``}`];
    } else {
      value = toRaw(value);
      return raw ? value : [`${key}=`, value];
    }
  }
  function callWithErrorHandling(fn, instance, type2, args) {
    try {
      return args ? fn(...args) : fn();
    } catch (err) {
      handleError(err, instance, type2);
    }
  }
  function callWithAsyncErrorHandling(fn, instance, type2, args) {
    if (isFunction$1(fn)) {
      const res = callWithErrorHandling(fn, instance, type2, args);
      if (res && isPromise$1(res)) {
        res.catch((err) => {
          handleError(err, instance, type2);
        });
      }
      return res;
    }
    if (isArray$1(fn)) {
      const values = [];
      for (let i = 0; i < fn.length; i++) {
        values.push(callWithAsyncErrorHandling(fn[i], instance, type2, args));
      }
      return values;
    }
  }
  function handleError(err, instance, type2, throwInDev = true) {
    const contextVNode = instance ? instance.vnode : null;
    const { errorHandler, throwUnhandledErrorInProduction } = instance && instance.appContext.config || EMPTY_OBJ;
    if (instance) {
      let cur = instance.parent;
      const exposedInstance = instance.proxy;
      const errorInfo = `https://vuejs.org/error-reference/#runtime-${type2}`;
      while (cur) {
        const errorCapturedHooks = cur.ec;
        if (errorCapturedHooks) {
          for (let i = 0; i < errorCapturedHooks.length; i++) {
            if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
              return;
            }
          }
        }
        cur = cur.parent;
      }
      if (errorHandler) {
        pauseTracking();
        callWithErrorHandling(errorHandler, null, 10, [
          err,
          exposedInstance,
          errorInfo
        ]);
        resetTracking();
        return;
      }
    }
    logError(err, type2, contextVNode, throwInDev, throwUnhandledErrorInProduction);
  }
  function logError(err, type2, contextVNode, throwInDev = true, throwInProd = false) {
    if (throwInProd) {
      throw err;
    } else {
      console.error(err);
    }
  }
  let isFlushing = false;
  let isFlushPending = false;
  const queue = [];
  let flushIndex = 0;
  const pendingPostFlushCbs = [];
  let activePostFlushCbs = null;
  let postFlushIndex = 0;
  const resolvedPromise = /* @__PURE__ */ Promise.resolve();
  let currentFlushPromise = null;
  function nextTick(fn) {
    const p2 = currentFlushPromise || resolvedPromise;
    return fn ? p2.then(this ? fn.bind(this) : fn) : p2;
  }
  function findInsertionIndex(id) {
    let start = isFlushing ? flushIndex + 1 : 0;
    let end = queue.length;
    while (start < end) {
      const middle = start + end >>> 1;
      const middleJob = queue[middle];
      const middleJobId = getId(middleJob);
      if (middleJobId < id || middleJobId === id && middleJob.flags & 2) {
        start = middle + 1;
      } else {
        end = middle;
      }
    }
    return start;
  }
  function queueJob(job) {
    if (!(job.flags & 1)) {
      const jobId = getId(job);
      const lastJob = queue[queue.length - 1];
      if (!lastJob || // fast path when the job id is larger than the tail
      !(job.flags & 2) && jobId >= getId(lastJob)) {
        queue.push(job);
      } else {
        queue.splice(findInsertionIndex(jobId), 0, job);
      }
      if (!(job.flags & 4)) {
        job.flags |= 1;
      }
      queueFlush();
    }
  }
  function queueFlush() {
    if (!isFlushing && !isFlushPending) {
      isFlushPending = true;
      currentFlushPromise = resolvedPromise.then(flushJobs);
    }
  }
  function queuePostFlushCb(cb) {
    if (!isArray$1(cb)) {
      if (activePostFlushCbs && cb.id === -1) {
        activePostFlushCbs.splice(postFlushIndex + 1, 0, cb);
      } else if (!(cb.flags & 1)) {
        pendingPostFlushCbs.push(cb);
        if (!(cb.flags & 4)) {
          cb.flags |= 1;
        }
      }
    } else {
      pendingPostFlushCbs.push(...cb);
    }
    queueFlush();
  }
  function flushPreFlushCbs(instance, seen, i = isFlushing ? flushIndex + 1 : 0) {
    for (; i < queue.length; i++) {
      const cb = queue[i];
      if (cb && cb.flags & 2) {
        if (instance && cb.id !== instance.uid) {
          continue;
        }
        queue.splice(i, 1);
        i--;
        cb();
        cb.flags &= ~1;
      }
    }
  }
  function flushPostFlushCbs(seen) {
    if (pendingPostFlushCbs.length) {
      const deduped = [...new Set(pendingPostFlushCbs)].sort(
        (a, b) => getId(a) - getId(b)
      );
      pendingPostFlushCbs.length = 0;
      if (activePostFlushCbs) {
        activePostFlushCbs.push(...deduped);
        return;
      }
      activePostFlushCbs = deduped;
      for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
        const cb = activePostFlushCbs[postFlushIndex];
        if (!(cb.flags & 8)) cb();
        cb.flags &= ~1;
      }
      activePostFlushCbs = null;
      postFlushIndex = 0;
    }
  }
  const getId = (job) => job.id == null ? job.flags & 2 ? -1 : Infinity : job.id;
  function flushJobs(seen) {
    isFlushPending = false;
    isFlushing = true;
    try {
      for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
        const job = queue[flushIndex];
        if (job && !(job.flags & 8)) {
          if (false) ;
          callWithErrorHandling(
            job,
            job.i,
            job.i ? 15 : 14
          );
          job.flags &= ~1;
        }
      }
    } finally {
      flushIndex = 0;
      queue.length = 0;
      flushPostFlushCbs();
      isFlushing = false;
      currentFlushPromise = null;
      if (queue.length || pendingPostFlushCbs.length) {
        flushJobs();
      }
    }
  }
  let currentRenderingInstance = null;
  let currentScopeId = null;
  function setCurrentRenderingInstance(instance) {
    const prev = currentRenderingInstance;
    currentRenderingInstance = instance;
    currentScopeId = instance && instance.type.__scopeId || null;
    return prev;
  }
  function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot) {
    if (!ctx) return fn;
    if (fn._n) {
      return fn;
    }
    const renderFnWithContext = (...args) => {
      if (renderFnWithContext._d) {
        setBlockTracking(-1);
      }
      const prevInstance = setCurrentRenderingInstance(ctx);
      let res;
      try {
        res = fn(...args);
      } finally {
        setCurrentRenderingInstance(prevInstance);
        if (renderFnWithContext._d) {
          setBlockTracking(1);
        }
      }
      return res;
    };
    renderFnWithContext._n = true;
    renderFnWithContext._c = true;
    renderFnWithContext._d = true;
    return renderFnWithContext;
  }
  function withDirectives(vnode, directives) {
    if (currentRenderingInstance === null) {
      return vnode;
    }
    const instance = getComponentPublicInstance(currentRenderingInstance);
    const bindings = vnode.dirs || (vnode.dirs = []);
    for (let i = 0; i < directives.length; i++) {
      let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
      if (dir) {
        if (isFunction$1(dir)) {
          dir = {
            mounted: dir,
            updated: dir
          };
        }
        if (dir.deep) {
          traverse(value);
        }
        bindings.push({
          dir,
          instance,
          value,
          oldValue: void 0,
          arg,
          modifiers
        });
      }
    }
    return vnode;
  }
  function invokeDirectiveHook(vnode, prevVNode, instance, name) {
    const bindings = vnode.dirs;
    const oldBindings = prevVNode && prevVNode.dirs;
    for (let i = 0; i < bindings.length; i++) {
      const binding = bindings[i];
      if (oldBindings) {
        binding.oldValue = oldBindings[i].value;
      }
      let hook = binding.dir[name];
      if (hook) {
        pauseTracking();
        callWithAsyncErrorHandling(hook, instance, 8, [
          vnode.el,
          binding,
          vnode,
          prevVNode
        ]);
        resetTracking();
      }
    }
  }
  const TeleportEndKey = Symbol("_vte");
  const isTeleport = (type2) => type2.__isTeleport;
  function setTransitionHooks(vnode, hooks) {
    if (vnode.shapeFlag & 6 && vnode.component) {
      setTransitionHooks(vnode.component.subTree, hooks);
    } else if (vnode.shapeFlag & 128) {
      vnode.ssContent.transition = hooks.clone(vnode.ssContent);
      vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
    } else {
      vnode.transition = hooks;
    }
  }
  /*! #__NO_SIDE_EFFECTS__ */
  // @__NO_SIDE_EFFECTS__
  function defineComponent(options, extraOptions) {
    return isFunction$1(options) ? (
      // #8326: extend call and options.name access are considered side-effects
      // by Rollup, so we have to wrap it in a pure-annotated IIFE.
      /* @__PURE__ */ (() => extend$1({ name: options.name }, extraOptions, { setup: options }))()
    ) : options;
  }
  function markAsyncBoundary(instance) {
    instance.ids = [instance.ids[0] + instance.ids[2]++ + "-", 0, 0];
  }
  function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
    if (isArray$1(rawRef)) {
      rawRef.forEach(
        (r, i) => setRef(
          r,
          oldRawRef && (isArray$1(oldRawRef) ? oldRawRef[i] : oldRawRef),
          parentSuspense,
          vnode,
          isUnmount
        )
      );
      return;
    }
    if (isAsyncWrapper(vnode) && !isUnmount) {
      return;
    }
    const refValue = vnode.shapeFlag & 4 ? getComponentPublicInstance(vnode.component) : vnode.el;
    const value = isUnmount ? null : refValue;
    const { i: owner, r: ref3 } = rawRef;
    const oldRef = oldRawRef && oldRawRef.r;
    const refs = owner.refs === EMPTY_OBJ ? owner.refs = {} : owner.refs;
    const setupState = owner.setupState;
    if (oldRef != null && oldRef !== ref3) {
      if (isString$1(oldRef)) {
        refs[oldRef] = null;
        if (hasOwn$2(setupState, oldRef)) {
          setupState[oldRef] = null;
        }
      } else if (isRef$1(oldRef)) {
        oldRef.value = null;
      }
    }
    if (isFunction$1(ref3)) {
      callWithErrorHandling(ref3, owner, 12, [value, refs]);
    } else {
      const _isString = isString$1(ref3);
      const _isRef = isRef$1(ref3);
      if (_isString || _isRef) {
        const doSet = () => {
          if (rawRef.f) {
            const existing = _isString ? hasOwn$2(setupState, ref3) ? setupState[ref3] : refs[ref3] : ref3.value;
            if (isUnmount) {
              isArray$1(existing) && remove(existing, refValue);
            } else {
              if (!isArray$1(existing)) {
                if (_isString) {
                  refs[ref3] = [refValue];
                  if (hasOwn$2(setupState, ref3)) {
                    setupState[ref3] = refs[ref3];
                  }
                } else {
                  ref3.value = [refValue];
                  if (rawRef.k) refs[rawRef.k] = ref3.value;
                }
              } else if (!existing.includes(refValue)) {
                existing.push(refValue);
              }
            }
          } else if (_isString) {
            refs[ref3] = value;
            if (hasOwn$2(setupState, ref3)) {
              setupState[ref3] = value;
            }
          } else if (_isRef) {
            ref3.value = value;
            if (rawRef.k) refs[rawRef.k] = value;
          } else ;
        };
        if (value) {
          doSet.id = -1;
          queuePostRenderEffect(doSet, parentSuspense);
        } else {
          doSet();
        }
      }
    }
  }
  const isAsyncWrapper = (i) => !!i.type.__asyncLoader;
  const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
  function onActivated(hook, target) {
    registerKeepAliveHook(hook, "a", target);
  }
  function onDeactivated(hook, target) {
    registerKeepAliveHook(hook, "da", target);
  }
  function registerKeepAliveHook(hook, type2, target = currentInstance) {
    const wrappedHook = hook.__wdc || (hook.__wdc = () => {
      let current = target;
      while (current) {
        if (current.isDeactivated) {
          return;
        }
        current = current.parent;
      }
      return hook();
    });
    injectHook(type2, wrappedHook, target);
    if (target) {
      let current = target.parent;
      while (current && current.parent) {
        if (isKeepAlive(current.parent.vnode)) {
          injectToKeepAliveRoot(wrappedHook, type2, target, current);
        }
        current = current.parent;
      }
    }
  }
  function injectToKeepAliveRoot(hook, type2, target, keepAliveRoot) {
    const injected = injectHook(
      type2,
      hook,
      keepAliveRoot,
      true
      /* prepend */
    );
    onUnmounted(() => {
      remove(keepAliveRoot[type2], injected);
    }, target);
  }
  function injectHook(type2, hook, target = currentInstance, prepend = false) {
    if (target) {
      const hooks = target[type2] || (target[type2] = []);
      const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
        pauseTracking();
        const reset = setCurrentInstance(target);
        const res = callWithAsyncErrorHandling(hook, target, type2, args);
        reset();
        resetTracking();
        return res;
      });
      if (prepend) {
        hooks.unshift(wrappedHook);
      } else {
        hooks.push(wrappedHook);
      }
      return wrappedHook;
    }
  }
  const createHook = (lifecycle) => (hook, target = currentInstance) => {
    if (!isInSSRComponentSetup || lifecycle === "sp") {
      injectHook(lifecycle, (...args) => hook(...args), target);
    }
  };
  const onBeforeMount = createHook("bm");
  const onMounted = createHook("m");
  const onBeforeUpdate = createHook(
    "bu"
  );
  const onUpdated = createHook("u");
  const onBeforeUnmount = createHook(
    "bum"
  );
  const onUnmounted = createHook("um");
  const onServerPrefetch = createHook(
    "sp"
  );
  const onRenderTriggered = createHook("rtg");
  const onRenderTracked = createHook("rtc");
  function onErrorCaptured(hook, target = currentInstance) {
    injectHook("ec", hook, target);
  }
  const NULL_DYNAMIC_COMPONENT = Symbol.for("v-ndc");
  function renderList(source, renderItem, cache, index) {
    let ret;
    const cached = cache;
    const sourceIsArray = isArray$1(source);
    if (sourceIsArray || isString$1(source)) {
      const sourceIsReactiveArray = sourceIsArray && isReactive(source);
      if (sourceIsReactiveArray) {
        source = shallowReadArray(source);
      }
      ret = new Array(source.length);
      for (let i = 0, l = source.length; i < l; i++) {
        ret[i] = renderItem(
          sourceIsReactiveArray ? toReactive(source[i]) : source[i],
          i,
          void 0,
          cached
        );
      }
    } else if (typeof source === "number") {
      ret = new Array(source);
      for (let i = 0; i < source; i++) {
        ret[i] = renderItem(i + 1, i, void 0, cached);
      }
    } else if (isObject$1(source)) {
      if (source[Symbol.iterator]) {
        ret = Array.from(
          source,
          (item, i) => renderItem(item, i, void 0, cached)
        );
      } else {
        const keys = Object.keys(source);
        ret = new Array(keys.length);
        for (let i = 0, l = keys.length; i < l; i++) {
          const key = keys[i];
          ret[i] = renderItem(source[key], key, i, cached);
        }
      }
    } else {
      ret = [];
    }
    return ret;
  }
  const getPublicInstance = (i) => {
    if (!i) return null;
    if (isStatefulComponent(i)) return getComponentPublicInstance(i);
    return getPublicInstance(i.parent);
  };
  const publicPropertiesMap = (
    // Move PURE marker to new line to workaround compiler discarding it
    // due to type annotation
    /* @__PURE__ */ extend$1(/* @__PURE__ */ Object.create(null), {
      $: (i) => i,
      $el: (i) => i.vnode.el,
      $data: (i) => i.data,
      $props: (i) => i.props,
      $attrs: (i) => i.attrs,
      $slots: (i) => i.slots,
      $refs: (i) => i.refs,
      $parent: (i) => getPublicInstance(i.parent),
      $root: (i) => getPublicInstance(i.root),
      $host: (i) => i.ce,
      $emit: (i) => i.emit,
      $options: (i) => resolveMergedOptions(i),
      $forceUpdate: (i) => i.f || (i.f = () => {
        queueJob(i.update);
      }),
      $nextTick: (i) => i.n || (i.n = nextTick.bind(i.proxy)),
      $watch: (i) => instanceWatch.bind(i)
    })
  );
  const hasSetupBinding = (state, key) => state !== EMPTY_OBJ && !state.__isScriptSetup && hasOwn$2(state, key);
  const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
      if (key === "__v_skip") {
        return true;
      }
      const { ctx, setupState, data, props, accessCache, type: type2, appContext } = instance;
      let normalizedProps;
      if (key[0] !== "$") {
        const n = accessCache[key];
        if (n !== void 0) {
          switch (n) {
            case 1:
              return setupState[key];
            case 2:
              return data[key];
            case 4:
              return ctx[key];
            case 3:
              return props[key];
          }
        } else if (hasSetupBinding(setupState, key)) {
          accessCache[key] = 1;
          return setupState[key];
        } else if (data !== EMPTY_OBJ && hasOwn$2(data, key)) {
          accessCache[key] = 2;
          return data[key];
        } else if (
          // only cache other properties when instance has declared (thus stable)
          // props
          (normalizedProps = instance.propsOptions[0]) && hasOwn$2(normalizedProps, key)
        ) {
          accessCache[key] = 3;
          return props[key];
        } else if (ctx !== EMPTY_OBJ && hasOwn$2(ctx, key)) {
          accessCache[key] = 4;
          return ctx[key];
        } else if (shouldCacheAccess) {
          accessCache[key] = 0;
        }
      }
      const publicGetter = publicPropertiesMap[key];
      let cssModule, globalProperties;
      if (publicGetter) {
        if (key === "$attrs") {
          track(instance.attrs, "get", "");
        }
        return publicGetter(instance);
      } else if (
        // css module (injected by vue-loader)
        (cssModule = type2.__cssModules) && (cssModule = cssModule[key])
      ) {
        return cssModule;
      } else if (ctx !== EMPTY_OBJ && hasOwn$2(ctx, key)) {
        accessCache[key] = 4;
        return ctx[key];
      } else if (
        // global properties
        globalProperties = appContext.config.globalProperties, hasOwn$2(globalProperties, key)
      ) {
        {
          return globalProperties[key];
        }
      } else ;
    },
    set({ _: instance }, key, value) {
      const { data, setupState, ctx } = instance;
      if (hasSetupBinding(setupState, key)) {
        setupState[key] = value;
        return true;
      } else if (data !== EMPTY_OBJ && hasOwn$2(data, key)) {
        data[key] = value;
        return true;
      } else if (hasOwn$2(instance.props, key)) {
        return false;
      }
      if (key[0] === "$" && key.slice(1) in instance) {
        return false;
      } else {
        {
          ctx[key] = value;
        }
      }
      return true;
    },
    has({
      _: { data, setupState, accessCache, ctx, appContext, propsOptions }
    }, key) {
      let normalizedProps;
      return !!accessCache[key] || data !== EMPTY_OBJ && hasOwn$2(data, key) || hasSetupBinding(setupState, key) || (normalizedProps = propsOptions[0]) && hasOwn$2(normalizedProps, key) || hasOwn$2(ctx, key) || hasOwn$2(publicPropertiesMap, key) || hasOwn$2(appContext.config.globalProperties, key);
    },
    defineProperty(target, key, descriptor) {
      if (descriptor.get != null) {
        target._.accessCache[key] = 0;
      } else if (hasOwn$2(descriptor, "value")) {
        this.set(target, key, descriptor.value, null);
      }
      return Reflect.defineProperty(target, key, descriptor);
    }
  };
  function normalizePropsOrEmits(props) {
    return isArray$1(props) ? props.reduce(
      (normalized, p2) => (normalized[p2] = null, normalized),
      {}
    ) : props;
  }
  let shouldCacheAccess = true;
  function applyOptions(instance) {
    const options = resolveMergedOptions(instance);
    const publicThis = instance.proxy;
    const ctx = instance.ctx;
    shouldCacheAccess = false;
    if (options.beforeCreate) {
      callHook(options.beforeCreate, instance, "bc");
    }
    const {
      // state
      data: dataOptions,
      computed: computedOptions,
      methods,
      watch: watchOptions,
      provide: provideOptions,
      inject: injectOptions,
      // lifecycle
      created,
      beforeMount,
      mounted,
      beforeUpdate,
      updated,
      activated,
      deactivated,
      beforeDestroy,
      beforeUnmount,
      destroyed,
      unmounted,
      render: render2,
      renderTracked,
      renderTriggered,
      errorCaptured,
      serverPrefetch,
      // public API
      expose,
      inheritAttrs,
      // assets
      components,
      directives,
      filters
    } = options;
    const checkDuplicateProperties = null;
    if (injectOptions) {
      resolveInjections(injectOptions, ctx, checkDuplicateProperties);
    }
    if (methods) {
      for (const key in methods) {
        const methodHandler = methods[key];
        if (isFunction$1(methodHandler)) {
          {
            ctx[key] = methodHandler.bind(publicThis);
          }
        }
      }
    }
    if (dataOptions) {
      const data = dataOptions.call(publicThis, publicThis);
      if (!isObject$1(data)) ;
      else {
        instance.data = reactive(data);
      }
    }
    shouldCacheAccess = true;
    if (computedOptions) {
      for (const key in computedOptions) {
        const opt = computedOptions[key];
        const get2 = isFunction$1(opt) ? opt.bind(publicThis, publicThis) : isFunction$1(opt.get) ? opt.get.bind(publicThis, publicThis) : NOOP;
        const set2 = !isFunction$1(opt) && isFunction$1(opt.set) ? opt.set.bind(publicThis) : NOOP;
        const c = computed({
          get: get2,
          set: set2
        });
        Object.defineProperty(ctx, key, {
          enumerable: true,
          configurable: true,
          get: () => c.value,
          set: (v) => c.value = v
        });
      }
    }
    if (watchOptions) {
      for (const key in watchOptions) {
        createWatcher(watchOptions[key], ctx, publicThis, key);
      }
    }
    if (provideOptions) {
      const provides = isFunction$1(provideOptions) ? provideOptions.call(publicThis) : provideOptions;
      Reflect.ownKeys(provides).forEach((key) => {
        provide(key, provides[key]);
      });
    }
    if (created) {
      callHook(created, instance, "c");
    }
    function registerLifecycleHook(register, hook) {
      if (isArray$1(hook)) {
        hook.forEach((_hook) => register(_hook.bind(publicThis)));
      } else if (hook) {
        register(hook.bind(publicThis));
      }
    }
    registerLifecycleHook(onBeforeMount, beforeMount);
    registerLifecycleHook(onMounted, mounted);
    registerLifecycleHook(onBeforeUpdate, beforeUpdate);
    registerLifecycleHook(onUpdated, updated);
    registerLifecycleHook(onActivated, activated);
    registerLifecycleHook(onDeactivated, deactivated);
    registerLifecycleHook(onErrorCaptured, errorCaptured);
    registerLifecycleHook(onRenderTracked, renderTracked);
    registerLifecycleHook(onRenderTriggered, renderTriggered);
    registerLifecycleHook(onBeforeUnmount, beforeUnmount);
    registerLifecycleHook(onUnmounted, unmounted);
    registerLifecycleHook(onServerPrefetch, serverPrefetch);
    if (isArray$1(expose)) {
      if (expose.length) {
        const exposed = instance.exposed || (instance.exposed = {});
        expose.forEach((key) => {
          Object.defineProperty(exposed, key, {
            get: () => publicThis[key],
            set: (val) => publicThis[key] = val
          });
        });
      } else if (!instance.exposed) {
        instance.exposed = {};
      }
    }
    if (render2 && instance.render === NOOP) {
      instance.render = render2;
    }
    if (inheritAttrs != null) {
      instance.inheritAttrs = inheritAttrs;
    }
    if (components) instance.components = components;
    if (directives) instance.directives = directives;
    if (serverPrefetch) {
      markAsyncBoundary(instance);
    }
  }
  function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP) {
    if (isArray$1(injectOptions)) {
      injectOptions = normalizeInject(injectOptions);
    }
    for (const key in injectOptions) {
      const opt = injectOptions[key];
      let injected;
      if (isObject$1(opt)) {
        if ("default" in opt) {
          injected = inject(
            opt.from || key,
            opt.default,
            true
          );
        } else {
          injected = inject(opt.from || key);
        }
      } else {
        injected = inject(opt);
      }
      if (isRef$1(injected)) {
        Object.defineProperty(ctx, key, {
          enumerable: true,
          configurable: true,
          get: () => injected.value,
          set: (v) => injected.value = v
        });
      } else {
        ctx[key] = injected;
      }
    }
  }
  function callHook(hook, instance, type2) {
    callWithAsyncErrorHandling(
      isArray$1(hook) ? hook.map((h2) => h2.bind(instance.proxy)) : hook.bind(instance.proxy),
      instance,
      type2
    );
  }
  function createWatcher(raw, ctx, publicThis, key) {
    let getter = key.includes(".") ? createPathGetter(publicThis, key) : () => publicThis[key];
    if (isString$1(raw)) {
      const handler = ctx[raw];
      if (isFunction$1(handler)) {
        {
          watch(getter, handler);
        }
      }
    } else if (isFunction$1(raw)) {
      {
        watch(getter, raw.bind(publicThis));
      }
    } else if (isObject$1(raw)) {
      if (isArray$1(raw)) {
        raw.forEach((r) => createWatcher(r, ctx, publicThis, key));
      } else {
        const handler = isFunction$1(raw.handler) ? raw.handler.bind(publicThis) : ctx[raw.handler];
        if (isFunction$1(handler)) {
          watch(getter, handler, raw);
        }
      }
    } else ;
  }
  function resolveMergedOptions(instance) {
    const base = instance.type;
    const { mixins, extends: extendsOptions } = base;
    const {
      mixins: globalMixins,
      optionsCache: cache,
      config: { optionMergeStrategies }
    } = instance.appContext;
    const cached = cache.get(base);
    let resolved;
    if (cached) {
      resolved = cached;
    } else if (!globalMixins.length && !mixins && !extendsOptions) {
      {
        resolved = base;
      }
    } else {
      resolved = {};
      if (globalMixins.length) {
        globalMixins.forEach(
          (m) => mergeOptions(resolved, m, optionMergeStrategies, true)
        );
      }
      mergeOptions(resolved, base, optionMergeStrategies);
    }
    if (isObject$1(base)) {
      cache.set(base, resolved);
    }
    return resolved;
  }
  function mergeOptions(to, from, strats, asMixin = false) {
    const { mixins, extends: extendsOptions } = from;
    if (extendsOptions) {
      mergeOptions(to, extendsOptions, strats, true);
    }
    if (mixins) {
      mixins.forEach(
        (m) => mergeOptions(to, m, strats, true)
      );
    }
    for (const key in from) {
      if (asMixin && key === "expose") ;
      else {
        const strat = internalOptionMergeStrats[key] || strats && strats[key];
        to[key] = strat ? strat(to[key], from[key]) : from[key];
      }
    }
    return to;
  }
  const internalOptionMergeStrats = {
    data: mergeDataFn,
    props: mergeEmitsOrPropsOptions,
    emits: mergeEmitsOrPropsOptions,
    // objects
    methods: mergeObjectOptions,
    computed: mergeObjectOptions,
    // lifecycle
    beforeCreate: mergeAsArray,
    created: mergeAsArray,
    beforeMount: mergeAsArray,
    mounted: mergeAsArray,
    beforeUpdate: mergeAsArray,
    updated: mergeAsArray,
    beforeDestroy: mergeAsArray,
    beforeUnmount: mergeAsArray,
    destroyed: mergeAsArray,
    unmounted: mergeAsArray,
    activated: mergeAsArray,
    deactivated: mergeAsArray,
    errorCaptured: mergeAsArray,
    serverPrefetch: mergeAsArray,
    // assets
    components: mergeObjectOptions,
    directives: mergeObjectOptions,
    // watch
    watch: mergeWatchOptions,
    // provide / inject
    provide: mergeDataFn,
    inject: mergeInject
  };
  function mergeDataFn(to, from) {
    if (!from) {
      return to;
    }
    if (!to) {
      return from;
    }
    return function mergedDataFn() {
      return extend$1(
        isFunction$1(to) ? to.call(this, this) : to,
        isFunction$1(from) ? from.call(this, this) : from
      );
    };
  }
  function mergeInject(to, from) {
    return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
  }
  function normalizeInject(raw) {
    if (isArray$1(raw)) {
      const res = {};
      for (let i = 0; i < raw.length; i++) {
        res[raw[i]] = raw[i];
      }
      return res;
    }
    return raw;
  }
  function mergeAsArray(to, from) {
    return to ? [...new Set([].concat(to, from))] : from;
  }
  function mergeObjectOptions(to, from) {
    return to ? extend$1(/* @__PURE__ */ Object.create(null), to, from) : from;
  }
  function mergeEmitsOrPropsOptions(to, from) {
    if (to) {
      if (isArray$1(to) && isArray$1(from)) {
        return [.../* @__PURE__ */ new Set([...to, ...from])];
      }
      return extend$1(
        /* @__PURE__ */ Object.create(null),
        normalizePropsOrEmits(to),
        normalizePropsOrEmits(from != null ? from : {})
      );
    } else {
      return from;
    }
  }
  function mergeWatchOptions(to, from) {
    if (!to) return from;
    if (!from) return to;
    const merged = extend$1(/* @__PURE__ */ Object.create(null), to);
    for (const key in from) {
      merged[key] = mergeAsArray(to[key], from[key]);
    }
    return merged;
  }
  function createAppContext() {
    return {
      app: null,
      config: {
        isNativeTag: NO,
        performance: false,
        globalProperties: {},
        optionMergeStrategies: {},
        errorHandler: void 0,
        warnHandler: void 0,
        compilerOptions: {}
      },
      mixins: [],
      components: {},
      directives: {},
      provides: /* @__PURE__ */ Object.create(null),
      optionsCache: /* @__PURE__ */ new WeakMap(),
      propsCache: /* @__PURE__ */ new WeakMap(),
      emitsCache: /* @__PURE__ */ new WeakMap()
    };
  }
  let uid$1 = 0;
  function createAppAPI(render2, hydrate) {
    return function createApp2(rootComponent, rootProps = null) {
      if (!isFunction$1(rootComponent)) {
        rootComponent = extend$1({}, rootComponent);
      }
      if (rootProps != null && !isObject$1(rootProps)) {
        rootProps = null;
      }
      const context = createAppContext();
      const installedPlugins = /* @__PURE__ */ new WeakSet();
      const pluginCleanupFns = [];
      let isMounted = false;
      const app = context.app = {
        _uid: uid$1++,
        _component: rootComponent,
        _props: rootProps,
        _container: null,
        _context: context,
        _instance: null,
        version,
        get config() {
          return context.config;
        },
        set config(v) {
        },
        use(plugin, ...options) {
          if (installedPlugins.has(plugin)) ;
          else if (plugin && isFunction$1(plugin.install)) {
            installedPlugins.add(plugin);
            plugin.install(app, ...options);
          } else if (isFunction$1(plugin)) {
            installedPlugins.add(plugin);
            plugin(app, ...options);
          } else ;
          return app;
        },
        mixin(mixin) {
          {
            if (!context.mixins.includes(mixin)) {
              context.mixins.push(mixin);
            }
          }
          return app;
        },
        component(name, component) {
          if (!component) {
            return context.components[name];
          }
          context.components[name] = component;
          return app;
        },
        directive(name, directive) {
          if (!directive) {
            return context.directives[name];
          }
          context.directives[name] = directive;
          return app;
        },
        mount(rootContainer, isHydrate, namespace) {
          if (!isMounted) {
            const vnode = app._ceVNode || createVNode(rootComponent, rootProps);
            vnode.appContext = context;
            if (namespace === true) {
              namespace = "svg";
            } else if (namespace === false) {
              namespace = void 0;
            }
            if (isHydrate && hydrate) {
              hydrate(vnode, rootContainer);
            } else {
              render2(vnode, rootContainer, namespace);
            }
            isMounted = true;
            app._container = rootContainer;
            rootContainer.__vue_app__ = app;
            return getComponentPublicInstance(vnode.component);
          }
        },
        onUnmount(cleanupFn) {
          pluginCleanupFns.push(cleanupFn);
        },
        unmount() {
          if (isMounted) {
            callWithAsyncErrorHandling(
              pluginCleanupFns,
              app._instance,
              16
            );
            render2(null, app._container);
            delete app._container.__vue_app__;
          }
        },
        provide(key, value) {
          context.provides[key] = value;
          return app;
        },
        runWithContext(fn) {
          const lastApp = currentApp;
          currentApp = app;
          try {
            return fn();
          } finally {
            currentApp = lastApp;
          }
        }
      };
      return app;
    };
  }
  let currentApp = null;
  function provide(key, value) {
    if (!currentInstance) ;
    else {
      let provides = currentInstance.provides;
      const parentProvides = currentInstance.parent && currentInstance.parent.provides;
      if (parentProvides === provides) {
        provides = currentInstance.provides = Object.create(parentProvides);
      }
      provides[key] = value;
    }
  }
  function inject(key, defaultValue, treatDefaultAsFactory = false) {
    const instance = currentInstance || currentRenderingInstance;
    if (instance || currentApp) {
      const provides = currentApp ? currentApp._context.provides : instance ? instance.parent == null ? instance.vnode.appContext && instance.vnode.appContext.provides : instance.parent.provides : void 0;
      if (provides && key in provides) {
        return provides[key];
      } else if (arguments.length > 1) {
        return treatDefaultAsFactory && isFunction$1(defaultValue) ? defaultValue.call(instance && instance.proxy) : defaultValue;
      } else ;
    }
  }
  function hasInjectionContext() {
    return !!(currentInstance || currentRenderingInstance || currentApp);
  }
  const internalObjectProto = {};
  const createInternalObject = () => Object.create(internalObjectProto);
  const isInternalObject = (obj) => Object.getPrototypeOf(obj) === internalObjectProto;
  function initProps(instance, rawProps, isStateful, isSSR = false) {
    const props = {};
    const attrs = createInternalObject();
    instance.propsDefaults = /* @__PURE__ */ Object.create(null);
    setFullProps(instance, rawProps, props, attrs);
    for (const key in instance.propsOptions[0]) {
      if (!(key in props)) {
        props[key] = void 0;
      }
    }
    if (isStateful) {
      instance.props = isSSR ? props : shallowReactive(props);
    } else {
      if (!instance.type.props) {
        instance.props = attrs;
      } else {
        instance.props = props;
      }
    }
    instance.attrs = attrs;
  }
  function updateProps(instance, rawProps, rawPrevProps, optimized) {
    const {
      props,
      attrs,
      vnode: { patchFlag }
    } = instance;
    const rawCurrentProps = toRaw(props);
    const [options] = instance.propsOptions;
    let hasAttrsChanged = false;
    if (
      // always force full diff in dev
      // - #1942 if hmr is enabled with sfc component
      // - vite#872 non-sfc component used by sfc component
      (optimized || patchFlag > 0) && !(patchFlag & 16)
    ) {
      if (patchFlag & 8) {
        const propsToUpdate = instance.vnode.dynamicProps;
        for (let i = 0; i < propsToUpdate.length; i++) {
          let key = propsToUpdate[i];
          if (isEmitListener(instance.emitsOptions, key)) {
            continue;
          }
          const value = rawProps[key];
          if (options) {
            if (hasOwn$2(attrs, key)) {
              if (value !== attrs[key]) {
                attrs[key] = value;
                hasAttrsChanged = true;
              }
            } else {
              const camelizedKey = camelize$1(key);
              props[camelizedKey] = resolvePropValue(
                options,
                rawCurrentProps,
                camelizedKey,
                value,
                instance,
                false
              );
            }
          } else {
            if (value !== attrs[key]) {
              attrs[key] = value;
              hasAttrsChanged = true;
            }
          }
        }
      }
    } else {
      if (setFullProps(instance, rawProps, props, attrs)) {
        hasAttrsChanged = true;
      }
      let kebabKey;
      for (const key in rawCurrentProps) {
        if (!rawProps || // for camelCase
        !hasOwn$2(rawProps, key) && // it's possible the original props was passed in as kebab-case
        // and converted to camelCase (#955)
        ((kebabKey = hyphenate$1(key)) === key || !hasOwn$2(rawProps, kebabKey))) {
          if (options) {
            if (rawPrevProps && // for camelCase
            (rawPrevProps[key] !== void 0 || // for kebab-case
            rawPrevProps[kebabKey] !== void 0)) {
              props[key] = resolvePropValue(
                options,
                rawCurrentProps,
                key,
                void 0,
                instance,
                true
              );
            }
          } else {
            delete props[key];
          }
        }
      }
      if (attrs !== rawCurrentProps) {
        for (const key in attrs) {
          if (!rawProps || !hasOwn$2(rawProps, key) && true) {
            delete attrs[key];
            hasAttrsChanged = true;
          }
        }
      }
    }
    if (hasAttrsChanged) {
      trigger(instance.attrs, "set", "");
    }
  }
  function setFullProps(instance, rawProps, props, attrs) {
    const [options, needCastKeys] = instance.propsOptions;
    let hasAttrsChanged = false;
    let rawCastValues;
    if (rawProps) {
      for (let key in rawProps) {
        if (isReservedProp(key)) {
          continue;
        }
        const value = rawProps[key];
        let camelKey;
        if (options && hasOwn$2(options, camelKey = camelize$1(key))) {
          if (!needCastKeys || !needCastKeys.includes(camelKey)) {
            props[camelKey] = value;
          } else {
            (rawCastValues || (rawCastValues = {}))[camelKey] = value;
          }
        } else if (!isEmitListener(instance.emitsOptions, key)) {
          if (!(key in attrs) || value !== attrs[key]) {
            attrs[key] = value;
            hasAttrsChanged = true;
          }
        }
      }
    }
    if (needCastKeys) {
      const rawCurrentProps = toRaw(props);
      const castValues = rawCastValues || EMPTY_OBJ;
      for (let i = 0; i < needCastKeys.length; i++) {
        const key = needCastKeys[i];
        props[key] = resolvePropValue(
          options,
          rawCurrentProps,
          key,
          castValues[key],
          instance,
          !hasOwn$2(castValues, key)
        );
      }
    }
    return hasAttrsChanged;
  }
  function resolvePropValue(options, props, key, value, instance, isAbsent) {
    const opt = options[key];
    if (opt != null) {
      const hasDefault = hasOwn$2(opt, "default");
      if (hasDefault && value === void 0) {
        const defaultValue = opt.default;
        if (opt.type !== Function && !opt.skipFactory && isFunction$1(defaultValue)) {
          const { propsDefaults } = instance;
          if (key in propsDefaults) {
            value = propsDefaults[key];
          } else {
            const reset = setCurrentInstance(instance);
            value = propsDefaults[key] = defaultValue.call(
              null,
              props
            );
            reset();
          }
        } else {
          value = defaultValue;
        }
        if (instance.ce) {
          instance.ce._setProp(key, value);
        }
      }
      if (opt[
        0
        /* shouldCast */
      ]) {
        if (isAbsent && !hasDefault) {
          value = false;
        } else if (opt[
          1
          /* shouldCastTrue */
        ] && (value === "" || value === hyphenate$1(key))) {
          value = true;
        }
      }
    }
    return value;
  }
  const mixinPropsCache = /* @__PURE__ */ new WeakMap();
  function normalizePropsOptions(comp, appContext, asMixin = false) {
    const cache = asMixin ? mixinPropsCache : appContext.propsCache;
    const cached = cache.get(comp);
    if (cached) {
      return cached;
    }
    const raw = comp.props;
    const normalized = {};
    const needCastKeys = [];
    let hasExtends = false;
    if (!isFunction$1(comp)) {
      const extendProps = (raw2) => {
        hasExtends = true;
        const [props, keys] = normalizePropsOptions(raw2, appContext, true);
        extend$1(normalized, props);
        if (keys) needCastKeys.push(...keys);
      };
      if (!asMixin && appContext.mixins.length) {
        appContext.mixins.forEach(extendProps);
      }
      if (comp.extends) {
        extendProps(comp.extends);
      }
      if (comp.mixins) {
        comp.mixins.forEach(extendProps);
      }
    }
    if (!raw && !hasExtends) {
      if (isObject$1(comp)) {
        cache.set(comp, EMPTY_ARR);
      }
      return EMPTY_ARR;
    }
    if (isArray$1(raw)) {
      for (let i = 0; i < raw.length; i++) {
        const normalizedKey = camelize$1(raw[i]);
        if (validatePropName(normalizedKey)) {
          normalized[normalizedKey] = EMPTY_OBJ;
        }
      }
    } else if (raw) {
      for (const key in raw) {
        const normalizedKey = camelize$1(key);
        if (validatePropName(normalizedKey)) {
          const opt = raw[key];
          const prop = normalized[normalizedKey] = isArray$1(opt) || isFunction$1(opt) ? { type: opt } : extend$1({}, opt);
          const propType = prop.type;
          let shouldCast = false;
          let shouldCastTrue = true;
          if (isArray$1(propType)) {
            for (let index = 0; index < propType.length; ++index) {
              const type2 = propType[index];
              const typeName = isFunction$1(type2) && type2.name;
              if (typeName === "Boolean") {
                shouldCast = true;
                break;
              } else if (typeName === "String") {
                shouldCastTrue = false;
              }
            }
          } else {
            shouldCast = isFunction$1(propType) && propType.name === "Boolean";
          }
          prop[
            0
            /* shouldCast */
          ] = shouldCast;
          prop[
            1
            /* shouldCastTrue */
          ] = shouldCastTrue;
          if (shouldCast || hasOwn$2(prop, "default")) {
            needCastKeys.push(normalizedKey);
          }
        }
      }
    }
    const res = [normalized, needCastKeys];
    if (isObject$1(comp)) {
      cache.set(comp, res);
    }
    return res;
  }
  function validatePropName(key) {
    if (key[0] !== "$" && !isReservedProp(key)) {
      return true;
    }
    return false;
  }
  const isInternalKey = (key) => key[0] === "_" || key === "$stable";
  const normalizeSlotValue = (value) => isArray$1(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];
  const normalizeSlot = (key, rawSlot, ctx) => {
    if (rawSlot._n) {
      return rawSlot;
    }
    const normalized = withCtx((...args) => {
      if (false) ;
      return normalizeSlotValue(rawSlot(...args));
    }, ctx);
    normalized._c = false;
    return normalized;
  };
  const normalizeObjectSlots = (rawSlots, slots, instance) => {
    const ctx = rawSlots._ctx;
    for (const key in rawSlots) {
      if (isInternalKey(key)) continue;
      const value = rawSlots[key];
      if (isFunction$1(value)) {
        slots[key] = normalizeSlot(key, value, ctx);
      } else if (value != null) {
        const normalized = normalizeSlotValue(value);
        slots[key] = () => normalized;
      }
    }
  };
  const normalizeVNodeSlots = (instance, children) => {
    const normalized = normalizeSlotValue(children);
    instance.slots.default = () => normalized;
  };
  const assignSlots = (slots, children, optimized) => {
    for (const key in children) {
      if (optimized || key !== "_") {
        slots[key] = children[key];
      }
    }
  };
  const initSlots = (instance, children, optimized) => {
    const slots = instance.slots = createInternalObject();
    if (instance.vnode.shapeFlag & 32) {
      const type2 = children._;
      if (type2) {
        assignSlots(slots, children, optimized);
        if (optimized) {
          def$1(slots, "_", type2, true);
        }
      } else {
        normalizeObjectSlots(children, slots);
      }
    } else if (children) {
      normalizeVNodeSlots(instance, children);
    }
  };
  const updateSlots = (instance, children, optimized) => {
    const { vnode, slots } = instance;
    let needDeletionCheck = true;
    let deletionComparisonTarget = EMPTY_OBJ;
    if (vnode.shapeFlag & 32) {
      const type2 = children._;
      if (type2) {
        if (optimized && type2 === 1) {
          needDeletionCheck = false;
        } else {
          assignSlots(slots, children, optimized);
        }
      } else {
        needDeletionCheck = !children.$stable;
        normalizeObjectSlots(children, slots);
      }
      deletionComparisonTarget = children;
    } else if (children) {
      normalizeVNodeSlots(instance, children);
      deletionComparisonTarget = { default: 1 };
    }
    if (needDeletionCheck) {
      for (const key in slots) {
        if (!isInternalKey(key) && deletionComparisonTarget[key] == null) {
          delete slots[key];
        }
      }
    }
  };
  const queuePostRenderEffect = queueEffectWithSuspense;
  function createRenderer(options) {
    return baseCreateRenderer(options);
  }
  function baseCreateRenderer(options, createHydrationFns) {
    const target = getGlobalThis();
    target.__VUE__ = true;
    const {
      insert: hostInsert,
      remove: hostRemove,
      patchProp: hostPatchProp,
      createElement: hostCreateElement,
      createText: hostCreateText,
      createComment: hostCreateComment,
      setText: hostSetText,
      setElementText: hostSetElementText,
      parentNode: hostParentNode,
      nextSibling: hostNextSibling,
      setScopeId: hostSetScopeId = NOOP,
      insertStaticContent: hostInsertStaticContent
    } = options;
    const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, namespace = void 0, slotScopeIds = null, optimized = !!n2.dynamicChildren) => {
      if (n1 === n2) {
        return;
      }
      if (n1 && !isSameVNodeType(n1, n2)) {
        anchor = getNextHostNode(n1);
        unmount(n1, parentComponent, parentSuspense, true);
        n1 = null;
      }
      if (n2.patchFlag === -2) {
        optimized = false;
        n2.dynamicChildren = null;
      }
      const { type: type2, ref: ref3, shapeFlag } = n2;
      switch (type2) {
        case Text:
          processText(n1, n2, container, anchor);
          break;
        case Comment:
          processCommentNode(n1, n2, container, anchor);
          break;
        case Static:
          if (n1 == null) {
            mountStaticNode(n2, container, anchor, namespace);
          }
          break;
        case Fragment:
          processFragment(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
          break;
        default:
          if (shapeFlag & 1) {
            processElement(
              n1,
              n2,
              container,
              anchor,
              parentComponent,
              parentSuspense,
              namespace,
              slotScopeIds,
              optimized
            );
          } else if (shapeFlag & 6) {
            processComponent(
              n1,
              n2,
              container,
              anchor,
              parentComponent,
              parentSuspense,
              namespace,
              slotScopeIds,
              optimized
            );
          } else if (shapeFlag & 64) {
            type2.process(
              n1,
              n2,
              container,
              anchor,
              parentComponent,
              parentSuspense,
              namespace,
              slotScopeIds,
              optimized,
              internals
            );
          } else if (shapeFlag & 128) {
            type2.process(
              n1,
              n2,
              container,
              anchor,
              parentComponent,
              parentSuspense,
              namespace,
              slotScopeIds,
              optimized,
              internals
            );
          } else ;
      }
      if (ref3 != null && parentComponent) {
        setRef(ref3, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
      }
    };
    const processText = (n1, n2, container, anchor) => {
      if (n1 == null) {
        hostInsert(
          n2.el = hostCreateText(n2.children),
          container,
          anchor
        );
      } else {
        const el = n2.el = n1.el;
        if (n2.children !== n1.children) {
          hostSetText(el, n2.children);
        }
      }
    };
    const processCommentNode = (n1, n2, container, anchor) => {
      if (n1 == null) {
        hostInsert(
          n2.el = hostCreateComment(n2.children || ""),
          container,
          anchor
        );
      } else {
        n2.el = n1.el;
      }
    };
    const mountStaticNode = (n2, container, anchor, namespace) => {
      [n2.el, n2.anchor] = hostInsertStaticContent(
        n2.children,
        container,
        anchor,
        namespace,
        n2.el,
        n2.anchor
      );
    };
    const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
      let next;
      while (el && el !== anchor) {
        next = hostNextSibling(el);
        hostInsert(el, container, nextSibling);
        el = next;
      }
      hostInsert(anchor, container, nextSibling);
    };
    const removeStaticNode = ({ el, anchor }) => {
      let next;
      while (el && el !== anchor) {
        next = hostNextSibling(el);
        hostRemove(el);
        el = next;
      }
      hostRemove(anchor);
    };
    const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
      if (n2.type === "svg") {
        namespace = "svg";
      } else if (n2.type === "math") {
        namespace = "mathml";
      }
      if (n1 == null) {
        mountElement(
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } else {
        patchElement(
          n1,
          n2,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      }
    };
    const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
      let el;
      let vnodeHook;
      const { props, shapeFlag, transition, dirs } = vnode;
      el = vnode.el = hostCreateElement(
        vnode.type,
        namespace,
        props && props.is,
        props
      );
      if (shapeFlag & 8) {
        hostSetElementText(el, vnode.children);
      } else if (shapeFlag & 16) {
        mountChildren(
          vnode.children,
          el,
          null,
          parentComponent,
          parentSuspense,
          resolveChildrenNamespace(vnode, namespace),
          slotScopeIds,
          optimized
        );
      }
      if (dirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "created");
      }
      setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
      if (props) {
        for (const key in props) {
          if (key !== "value" && !isReservedProp(key)) {
            hostPatchProp(el, key, null, props[key], namespace, parentComponent);
          }
        }
        if ("value" in props) {
          hostPatchProp(el, "value", null, props.value, namespace);
        }
        if (vnodeHook = props.onVnodeBeforeMount) {
          invokeVNodeHook(vnodeHook, parentComponent, vnode);
        }
      }
      if (dirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
      }
      const needCallTransitionHooks = needTransition(parentSuspense, transition);
      if (needCallTransitionHooks) {
        transition.beforeEnter(el);
      }
      hostInsert(el, container, anchor);
      if ((vnodeHook = props && props.onVnodeMounted) || needCallTransitionHooks || dirs) {
        queuePostRenderEffect(() => {
          vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
          needCallTransitionHooks && transition.enter(el);
          dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
        }, parentSuspense);
      }
    };
    const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
      if (scopeId) {
        hostSetScopeId(el, scopeId);
      }
      if (slotScopeIds) {
        for (let i = 0; i < slotScopeIds.length; i++) {
          hostSetScopeId(el, slotScopeIds[i]);
        }
      }
      if (parentComponent) {
        let subTree = parentComponent.subTree;
        if (vnode === subTree || isSuspense(subTree.type) && (subTree.ssContent === vnode || subTree.ssFallback === vnode)) {
          const parentVNode = parentComponent.vnode;
          setScopeId(
            el,
            parentVNode,
            parentVNode.scopeId,
            parentVNode.slotScopeIds,
            parentComponent.parent
          );
        }
      }
    };
    const mountChildren = (children, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, start = 0) => {
      for (let i = start; i < children.length; i++) {
        const child = children[i] = optimized ? cloneIfMounted(children[i]) : normalizeVNode(children[i]);
        patch(
          null,
          child,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      }
    };
    const patchElement = (n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
      const el = n2.el = n1.el;
      let { patchFlag, dynamicChildren, dirs } = n2;
      patchFlag |= n1.patchFlag & 16;
      const oldProps = n1.props || EMPTY_OBJ;
      const newProps = n2.props || EMPTY_OBJ;
      let vnodeHook;
      parentComponent && toggleRecurse(parentComponent, false);
      if (vnodeHook = newProps.onVnodeBeforeUpdate) {
        invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
      }
      if (dirs) {
        invokeDirectiveHook(n2, n1, parentComponent, "beforeUpdate");
      }
      parentComponent && toggleRecurse(parentComponent, true);
      if (oldProps.innerHTML && newProps.innerHTML == null || oldProps.textContent && newProps.textContent == null) {
        hostSetElementText(el, "");
      }
      if (dynamicChildren) {
        patchBlockChildren(
          n1.dynamicChildren,
          dynamicChildren,
          el,
          parentComponent,
          parentSuspense,
          resolveChildrenNamespace(n2, namespace),
          slotScopeIds
        );
      } else if (!optimized) {
        patchChildren(
          n1,
          n2,
          el,
          null,
          parentComponent,
          parentSuspense,
          resolveChildrenNamespace(n2, namespace),
          slotScopeIds,
          false
        );
      }
      if (patchFlag > 0) {
        if (patchFlag & 16) {
          patchProps(el, oldProps, newProps, parentComponent, namespace);
        } else {
          if (patchFlag & 2) {
            if (oldProps.class !== newProps.class) {
              hostPatchProp(el, "class", null, newProps.class, namespace);
            }
          }
          if (patchFlag & 4) {
            hostPatchProp(el, "style", oldProps.style, newProps.style, namespace);
          }
          if (patchFlag & 8) {
            const propsToUpdate = n2.dynamicProps;
            for (let i = 0; i < propsToUpdate.length; i++) {
              const key = propsToUpdate[i];
              const prev = oldProps[key];
              const next = newProps[key];
              if (next !== prev || key === "value") {
                hostPatchProp(el, key, prev, next, namespace, parentComponent);
              }
            }
          }
        }
        if (patchFlag & 1) {
          if (n1.children !== n2.children) {
            hostSetElementText(el, n2.children);
          }
        }
      } else if (!optimized && dynamicChildren == null) {
        patchProps(el, oldProps, newProps, parentComponent, namespace);
      }
      if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
        queuePostRenderEffect(() => {
          vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
          dirs && invokeDirectiveHook(n2, n1, parentComponent, "updated");
        }, parentSuspense);
      }
    };
    const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, namespace, slotScopeIds) => {
      for (let i = 0; i < newChildren.length; i++) {
        const oldVNode = oldChildren[i];
        const newVNode = newChildren[i];
        const container = (
          // oldVNode may be an errored async setup() component inside Suspense
          // which will not have a mounted element
          oldVNode.el && // - In the case of a Fragment, we need to provide the actual parent
          // of the Fragment itself so it can move its children.
          (oldVNode.type === Fragment || // - In the case of different nodes, there is going to be a replacement
          // which also requires the correct parent container
          !isSameVNodeType(oldVNode, newVNode) || // - In the case of a component, it could contain anything.
          oldVNode.shapeFlag & (6 | 64)) ? hostParentNode(oldVNode.el) : (
            // In other cases, the parent container is not actually used so we
            // just pass the block element here to avoid a DOM parentNode call.
            fallbackContainer
          )
        );
        patch(
          oldVNode,
          newVNode,
          container,
          null,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          true
        );
      }
    };
    const patchProps = (el, oldProps, newProps, parentComponent, namespace) => {
      if (oldProps !== newProps) {
        if (oldProps !== EMPTY_OBJ) {
          for (const key in oldProps) {
            if (!isReservedProp(key) && !(key in newProps)) {
              hostPatchProp(
                el,
                key,
                oldProps[key],
                null,
                namespace,
                parentComponent
              );
            }
          }
        }
        for (const key in newProps) {
          if (isReservedProp(key)) continue;
          const next = newProps[key];
          const prev = oldProps[key];
          if (next !== prev && key !== "value") {
            hostPatchProp(el, key, prev, next, namespace, parentComponent);
          }
        }
        if ("value" in newProps) {
          hostPatchProp(el, "value", oldProps.value, newProps.value, namespace);
        }
      }
    };
    const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
      const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText("");
      const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText("");
      let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
      if (fragmentSlotScopeIds) {
        slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
      }
      if (n1 == null) {
        hostInsert(fragmentStartAnchor, container, anchor);
        hostInsert(fragmentEndAnchor, container, anchor);
        mountChildren(
          // #10007
          // such fragment like `<></>` will be compiled into
          // a fragment which doesn't have a children.
          // In this case fallback to an empty array
          n2.children || [],
          container,
          fragmentEndAnchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } else {
        if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && // #2715 the previous fragment could've been a BAILed one as a result
        // of renderSlot() with no valid children
        n1.dynamicChildren) {
          patchBlockChildren(
            n1.dynamicChildren,
            dynamicChildren,
            container,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds
          );
          if (
            // #2080 if the stable fragment has a key, it's a <template v-for> that may
            //  get moved around. Make sure all root level vnodes inherit el.
            // #2134 or if it's a component root, it may also get moved around
            // as the component is being moved.
            n2.key != null || parentComponent && n2 === parentComponent.subTree
          ) {
            traverseStaticChildren(
              n1,
              n2,
              true
              /* shallow */
            );
          }
        } else {
          patchChildren(
            n1,
            n2,
            container,
            fragmentEndAnchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        }
      }
    };
    const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
      n2.slotScopeIds = slotScopeIds;
      if (n1 == null) {
        if (n2.shapeFlag & 512) {
          parentComponent.ctx.activate(
            n2,
            container,
            anchor,
            namespace,
            optimized
          );
        } else {
          mountComponent(
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            optimized
          );
        }
      } else {
        updateComponent(n1, n2, optimized);
      }
    };
    const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, namespace, optimized) => {
      const instance = initialVNode.component = createComponentInstance(
        initialVNode,
        parentComponent,
        parentSuspense
      );
      if (isKeepAlive(initialVNode)) {
        instance.ctx.renderer = internals;
      }
      {
        setupComponent(instance, false, optimized);
      }
      if (instance.asyncDep) {
        parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect, optimized);
        if (!initialVNode.el) {
          const placeholder = instance.subTree = createVNode(Comment);
          processCommentNode(null, placeholder, container, anchor);
        }
      } else {
        setupRenderEffect(
          instance,
          initialVNode,
          container,
          anchor,
          parentSuspense,
          namespace,
          optimized
        );
      }
    };
    const updateComponent = (n1, n2, optimized) => {
      const instance = n2.component = n1.component;
      if (shouldUpdateComponent(n1, n2, optimized)) {
        if (instance.asyncDep && !instance.asyncResolved) {
          updateComponentPreRender(instance, n2, optimized);
          return;
        } else {
          instance.next = n2;
          instance.update();
        }
      } else {
        n2.el = n1.el;
        instance.vnode = n2;
      }
    };
    const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, namespace, optimized) => {
      const componentUpdateFn = () => {
        if (!instance.isMounted) {
          let vnodeHook;
          const { el, props } = initialVNode;
          const { bm, m, parent, root, type: type2 } = instance;
          const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
          toggleRecurse(instance, false);
          if (bm) {
            invokeArrayFns$1(bm);
          }
          if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeBeforeMount)) {
            invokeVNodeHook(vnodeHook, parent, initialVNode);
          }
          toggleRecurse(instance, true);
          if (el && hydrateNode) {
            const hydrateSubTree = () => {
              instance.subTree = renderComponentRoot(instance);
              hydrateNode(
                el,
                instance.subTree,
                instance,
                parentSuspense,
                null
              );
            };
            if (isAsyncWrapperVNode) {
              type2.__asyncHydrate(
                el,
                instance,
                hydrateSubTree
              );
            } else {
              hydrateSubTree();
            }
          } else {
            if (root.ce) {
              root.ce._injectChildStyle(type2);
            }
            const subTree = instance.subTree = renderComponentRoot(instance);
            patch(
              null,
              subTree,
              container,
              anchor,
              instance,
              parentSuspense,
              namespace
            );
            initialVNode.el = subTree.el;
          }
          if (m) {
            queuePostRenderEffect(m, parentSuspense);
          }
          if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) {
            const scopedInitialVNode = initialVNode;
            queuePostRenderEffect(
              () => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode),
              parentSuspense
            );
          }
          if (initialVNode.shapeFlag & 256 || parent && isAsyncWrapper(parent.vnode) && parent.vnode.shapeFlag & 256) {
            instance.a && queuePostRenderEffect(instance.a, parentSuspense);
          }
          instance.isMounted = true;
          initialVNode = container = anchor = null;
        } else {
          let { next, bu, u, parent, vnode } = instance;
          {
            const nonHydratedAsyncRoot = locateNonHydratedAsyncRoot(instance);
            if (nonHydratedAsyncRoot) {
              if (next) {
                next.el = vnode.el;
                updateComponentPreRender(instance, next, optimized);
              }
              nonHydratedAsyncRoot.asyncDep.then(() => {
                if (!instance.isUnmounted) {
                  componentUpdateFn();
                }
              });
              return;
            }
          }
          let originNext = next;
          let vnodeHook;
          toggleRecurse(instance, false);
          if (next) {
            next.el = vnode.el;
            updateComponentPreRender(instance, next, optimized);
          } else {
            next = vnode;
          }
          if (bu) {
            invokeArrayFns$1(bu);
          }
          if (vnodeHook = next.props && next.props.onVnodeBeforeUpdate) {
            invokeVNodeHook(vnodeHook, parent, next, vnode);
          }
          toggleRecurse(instance, true);
          const nextTree = renderComponentRoot(instance);
          const prevTree = instance.subTree;
          instance.subTree = nextTree;
          patch(
            prevTree,
            nextTree,
            // parent may have changed if it's in a teleport
            hostParentNode(prevTree.el),
            // anchor may have changed if it's in a fragment
            getNextHostNode(prevTree),
            instance,
            parentSuspense,
            namespace
          );
          next.el = nextTree.el;
          if (originNext === null) {
            updateHOCHostEl(instance, nextTree.el);
          }
          if (u) {
            queuePostRenderEffect(u, parentSuspense);
          }
          if (vnodeHook = next.props && next.props.onVnodeUpdated) {
            queuePostRenderEffect(
              () => invokeVNodeHook(vnodeHook, parent, next, vnode),
              parentSuspense
            );
          }
        }
      };
      instance.scope.on();
      const effect2 = instance.effect = new ReactiveEffect(componentUpdateFn);
      instance.scope.off();
      const update = instance.update = effect2.run.bind(effect2);
      const job = instance.job = effect2.runIfDirty.bind(effect2);
      job.i = instance;
      job.id = instance.uid;
      effect2.scheduler = () => queueJob(job);
      toggleRecurse(instance, true);
      update();
    };
    const updateComponentPreRender = (instance, nextVNode, optimized) => {
      nextVNode.component = instance;
      const prevProps = instance.vnode.props;
      instance.vnode = nextVNode;
      instance.next = null;
      updateProps(instance, nextVNode.props, prevProps, optimized);
      updateSlots(instance, nextVNode.children, optimized);
      pauseTracking();
      flushPreFlushCbs(instance);
      resetTracking();
    };
    const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized = false) => {
      const c1 = n1 && n1.children;
      const prevShapeFlag = n1 ? n1.shapeFlag : 0;
      const c2 = n2.children;
      const { patchFlag, shapeFlag } = n2;
      if (patchFlag > 0) {
        if (patchFlag & 128) {
          patchKeyedChildren(
            c1,
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
          return;
        } else if (patchFlag & 256) {
          patchUnkeyedChildren(
            c1,
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
          return;
        }
      }
      if (shapeFlag & 8) {
        if (prevShapeFlag & 16) {
          unmountChildren(c1, parentComponent, parentSuspense);
        }
        if (c2 !== c1) {
          hostSetElementText(container, c2);
        }
      } else {
        if (prevShapeFlag & 16) {
          if (shapeFlag & 16) {
            patchKeyedChildren(
              c1,
              c2,
              container,
              anchor,
              parentComponent,
              parentSuspense,
              namespace,
              slotScopeIds,
              optimized
            );
          } else {
            unmountChildren(c1, parentComponent, parentSuspense, true);
          }
        } else {
          if (prevShapeFlag & 8) {
            hostSetElementText(container, "");
          }
          if (shapeFlag & 16) {
            mountChildren(
              c2,
              container,
              anchor,
              parentComponent,
              parentSuspense,
              namespace,
              slotScopeIds,
              optimized
            );
          }
        }
      }
    };
    const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
      c1 = c1 || EMPTY_ARR;
      c2 = c2 || EMPTY_ARR;
      const oldLength = c1.length;
      const newLength = c2.length;
      const commonLength = Math.min(oldLength, newLength);
      let i;
      for (i = 0; i < commonLength; i++) {
        const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
        patch(
          c1[i],
          nextChild,
          container,
          null,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      }
      if (oldLength > newLength) {
        unmountChildren(
          c1,
          parentComponent,
          parentSuspense,
          true,
          false,
          commonLength
        );
      } else {
        mountChildren(
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized,
          commonLength
        );
      }
    };
    const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
      let i = 0;
      const l2 = c2.length;
      let e1 = c1.length - 1;
      let e2 = l2 - 1;
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
        if (isSameVNodeType(n1, n2)) {
          patch(
            n1,
            n2,
            container,
            null,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else {
          break;
        }
        i++;
      }
      while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2] = optimized ? cloneIfMounted(c2[e2]) : normalizeVNode(c2[e2]);
        if (isSameVNodeType(n1, n2)) {
          patch(
            n1,
            n2,
            container,
            null,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else {
          break;
        }
        e1--;
        e2--;
      }
      if (i > e1) {
        if (i <= e2) {
          const nextPos = e2 + 1;
          const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
          while (i <= e2) {
            patch(
              null,
              c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]),
              container,
              anchor,
              parentComponent,
              parentSuspense,
              namespace,
              slotScopeIds,
              optimized
            );
            i++;
          }
        }
      } else if (i > e2) {
        while (i <= e1) {
          unmount(c1[i], parentComponent, parentSuspense, true);
          i++;
        }
      } else {
        const s1 = i;
        const s2 = i;
        const keyToNewIndexMap = /* @__PURE__ */ new Map();
        for (i = s2; i <= e2; i++) {
          const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
          if (nextChild.key != null) {
            keyToNewIndexMap.set(nextChild.key, i);
          }
        }
        let j;
        let patched = 0;
        const toBePatched = e2 - s2 + 1;
        let moved = false;
        let maxNewIndexSoFar = 0;
        const newIndexToOldIndexMap = new Array(toBePatched);
        for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
        for (i = s1; i <= e1; i++) {
          const prevChild = c1[i];
          if (patched >= toBePatched) {
            unmount(prevChild, parentComponent, parentSuspense, true);
            continue;
          }
          let newIndex;
          if (prevChild.key != null) {
            newIndex = keyToNewIndexMap.get(prevChild.key);
          } else {
            for (j = s2; j <= e2; j++) {
              if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
                newIndex = j;
                break;
              }
            }
          }
          if (newIndex === void 0) {
            unmount(prevChild, parentComponent, parentSuspense, true);
          } else {
            newIndexToOldIndexMap[newIndex - s2] = i + 1;
            if (newIndex >= maxNewIndexSoFar) {
              maxNewIndexSoFar = newIndex;
            } else {
              moved = true;
            }
            patch(
              prevChild,
              c2[newIndex],
              container,
              null,
              parentComponent,
              parentSuspense,
              namespace,
              slotScopeIds,
              optimized
            );
            patched++;
          }
        }
        const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : EMPTY_ARR;
        j = increasingNewIndexSequence.length - 1;
        for (i = toBePatched - 1; i >= 0; i--) {
          const nextIndex = s2 + i;
          const nextChild = c2[nextIndex];
          const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
          if (newIndexToOldIndexMap[i] === 0) {
            patch(
              null,
              nextChild,
              container,
              anchor,
              parentComponent,
              parentSuspense,
              namespace,
              slotScopeIds,
              optimized
            );
          } else if (moved) {
            if (j < 0 || i !== increasingNewIndexSequence[j]) {
              move(nextChild, container, anchor, 2);
            } else {
              j--;
            }
          }
        }
      }
    };
    const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
      const { el, type: type2, transition, children, shapeFlag } = vnode;
      if (shapeFlag & 6) {
        move(vnode.component.subTree, container, anchor, moveType);
        return;
      }
      if (shapeFlag & 128) {
        vnode.suspense.move(container, anchor, moveType);
        return;
      }
      if (shapeFlag & 64) {
        type2.move(vnode, container, anchor, internals);
        return;
      }
      if (type2 === Fragment) {
        hostInsert(el, container, anchor);
        for (let i = 0; i < children.length; i++) {
          move(children[i], container, anchor, moveType);
        }
        hostInsert(vnode.anchor, container, anchor);
        return;
      }
      if (type2 === Static) {
        moveStaticNode(vnode, container, anchor);
        return;
      }
      const needTransition2 = moveType !== 2 && shapeFlag & 1 && transition;
      if (needTransition2) {
        if (moveType === 0) {
          transition.beforeEnter(el);
          hostInsert(el, container, anchor);
          queuePostRenderEffect(() => transition.enter(el), parentSuspense);
        } else {
          const { leave, delayLeave, afterLeave } = transition;
          const remove22 = () => hostInsert(el, container, anchor);
          const performLeave = () => {
            leave(el, () => {
              remove22();
              afterLeave && afterLeave();
            });
          };
          if (delayLeave) {
            delayLeave(el, remove22, performLeave);
          } else {
            performLeave();
          }
        }
      } else {
        hostInsert(el, container, anchor);
      }
    };
    const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
      const {
        type: type2,
        props,
        ref: ref3,
        children,
        dynamicChildren,
        shapeFlag,
        patchFlag,
        dirs,
        cacheIndex
      } = vnode;
      if (patchFlag === -2) {
        optimized = false;
      }
      if (ref3 != null) {
        setRef(ref3, null, parentSuspense, vnode, true);
      }
      if (cacheIndex != null) {
        parentComponent.renderCache[cacheIndex] = void 0;
      }
      if (shapeFlag & 256) {
        parentComponent.ctx.deactivate(vnode);
        return;
      }
      const shouldInvokeDirs = shapeFlag & 1 && dirs;
      const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
      let vnodeHook;
      if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeBeforeUnmount)) {
        invokeVNodeHook(vnodeHook, parentComponent, vnode);
      }
      if (shapeFlag & 6) {
        unmountComponent(vnode.component, parentSuspense, doRemove);
      } else {
        if (shapeFlag & 128) {
          vnode.suspense.unmount(parentSuspense, doRemove);
          return;
        }
        if (shouldInvokeDirs) {
          invokeDirectiveHook(vnode, null, parentComponent, "beforeUnmount");
        }
        if (shapeFlag & 64) {
          vnode.type.remove(
            vnode,
            parentComponent,
            parentSuspense,
            internals,
            doRemove
          );
        } else if (dynamicChildren && // #5154
        // when v-once is used inside a block, setBlockTracking(-1) marks the
        // parent block with hasOnce: true
        // so that it doesn't take the fast path during unmount - otherwise
        // components nested in v-once are never unmounted.
        !dynamicChildren.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
        (type2 !== Fragment || patchFlag > 0 && patchFlag & 64)) {
          unmountChildren(
            dynamicChildren,
            parentComponent,
            parentSuspense,
            false,
            true
          );
        } else if (type2 === Fragment && patchFlag & (128 | 256) || !optimized && shapeFlag & 16) {
          unmountChildren(children, parentComponent, parentSuspense);
        }
        if (doRemove) {
          remove2(vnode);
        }
      }
      if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs) {
        queuePostRenderEffect(() => {
          vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
          shouldInvokeDirs && invokeDirectiveHook(vnode, null, parentComponent, "unmounted");
        }, parentSuspense);
      }
    };
    const remove2 = (vnode) => {
      const { type: type2, el, anchor, transition } = vnode;
      if (type2 === Fragment) {
        {
          removeFragment(el, anchor);
        }
        return;
      }
      if (type2 === Static) {
        removeStaticNode(vnode);
        return;
      }
      const performRemove = () => {
        hostRemove(el);
        if (transition && !transition.persisted && transition.afterLeave) {
          transition.afterLeave();
        }
      };
      if (vnode.shapeFlag & 1 && transition && !transition.persisted) {
        const { leave, delayLeave } = transition;
        const performLeave = () => leave(el, performRemove);
        if (delayLeave) {
          delayLeave(vnode.el, performRemove, performLeave);
        } else {
          performLeave();
        }
      } else {
        performRemove();
      }
    };
    const removeFragment = (cur, end) => {
      let next;
      while (cur !== end) {
        next = hostNextSibling(cur);
        hostRemove(cur);
        cur = next;
      }
      hostRemove(end);
    };
    const unmountComponent = (instance, parentSuspense, doRemove) => {
      const { bum, scope, job, subTree, um, m, a } = instance;
      invalidateMount(m);
      invalidateMount(a);
      if (bum) {
        invokeArrayFns$1(bum);
      }
      scope.stop();
      if (job) {
        job.flags |= 8;
        unmount(subTree, instance, parentSuspense, doRemove);
      }
      if (um) {
        queuePostRenderEffect(um, parentSuspense);
      }
      queuePostRenderEffect(() => {
        instance.isUnmounted = true;
      }, parentSuspense);
      if (parentSuspense && parentSuspense.pendingBranch && !parentSuspense.isUnmounted && instance.asyncDep && !instance.asyncResolved && instance.suspenseId === parentSuspense.pendingId) {
        parentSuspense.deps--;
        if (parentSuspense.deps === 0) {
          parentSuspense.resolve();
        }
      }
    };
    const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
      for (let i = start; i < children.length; i++) {
        unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
      }
    };
    const getNextHostNode = (vnode) => {
      if (vnode.shapeFlag & 6) {
        return getNextHostNode(vnode.component.subTree);
      }
      if (vnode.shapeFlag & 128) {
        return vnode.suspense.next();
      }
      const el = hostNextSibling(vnode.anchor || vnode.el);
      const teleportEnd = el && el[TeleportEndKey];
      return teleportEnd ? hostNextSibling(teleportEnd) : el;
    };
    let isFlushing2 = false;
    const render2 = (vnode, container, namespace) => {
      if (vnode == null) {
        if (container._vnode) {
          unmount(container._vnode, null, null, true);
        }
      } else {
        patch(
          container._vnode || null,
          vnode,
          container,
          null,
          null,
          null,
          namespace
        );
      }
      container._vnode = vnode;
      if (!isFlushing2) {
        isFlushing2 = true;
        flushPreFlushCbs();
        flushPostFlushCbs();
        isFlushing2 = false;
      }
    };
    const internals = {
      p: patch,
      um: unmount,
      m: move,
      r: remove2,
      mt: mountComponent,
      mc: mountChildren,
      pc: patchChildren,
      pbc: patchBlockChildren,
      n: getNextHostNode,
      o: options
    };
    let hydrate;
    let hydrateNode;
    return {
      render: render2,
      hydrate,
      createApp: createAppAPI(render2, hydrate)
    };
  }
  function resolveChildrenNamespace({ type: type2, props }, currentNamespace) {
    return currentNamespace === "svg" && type2 === "foreignObject" || currentNamespace === "mathml" && type2 === "annotation-xml" && props && props.encoding && props.encoding.includes("html") ? void 0 : currentNamespace;
  }
  function toggleRecurse({ effect: effect2, job }, allowed) {
    if (allowed) {
      effect2.flags |= 32;
      job.flags |= 4;
    } else {
      effect2.flags &= ~32;
      job.flags &= ~4;
    }
  }
  function needTransition(parentSuspense, transition) {
    return (!parentSuspense || parentSuspense && !parentSuspense.pendingBranch) && transition && !transition.persisted;
  }
  function traverseStaticChildren(n1, n2, shallow = false) {
    const ch1 = n1.children;
    const ch2 = n2.children;
    if (isArray$1(ch1) && isArray$1(ch2)) {
      for (let i = 0; i < ch1.length; i++) {
        const c1 = ch1[i];
        let c2 = ch2[i];
        if (c2.shapeFlag & 1 && !c2.dynamicChildren) {
          if (c2.patchFlag <= 0 || c2.patchFlag === 32) {
            c2 = ch2[i] = cloneIfMounted(ch2[i]);
            c2.el = c1.el;
          }
          if (!shallow && c2.patchFlag !== -2)
            traverseStaticChildren(c1, c2);
        }
        if (c2.type === Text) {
          c2.el = c1.el;
        }
      }
    }
  }
  function getSequence(arr) {
    const p2 = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        j = result[result.length - 1];
        if (arr[j] < arrI) {
          p2[i] = j;
          result.push(i);
          continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
          c = u + v >> 1;
          if (arr[result[c]] < arrI) {
            u = c + 1;
          } else {
            v = c;
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p2[i] = result[u - 1];
          }
          result[u] = i;
        }
      }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
      result[u] = v;
      v = p2[v];
    }
    return result;
  }
  function locateNonHydratedAsyncRoot(instance) {
    const subComponent = instance.subTree.component;
    if (subComponent) {
      if (subComponent.asyncDep && !subComponent.asyncResolved) {
        return subComponent;
      } else {
        return locateNonHydratedAsyncRoot(subComponent);
      }
    }
  }
  function invalidateMount(hooks) {
    if (hooks) {
      for (let i = 0; i < hooks.length; i++)
        hooks[i].flags |= 8;
    }
  }
  const ssrContextKey = Symbol.for("v-scx");
  const useSSRContext = () => {
    {
      const ctx = inject(ssrContextKey);
      return ctx;
    }
  };
  function watch(source, cb, options) {
    return doWatch(source, cb, options);
  }
  function doWatch(source, cb, options = EMPTY_OBJ) {
    const { immediate, deep, flush, once } = options;
    const baseWatchOptions = extend$1({}, options);
    let ssrCleanup;
    if (isInSSRComponentSetup) {
      if (flush === "sync") {
        const ctx = useSSRContext();
        ssrCleanup = ctx.__watcherHandles || (ctx.__watcherHandles = []);
      } else if (!cb || immediate) {
        baseWatchOptions.once = true;
      } else {
        return {
          stop: NOOP,
          resume: NOOP,
          pause: NOOP
        };
      }
    }
    const instance = currentInstance;
    baseWatchOptions.call = (fn, type2, args) => callWithAsyncErrorHandling(fn, instance, type2, args);
    let isPre = false;
    if (flush === "post") {
      baseWatchOptions.scheduler = (job) => {
        queuePostRenderEffect(job, instance && instance.suspense);
      };
    } else if (flush !== "sync") {
      isPre = true;
      baseWatchOptions.scheduler = (job, isFirstRun) => {
        if (isFirstRun) {
          job();
        } else {
          queueJob(job);
        }
      };
    }
    baseWatchOptions.augmentJob = (job) => {
      if (cb) {
        job.flags |= 4;
      }
      if (isPre) {
        job.flags |= 2;
        if (instance) {
          job.id = instance.uid;
          job.i = instance;
        }
      }
    };
    const watchHandle = watch$1(source, cb, baseWatchOptions);
    if (ssrCleanup) ssrCleanup.push(watchHandle);
    return watchHandle;
  }
  function instanceWatch(source, value, options) {
    const publicThis = this.proxy;
    const getter = isString$1(source) ? source.includes(".") ? createPathGetter(publicThis, source) : () => publicThis[source] : source.bind(publicThis, publicThis);
    let cb;
    if (isFunction$1(value)) {
      cb = value;
    } else {
      cb = value.handler;
      options = value;
    }
    const reset = setCurrentInstance(this);
    const res = doWatch(getter, cb.bind(publicThis), options);
    reset();
    return res;
  }
  function createPathGetter(ctx, path) {
    const segments = path.split(".");
    return () => {
      let cur = ctx;
      for (let i = 0; i < segments.length && cur; i++) {
        cur = cur[segments[i]];
      }
      return cur;
    };
  }
  const getModelModifiers = (props, modelName) => {
    return modelName === "modelValue" || modelName === "model-value" ? props.modelModifiers : props[`${modelName}Modifiers`] || props[`${camelize$1(modelName)}Modifiers`] || props[`${hyphenate$1(modelName)}Modifiers`];
  };
  function emit(instance, event, ...rawArgs) {
    if (instance.isUnmounted) return;
    const props = instance.vnode.props || EMPTY_OBJ;
    let args = rawArgs;
    const isModelListener2 = event.startsWith("update:");
    const modifiers = isModelListener2 && getModelModifiers(props, event.slice(7));
    if (modifiers) {
      if (modifiers.trim) {
        args = rawArgs.map((a) => isString$1(a) ? a.trim() : a);
      }
      if (modifiers.number) {
        args = rawArgs.map(looseToNumber$1);
      }
    }
    let handlerName;
    let handler = props[handlerName = toHandlerKey(event)] || // also try camelCase event handler (#2249)
    props[handlerName = toHandlerKey(camelize$1(event))];
    if (!handler && isModelListener2) {
      handler = props[handlerName = toHandlerKey(hyphenate$1(event))];
    }
    if (handler) {
      callWithAsyncErrorHandling(
        handler,
        instance,
        6,
        args
      );
    }
    const onceHandler = props[handlerName + `Once`];
    if (onceHandler) {
      if (!instance.emitted) {
        instance.emitted = {};
      } else if (instance.emitted[handlerName]) {
        return;
      }
      instance.emitted[handlerName] = true;
      callWithAsyncErrorHandling(
        onceHandler,
        instance,
        6,
        args
      );
    }
  }
  function normalizeEmitsOptions(comp, appContext, asMixin = false) {
    const cache = appContext.emitsCache;
    const cached = cache.get(comp);
    if (cached !== void 0) {
      return cached;
    }
    const raw = comp.emits;
    let normalized = {};
    let hasExtends = false;
    if (!isFunction$1(comp)) {
      const extendEmits = (raw2) => {
        const normalizedFromExtend = normalizeEmitsOptions(raw2, appContext, true);
        if (normalizedFromExtend) {
          hasExtends = true;
          extend$1(normalized, normalizedFromExtend);
        }
      };
      if (!asMixin && appContext.mixins.length) {
        appContext.mixins.forEach(extendEmits);
      }
      if (comp.extends) {
        extendEmits(comp.extends);
      }
      if (comp.mixins) {
        comp.mixins.forEach(extendEmits);
      }
    }
    if (!raw && !hasExtends) {
      if (isObject$1(comp)) {
        cache.set(comp, null);
      }
      return null;
    }
    if (isArray$1(raw)) {
      raw.forEach((key) => normalized[key] = null);
    } else {
      extend$1(normalized, raw);
    }
    if (isObject$1(comp)) {
      cache.set(comp, normalized);
    }
    return normalized;
  }
  function isEmitListener(options, key) {
    if (!options || !isOn$1(key)) {
      return false;
    }
    key = key.slice(2).replace(/Once$/, "");
    return hasOwn$2(options, key[0].toLowerCase() + key.slice(1)) || hasOwn$2(options, hyphenate$1(key)) || hasOwn$2(options, key);
  }
  function markAttrsAccessed() {
  }
  function renderComponentRoot(instance) {
    const {
      type: Component,
      vnode,
      proxy,
      withProxy,
      propsOptions: [propsOptions],
      slots,
      attrs,
      emit: emit2,
      render: render2,
      renderCache,
      props,
      data,
      setupState,
      ctx,
      inheritAttrs
    } = instance;
    const prev = setCurrentRenderingInstance(instance);
    let result;
    let fallthroughAttrs;
    try {
      if (vnode.shapeFlag & 4) {
        const proxyToUse = withProxy || proxy;
        const thisProxy = false ? new Proxy(proxyToUse, {
          get(target, key, receiver) {
            warn$1(
              `Property '${String(
                key
              )}' was accessed via 'this'. Avoid using 'this' in templates.`
            );
            return Reflect.get(target, key, receiver);
          }
        }) : proxyToUse;
        result = normalizeVNode(
          render2.call(
            thisProxy,
            proxyToUse,
            renderCache,
            false ? shallowReadonly(props) : props,
            setupState,
            data,
            ctx
          )
        );
        fallthroughAttrs = attrs;
      } else {
        const render22 = Component;
        if (false) ;
        result = normalizeVNode(
          render22.length > 1 ? render22(
            false ? shallowReadonly(props) : props,
            false ? {
              get attrs() {
                markAttrsAccessed();
                return shallowReadonly(attrs);
              },
              slots,
              emit: emit2
            } : { attrs, slots, emit: emit2 }
          ) : render22(
            false ? shallowReadonly(props) : props,
            null
          )
        );
        fallthroughAttrs = Component.props ? attrs : getFunctionalFallthrough(attrs);
      }
    } catch (err) {
      blockStack.length = 0;
      handleError(err, instance, 1);
      result = createVNode(Comment);
    }
    let root = result;
    if (fallthroughAttrs && inheritAttrs !== false) {
      const keys = Object.keys(fallthroughAttrs);
      const { shapeFlag } = root;
      if (keys.length) {
        if (shapeFlag & (1 | 6)) {
          if (propsOptions && keys.some(isModelListener$1)) {
            fallthroughAttrs = filterModelListeners(
              fallthroughAttrs,
              propsOptions
            );
          }
          root = cloneVNode(root, fallthroughAttrs, false, true);
        }
      }
    }
    if (vnode.dirs) {
      root = cloneVNode(root, null, false, true);
      root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
    }
    if (vnode.transition) {
      root.transition = vnode.transition;
    }
    {
      result = root;
    }
    setCurrentRenderingInstance(prev);
    return result;
  }
  const getFunctionalFallthrough = (attrs) => {
    let res;
    for (const key in attrs) {
      if (key === "class" || key === "style" || isOn$1(key)) {
        (res || (res = {}))[key] = attrs[key];
      }
    }
    return res;
  };
  const filterModelListeners = (attrs, props) => {
    const res = {};
    for (const key in attrs) {
      if (!isModelListener$1(key) || !(key.slice(9) in props)) {
        res[key] = attrs[key];
      }
    }
    return res;
  };
  function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
    const { props: prevProps, children: prevChildren, component } = prevVNode;
    const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
    const emits = component.emitsOptions;
    if (nextVNode.dirs || nextVNode.transition) {
      return true;
    }
    if (optimized && patchFlag >= 0) {
      if (patchFlag & 1024) {
        return true;
      }
      if (patchFlag & 16) {
        if (!prevProps) {
          return !!nextProps;
        }
        return hasPropsChanged(prevProps, nextProps, emits);
      } else if (patchFlag & 8) {
        const dynamicProps = nextVNode.dynamicProps;
        for (let i = 0; i < dynamicProps.length; i++) {
          const key = dynamicProps[i];
          if (nextProps[key] !== prevProps[key] && !isEmitListener(emits, key)) {
            return true;
          }
        }
      }
    } else {
      if (prevChildren || nextChildren) {
        if (!nextChildren || !nextChildren.$stable) {
          return true;
        }
      }
      if (prevProps === nextProps) {
        return false;
      }
      if (!prevProps) {
        return !!nextProps;
      }
      if (!nextProps) {
        return true;
      }
      return hasPropsChanged(prevProps, nextProps, emits);
    }
    return false;
  }
  function hasPropsChanged(prevProps, nextProps, emitsOptions) {
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i];
      if (nextProps[key] !== prevProps[key] && !isEmitListener(emitsOptions, key)) {
        return true;
      }
    }
    return false;
  }
  function updateHOCHostEl({ vnode, parent }, el) {
    while (parent) {
      const root = parent.subTree;
      if (root.suspense && root.suspense.activeBranch === vnode) {
        root.el = vnode.el;
      }
      if (root === vnode) {
        (vnode = parent.vnode).el = el;
        parent = parent.parent;
      } else {
        break;
      }
    }
  }
  const isSuspense = (type2) => type2.__isSuspense;
  function queueEffectWithSuspense(fn, suspense) {
    if (suspense && suspense.pendingBranch) {
      if (isArray$1(fn)) {
        suspense.effects.push(...fn);
      } else {
        suspense.effects.push(fn);
      }
    } else {
      queuePostFlushCb(fn);
    }
  }
  const Fragment = Symbol.for("v-fgt");
  const Text = Symbol.for("v-txt");
  const Comment = Symbol.for("v-cmt");
  const Static = Symbol.for("v-stc");
  const blockStack = [];
  let currentBlock = null;
  function openBlock(disableTracking = false) {
    blockStack.push(currentBlock = disableTracking ? null : []);
  }
  function closeBlock() {
    blockStack.pop();
    currentBlock = blockStack[blockStack.length - 1] || null;
  }
  let isBlockTreeEnabled = 1;
  function setBlockTracking(value) {
    isBlockTreeEnabled += value;
    if (value < 0 && currentBlock) {
      currentBlock.hasOnce = true;
    }
  }
  function setupBlock(vnode) {
    vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
    closeBlock();
    if (isBlockTreeEnabled > 0 && currentBlock) {
      currentBlock.push(vnode);
    }
    return vnode;
  }
  function createElementBlock(type2, props, children, patchFlag, dynamicProps, shapeFlag) {
    return setupBlock(
      createBaseVNode(
        type2,
        props,
        children,
        patchFlag,
        dynamicProps,
        shapeFlag,
        true
      )
    );
  }
  function createBlock(type2, props, children, patchFlag, dynamicProps) {
    return setupBlock(
      createVNode(
        type2,
        props,
        children,
        patchFlag,
        dynamicProps,
        true
      )
    );
  }
  function isVNode(value) {
    return value ? value.__v_isVNode === true : false;
  }
  function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  const normalizeKey = ({ key }) => key != null ? key : null;
  const normalizeRef = ({
    ref: ref3,
    ref_key,
    ref_for
  }) => {
    if (typeof ref3 === "number") {
      ref3 = "" + ref3;
    }
    return ref3 != null ? isString$1(ref3) || isRef$1(ref3) || isFunction$1(ref3) ? { i: currentRenderingInstance, r: ref3, k: ref_key, f: !!ref_for } : ref3 : null;
  };
  function createBaseVNode(type2, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type2 === Fragment ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
    const vnode = {
      __v_isVNode: true,
      __v_skip: true,
      type: type2,
      props,
      key: props && normalizeKey(props),
      ref: props && normalizeRef(props),
      scopeId: currentScopeId,
      slotScopeIds: null,
      children,
      component: null,
      suspense: null,
      ssContent: null,
      ssFallback: null,
      dirs: null,
      transition: null,
      el: null,
      anchor: null,
      target: null,
      targetStart: null,
      targetAnchor: null,
      staticCount: 0,
      shapeFlag,
      patchFlag,
      dynamicProps,
      dynamicChildren: null,
      appContext: null,
      ctx: currentRenderingInstance
    };
    if (needFullChildrenNormalization) {
      normalizeChildren(vnode, children);
      if (shapeFlag & 128) {
        type2.normalize(vnode);
      }
    } else if (children) {
      vnode.shapeFlag |= isString$1(children) ? 8 : 16;
    }
    if (isBlockTreeEnabled > 0 && // avoid a block node from tracking itself
    !isBlockNode && // has current parent block
    currentBlock && // presence of a patch flag indicates this node needs patching on updates.
    // component nodes also should always be patched, because even if the
    // component doesn't need to update, it needs to persist the instance on to
    // the next vnode so that it can be properly unmounted later.
    (vnode.patchFlag > 0 || shapeFlag & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
    // vnode should not be considered dynamic due to handler caching.
    vnode.patchFlag !== 32) {
      currentBlock.push(vnode);
    }
    return vnode;
  }
  const createVNode = _createVNode;
  function _createVNode(type2, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
    if (!type2 || type2 === NULL_DYNAMIC_COMPONENT) {
      type2 = Comment;
    }
    if (isVNode(type2)) {
      const cloned = cloneVNode(
        type2,
        props,
        true
        /* mergeRef: true */
      );
      if (children) {
        normalizeChildren(cloned, children);
      }
      if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
        if (cloned.shapeFlag & 6) {
          currentBlock[currentBlock.indexOf(type2)] = cloned;
        } else {
          currentBlock.push(cloned);
        }
      }
      cloned.patchFlag = -2;
      return cloned;
    }
    if (isClassComponent(type2)) {
      type2 = type2.__vccOpts;
    }
    if (props) {
      props = guardReactiveProps(props);
      let { class: klass, style } = props;
      if (klass && !isString$1(klass)) {
        props.class = normalizeClass(klass);
      }
      if (isObject$1(style)) {
        if (isProxy(style) && !isArray$1(style)) {
          style = extend$1({}, style);
        }
        props.style = normalizeStyle(style);
      }
    }
    const shapeFlag = isString$1(type2) ? 1 : isSuspense(type2) ? 128 : isTeleport(type2) ? 64 : isObject$1(type2) ? 4 : isFunction$1(type2) ? 2 : 0;
    return createBaseVNode(
      type2,
      props,
      children,
      patchFlag,
      dynamicProps,
      shapeFlag,
      isBlockNode,
      true
    );
  }
  function guardReactiveProps(props) {
    if (!props) return null;
    return isProxy(props) || isInternalObject(props) ? extend$1({}, props) : props;
  }
  function cloneVNode(vnode, extraProps, mergeRef = false, cloneTransition = false) {
    const { props, ref: ref3, patchFlag, children, transition } = vnode;
    const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
    const cloned = {
      __v_isVNode: true,
      __v_skip: true,
      type: vnode.type,
      props: mergedProps,
      key: mergedProps && normalizeKey(mergedProps),
      ref: extraProps && extraProps.ref ? (
        // #2078 in the case of <component :is="vnode" ref="extra"/>
        // if the vnode itself already has a ref, cloneVNode will need to merge
        // the refs so the single vnode can be set on multiple refs
        mergeRef && ref3 ? isArray$1(ref3) ? ref3.concat(normalizeRef(extraProps)) : [ref3, normalizeRef(extraProps)] : normalizeRef(extraProps)
      ) : ref3,
      scopeId: vnode.scopeId,
      slotScopeIds: vnode.slotScopeIds,
      children,
      target: vnode.target,
      targetStart: vnode.targetStart,
      targetAnchor: vnode.targetAnchor,
      staticCount: vnode.staticCount,
      shapeFlag: vnode.shapeFlag,
      // if the vnode is cloned with extra props, we can no longer assume its
      // existing patch flag to be reliable and need to add the FULL_PROPS flag.
      // note: preserve flag for fragments since they use the flag for children
      // fast paths only.
      patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
      dynamicProps: vnode.dynamicProps,
      dynamicChildren: vnode.dynamicChildren,
      appContext: vnode.appContext,
      dirs: vnode.dirs,
      transition,
      // These should technically only be non-null on mounted VNodes. However,
      // they *should* be copied for kept-alive vnodes. So we just always copy
      // them since them being non-null during a mount doesn't affect the logic as
      // they will simply be overwritten.
      component: vnode.component,
      suspense: vnode.suspense,
      ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
      ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
      el: vnode.el,
      anchor: vnode.anchor,
      ctx: vnode.ctx,
      ce: vnode.ce
    };
    if (transition && cloneTransition) {
      setTransitionHooks(
        cloned,
        transition.clone(cloned)
      );
    }
    return cloned;
  }
  function createTextVNode(text = " ", flag = 0) {
    return createVNode(Text, null, text, flag);
  }
  function createCommentVNode(text = "", asBlock = false) {
    return asBlock ? (openBlock(), createBlock(Comment, null, text)) : createVNode(Comment, null, text);
  }
  function normalizeVNode(child) {
    if (child == null || typeof child === "boolean") {
      return createVNode(Comment);
    } else if (isArray$1(child)) {
      return createVNode(
        Fragment,
        null,
        // #3666, avoid reference pollution when reusing vnode
        child.slice()
      );
    } else if (typeof child === "object") {
      return cloneIfMounted(child);
    } else {
      return createVNode(Text, null, String(child));
    }
  }
  function cloneIfMounted(child) {
    return child.el === null && child.patchFlag !== -1 || child.memo ? child : cloneVNode(child);
  }
  function normalizeChildren(vnode, children) {
    let type2 = 0;
    const { shapeFlag } = vnode;
    if (children == null) {
      children = null;
    } else if (isArray$1(children)) {
      type2 = 16;
    } else if (typeof children === "object") {
      if (shapeFlag & (1 | 64)) {
        const slot = children.default;
        if (slot) {
          slot._c && (slot._d = false);
          normalizeChildren(vnode, slot());
          slot._c && (slot._d = true);
        }
        return;
      } else {
        type2 = 32;
        const slotFlag = children._;
        if (!slotFlag && !isInternalObject(children)) {
          children._ctx = currentRenderingInstance;
        } else if (slotFlag === 3 && currentRenderingInstance) {
          if (currentRenderingInstance.slots._ === 1) {
            children._ = 1;
          } else {
            children._ = 2;
            vnode.patchFlag |= 1024;
          }
        }
      }
    } else if (isFunction$1(children)) {
      children = { default: children, _ctx: currentRenderingInstance };
      type2 = 32;
    } else {
      children = String(children);
      if (shapeFlag & 64) {
        type2 = 16;
        children = [createTextVNode(children)];
      } else {
        type2 = 8;
      }
    }
    vnode.children = children;
    vnode.shapeFlag |= type2;
  }
  function mergeProps(...args) {
    const ret = {};
    for (let i = 0; i < args.length; i++) {
      const toMerge = args[i];
      for (const key in toMerge) {
        if (key === "class") {
          if (ret.class !== toMerge.class) {
            ret.class = normalizeClass([ret.class, toMerge.class]);
          }
        } else if (key === "style") {
          ret.style = normalizeStyle([ret.style, toMerge.style]);
        } else if (isOn$1(key)) {
          const existing = ret[key];
          const incoming = toMerge[key];
          if (incoming && existing !== incoming && !(isArray$1(existing) && existing.includes(incoming))) {
            ret[key] = existing ? [].concat(existing, incoming) : incoming;
          }
        } else if (key !== "") {
          ret[key] = toMerge[key];
        }
      }
    }
    return ret;
  }
  function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
    callWithAsyncErrorHandling(hook, instance, 7, [
      vnode,
      prevVNode
    ]);
  }
  const emptyAppContext = createAppContext();
  let uid = 0;
  function createComponentInstance(vnode, parent, suspense) {
    const type2 = vnode.type;
    const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
    const instance = {
      uid: uid++,
      vnode,
      type: type2,
      parent,
      appContext,
      root: null,
      // to be immediately set
      next: null,
      subTree: null,
      // will be set synchronously right after creation
      effect: null,
      update: null,
      // will be set synchronously right after creation
      job: null,
      scope: new EffectScope(
        true
        /* detached */
      ),
      render: null,
      proxy: null,
      exposed: null,
      exposeProxy: null,
      withProxy: null,
      provides: parent ? parent.provides : Object.create(appContext.provides),
      ids: parent ? parent.ids : ["", 0, 0],
      accessCache: null,
      renderCache: [],
      // local resolved assets
      components: null,
      directives: null,
      // resolved props and emits options
      propsOptions: normalizePropsOptions(type2, appContext),
      emitsOptions: normalizeEmitsOptions(type2, appContext),
      // emit
      emit: null,
      // to be set immediately
      emitted: null,
      // props default value
      propsDefaults: EMPTY_OBJ,
      // inheritAttrs
      inheritAttrs: type2.inheritAttrs,
      // state
      ctx: EMPTY_OBJ,
      data: EMPTY_OBJ,
      props: EMPTY_OBJ,
      attrs: EMPTY_OBJ,
      slots: EMPTY_OBJ,
      refs: EMPTY_OBJ,
      setupState: EMPTY_OBJ,
      setupContext: null,
      // suspense related
      suspense,
      suspenseId: suspense ? suspense.pendingId : 0,
      asyncDep: null,
      asyncResolved: false,
      // lifecycle hooks
      // not using enums here because it results in computed properties
      isMounted: false,
      isUnmounted: false,
      isDeactivated: false,
      bc: null,
      c: null,
      bm: null,
      m: null,
      bu: null,
      u: null,
      um: null,
      bum: null,
      da: null,
      a: null,
      rtg: null,
      rtc: null,
      ec: null,
      sp: null
    };
    {
      instance.ctx = { _: instance };
    }
    instance.root = parent ? parent.root : instance;
    instance.emit = emit.bind(null, instance);
    if (vnode.ce) {
      vnode.ce(instance);
    }
    return instance;
  }
  let currentInstance = null;
  let internalSetCurrentInstance;
  let setInSSRSetupState;
  {
    const g = getGlobalThis();
    const registerGlobalSetter = (key, setter) => {
      let setters;
      if (!(setters = g[key])) setters = g[key] = [];
      setters.push(setter);
      return (v) => {
        if (setters.length > 1) setters.forEach((set2) => set2(v));
        else setters[0](v);
      };
    };
    internalSetCurrentInstance = registerGlobalSetter(
      `__VUE_INSTANCE_SETTERS__`,
      (v) => currentInstance = v
    );
    setInSSRSetupState = registerGlobalSetter(
      `__VUE_SSR_SETTERS__`,
      (v) => isInSSRComponentSetup = v
    );
  }
  const setCurrentInstance = (instance) => {
    const prev = currentInstance;
    internalSetCurrentInstance(instance);
    instance.scope.on();
    return () => {
      instance.scope.off();
      internalSetCurrentInstance(prev);
    };
  };
  const unsetCurrentInstance = () => {
    currentInstance && currentInstance.scope.off();
    internalSetCurrentInstance(null);
  };
  function isStatefulComponent(instance) {
    return instance.vnode.shapeFlag & 4;
  }
  let isInSSRComponentSetup = false;
  function setupComponent(instance, isSSR = false, optimized = false) {
    isSSR && setInSSRSetupState(isSSR);
    const { props, children } = instance.vnode;
    const isStateful = isStatefulComponent(instance);
    initProps(instance, props, isStateful, isSSR);
    initSlots(instance, children, optimized);
    const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : void 0;
    isSSR && setInSSRSetupState(false);
    return setupResult;
  }
  function setupStatefulComponent(instance, isSSR) {
    const Component = instance.type;
    instance.accessCache = /* @__PURE__ */ Object.create(null);
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
      const setupContext = instance.setupContext = setup.length > 1 ? createSetupContext(instance) : null;
      const reset = setCurrentInstance(instance);
      pauseTracking();
      const setupResult = callWithErrorHandling(
        setup,
        instance,
        0,
        [
          instance.props,
          setupContext
        ]
      );
      resetTracking();
      reset();
      if (isPromise$1(setupResult)) {
        if (!isAsyncWrapper(instance)) markAsyncBoundary(instance);
        setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
        if (isSSR) {
          return setupResult.then((resolvedResult) => {
            handleSetupResult(instance, resolvedResult, isSSR);
          }).catch((e) => {
            handleError(e, instance, 0);
          });
        } else {
          instance.asyncDep = setupResult;
        }
      } else {
        handleSetupResult(instance, setupResult, isSSR);
      }
    } else {
      finishComponentSetup(instance, isSSR);
    }
  }
  function handleSetupResult(instance, setupResult, isSSR) {
    if (isFunction$1(setupResult)) {
      if (instance.type.__ssrInlineRender) {
        instance.ssrRender = setupResult;
      } else {
        instance.render = setupResult;
      }
    } else if (isObject$1(setupResult)) {
      instance.setupState = proxyRefs(setupResult);
    } else ;
    finishComponentSetup(instance, isSSR);
  }
  let compile;
  function finishComponentSetup(instance, isSSR, skipOptions) {
    const Component = instance.type;
    if (!instance.render) {
      if (!isSSR && compile && !Component.render) {
        const template = Component.template || resolveMergedOptions(instance).template;
        if (template) {
          const { isCustomElement, compilerOptions } = instance.appContext.config;
          const { delimiters, compilerOptions: componentCompilerOptions } = Component;
          const finalCompilerOptions = extend$1(
            extend$1(
              {
                isCustomElement,
                delimiters
              },
              compilerOptions
            ),
            componentCompilerOptions
          );
          Component.render = compile(template, finalCompilerOptions);
        }
      }
      instance.render = Component.render || NOOP;
    }
    {
      const reset = setCurrentInstance(instance);
      pauseTracking();
      try {
        applyOptions(instance);
      } finally {
        resetTracking();
        reset();
      }
    }
  }
  const attrsProxyHandlers = {
    get(target, key) {
      track(target, "get", "");
      return target[key];
    }
  };
  function createSetupContext(instance) {
    const expose = (exposed) => {
      instance.exposed = exposed || {};
    };
    {
      return {
        attrs: new Proxy(instance.attrs, attrsProxyHandlers),
        slots: instance.slots,
        emit: instance.emit,
        expose
      };
    }
  }
  function getComponentPublicInstance(instance) {
    if (instance.exposed) {
      return instance.exposeProxy || (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
        get(target, key) {
          if (key in target) {
            return target[key];
          } else if (key in publicPropertiesMap) {
            return publicPropertiesMap[key](instance);
          }
        },
        has(target, key) {
          return key in target || key in publicPropertiesMap;
        }
      }));
    } else {
      return instance.proxy;
    }
  }
  const classifyRE = /(?:^|[-_])(\w)/g;
  const classify = (str2) => str2.replace(classifyRE, (c) => c.toUpperCase()).replace(/[-_]/g, "");
  function getComponentName(Component, includeInferred = true) {
    return isFunction$1(Component) ? Component.displayName || Component.name : Component.name || includeInferred && Component.__name;
  }
  function formatComponentName(instance, Component, isRoot = false) {
    let name = getComponentName(Component);
    if (!name && Component.__file) {
      const match = Component.__file.match(/([^/\\]+)\.\w+$/);
      if (match) {
        name = match[1];
      }
    }
    if (!name && instance && instance.parent) {
      const inferFromRegistry = (registry) => {
        for (const key in registry) {
          if (registry[key] === Component) {
            return key;
          }
        }
      };
      name = inferFromRegistry(
        instance.components || instance.parent.type.components
      ) || inferFromRegistry(instance.appContext.components);
    }
    return name ? classify(name) : isRoot ? `App` : `Anonymous`;
  }
  function isClassComponent(value) {
    return isFunction$1(value) && "__vccOpts" in value;
  }
  const computed = (getterOrOptions, debugOptions) => {
    const c = computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
    return c;
  };
  const version = "3.5.0-beta.3";
  /**
  * @vue/shared v3.5.0-beta.3
  * (c) 2018-present Yuxi (Evan) You and Vue contributors
  * @license MIT
  **/
  /*! #__NO_SIDE_EFFECTS__ */
  // @__NO_SIDE_EFFECTS__
  function makeMap(str2, expectsLowerCase) {
    const set2 = new Set(str2.split(","));
    return (val) => set2.has(val);
  }
  const isOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // uppercase letter
  (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);
  const isModelListener = (key) => key.startsWith("onUpdate:");
  const extend = Object.assign;
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn$1 = (val, key) => hasOwnProperty.call(val, key);
  const isArray = Array.isArray;
  const isSet = (val) => toTypeString(val) === "[object Set]";
  const isDate = (val) => toTypeString(val) === "[object Date]";
  const isFunction = (val) => typeof val === "function";
  const isString = (val) => typeof val === "string";
  const isSymbol = (val) => typeof val === "symbol";
  const isObject = (val) => val !== null && typeof val === "object";
  const objectToString = Object.prototype.toString;
  const toTypeString = (value) => objectToString.call(value);
  const isPlainObject$1 = (val) => toTypeString(val) === "[object Object]";
  const cacheStringFunction = (fn) => {
    const cache = /* @__PURE__ */ Object.create(null);
    return (str2) => {
      const hit = cache[str2];
      return hit || (cache[str2] = fn(str2));
    };
  };
  const camelizeRE = /-(\w)/g;
  const camelize = cacheStringFunction(
    (str2) => {
      return str2.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
    }
  );
  const hyphenateRE = /\B([A-Z])/g;
  const hyphenate = cacheStringFunction(
    (str2) => str2.replace(hyphenateRE, "-$1").toLowerCase()
  );
  const capitalize = cacheStringFunction((str2) => {
    return str2.charAt(0).toUpperCase() + str2.slice(1);
  });
  const invokeArrayFns = (fns, ...arg) => {
    for (let i = 0; i < fns.length; i++) {
      fns[i](...arg);
    }
  };
  const looseToNumber = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? val : n;
  };
  const toNumber = (val) => {
    const n = isString(val) ? Number(val) : NaN;
    return isNaN(n) ? val : n;
  };
  const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
  const isSpecialBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs);
  function includeBooleanAttr(value) {
    return !!value || value === "";
  }
  function looseCompareArrays(a, b) {
    if (a.length !== b.length) return false;
    let equal = true;
    for (let i = 0; equal && i < a.length; i++) {
      equal = looseEqual(a[i], b[i]);
    }
    return equal;
  }
  function looseEqual(a, b) {
    if (a === b) return true;
    let aValidType = isDate(a);
    let bValidType = isDate(b);
    if (aValidType || bValidType) {
      return aValidType && bValidType ? a.getTime() === b.getTime() : false;
    }
    aValidType = isSymbol(a);
    bValidType = isSymbol(b);
    if (aValidType || bValidType) {
      return a === b;
    }
    aValidType = isArray(a);
    bValidType = isArray(b);
    if (aValidType || bValidType) {
      return aValidType && bValidType ? looseCompareArrays(a, b) : false;
    }
    aValidType = isObject(a);
    bValidType = isObject(b);
    if (aValidType || bValidType) {
      if (!aValidType || !bValidType) {
        return false;
      }
      const aKeysCount = Object.keys(a).length;
      const bKeysCount = Object.keys(b).length;
      if (aKeysCount !== bKeysCount) {
        return false;
      }
      for (const key in a) {
        const aHasKey = a.hasOwnProperty(key);
        const bHasKey = b.hasOwnProperty(key);
        if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key])) {
          return false;
        }
      }
    }
    return String(a) === String(b);
  }
  function looseIndexOf(arr, val) {
    return arr.findIndex((item) => looseEqual(item, val));
  }
  /**
  * @vue/runtime-dom v3.5.0-beta.3
  * (c) 2018-present Yuxi (Evan) You and Vue contributors
  * @license MIT
  **/
  let policy = void 0;
  const tt = typeof window !== "undefined" && window.trustedTypes;
  if (tt) {
    try {
      policy = /* @__PURE__ */ tt.createPolicy("vue", {
        createHTML: (val) => val
      });
    } catch (e) {
    }
  }
  const unsafeToTrustedHTML = policy ? (val) => policy.createHTML(val) : (val) => val;
  const svgNS = "http://www.w3.org/2000/svg";
  const mathmlNS = "http://www.w3.org/1998/Math/MathML";
  const doc = typeof document !== "undefined" ? document : null;
  const templateContainer = doc && /* @__PURE__ */ doc.createElement("template");
  const nodeOps = {
    insert: (child, parent, anchor) => {
      parent.insertBefore(child, anchor || null);
    },
    remove: (child) => {
      const parent = child.parentNode;
      if (parent) {
        parent.removeChild(child);
      }
    },
    createElement: (tag2, namespace, is, props) => {
      const el = namespace === "svg" ? doc.createElementNS(svgNS, tag2) : namespace === "mathml" ? doc.createElementNS(mathmlNS, tag2) : is ? doc.createElement(tag2, { is }) : doc.createElement(tag2);
      if (tag2 === "select" && props && props.multiple != null) {
        el.setAttribute("multiple", props.multiple);
      }
      return el;
    },
    createText: (text) => doc.createTextNode(text),
    createComment: (text) => doc.createComment(text),
    setText: (node, text) => {
      node.nodeValue = text;
    },
    setElementText: (el, text) => {
      el.textContent = text;
    },
    parentNode: (node) => node.parentNode,
    nextSibling: (node) => node.nextSibling,
    querySelector: (selector) => doc.querySelector(selector),
    setScopeId(el, id) {
      el.setAttribute(id, "");
    },
    // __UNSAFE__
    // Reason: innerHTML.
    // Static content here can only come from compiled templates.
    // As long as the user only uses trusted templates, this is safe.
    insertStaticContent(content, parent, anchor, namespace, start, end) {
      const before = anchor ? anchor.previousSibling : parent.lastChild;
      if (start && (start === end || start.nextSibling)) {
        while (true) {
          parent.insertBefore(start.cloneNode(true), anchor);
          if (start === end || !(start = start.nextSibling)) break;
        }
      } else {
        templateContainer.innerHTML = unsafeToTrustedHTML(
          namespace === "svg" ? `<svg>${content}</svg>` : namespace === "mathml" ? `<math>${content}</math>` : content
        );
        const template = templateContainer.content;
        if (namespace === "svg" || namespace === "mathml") {
          const wrapper = template.firstChild;
          while (wrapper.firstChild) {
            template.appendChild(wrapper.firstChild);
          }
          template.removeChild(wrapper);
        }
        parent.insertBefore(template, anchor);
      }
      return [
        // first
        before ? before.nextSibling : parent.firstChild,
        // last
        anchor ? anchor.previousSibling : parent.lastChild
      ];
    }
  };
  const vtcKey = Symbol("_vtc");
  function patchClass(el, value, isSVG) {
    const transitionClasses = el[vtcKey];
    if (transitionClasses) {
      value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(" ");
    }
    if (value == null) {
      el.removeAttribute("class");
    } else if (isSVG) {
      el.setAttribute("class", value);
    } else {
      el.className = value;
    }
  }
  const vShowOriginalDisplay = Symbol("_vod");
  const vShowHidden = Symbol("_vsh");
  const CSS_VAR_TEXT = Symbol("");
  const displayRE = /(^|;)\s*display\s*:/;
  function patchStyle(el, prev, next) {
    const style = el.style;
    const isCssString = isString(next);
    let hasControlledDisplay = false;
    if (next && !isCssString) {
      if (prev) {
        if (!isString(prev)) {
          for (const key in prev) {
            if (next[key] == null) {
              setStyle(style, key, "");
            }
          }
        } else {
          for (const prevStyle of prev.split(";")) {
            const key = prevStyle.slice(0, prevStyle.indexOf(":")).trim();
            if (next[key] == null) {
              setStyle(style, key, "");
            }
          }
        }
      }
      for (const key in next) {
        if (key === "display") {
          hasControlledDisplay = true;
        }
        setStyle(style, key, next[key]);
      }
    } else {
      if (isCssString) {
        if (prev !== next) {
          const cssVarText = style[CSS_VAR_TEXT];
          if (cssVarText) {
            next += ";" + cssVarText;
          }
          style.cssText = next;
          hasControlledDisplay = displayRE.test(next);
        }
      } else if (prev) {
        el.removeAttribute("style");
      }
    }
    if (vShowOriginalDisplay in el) {
      el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : "";
      if (el[vShowHidden]) {
        style.display = "none";
      }
    }
  }
  const importantRE = /\s*!important$/;
  function setStyle(style, name, val) {
    if (isArray(val)) {
      val.forEach((v) => setStyle(style, name, v));
    } else {
      if (val == null) val = "";
      if (name.startsWith("--")) {
        style.setProperty(name, val);
      } else {
        const prefixed = autoPrefix(style, name);
        if (importantRE.test(val)) {
          style.setProperty(
            hyphenate(prefixed),
            val.replace(importantRE, ""),
            "important"
          );
        } else {
          style[prefixed] = val;
        }
      }
    }
  }
  const prefixes = ["Webkit", "Moz", "ms"];
  const prefixCache = {};
  function autoPrefix(style, rawName) {
    const cached = prefixCache[rawName];
    if (cached) {
      return cached;
    }
    let name = camelize$1(rawName);
    if (name !== "filter" && name in style) {
      return prefixCache[rawName] = name;
    }
    name = capitalize(name);
    for (let i = 0; i < prefixes.length; i++) {
      const prefixed = prefixes[i] + name;
      if (prefixed in style) {
        return prefixCache[rawName] = prefixed;
      }
    }
    return rawName;
  }
  const xlinkNS = "http://www.w3.org/1999/xlink";
  function patchAttr(el, key, value, isSVG, instance, isBoolean = isSpecialBooleanAttr(key)) {
    if (isSVG && key.startsWith("xlink:")) {
      if (value == null) {
        el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
      } else {
        el.setAttributeNS(xlinkNS, key, value);
      }
    } else {
      if (value == null || isBoolean && !includeBooleanAttr(value)) {
        el.removeAttribute(key);
      } else {
        el.setAttribute(
          key,
          isBoolean ? "" : isSymbol(value) ? String(value) : value
        );
      }
    }
  }
  function patchDOMProp(el, key, value, parentComponent) {
    if (key === "innerHTML" || key === "textContent") {
      if (value == null) return;
      el[key] = value;
      return;
    }
    const tag2 = el.tagName;
    if (key === "value" && tag2 !== "PROGRESS" && // custom elements may use _value internally
    !tag2.includes("-")) {
      const oldValue = tag2 === "OPTION" ? el.getAttribute("value") || "" : el.value;
      const newValue = value == null ? "" : String(value);
      if (oldValue !== newValue || !("_value" in el)) {
        el.value = newValue;
      }
      if (value == null) {
        el.removeAttribute(key);
      }
      el._value = value;
      return;
    }
    let needRemove = false;
    if (value === "" || value == null) {
      const type2 = typeof el[key];
      if (type2 === "boolean") {
        value = includeBooleanAttr(value);
      } else if (value == null && type2 === "string") {
        value = "";
        needRemove = true;
      } else if (type2 === "number") {
        value = 0;
        needRemove = true;
      }
    }
    try {
      el[key] = value;
    } catch (e) {
    }
    needRemove && el.removeAttribute(key);
  }
  function addEventListener(el, event, handler, options) {
    el.addEventListener(event, handler, options);
  }
  function removeEventListener(el, event, handler, options) {
    el.removeEventListener(event, handler, options);
  }
  const veiKey = Symbol("_vei");
  function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
    const invokers = el[veiKey] || (el[veiKey] = {});
    const existingInvoker = invokers[rawName];
    if (nextValue && existingInvoker) {
      existingInvoker.value = nextValue;
    } else {
      const [name, options] = parseName(rawName);
      if (nextValue) {
        const invoker = invokers[rawName] = createInvoker(
          nextValue,
          instance
        );
        addEventListener(el, name, invoker, options);
      } else if (existingInvoker) {
        removeEventListener(el, name, existingInvoker, options);
        invokers[rawName] = void 0;
      }
    }
  }
  const optionsModifierRE = /(?:Once|Passive|Capture)$/;
  function parseName(name) {
    let options;
    if (optionsModifierRE.test(name)) {
      options = {};
      let m;
      while (m = name.match(optionsModifierRE)) {
        name = name.slice(0, name.length - m[0].length);
        options[m[0].toLowerCase()] = true;
      }
    }
    const event = name[2] === ":" ? name.slice(3) : hyphenate(name.slice(2));
    return [event, options];
  }
  let cachedNow = 0;
  const p = /* @__PURE__ */ Promise.resolve();
  const getNow = () => cachedNow || (p.then(() => cachedNow = 0), cachedNow = Date.now());
  function createInvoker(initialValue, instance) {
    const invoker = (e) => {
      if (!e._vts) {
        e._vts = Date.now();
      } else if (e._vts <= invoker.attached) {
        return;
      }
      callWithAsyncErrorHandling(
        patchStopImmediatePropagation(e, invoker.value),
        instance,
        5,
        [e]
      );
    };
    invoker.value = initialValue;
    invoker.attached = getNow();
    return invoker;
  }
  function patchStopImmediatePropagation(e, value) {
    if (isArray(value)) {
      const originalStop = e.stopImmediatePropagation;
      e.stopImmediatePropagation = () => {
        originalStop.call(e);
        e._stopped = true;
      };
      return value.map(
        (fn) => (e2) => !e2._stopped && fn && fn(e2)
      );
    } else {
      return value;
    }
  }
  const isNativeOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // lowercase letter
  key.charCodeAt(2) > 96 && key.charCodeAt(2) < 123;
  const patchProp = (el, key, prevValue, nextValue, namespace, parentComponent) => {
    const isSVG = namespace === "svg";
    if (key === "class") {
      patchClass(el, nextValue, isSVG);
    } else if (key === "style") {
      patchStyle(el, prevValue, nextValue);
    } else if (isOn(key)) {
      if (!isModelListener(key)) {
        patchEvent(el, key, prevValue, nextValue, parentComponent);
      }
    } else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), false) : shouldSetAsProp(el, key, nextValue, isSVG)) {
      patchDOMProp(el, key, nextValue);
      if (!el.tagName.includes("-") && (key === "value" || key === "checked" || key === "selected")) {
        patchAttr(el, key, nextValue, isSVG, parentComponent, key !== "value");
      }
    } else {
      if (key === "true-value") {
        el._trueValue = nextValue;
      } else if (key === "false-value") {
        el._falseValue = nextValue;
      }
      patchAttr(el, key, nextValue, isSVG);
    }
  };
  function shouldSetAsProp(el, key, value, isSVG) {
    if (isSVG) {
      if (key === "innerHTML" || key === "textContent") {
        return true;
      }
      if (key in el && isNativeOn(key) && isFunction(value)) {
        return true;
      }
      return false;
    }
    if (key === "spellcheck" || key === "draggable" || key === "translate") {
      return false;
    }
    if (key === "form") {
      return false;
    }
    if (key === "list" && el.tagName === "INPUT") {
      return false;
    }
    if (key === "type" && el.tagName === "TEXTAREA") {
      return false;
    }
    if (key === "width" || key === "height") {
      const tag2 = el.tagName;
      if (tag2 === "IMG" || tag2 === "VIDEO" || tag2 === "CANVAS" || tag2 === "SOURCE") {
        return false;
      }
    }
    if (isNativeOn(key) && isString(value)) {
      return false;
    }
    if (key in el) {
      return true;
    }
    if (el._isVueCE && (/[A-Z]/.test(key) || !isString(value))) {
      return true;
    }
    return false;
  }
  const REMOVAL = {};
  /*! #__NO_SIDE_EFFECTS__ */
  // @__NO_SIDE_EFFECTS__
  function defineCustomElement(options, extraOptions, _createApp) {
    const Comp = /* @__PURE__ */ defineComponent(options, extraOptions);
    if (isPlainObject$1(Comp)) extend(Comp, extraOptions);
    class VueCustomElement extends VueElement {
      constructor(initialProps) {
        super(Comp, initialProps, _createApp);
      }
    }
    VueCustomElement.def = Comp;
    return VueCustomElement;
  }
  const BaseClass = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  class VueElement extends BaseClass {
    constructor(_def, _props = {}, _createApp = createApp) {
      super();
      this._def = _def;
      this._props = _props;
      this._createApp = _createApp;
      this._isVueCE = true;
      this._instance = null;
      this._app = null;
      this._nonce = this._def.nonce;
      this._connected = false;
      this._resolved = false;
      this._numberProps = null;
      this._styleChildren = /* @__PURE__ */ new WeakSet();
      this._ob = null;
      if (this.shadowRoot && _createApp !== createApp) {
        this._root = this.shadowRoot;
      } else {
        if (_def.shadowRoot !== false) {
          this.attachShadow({ mode: "open" });
          this._root = this.shadowRoot;
        } else {
          this._root = this;
        }
      }
      if (!this._def.__asyncLoader) {
        this._resolveProps(this._def);
      }
    }
    connectedCallback() {
      if (!this.shadowRoot) {
        this._parseSlots();
      }
      this._connected = true;
      let parent = this;
      while (parent = parent && (parent.parentNode || parent.host)) {
        if (parent instanceof VueElement) {
          this._parent = parent;
          break;
        }
      }
      if (!this._instance) {
        if (this._resolved) {
          this._setParent();
          this._update();
        } else {
          if (parent && parent._pendingResolve) {
            this._pendingResolve = parent._pendingResolve.then(() => {
              this._pendingResolve = void 0;
              this._resolveDef();
            });
          } else {
            this._resolveDef();
          }
        }
      }
    }
    _setParent(parent = this._parent) {
      if (parent) {
        this._instance.parent = parent._instance;
        this._instance.provides = parent._instance.provides;
      }
    }
    disconnectedCallback() {
      this._connected = false;
      nextTick(() => {
        if (!this._connected) {
          if (this._ob) {
            this._ob.disconnect();
            this._ob = null;
          }
          this._app && this._app.unmount();
          this._instance.ce = void 0;
          this._app = this._instance = null;
        }
      });
    }
    /**
     * resolve inner component definition (handle possible async component)
     */
    _resolveDef() {
      if (this._pendingResolve) {
        return;
      }
      for (let i = 0; i < this.attributes.length; i++) {
        this._setAttr(this.attributes[i].name);
      }
      this._ob = new MutationObserver((mutations) => {
        for (const m of mutations) {
          this._setAttr(m.attributeName);
        }
      });
      this._ob.observe(this, { attributes: true });
      const resolve = (def2, isAsync = false) => {
        this._resolved = true;
        this._pendingResolve = void 0;
        const { props, styles } = def2;
        let numberProps;
        if (props && !isArray(props)) {
          for (const key in props) {
            const opt = props[key];
            if (opt === Number || opt && opt.type === Number) {
              if (key in this._props) {
                this._props[key] = toNumber(this._props[key]);
              }
              (numberProps || (numberProps = /* @__PURE__ */ Object.create(null)))[camelize(key)] = true;
            }
          }
        }
        this._numberProps = numberProps;
        if (isAsync) {
          this._resolveProps(def2);
        }
        if (this.shadowRoot) {
          this._applyStyles(styles);
        }
        this._mount(def2);
      };
      const asyncDef = this._def.__asyncLoader;
      if (asyncDef) {
        this._pendingResolve = asyncDef().then(
          (def2) => resolve(this._def = def2, true)
        );
      } else {
        resolve(this._def);
      }
    }
    _mount(def2) {
      this._app = this._createApp(def2);
      if (def2.configureApp) {
        def2.configureApp(this._app);
      }
      this._app._ceVNode = this._createVNode();
      this._app.mount(this._root);
      const exposed = this._instance && this._instance.exposed;
      if (!exposed) return;
      for (const key in exposed) {
        if (!hasOwn$1(this, key)) {
          Object.defineProperty(this, key, {
            // unwrap ref to be consistent with public instance behavior
            get: () => unref(exposed[key])
          });
        }
      }
    }
    _resolveProps(def2) {
      const { props } = def2;
      const declaredPropKeys = isArray(props) ? props : Object.keys(props || {});
      for (const key of Object.keys(this)) {
        if (key[0] !== "_" && declaredPropKeys.includes(key)) {
          this._setProp(key, this[key]);
        }
      }
      for (const key of declaredPropKeys.map(camelize)) {
        Object.defineProperty(this, key, {
          get() {
            return this._getProp(key);
          },
          set(val) {
            this._setProp(key, val, true, true);
          }
        });
      }
    }
    _setAttr(key) {
      if (key.startsWith("data-v-")) return;
      const has2 = this.hasAttribute(key);
      let value = has2 ? this.getAttribute(key) : REMOVAL;
      const camelKey = camelize(key);
      if (has2 && this._numberProps && this._numberProps[camelKey]) {
        value = toNumber(value);
      }
      this._setProp(camelKey, value, false, true);
    }
    /**
     * @internal
     */
    _getProp(key) {
      return this._props[key];
    }
    /**
     * @internal
     */
    _setProp(key, val, shouldReflect = true, shouldUpdate = false) {
      if (val !== this._props[key]) {
        if (val === REMOVAL) {
          delete this._props[key];
        } else {
          this._props[key] = val;
        }
        if (shouldUpdate && this._instance) {
          this._update();
        }
        if (shouldReflect) {
          if (val === true) {
            this.setAttribute(hyphenate(key), "");
          } else if (typeof val === "string" || typeof val === "number") {
            this.setAttribute(hyphenate(key), val + "");
          } else if (!val) {
            this.removeAttribute(hyphenate(key));
          }
        }
      }
    }
    _update() {
      render(this._createVNode(), this._root);
    }
    _createVNode() {
      const baseProps = {};
      if (!this.shadowRoot) {
        baseProps.onVnodeMounted = baseProps.onVnodeUpdated = this._renderSlots.bind(this);
      }
      const vnode = createVNode(this._def, extend(baseProps, this._props));
      if (!this._instance) {
        vnode.ce = (instance) => {
          this._instance = instance;
          instance.ce = this;
          instance.isCE = true;
          const dispatch = (event, args) => {
            this.dispatchEvent(
              new CustomEvent(
                event,
                isPlainObject$1(args[0]) ? extend({ detail: args }, args[0]) : { detail: args }
              )
            );
          };
          instance.emit = (event, ...args) => {
            dispatch(event, args);
            if (hyphenate(event) !== event) {
              dispatch(hyphenate(event), args);
            }
          };
          this._setParent();
        };
      }
      return vnode;
    }
    _applyStyles(styles, owner) {
      if (!styles) return;
      if (owner) {
        if (owner === this._def || this._styleChildren.has(owner)) {
          return;
        }
        this._styleChildren.add(owner);
      }
      const nonce = this._nonce;
      for (let i = styles.length - 1; i >= 0; i--) {
        const s = document.createElement("style");
        if (nonce) s.setAttribute("nonce", nonce);
        s.textContent = styles[i];
        this.shadowRoot.prepend(s);
      }
    }
    /**
     * Only called when shaddowRoot is false
     */
    _parseSlots() {
      const slots = this._slots = {};
      let n;
      while (n = this.firstChild) {
        const slotName = n.nodeType === 1 && n.getAttribute("slot") || "default";
        (slots[slotName] || (slots[slotName] = [])).push(n);
        this.removeChild(n);
      }
    }
    /**
     * Only called when shaddowRoot is false
     */
    _renderSlots() {
      const outlets = this.querySelectorAll("slot");
      const scopeId = this._instance.type.__scopeId;
      for (let i = 0; i < outlets.length; i++) {
        const o = outlets[i];
        const slotName = o.getAttribute("name") || "default";
        const content = this._slots[slotName];
        const parent = o.parentNode;
        if (content) {
          for (const n of content) {
            if (scopeId && n.nodeType === 1) {
              const id = scopeId + "-s";
              const walker = document.createTreeWalker(n, 1);
              n.setAttribute(id, "");
              let child;
              while (child = walker.nextNode()) {
                child.setAttribute(id, "");
              }
            }
            parent.insertBefore(n, o);
          }
        } else {
          while (o.firstChild) parent.insertBefore(o.firstChild, o);
        }
        parent.removeChild(o);
      }
    }
    /**
     * @internal
     */
    _injectChildStyle(comp) {
      this._applyStyles(comp.styles, comp);
    }
    /**
     * @internal
     */
    _removeChildStyle(comp) {
    }
  }
  const getModelAssigner = (vnode) => {
    const fn = vnode.props["onUpdate:modelValue"] || false;
    return isArray(fn) ? (value) => invokeArrayFns(fn, value) : fn;
  };
  function onCompositionStart(e) {
    e.target.composing = true;
  }
  function onCompositionEnd(e) {
    const target = e.target;
    if (target.composing) {
      target.composing = false;
      target.dispatchEvent(new Event("input"));
    }
  }
  const assignKey = Symbol("_assign");
  const vModelText = {
    created(el, { modifiers: { lazy, trim, number } }, vnode) {
      el[assignKey] = getModelAssigner(vnode);
      const castToNumber = number || vnode.props && vnode.props.type === "number";
      addEventListener(el, lazy ? "change" : "input", (e) => {
        if (e.target.composing) return;
        let domValue = el.value;
        if (trim) {
          domValue = domValue.trim();
        }
        if (castToNumber) {
          domValue = looseToNumber(domValue);
        }
        el[assignKey](domValue);
      });
      if (trim) {
        addEventListener(el, "change", () => {
          el.value = el.value.trim();
        });
      }
      if (!lazy) {
        addEventListener(el, "compositionstart", onCompositionStart);
        addEventListener(el, "compositionend", onCompositionEnd);
        addEventListener(el, "change", onCompositionEnd);
      }
    },
    // set value on mounted so it's after min/max for type="range"
    mounted(el, { value }) {
      el.value = value == null ? "" : value;
    },
    beforeUpdate(el, { value, oldValue, modifiers: { lazy, trim, number } }, vnode) {
      el[assignKey] = getModelAssigner(vnode);
      if (el.composing) return;
      const elValue = (number || el.type === "number") && !/^0\d/.test(el.value) ? looseToNumber(el.value) : el.value;
      const newValue = value == null ? "" : value;
      if (elValue === newValue) {
        return;
      }
      if (document.activeElement === el && el.type !== "range") {
        if (lazy && value === oldValue) {
          return;
        }
        if (trim && el.value.trim() === newValue) {
          return;
        }
      }
      el.value = newValue;
    }
  };
  const vModelSelect = {
    // <select multiple> value need to be deep traversed
    deep: true,
    created(el, { value, modifiers: { number } }, vnode) {
      const isSetModel = isSet(value);
      addEventListener(el, "change", () => {
        const selectedVal = Array.prototype.filter.call(el.options, (o) => o.selected).map(
          (o) => number ? looseToNumber(getValue(o)) : getValue(o)
        );
        el[assignKey](
          el.multiple ? isSetModel ? new Set(selectedVal) : selectedVal : selectedVal[0]
        );
        el._assigning = true;
        nextTick(() => {
          el._assigning = false;
        });
      });
      el[assignKey] = getModelAssigner(vnode);
    },
    // set value in mounted & updated because <select> relies on its children
    // <option>s.
    mounted(el, { value, modifiers: { number } }) {
      setSelected(el, value);
    },
    beforeUpdate(el, _binding, vnode) {
      el[assignKey] = getModelAssigner(vnode);
    },
    updated(el, { value, modifiers: { number } }) {
      if (!el._assigning) {
        setSelected(el, value);
      }
    }
  };
  function setSelected(el, value, number) {
    const isMultiple = el.multiple;
    const isArrayValue = isArray(value);
    if (isMultiple && !isArrayValue && !isSet(value)) {
      return;
    }
    for (let i = 0, l = el.options.length; i < l; i++) {
      const option = el.options[i];
      const optionValue = getValue(option);
      if (isMultiple) {
        if (isArrayValue) {
          const optionType = typeof optionValue;
          if (optionType === "string" || optionType === "number") {
            option.selected = value.some((v) => String(v) === String(optionValue));
          } else {
            option.selected = looseIndexOf(value, optionValue) > -1;
          }
        } else {
          option.selected = value.has(optionValue);
        }
      } else if (looseEqual(getValue(option), value)) {
        if (el.selectedIndex !== i) el.selectedIndex = i;
        return;
      }
    }
    if (!isMultiple && el.selectedIndex !== -1) {
      el.selectedIndex = -1;
    }
  }
  function getValue(el) {
    return "_value" in el ? el._value : el.value;
  }
  const keyNames = {
    esc: "escape",
    space: " ",
    up: "arrow-up",
    left: "arrow-left",
    right: "arrow-right",
    down: "arrow-down",
    delete: "backspace"
  };
  const withKeys = (fn, modifiers) => {
    const cache = fn._withKeys || (fn._withKeys = {});
    const cacheKey = modifiers.join(".");
    return cache[cacheKey] || (cache[cacheKey] = (event) => {
      if (!("key" in event)) {
        return;
      }
      const eventKey = hyphenate(event.key);
      if (modifiers.some(
        (k) => k === eventKey || keyNames[k] === eventKey
      )) {
        return fn(event);
      }
    });
  };
  const rendererOptions = /* @__PURE__ */ extend({ patchProp }, nodeOps);
  let renderer;
  function ensureRenderer() {
    return renderer || (renderer = createRenderer(rendererOptions));
  }
  const render = (...args) => {
    ensureRenderer().render(...args);
  };
  const createApp = (...args) => {
    const app = ensureRenderer().createApp(...args);
    const { mount } = app;
    app.mount = (containerOrSelector) => {
      const container = normalizeContainer(containerOrSelector);
      if (!container) return;
      const component = app._component;
      if (!isFunction(component) && !component.render && !component.template) {
        component.template = container.innerHTML;
      }
      if (container.nodeType === 1) {
        container.textContent = "";
      }
      const proxy = mount(container, false, resolveRootNamespace(container));
      if (container instanceof Element) {
        container.removeAttribute("v-cloak");
        container.setAttribute("data-v-app", "");
      }
      return proxy;
    };
    return app;
  };
  function resolveRootNamespace(container) {
    if (container instanceof SVGElement) {
      return "svg";
    }
    if (typeof MathMLElement === "function" && container instanceof MathMLElement) {
      return "mathml";
    }
  }
  function normalizeContainer(container) {
    if (isString(container)) {
      const res = document.querySelector(container);
      return res;
    }
    return container;
  }
  const VERSION = "4.56.0";
  let auto = false;
  let kind = void 0;
  let fetch$1 = void 0;
  let FormData$1 = void 0;
  let File$1 = void 0;
  let ReadableStream$1 = void 0;
  let getMultipartRequestOptions = void 0;
  let getDefaultAgent = void 0;
  let fileFromPath = void 0;
  let isFsReadStream = void 0;
  function setShims(shims, options = { auto: false }) {
    if (auto) {
      throw new Error(`you must \`import 'openai/shims/${shims.kind}'\` before importing anything else from openai`);
    }
    if (kind) {
      throw new Error(`can't \`import 'openai/shims/${shims.kind}'\` after \`import 'openai/shims/${kind}'\``);
    }
    auto = options.auto;
    kind = shims.kind;
    fetch$1 = shims.fetch;
    FormData$1 = shims.FormData;
    File$1 = shims.File;
    ReadableStream$1 = shims.ReadableStream;
    getMultipartRequestOptions = shims.getMultipartRequestOptions;
    getDefaultAgent = shims.getDefaultAgent;
    fileFromPath = shims.fileFromPath;
    isFsReadStream = shims.isFsReadStream;
  }
  class MultipartBody {
    constructor(body) {
      this.body = body;
    }
    get [Symbol.toStringTag]() {
      return "MultipartBody";
    }
  }
  function getRuntime({ manuallyImported } = {}) {
    const recommendation = manuallyImported ? `You may need to use polyfills` : `Add one of these imports before your first \`import … from 'openai'\`:
- \`import 'openai/shims/node'\` (if you're running on Node)
- \`import 'openai/shims/web'\` (otherwise)
`;
    let _fetch, _Request, _Response, _Headers;
    try {
      _fetch = fetch;
      _Request = Request;
      _Response = Response;
      _Headers = Headers;
    } catch (error) {
      throw new Error(`this environment is missing the following Web Fetch API type: ${error.message}. ${recommendation}`);
    }
    return {
      kind: "web",
      fetch: _fetch,
      Request: _Request,
      Response: _Response,
      Headers: _Headers,
      FormData: (
        // @ts-ignore
        typeof FormData !== "undefined" ? FormData : class FormData {
          // @ts-ignore
          constructor() {
            throw new Error(`file uploads aren't supported in this environment yet as 'FormData' is undefined. ${recommendation}`);
          }
        }
      ),
      Blob: typeof Blob !== "undefined" ? Blob : class Blob {
        constructor() {
          throw new Error(`file uploads aren't supported in this environment yet as 'Blob' is undefined. ${recommendation}`);
        }
      },
      File: (
        // @ts-ignore
        typeof File !== "undefined" ? File : class File {
          // @ts-ignore
          constructor() {
            throw new Error(`file uploads aren't supported in this environment yet as 'File' is undefined. ${recommendation}`);
          }
        }
      ),
      ReadableStream: (
        // @ts-ignore
        typeof ReadableStream !== "undefined" ? ReadableStream : class ReadableStream {
          // @ts-ignore
          constructor() {
            throw new Error(`streaming isn't supported in this environment yet as 'ReadableStream' is undefined. ${recommendation}`);
          }
        }
      ),
      getMultipartRequestOptions: async (form, opts) => ({
        ...opts,
        body: new MultipartBody(form)
      }),
      getDefaultAgent: (url) => void 0,
      fileFromPath: () => {
        throw new Error("The `fileFromPath` function is only supported in Node. See the README for more details: https://www.github.com/openai/openai-node#file-uploads");
      },
      isFsReadStream: (value) => false
    };
  }
  if (!kind) setShims(getRuntime(), { auto: true });
  class Stream {
    constructor(iterator2, controller) {
      this.iterator = iterator2;
      this.controller = controller;
    }
    static fromSSEResponse(response, controller) {
      let consumed = false;
      async function* iterator2() {
        if (consumed) {
          throw new Error("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
        }
        consumed = true;
        let done = false;
        try {
          for await (const sse of _iterSSEMessages(response, controller)) {
            if (done)
              continue;
            if (sse.data.startsWith("[DONE]")) {
              done = true;
              continue;
            }
            if (sse.event === null) {
              let data;
              try {
                data = JSON.parse(sse.data);
              } catch (e) {
                console.error(`Could not parse message into JSON:`, sse.data);
                console.error(`From chunk:`, sse.raw);
                throw e;
              }
              if (data && data.error) {
                throw new APIError(void 0, data.error, void 0, void 0);
              }
              yield data;
            } else {
              let data;
              try {
                data = JSON.parse(sse.data);
              } catch (e) {
                console.error(`Could not parse message into JSON:`, sse.data);
                console.error(`From chunk:`, sse.raw);
                throw e;
              }
              if (sse.event == "error") {
                throw new APIError(void 0, data.error, data.message, void 0);
              }
              yield { event: sse.event, data };
            }
          }
          done = true;
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError")
            return;
          throw e;
        } finally {
          if (!done)
            controller.abort();
        }
      }
      return new Stream(iterator2, controller);
    }
    /**
     * Generates a Stream from a newline-separated ReadableStream
     * where each item is a JSON value.
     */
    static fromReadableStream(readableStream, controller) {
      let consumed = false;
      async function* iterLines() {
        const lineDecoder = new LineDecoder();
        const iter = readableStreamAsyncIterable(readableStream);
        for await (const chunk of iter) {
          for (const line of lineDecoder.decode(chunk)) {
            yield line;
          }
        }
        for (const line of lineDecoder.flush()) {
          yield line;
        }
      }
      async function* iterator2() {
        if (consumed) {
          throw new Error("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
        }
        consumed = true;
        let done = false;
        try {
          for await (const line of iterLines()) {
            if (done)
              continue;
            if (line)
              yield JSON.parse(line);
          }
          done = true;
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError")
            return;
          throw e;
        } finally {
          if (!done)
            controller.abort();
        }
      }
      return new Stream(iterator2, controller);
    }
    [Symbol.asyncIterator]() {
      return this.iterator();
    }
    /**
     * Splits the stream into two streams which can be
     * independently read from at different speeds.
     */
    tee() {
      const left = [];
      const right = [];
      const iterator2 = this.iterator();
      const teeIterator = (queue2) => {
        return {
          next: () => {
            if (queue2.length === 0) {
              const result = iterator2.next();
              left.push(result);
              right.push(result);
            }
            return queue2.shift();
          }
        };
      };
      return [
        new Stream(() => teeIterator(left), this.controller),
        new Stream(() => teeIterator(right), this.controller)
      ];
    }
    /**
     * Converts this stream to a newline-separated ReadableStream of
     * JSON stringified values in the stream
     * which can be turned back into a Stream with `Stream.fromReadableStream()`.
     */
    toReadableStream() {
      const self2 = this;
      let iter;
      const encoder = new TextEncoder();
      return new ReadableStream$1({
        async start() {
          iter = self2[Symbol.asyncIterator]();
        },
        async pull(ctrl) {
          try {
            const { value, done } = await iter.next();
            if (done)
              return ctrl.close();
            const bytes = encoder.encode(JSON.stringify(value) + "\n");
            ctrl.enqueue(bytes);
          } catch (err) {
            ctrl.error(err);
          }
        },
        async cancel() {
          var _a2;
          await ((_a2 = iter.return) == null ? void 0 : _a2.call(iter));
        }
      });
    }
  }
  async function* _iterSSEMessages(response, controller) {
    if (!response.body) {
      controller.abort();
      throw new OpenAIError(`Attempted to iterate over a response with no body`);
    }
    const sseDecoder = new SSEDecoder();
    const lineDecoder = new LineDecoder();
    const iter = readableStreamAsyncIterable(response.body);
    for await (const sseChunk of iterSSEChunks(iter)) {
      for (const line of lineDecoder.decode(sseChunk)) {
        const sse = sseDecoder.decode(line);
        if (sse)
          yield sse;
      }
    }
    for (const line of lineDecoder.flush()) {
      const sse = sseDecoder.decode(line);
      if (sse)
        yield sse;
    }
  }
  async function* iterSSEChunks(iterator2) {
    let data = new Uint8Array();
    for await (const chunk of iterator2) {
      if (chunk == null) {
        continue;
      }
      const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk;
      let newData = new Uint8Array(data.length + binaryChunk.length);
      newData.set(data);
      newData.set(binaryChunk, data.length);
      data = newData;
      let patternIndex;
      while ((patternIndex = findDoubleNewlineIndex(data)) !== -1) {
        yield data.slice(0, patternIndex);
        data = data.slice(patternIndex);
      }
    }
    if (data.length > 0) {
      yield data;
    }
  }
  function findDoubleNewlineIndex(buffer) {
    const newline2 = 10;
    const carriage = 13;
    for (let i = 0; i < buffer.length - 2; i++) {
      if (buffer[i] === newline2 && buffer[i + 1] === newline2) {
        return i + 2;
      }
      if (buffer[i] === carriage && buffer[i + 1] === carriage) {
        return i + 2;
      }
      if (buffer[i] === carriage && buffer[i + 1] === newline2 && i + 3 < buffer.length && buffer[i + 2] === carriage && buffer[i + 3] === newline2) {
        return i + 4;
      }
    }
    return -1;
  }
  class SSEDecoder {
    constructor() {
      this.event = null;
      this.data = [];
      this.chunks = [];
    }
    decode(line) {
      if (line.endsWith("\r")) {
        line = line.substring(0, line.length - 1);
      }
      if (!line) {
        if (!this.event && !this.data.length)
          return null;
        const sse = {
          event: this.event,
          data: this.data.join("\n"),
          raw: this.chunks
        };
        this.event = null;
        this.data = [];
        this.chunks = [];
        return sse;
      }
      this.chunks.push(line);
      if (line.startsWith(":")) {
        return null;
      }
      let [fieldname, _, value] = partition(line, ":");
      if (value.startsWith(" ")) {
        value = value.substring(1);
      }
      if (fieldname === "event") {
        this.event = value;
      } else if (fieldname === "data") {
        this.data.push(value);
      }
      return null;
    }
  }
  class LineDecoder {
    constructor() {
      this.buffer = [];
      this.trailingCR = false;
    }
    decode(chunk) {
      let text = this.decodeText(chunk);
      if (this.trailingCR) {
        text = "\r" + text;
        this.trailingCR = false;
      }
      if (text.endsWith("\r")) {
        this.trailingCR = true;
        text = text.slice(0, -1);
      }
      if (!text) {
        return [];
      }
      const trailingNewline = LineDecoder.NEWLINE_CHARS.has(text[text.length - 1] || "");
      let lines = text.split(LineDecoder.NEWLINE_REGEXP);
      if (trailingNewline) {
        lines.pop();
      }
      if (lines.length === 1 && !trailingNewline) {
        this.buffer.push(lines[0]);
        return [];
      }
      if (this.buffer.length > 0) {
        lines = [this.buffer.join("") + lines[0], ...lines.slice(1)];
        this.buffer = [];
      }
      if (!trailingNewline) {
        this.buffer = [lines.pop() || ""];
      }
      return lines;
    }
    decodeText(bytes) {
      if (bytes == null)
        return "";
      if (typeof bytes === "string")
        return bytes;
      if (typeof Buffer !== "undefined") {
        if (bytes instanceof Buffer) {
          return bytes.toString();
        }
        if (bytes instanceof Uint8Array) {
          return Buffer.from(bytes).toString();
        }
        throw new OpenAIError(`Unexpected: received non-Uint8Array (${bytes.constructor.name}) stream chunk in an environment with a global "Buffer" defined, which this library assumes to be Node. Please report this error.`);
      }
      if (typeof TextDecoder !== "undefined") {
        if (bytes instanceof Uint8Array || bytes instanceof ArrayBuffer) {
          this.textDecoder ?? (this.textDecoder = new TextDecoder("utf8"));
          return this.textDecoder.decode(bytes);
        }
        throw new OpenAIError(`Unexpected: received non-Uint8Array/ArrayBuffer (${bytes.constructor.name}) in a web platform. Please report this error.`);
      }
      throw new OpenAIError(`Unexpected: neither Buffer nor TextDecoder are available as globals. Please report this error.`);
    }
    flush() {
      if (!this.buffer.length && !this.trailingCR) {
        return [];
      }
      const lines = [this.buffer.join("")];
      this.buffer = [];
      this.trailingCR = false;
      return lines;
    }
  }
  LineDecoder.NEWLINE_CHARS = /* @__PURE__ */ new Set(["\n", "\r"]);
  LineDecoder.NEWLINE_REGEXP = /\r\n|[\n\r]/g;
  function partition(str2, delimiter) {
    const index = str2.indexOf(delimiter);
    if (index !== -1) {
      return [str2.substring(0, index), delimiter, str2.substring(index + delimiter.length)];
    }
    return [str2, "", ""];
  }
  function readableStreamAsyncIterable(stream) {
    if (stream[Symbol.asyncIterator])
      return stream;
    const reader = stream.getReader();
    return {
      async next() {
        try {
          const result = await reader.read();
          if (result == null ? void 0 : result.done)
            reader.releaseLock();
          return result;
        } catch (e) {
          reader.releaseLock();
          throw e;
        }
      },
      async return() {
        const cancelPromise = reader.cancel();
        reader.releaseLock();
        await cancelPromise;
        return { done: true, value: void 0 };
      },
      [Symbol.asyncIterator]() {
        return this;
      }
    };
  }
  const isResponseLike = (value) => value != null && typeof value === "object" && typeof value.url === "string" && typeof value.blob === "function";
  const isFileLike = (value) => value != null && typeof value === "object" && typeof value.name === "string" && typeof value.lastModified === "number" && isBlobLike(value);
  const isBlobLike = (value) => value != null && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && typeof value.text === "function" && typeof value.slice === "function" && typeof value.arrayBuffer === "function";
  const isUploadable = (value) => {
    return isFileLike(value) || isResponseLike(value) || isFsReadStream(value);
  };
  async function toFile(value, name, options) {
    var _a2;
    value = await value;
    options ?? (options = isFileLike(value) ? { lastModified: value.lastModified, type: value.type } : {});
    if (isResponseLike(value)) {
      const blob = await value.blob();
      name || (name = new URL(value.url).pathname.split(/[\\/]/).pop() ?? "unknown_file");
      return new File$1([blob], name, options);
    }
    const bits = await getBytes(value);
    name || (name = getName(value) ?? "unknown_file");
    if (!options.type) {
      const type2 = (_a2 = bits[0]) == null ? void 0 : _a2.type;
      if (typeof type2 === "string") {
        options = { ...options, type: type2 };
      }
    }
    return new File$1(bits, name, options);
  }
  async function getBytes(value) {
    var _a2;
    let parts = [];
    if (typeof value === "string" || ArrayBuffer.isView(value) || // includes Uint8Array, Buffer, etc.
    value instanceof ArrayBuffer) {
      parts.push(value);
    } else if (isBlobLike(value)) {
      parts.push(await value.arrayBuffer());
    } else if (isAsyncIterableIterator(value)) {
      for await (const chunk of value) {
        parts.push(chunk);
      }
    } else {
      throw new Error(`Unexpected data type: ${typeof value}; constructor: ${(_a2 = value == null ? void 0 : value.constructor) == null ? void 0 : _a2.name}; props: ${propsForError(value)}`);
    }
    return parts;
  }
  function propsForError(value) {
    const props = Object.getOwnPropertyNames(value);
    return `[${props.map((p2) => `"${p2}"`).join(", ")}]`;
  }
  function getName(value) {
    var _a2;
    return getStringFromMaybeBuffer(value.name) || getStringFromMaybeBuffer(value.filename) || // For fs.ReadStream
    ((_a2 = getStringFromMaybeBuffer(value.path)) == null ? void 0 : _a2.split(/[\\/]/).pop());
  }
  const getStringFromMaybeBuffer = (x) => {
    if (typeof x === "string")
      return x;
    if (typeof Buffer !== "undefined" && x instanceof Buffer)
      return String(x);
    return void 0;
  };
  const isAsyncIterableIterator = (value) => value != null && typeof value === "object" && typeof value[Symbol.asyncIterator] === "function";
  const isMultipartBody = (body) => body && typeof body === "object" && body.body && body[Symbol.toStringTag] === "MultipartBody";
  const multipartFormRequestOptions = async (opts) => {
    const form = await createForm(opts.body);
    return getMultipartRequestOptions(form, opts);
  };
  const createForm = async (body) => {
    const form = new FormData$1();
    await Promise.all(Object.entries(body || {}).map(([key, value]) => addFormValue(form, key, value)));
    return form;
  };
  const addFormValue = async (form, key, value) => {
    if (value === void 0)
      return;
    if (value == null) {
      throw new TypeError(`Received null for "${key}"; to pass null in FormData, you must use the string 'null'`);
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      form.append(key, String(value));
    } else if (isUploadable(value)) {
      const file = await toFile(value);
      form.append(key, file);
    } else if (Array.isArray(value)) {
      await Promise.all(value.map((entry) => addFormValue(form, key + "[]", entry)));
    } else if (typeof value === "object") {
      await Promise.all(Object.entries(value).map(([name, prop]) => addFormValue(form, `${key}[${name}]`, prop)));
    } else {
      throw new TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${value} instead`);
    }
  };
  var define_process_env_default = {};
  var __classPrivateFieldSet$3 = function(receiver, state, value, kind2, f) {
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return state.set(receiver, value), value;
  };
  var __classPrivateFieldGet$4 = function(receiver, state, kind2, f) {
    if (kind2 === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind2 === "m" ? f : kind2 === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
  };
  var _AbstractPage_client;
  async function defaultParseResponse(props) {
    const { response } = props;
    if (props.options.stream) {
      debug("response", response.status, response.url, response.headers, response.body);
      if (props.options.__streamClass) {
        return props.options.__streamClass.fromSSEResponse(response, props.controller);
      }
      return Stream.fromSSEResponse(response, props.controller);
    }
    if (response.status === 204) {
      return null;
    }
    if (props.options.__binaryResponse) {
      return response;
    }
    const contentType = response.headers.get("content-type");
    const isJSON = (contentType == null ? void 0 : contentType.includes("application/json")) || (contentType == null ? void 0 : contentType.includes("application/vnd.api+json"));
    if (isJSON) {
      const json = await response.json();
      debug("response", response.status, response.url, response.headers, json);
      return json;
    }
    const text = await response.text();
    debug("response", response.status, response.url, response.headers, text);
    return text;
  }
  class APIPromise extends Promise {
    constructor(responsePromise, parseResponse = defaultParseResponse) {
      super((resolve) => {
        resolve(null);
      });
      this.responsePromise = responsePromise;
      this.parseResponse = parseResponse;
    }
    _thenUnwrap(transform) {
      return new APIPromise(this.responsePromise, async (props) => transform(await this.parseResponse(props)));
    }
    /**
     * Gets the raw `Response` instance instead of parsing the response
     * data.
     *
     * If you want to parse the response body but still get the `Response`
     * instance, you can use {@link withResponse()}.
     *
     * 👋 Getting the wrong TypeScript type for `Response`?
     * Try setting `"moduleResolution": "NodeNext"` if you can,
     * or add one of these imports before your first `import … from 'openai'`:
     * - `import 'openai/shims/node'` (if you're running on Node)
     * - `import 'openai/shims/web'` (otherwise)
     */
    asResponse() {
      return this.responsePromise.then((p2) => p2.response);
    }
    /**
     * Gets the parsed response data and the raw `Response` instance.
     *
     * If you just want to get the raw `Response` instance without parsing it,
     * you can use {@link asResponse()}.
     *
     *
     * 👋 Getting the wrong TypeScript type for `Response`?
     * Try setting `"moduleResolution": "NodeNext"` if you can,
     * or add one of these imports before your first `import … from 'openai'`:
     * - `import 'openai/shims/node'` (if you're running on Node)
     * - `import 'openai/shims/web'` (otherwise)
     */
    async withResponse() {
      const [data, response] = await Promise.all([this.parse(), this.asResponse()]);
      return { data, response };
    }
    parse() {
      if (!this.parsedPromise) {
        this.parsedPromise = this.responsePromise.then(this.parseResponse);
      }
      return this.parsedPromise;
    }
    then(onfulfilled, onrejected) {
      return this.parse().then(onfulfilled, onrejected);
    }
    catch(onrejected) {
      return this.parse().catch(onrejected);
    }
    finally(onfinally) {
      return this.parse().finally(onfinally);
    }
  }
  class APIClient {
    constructor({
      baseURL,
      maxRetries = 2,
      timeout = 6e5,
      // 10 minutes
      httpAgent,
      fetch: overridenFetch
    }) {
      this.baseURL = baseURL;
      this.maxRetries = validatePositiveInteger("maxRetries", maxRetries);
      this.timeout = validatePositiveInteger("timeout", timeout);
      this.httpAgent = httpAgent;
      this.fetch = overridenFetch ?? fetch$1;
    }
    authHeaders(opts) {
      return {};
    }
    /**
     * Override this to add your own default headers, for example:
     *
     *  {
     *    ...super.defaultHeaders(),
     *    Authorization: 'Bearer 123',
     *  }
     */
    defaultHeaders(opts) {
      return {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": this.getUserAgent(),
        ...getPlatformHeaders(),
        ...this.authHeaders(opts)
      };
    }
    /**
     * Override this to add your own headers validation:
     */
    validateHeaders(headers, customHeaders) {
    }
    defaultIdempotencyKey() {
      return `stainless-node-retry-${uuid4()}`;
    }
    get(path, opts) {
      return this.methodRequest("get", path, opts);
    }
    post(path, opts) {
      return this.methodRequest("post", path, opts);
    }
    patch(path, opts) {
      return this.methodRequest("patch", path, opts);
    }
    put(path, opts) {
      return this.methodRequest("put", path, opts);
    }
    delete(path, opts) {
      return this.methodRequest("delete", path, opts);
    }
    methodRequest(method, path, opts) {
      return this.request(Promise.resolve(opts).then(async (opts2) => {
        const body = opts2 && isBlobLike(opts2 == null ? void 0 : opts2.body) ? new DataView(await opts2.body.arrayBuffer()) : (opts2 == null ? void 0 : opts2.body) instanceof DataView ? opts2.body : (opts2 == null ? void 0 : opts2.body) instanceof ArrayBuffer ? new DataView(opts2.body) : opts2 && ArrayBuffer.isView(opts2 == null ? void 0 : opts2.body) ? new DataView(opts2.body.buffer) : opts2 == null ? void 0 : opts2.body;
        return { method, path, ...opts2, body };
      }));
    }
    getAPIList(path, Page2, opts) {
      return this.requestAPIList(Page2, { method: "get", path, ...opts });
    }
    calculateContentLength(body) {
      if (typeof body === "string") {
        if (typeof Buffer !== "undefined") {
          return Buffer.byteLength(body, "utf8").toString();
        }
        if (typeof TextEncoder !== "undefined") {
          const encoder = new TextEncoder();
          const encoded = encoder.encode(body);
          return encoded.length.toString();
        }
      } else if (ArrayBuffer.isView(body)) {
        return body.byteLength.toString();
      }
      return null;
    }
    buildRequest(options) {
      var _a2;
      const { method, path, query, headers = {} } = options;
      const body = ArrayBuffer.isView(options.body) || options.__binaryRequest && typeof options.body === "string" ? options.body : isMultipartBody(options.body) ? options.body.body : options.body ? JSON.stringify(options.body, null, 2) : null;
      const contentLength = this.calculateContentLength(body);
      const url = this.buildURL(path, query);
      if ("timeout" in options)
        validatePositiveInteger("timeout", options.timeout);
      const timeout = options.timeout ?? this.timeout;
      const httpAgent = options.httpAgent ?? this.httpAgent ?? getDefaultAgent(url);
      const minAgentTimeout = timeout + 1e3;
      if (typeof ((_a2 = httpAgent == null ? void 0 : httpAgent.options) == null ? void 0 : _a2.timeout) === "number" && minAgentTimeout > (httpAgent.options.timeout ?? 0)) {
        httpAgent.options.timeout = minAgentTimeout;
      }
      if (this.idempotencyHeader && method !== "get") {
        if (!options.idempotencyKey)
          options.idempotencyKey = this.defaultIdempotencyKey();
        headers[this.idempotencyHeader] = options.idempotencyKey;
      }
      const reqHeaders = this.buildHeaders({ options, headers, contentLength });
      const req = {
        method,
        ...body && { body },
        headers: reqHeaders,
        ...httpAgent && { agent: httpAgent },
        // @ts-ignore node-fetch uses a custom AbortSignal type that is
        // not compatible with standard web types
        signal: options.signal ?? null
      };
      return { req, url, timeout };
    }
    buildHeaders({ options, headers, contentLength }) {
      const reqHeaders = {};
      if (contentLength) {
        reqHeaders["content-length"] = contentLength;
      }
      const defaultHeaders = this.defaultHeaders(options);
      applyHeadersMut(reqHeaders, defaultHeaders);
      applyHeadersMut(reqHeaders, headers);
      if (isMultipartBody(options.body) && kind !== "node") {
        delete reqHeaders["content-type"];
      }
      this.validateHeaders(reqHeaders, headers);
      return reqHeaders;
    }
    /**
     * Used as a callback for mutating the given `FinalRequestOptions` object.
     */
    async prepareOptions(options) {
    }
    /**
     * Used as a callback for mutating the given `RequestInit` object.
     *
     * This is useful for cases where you want to add certain headers based off of
     * the request properties, e.g. `method` or `url`.
     */
    async prepareRequest(request, { url, options }) {
    }
    parseHeaders(headers) {
      return !headers ? {} : Symbol.iterator in headers ? Object.fromEntries(Array.from(headers).map((header) => [...header])) : { ...headers };
    }
    makeStatusError(status, error, message, headers) {
      return APIError.generate(status, error, message, headers);
    }
    request(options, remainingRetries = null) {
      return new APIPromise(this.makeRequest(options, remainingRetries));
    }
    async makeRequest(optionsInput, retriesRemaining) {
      var _a2, _b;
      const options = await optionsInput;
      if (retriesRemaining == null) {
        retriesRemaining = options.maxRetries ?? this.maxRetries;
      }
      await this.prepareOptions(options);
      const { req, url, timeout } = this.buildRequest(options);
      await this.prepareRequest(req, { url, options });
      debug("request", url, options, req.headers);
      if ((_a2 = options.signal) == null ? void 0 : _a2.aborted) {
        throw new APIUserAbortError();
      }
      const controller = new AbortController();
      const response = await this.fetchWithTimeout(url, req, timeout, controller).catch(castToError);
      if (response instanceof Error) {
        if ((_b = options.signal) == null ? void 0 : _b.aborted) {
          throw new APIUserAbortError();
        }
        if (retriesRemaining) {
          return this.retryRequest(options, retriesRemaining);
        }
        if (response.name === "AbortError") {
          throw new APIConnectionTimeoutError();
        }
        throw new APIConnectionError({ cause: response });
      }
      const responseHeaders = createResponseHeaders(response.headers);
      if (!response.ok) {
        if (retriesRemaining && this.shouldRetry(response)) {
          const retryMessage2 = `retrying, ${retriesRemaining} attempts remaining`;
          debug(`response (error; ${retryMessage2})`, response.status, url, responseHeaders);
          return this.retryRequest(options, retriesRemaining, responseHeaders);
        }
        const errText = await response.text().catch((e) => castToError(e).message);
        const errJSON = safeJSON(errText);
        const errMessage = errJSON ? void 0 : errText;
        const retryMessage = retriesRemaining ? `(error; no more retries left)` : `(error; not retryable)`;
        debug(`response (error; ${retryMessage})`, response.status, url, responseHeaders, errMessage);
        const err = this.makeStatusError(response.status, errJSON, errMessage, responseHeaders);
        throw err;
      }
      return { response, options, controller };
    }
    requestAPIList(Page2, options) {
      const request = this.makeRequest(options, null);
      return new PagePromise(this, request, Page2);
    }
    buildURL(path, query) {
      const url = isAbsoluteURL(path) ? new URL(path) : new URL(this.baseURL + (this.baseURL.endsWith("/") && path.startsWith("/") ? path.slice(1) : path));
      const defaultQuery = this.defaultQuery();
      if (!isEmptyObj(defaultQuery)) {
        query = { ...defaultQuery, ...query };
      }
      if (typeof query === "object" && query && !Array.isArray(query)) {
        url.search = this.stringifyQuery(query);
      }
      return url.toString();
    }
    stringifyQuery(query) {
      return Object.entries(query).filter(([_, value]) => typeof value !== "undefined").map(([key, value]) => {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
        if (value === null) {
          return `${encodeURIComponent(key)}=`;
        }
        throw new OpenAIError(`Cannot stringify type ${typeof value}; Expected string, number, boolean, or null. If you need to pass nested query parameters, you can manually encode them, e.g. { query: { 'foo[key1]': value1, 'foo[key2]': value2 } }, and please open a GitHub issue requesting better support for your use case.`);
      }).join("&");
    }
    async fetchWithTimeout(url, init2, ms, controller) {
      const { signal, ...options } = init2 || {};
      if (signal)
        signal.addEventListener("abort", () => controller.abort());
      const timeout = setTimeout(() => controller.abort(), ms);
      return this.getRequestClient().fetch.call(void 0, url, { signal: controller.signal, ...options }).finally(() => {
        clearTimeout(timeout);
      });
    }
    getRequestClient() {
      return { fetch: this.fetch };
    }
    shouldRetry(response) {
      const shouldRetryHeader = response.headers.get("x-should-retry");
      if (shouldRetryHeader === "true")
        return true;
      if (shouldRetryHeader === "false")
        return false;
      if (response.status === 408)
        return true;
      if (response.status === 409)
        return true;
      if (response.status === 429)
        return true;
      if (response.status >= 500)
        return true;
      return false;
    }
    async retryRequest(options, retriesRemaining, responseHeaders) {
      let timeoutMillis;
      const retryAfterMillisHeader = responseHeaders == null ? void 0 : responseHeaders["retry-after-ms"];
      if (retryAfterMillisHeader) {
        const timeoutMs = parseFloat(retryAfterMillisHeader);
        if (!Number.isNaN(timeoutMs)) {
          timeoutMillis = timeoutMs;
        }
      }
      const retryAfterHeader = responseHeaders == null ? void 0 : responseHeaders["retry-after"];
      if (retryAfterHeader && !timeoutMillis) {
        const timeoutSeconds = parseFloat(retryAfterHeader);
        if (!Number.isNaN(timeoutSeconds)) {
          timeoutMillis = timeoutSeconds * 1e3;
        } else {
          timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
        }
      }
      if (!(timeoutMillis && 0 <= timeoutMillis && timeoutMillis < 60 * 1e3)) {
        const maxRetries = options.maxRetries ?? this.maxRetries;
        timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
      }
      await sleep$1(timeoutMillis);
      return this.makeRequest(options, retriesRemaining - 1);
    }
    calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries) {
      const initialRetryDelay = 0.5;
      const maxRetryDelay = 8;
      const numRetries = maxRetries - retriesRemaining;
      const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
      const jitter = 1 - Math.random() * 0.25;
      return sleepSeconds * jitter * 1e3;
    }
    getUserAgent() {
      return `${this.constructor.name}/JS ${VERSION}`;
    }
  }
  class AbstractPage {
    constructor(client, response, body, options) {
      _AbstractPage_client.set(this, void 0);
      __classPrivateFieldSet$3(this, _AbstractPage_client, client);
      this.options = options;
      this.response = response;
      this.body = body;
    }
    hasNextPage() {
      const items = this.getPaginatedItems();
      if (!items.length)
        return false;
      return this.nextPageInfo() != null;
    }
    async getNextPage() {
      const nextInfo = this.nextPageInfo();
      if (!nextInfo) {
        throw new OpenAIError("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
      }
      const nextOptions = { ...this.options };
      if ("params" in nextInfo && typeof nextOptions.query === "object") {
        nextOptions.query = { ...nextOptions.query, ...nextInfo.params };
      } else if ("url" in nextInfo) {
        const params = [...Object.entries(nextOptions.query || {}), ...nextInfo.url.searchParams.entries()];
        for (const [key, value] of params) {
          nextInfo.url.searchParams.set(key, value);
        }
        nextOptions.query = void 0;
        nextOptions.path = nextInfo.url.toString();
      }
      return await __classPrivateFieldGet$4(this, _AbstractPage_client, "f").requestAPIList(this.constructor, nextOptions);
    }
    async *iterPages() {
      let page = this;
      yield page;
      while (page.hasNextPage()) {
        page = await page.getNextPage();
        yield page;
      }
    }
    async *[(_AbstractPage_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
      for await (const page of this.iterPages()) {
        for (const item of page.getPaginatedItems()) {
          yield item;
        }
      }
    }
  }
  class PagePromise extends APIPromise {
    constructor(client, request, Page2) {
      super(request, async (props) => new Page2(client, props.response, await defaultParseResponse(props), props.options));
    }
    /**
     * Allow auto-paginating iteration on an unawaited list call, eg:
     *
     *    for await (const item of client.items.list()) {
     *      console.log(item)
     *    }
     */
    async *[Symbol.asyncIterator]() {
      const page = await this;
      for await (const item of page) {
        yield item;
      }
    }
  }
  const createResponseHeaders = (headers) => {
    return new Proxy(Object.fromEntries(
      // @ts-ignore
      headers.entries()
    ), {
      get(target, name) {
        const key = name.toString();
        return target[key.toLowerCase()] || target[key];
      }
    });
  };
  const requestOptionsKeys = {
    method: true,
    path: true,
    query: true,
    body: true,
    headers: true,
    maxRetries: true,
    stream: true,
    timeout: true,
    httpAgent: true,
    signal: true,
    idempotencyKey: true,
    __binaryRequest: true,
    __binaryResponse: true,
    __streamClass: true
  };
  const isRequestOptions = (obj) => {
    return typeof obj === "object" && obj !== null && !isEmptyObj(obj) && Object.keys(obj).every((k) => hasOwn(requestOptionsKeys, k));
  };
  const getPlatformProperties = () => {
    var _a2;
    if (typeof Deno !== "undefined" && Deno.build != null) {
      return {
        "X-Stainless-Lang": "js",
        "X-Stainless-Package-Version": VERSION,
        "X-Stainless-OS": normalizePlatform(Deno.build.os),
        "X-Stainless-Arch": normalizeArch(Deno.build.arch),
        "X-Stainless-Runtime": "deno",
        "X-Stainless-Runtime-Version": typeof Deno.version === "string" ? Deno.version : ((_a2 = Deno.version) == null ? void 0 : _a2.deno) ?? "unknown"
      };
    }
    if (typeof EdgeRuntime !== "undefined") {
      return {
        "X-Stainless-Lang": "js",
        "X-Stainless-Package-Version": VERSION,
        "X-Stainless-OS": "Unknown",
        "X-Stainless-Arch": `other:${EdgeRuntime}`,
        "X-Stainless-Runtime": "edge",
        "X-Stainless-Runtime-Version": process.version
      };
    }
    if (Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]") {
      return {
        "X-Stainless-Lang": "js",
        "X-Stainless-Package-Version": VERSION,
        "X-Stainless-OS": normalizePlatform(process.platform),
        "X-Stainless-Arch": normalizeArch(process.arch),
        "X-Stainless-Runtime": "node",
        "X-Stainless-Runtime-Version": process.version
      };
    }
    const browserInfo = getBrowserInfo();
    if (browserInfo) {
      return {
        "X-Stainless-Lang": "js",
        "X-Stainless-Package-Version": VERSION,
        "X-Stainless-OS": "Unknown",
        "X-Stainless-Arch": "unknown",
        "X-Stainless-Runtime": `browser:${browserInfo.browser}`,
        "X-Stainless-Runtime-Version": browserInfo.version
      };
    }
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": "unknown",
      "X-Stainless-Runtime": "unknown",
      "X-Stainless-Runtime-Version": "unknown"
    };
  };
  function getBrowserInfo() {
    if (typeof navigator === "undefined" || !navigator) {
      return null;
    }
    const browserPatterns = [
      { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
      { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
      { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
      { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
      { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
      { key: "safari", pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/ }
    ];
    for (const { key, pattern } of browserPatterns) {
      const match = pattern.exec(navigator.userAgent);
      if (match) {
        const major = match[1] || 0;
        const minor = match[2] || 0;
        const patch = match[3] || 0;
        return { browser: key, version: `${major}.${minor}.${patch}` };
      }
    }
    return null;
  }
  const normalizeArch = (arch) => {
    if (arch === "x32")
      return "x32";
    if (arch === "x86_64" || arch === "x64")
      return "x64";
    if (arch === "arm")
      return "arm";
    if (arch === "aarch64" || arch === "arm64")
      return "arm64";
    if (arch)
      return `other:${arch}`;
    return "unknown";
  };
  const normalizePlatform = (platform) => {
    platform = platform.toLowerCase();
    if (platform.includes("ios"))
      return "iOS";
    if (platform === "android")
      return "Android";
    if (platform === "darwin")
      return "MacOS";
    if (platform === "win32")
      return "Windows";
    if (platform === "freebsd")
      return "FreeBSD";
    if (platform === "openbsd")
      return "OpenBSD";
    if (platform === "linux")
      return "Linux";
    if (platform)
      return `Other:${platform}`;
    return "Unknown";
  };
  let _platformHeaders;
  const getPlatformHeaders = () => {
    return _platformHeaders ?? (_platformHeaders = getPlatformProperties());
  };
  const safeJSON = (text) => {
    try {
      return JSON.parse(text);
    } catch (err) {
      return void 0;
    }
  };
  const startsWithSchemeRegexp = new RegExp("^(?:[a-z]+:)?//", "i");
  const isAbsoluteURL = (url) => {
    return startsWithSchemeRegexp.test(url);
  };
  const sleep$1 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const validatePositiveInteger = (name, n) => {
    if (typeof n !== "number" || !Number.isInteger(n)) {
      throw new OpenAIError(`${name} must be an integer`);
    }
    if (n < 0) {
      throw new OpenAIError(`${name} must be a positive integer`);
    }
    return n;
  };
  const castToError = (err) => {
    if (err instanceof Error)
      return err;
    return new Error(err);
  };
  const readEnv = (env) => {
    var _a2, _b, _c, _d;
    if (typeof process !== "undefined") {
      return ((_a2 = define_process_env_default == null ? void 0 : define_process_env_default[env]) == null ? void 0 : _a2.trim()) ?? void 0;
    }
    if (typeof Deno !== "undefined") {
      return (_d = (_c = (_b = Deno.env) == null ? void 0 : _b.get) == null ? void 0 : _c.call(_b, env)) == null ? void 0 : _d.trim();
    }
    return void 0;
  };
  function isEmptyObj(obj) {
    if (!obj)
      return true;
    for (const _k in obj)
      return false;
    return true;
  }
  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }
  function applyHeadersMut(targetHeaders, newHeaders) {
    for (const k in newHeaders) {
      if (!hasOwn(newHeaders, k))
        continue;
      const lowerKey = k.toLowerCase();
      if (!lowerKey)
        continue;
      const val = newHeaders[k];
      if (val === null) {
        delete targetHeaders[lowerKey];
      } else if (val !== void 0) {
        targetHeaders[lowerKey] = val;
      }
    }
  }
  function debug(action, ...args) {
    if (typeof process !== "undefined" && (define_process_env_default == null ? void 0 : define_process_env_default["DEBUG"]) === "true") {
      console.log(`OpenAI:DEBUG:${action}`, ...args);
    }
  }
  const uuid4 = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  };
  const isRunningInBrowser = () => {
    return (
      // @ts-ignore
      typeof window !== "undefined" && // @ts-ignore
      typeof window.document !== "undefined" && // @ts-ignore
      typeof navigator !== "undefined"
    );
  };
  function isObj(obj) {
    return obj != null && typeof obj === "object" && !Array.isArray(obj);
  }
  class OpenAIError extends Error {
  }
  class APIError extends OpenAIError {
    constructor(status, error, message, headers) {
      super(`${APIError.makeMessage(status, error, message)}`);
      this.status = status;
      this.headers = headers;
      this.request_id = headers == null ? void 0 : headers["x-request-id"];
      const data = error;
      this.error = data;
      this.code = data == null ? void 0 : data["code"];
      this.param = data == null ? void 0 : data["param"];
      this.type = data == null ? void 0 : data["type"];
    }
    static makeMessage(status, error, message) {
      const msg = (error == null ? void 0 : error.message) ? typeof error.message === "string" ? error.message : JSON.stringify(error.message) : error ? JSON.stringify(error) : message;
      if (status && msg) {
        return `${status} ${msg}`;
      }
      if (status) {
        return `${status} status code (no body)`;
      }
      if (msg) {
        return msg;
      }
      return "(no status code or body)";
    }
    static generate(status, errorResponse, message, headers) {
      if (!status) {
        return new APIConnectionError({ cause: castToError(errorResponse) });
      }
      const error = errorResponse == null ? void 0 : errorResponse["error"];
      if (status === 400) {
        return new BadRequestError(status, error, message, headers);
      }
      if (status === 401) {
        return new AuthenticationError(status, error, message, headers);
      }
      if (status === 403) {
        return new PermissionDeniedError(status, error, message, headers);
      }
      if (status === 404) {
        return new NotFoundError(status, error, message, headers);
      }
      if (status === 409) {
        return new ConflictError(status, error, message, headers);
      }
      if (status === 422) {
        return new UnprocessableEntityError(status, error, message, headers);
      }
      if (status === 429) {
        return new RateLimitError(status, error, message, headers);
      }
      if (status >= 500) {
        return new InternalServerError(status, error, message, headers);
      }
      return new APIError(status, error, message, headers);
    }
  }
  class APIUserAbortError extends APIError {
    constructor({ message } = {}) {
      super(void 0, void 0, message || "Request was aborted.", void 0);
      this.status = void 0;
    }
  }
  class APIConnectionError extends APIError {
    constructor({ message, cause }) {
      super(void 0, void 0, message || "Connection error.", void 0);
      this.status = void 0;
      if (cause)
        this.cause = cause;
    }
  }
  class APIConnectionTimeoutError extends APIConnectionError {
    constructor({ message } = {}) {
      super({ message: message ?? "Request timed out." });
    }
  }
  class BadRequestError extends APIError {
    constructor() {
      super(...arguments);
      this.status = 400;
    }
  }
  class AuthenticationError extends APIError {
    constructor() {
      super(...arguments);
      this.status = 401;
    }
  }
  class PermissionDeniedError extends APIError {
    constructor() {
      super(...arguments);
      this.status = 403;
    }
  }
  class NotFoundError extends APIError {
    constructor() {
      super(...arguments);
      this.status = 404;
    }
  }
  class ConflictError extends APIError {
    constructor() {
      super(...arguments);
      this.status = 409;
    }
  }
  class UnprocessableEntityError extends APIError {
    constructor() {
      super(...arguments);
      this.status = 422;
    }
  }
  class RateLimitError extends APIError {
    constructor() {
      super(...arguments);
      this.status = 429;
    }
  }
  class InternalServerError extends APIError {
  }
  class LengthFinishReasonError extends OpenAIError {
    constructor() {
      super(`Could not parse response content as the length limit was reached`);
    }
  }
  class ContentFilterFinishReasonError extends OpenAIError {
    constructor() {
      super(`Could not parse response content as the request was rejected by the content filter`);
    }
  }
  class Page extends AbstractPage {
    constructor(client, response, body, options) {
      super(client, response, body, options);
      this.data = body.data || [];
      this.object = body.object;
    }
    getPaginatedItems() {
      return this.data ?? [];
    }
    // @deprecated Please use `nextPageInfo()` instead
    /**
     * This page represents a response that isn't actually paginated at the API level
     * so there will never be any next page params.
     */
    nextPageParams() {
      return null;
    }
    nextPageInfo() {
      return null;
    }
  }
  class CursorPage extends AbstractPage {
    constructor(client, response, body, options) {
      super(client, response, body, options);
      this.data = body.data || [];
    }
    getPaginatedItems() {
      return this.data ?? [];
    }
    // @deprecated Please use `nextPageInfo()` instead
    nextPageParams() {
      const info = this.nextPageInfo();
      if (!info)
        return null;
      if ("params" in info)
        return info.params;
      const params = Object.fromEntries(info.url.searchParams);
      if (!Object.keys(params).length)
        return null;
      return params;
    }
    nextPageInfo() {
      var _a2;
      const data = this.getPaginatedItems();
      if (!data.length) {
        return null;
      }
      const id = (_a2 = data[data.length - 1]) == null ? void 0 : _a2.id;
      if (!id) {
        return null;
      }
      return { params: { after: id } };
    }
  }
  class APIResource {
    constructor(client) {
      this._client = client;
    }
  }
  let Completions$2 = class Completions extends APIResource {
    create(body, options) {
      return this._client.post("/chat/completions", { body, ...options, stream: body.stream ?? false });
    }
  };
  /* @__PURE__ */ (function(Completions2) {
  })(Completions$2 || (Completions$2 = {}));
  let Chat$1 = class Chat extends APIResource {
    constructor() {
      super(...arguments);
      this.completions = new Completions$2(this._client);
    }
  };
  (function(Chat2) {
    Chat2.Completions = Completions$2;
  })(Chat$1 || (Chat$1 = {}));
  class Speech extends APIResource {
    /**
     * Generates audio from the input text.
     */
    create(body, options) {
      return this._client.post("/audio/speech", { body, ...options, __binaryResponse: true });
    }
  }
  /* @__PURE__ */ (function(Speech2) {
  })(Speech || (Speech = {}));
  class Transcriptions extends APIResource {
    /**
     * Transcribes audio into the input language.
     */
    create(body, options) {
      return this._client.post("/audio/transcriptions", multipartFormRequestOptions({ body, ...options }));
    }
  }
  /* @__PURE__ */ (function(Transcriptions2) {
  })(Transcriptions || (Transcriptions = {}));
  class Translations extends APIResource {
    /**
     * Translates audio into English.
     */
    create(body, options) {
      return this._client.post("/audio/translations", multipartFormRequestOptions({ body, ...options }));
    }
  }
  /* @__PURE__ */ (function(Translations2) {
  })(Translations || (Translations = {}));
  class Audio extends APIResource {
    constructor() {
      super(...arguments);
      this.transcriptions = new Transcriptions(this._client);
      this.translations = new Translations(this._client);
      this.speech = new Speech(this._client);
    }
  }
  (function(Audio2) {
    Audio2.Transcriptions = Transcriptions;
    Audio2.Translations = Translations;
    Audio2.Speech = Speech;
  })(Audio || (Audio = {}));
  class Batches extends APIResource {
    /**
     * Creates and executes a batch from an uploaded file of requests
     */
    create(body, options) {
      return this._client.post("/batches", { body, ...options });
    }
    /**
     * Retrieves a batch.
     */
    retrieve(batchId, options) {
      return this._client.get(`/batches/${batchId}`, options);
    }
    list(query = {}, options) {
      if (isRequestOptions(query)) {
        return this.list({}, query);
      }
      return this._client.getAPIList("/batches", BatchesPage, { query, ...options });
    }
    /**
     * Cancels an in-progress batch. The batch will be in status `cancelling` for up to
     * 10 minutes, before changing to `cancelled`, where it will have partial results
     * (if any) available in the output file.
     */
    cancel(batchId, options) {
      return this._client.post(`/batches/${batchId}/cancel`, options);
    }
  }
  class BatchesPage extends CursorPage {
  }
  (function(Batches2) {
    Batches2.BatchesPage = BatchesPage;
  })(Batches || (Batches = {}));
  class Assistants extends APIResource {
    /**
     * Create an assistant with a model and instructions.
     */
    create(body, options) {
      return this._client.post("/assistants", {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Retrieves an assistant.
     */
    retrieve(assistantId, options) {
      return this._client.get(`/assistants/${assistantId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Modifies an assistant.
     */
    update(assistantId, body, options) {
      return this._client.post(`/assistants/${assistantId}`, {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    list(query = {}, options) {
      if (isRequestOptions(query)) {
        return this.list({}, query);
      }
      return this._client.getAPIList("/assistants", AssistantsPage, {
        query,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Delete an assistant.
     */
    del(assistantId, options) {
      return this._client.delete(`/assistants/${assistantId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
  }
  class AssistantsPage extends CursorPage {
  }
  (function(Assistants2) {
    Assistants2.AssistantsPage = AssistantsPage;
  })(Assistants || (Assistants = {}));
  function isRunnableFunctionWithParse(fn) {
    return typeof fn.parse === "function";
  }
  const isAssistantMessage = (message) => {
    return (message == null ? void 0 : message.role) === "assistant";
  };
  const isFunctionMessage = (message) => {
    return (message == null ? void 0 : message.role) === "function";
  };
  const isToolMessage = (message) => {
    return (message == null ? void 0 : message.role) === "tool";
  };
  var __classPrivateFieldSet$2 = function(receiver, state, value, kind2, f) {
    if (kind2 === "m") throw new TypeError("Private method is not writable");
    if (kind2 === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind2 === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
  };
  var __classPrivateFieldGet$3 = function(receiver, state, kind2, f) {
    if (kind2 === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind2 === "m" ? f : kind2 === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
  };
  var _EventStream_instances, _EventStream_connectedPromise, _EventStream_resolveConnectedPromise, _EventStream_rejectConnectedPromise, _EventStream_endPromise, _EventStream_resolveEndPromise, _EventStream_rejectEndPromise, _EventStream_listeners, _EventStream_ended, _EventStream_errored, _EventStream_aborted, _EventStream_catchingPromiseCreated, _EventStream_handleError;
  class EventStream {
    constructor() {
      _EventStream_instances.add(this);
      this.controller = new AbortController();
      _EventStream_connectedPromise.set(this, void 0);
      _EventStream_resolveConnectedPromise.set(this, () => {
      });
      _EventStream_rejectConnectedPromise.set(this, () => {
      });
      _EventStream_endPromise.set(this, void 0);
      _EventStream_resolveEndPromise.set(this, () => {
      });
      _EventStream_rejectEndPromise.set(this, () => {
      });
      _EventStream_listeners.set(this, {});
      _EventStream_ended.set(this, false);
      _EventStream_errored.set(this, false);
      _EventStream_aborted.set(this, false);
      _EventStream_catchingPromiseCreated.set(this, false);
      __classPrivateFieldSet$2(this, _EventStream_connectedPromise, new Promise((resolve, reject) => {
        __classPrivateFieldSet$2(this, _EventStream_resolveConnectedPromise, resolve, "f");
        __classPrivateFieldSet$2(this, _EventStream_rejectConnectedPromise, reject, "f");
      }), "f");
      __classPrivateFieldSet$2(this, _EventStream_endPromise, new Promise((resolve, reject) => {
        __classPrivateFieldSet$2(this, _EventStream_resolveEndPromise, resolve, "f");
        __classPrivateFieldSet$2(this, _EventStream_rejectEndPromise, reject, "f");
      }), "f");
      __classPrivateFieldGet$3(this, _EventStream_connectedPromise, "f").catch(() => {
      });
      __classPrivateFieldGet$3(this, _EventStream_endPromise, "f").catch(() => {
      });
    }
    _run(executor) {
      setTimeout(() => {
        executor().then(() => {
          this._emitFinal();
          this._emit("end");
        }, __classPrivateFieldGet$3(this, _EventStream_instances, "m", _EventStream_handleError).bind(this));
      }, 0);
    }
    _connected() {
      if (this.ended)
        return;
      __classPrivateFieldGet$3(this, _EventStream_resolveConnectedPromise, "f").call(this);
      this._emit("connect");
    }
    get ended() {
      return __classPrivateFieldGet$3(this, _EventStream_ended, "f");
    }
    get errored() {
      return __classPrivateFieldGet$3(this, _EventStream_errored, "f");
    }
    get aborted() {
      return __classPrivateFieldGet$3(this, _EventStream_aborted, "f");
    }
    abort() {
      this.controller.abort();
    }
    /**
     * Adds the listener function to the end of the listeners array for the event.
     * No checks are made to see if the listener has already been added. Multiple calls passing
     * the same combination of event and listener will result in the listener being added, and
     * called, multiple times.
     * @returns this ChatCompletionStream, so that calls can be chained
     */
    on(event, listener) {
      const listeners = __classPrivateFieldGet$3(this, _EventStream_listeners, "f")[event] || (__classPrivateFieldGet$3(this, _EventStream_listeners, "f")[event] = []);
      listeners.push({ listener });
      return this;
    }
    /**
     * Removes the specified listener from the listener array for the event.
     * off() will remove, at most, one instance of a listener from the listener array. If any single
     * listener has been added multiple times to the listener array for the specified event, then
     * off() must be called multiple times to remove each instance.
     * @returns this ChatCompletionStream, so that calls can be chained
     */
    off(event, listener) {
      const listeners = __classPrivateFieldGet$3(this, _EventStream_listeners, "f")[event];
      if (!listeners)
        return this;
      const index = listeners.findIndex((l) => l.listener === listener);
      if (index >= 0)
        listeners.splice(index, 1);
      return this;
    }
    /**
     * Adds a one-time listener function for the event. The next time the event is triggered,
     * this listener is removed and then invoked.
     * @returns this ChatCompletionStream, so that calls can be chained
     */
    once(event, listener) {
      const listeners = __classPrivateFieldGet$3(this, _EventStream_listeners, "f")[event] || (__classPrivateFieldGet$3(this, _EventStream_listeners, "f")[event] = []);
      listeners.push({ listener, once: true });
      return this;
    }
    /**
     * This is similar to `.once()`, but returns a Promise that resolves the next time
     * the event is triggered, instead of calling a listener callback.
     * @returns a Promise that resolves the next time given event is triggered,
     * or rejects if an error is emitted.  (If you request the 'error' event,
     * returns a promise that resolves with the error).
     *
     * Example:
     *
     *   const message = await stream.emitted('message') // rejects if the stream errors
     */
    emitted(event) {
      return new Promise((resolve, reject) => {
        __classPrivateFieldSet$2(this, _EventStream_catchingPromiseCreated, true, "f");
        if (event !== "error")
          this.once("error", reject);
        this.once(event, resolve);
      });
    }
    async done() {
      __classPrivateFieldSet$2(this, _EventStream_catchingPromiseCreated, true, "f");
      await __classPrivateFieldGet$3(this, _EventStream_endPromise, "f");
    }
    _emit(event, ...args) {
      if (__classPrivateFieldGet$3(this, _EventStream_ended, "f")) {
        return;
      }
      if (event === "end") {
        __classPrivateFieldSet$2(this, _EventStream_ended, true, "f");
        __classPrivateFieldGet$3(this, _EventStream_resolveEndPromise, "f").call(this);
      }
      const listeners = __classPrivateFieldGet$3(this, _EventStream_listeners, "f")[event];
      if (listeners) {
        __classPrivateFieldGet$3(this, _EventStream_listeners, "f")[event] = listeners.filter((l) => !l.once);
        listeners.forEach(({ listener }) => listener(...args));
      }
      if (event === "abort") {
        const error = args[0];
        if (!__classPrivateFieldGet$3(this, _EventStream_catchingPromiseCreated, "f") && !(listeners == null ? void 0 : listeners.length)) {
          Promise.reject(error);
        }
        __classPrivateFieldGet$3(this, _EventStream_rejectConnectedPromise, "f").call(this, error);
        __classPrivateFieldGet$3(this, _EventStream_rejectEndPromise, "f").call(this, error);
        this._emit("end");
        return;
      }
      if (event === "error") {
        const error = args[0];
        if (!__classPrivateFieldGet$3(this, _EventStream_catchingPromiseCreated, "f") && !(listeners == null ? void 0 : listeners.length)) {
          Promise.reject(error);
        }
        __classPrivateFieldGet$3(this, _EventStream_rejectConnectedPromise, "f").call(this, error);
        __classPrivateFieldGet$3(this, _EventStream_rejectEndPromise, "f").call(this, error);
        this._emit("end");
      }
    }
    _emitFinal() {
    }
  }
  _EventStream_connectedPromise = /* @__PURE__ */ new WeakMap(), _EventStream_resolveConnectedPromise = /* @__PURE__ */ new WeakMap(), _EventStream_rejectConnectedPromise = /* @__PURE__ */ new WeakMap(), _EventStream_endPromise = /* @__PURE__ */ new WeakMap(), _EventStream_resolveEndPromise = /* @__PURE__ */ new WeakMap(), _EventStream_rejectEndPromise = /* @__PURE__ */ new WeakMap(), _EventStream_listeners = /* @__PURE__ */ new WeakMap(), _EventStream_ended = /* @__PURE__ */ new WeakMap(), _EventStream_errored = /* @__PURE__ */ new WeakMap(), _EventStream_aborted = /* @__PURE__ */ new WeakMap(), _EventStream_catchingPromiseCreated = /* @__PURE__ */ new WeakMap(), _EventStream_instances = /* @__PURE__ */ new WeakSet(), _EventStream_handleError = function _EventStream_handleError2(error) {
    __classPrivateFieldSet$2(this, _EventStream_errored, true, "f");
    if (error instanceof Error && error.name === "AbortError") {
      error = new APIUserAbortError();
    }
    if (error instanceof APIUserAbortError) {
      __classPrivateFieldSet$2(this, _EventStream_aborted, true, "f");
      return this._emit("abort", error);
    }
    if (error instanceof OpenAIError) {
      return this._emit("error", error);
    }
    if (error instanceof Error) {
      const openAIError = new OpenAIError(error.message);
      openAIError.cause = error;
      return this._emit("error", openAIError);
    }
    return this._emit("error", new OpenAIError(String(error)));
  };
  function isAutoParsableResponseFormat(response_format) {
    return (response_format == null ? void 0 : response_format["$brand"]) === "auto-parseable-response-format";
  }
  function isAutoParsableTool(tool) {
    return (tool == null ? void 0 : tool["$brand"]) === "auto-parseable-tool";
  }
  function maybeParseChatCompletion(completion, params) {
    if (!params || !hasAutoParseableInput(params)) {
      return {
        ...completion,
        choices: completion.choices.map((choice) => ({
          ...choice,
          message: { ...choice.message, parsed: null, tool_calls: choice.message.tool_calls ?? [] }
        }))
      };
    }
    return parseChatCompletion(completion, params);
  }
  function parseChatCompletion(completion, params) {
    const choices = completion.choices.map((choice) => {
      var _a2;
      if (choice.finish_reason === "length") {
        throw new LengthFinishReasonError();
      }
      if (choice.finish_reason === "content_filter") {
        throw new ContentFilterFinishReasonError();
      }
      return {
        ...choice,
        message: {
          ...choice.message,
          tool_calls: ((_a2 = choice.message.tool_calls) == null ? void 0 : _a2.map((toolCall) => parseToolCall(params, toolCall))) ?? [],
          parsed: choice.message.content && !choice.message.refusal ? parseResponseFormat(params, choice.message.content) : null
        }
      };
    });
    return { ...completion, choices };
  }
  function parseResponseFormat(params, content) {
    var _a2, _b;
    if (((_a2 = params.response_format) == null ? void 0 : _a2.type) !== "json_schema") {
      return null;
    }
    if (((_b = params.response_format) == null ? void 0 : _b.type) === "json_schema") {
      if ("$parseRaw" in params.response_format) {
        const response_format = params.response_format;
        return response_format.$parseRaw(content);
      }
      return JSON.parse(content);
    }
    return null;
  }
  function parseToolCall(params, toolCall) {
    var _a2;
    const inputTool = (_a2 = params.tools) == null ? void 0 : _a2.find((inputTool2) => {
      var _a3;
      return ((_a3 = inputTool2.function) == null ? void 0 : _a3.name) === toolCall.function.name;
    });
    return {
      ...toolCall,
      function: {
        ...toolCall.function,
        parsed_arguments: isAutoParsableTool(inputTool) ? inputTool.$parseRaw(toolCall.function.arguments) : (inputTool == null ? void 0 : inputTool.function.strict) ? JSON.parse(toolCall.function.arguments) : null
      }
    };
  }
  function shouldParseToolCall(params, toolCall) {
    var _a2;
    if (!params) {
      return false;
    }
    const inputTool = (_a2 = params.tools) == null ? void 0 : _a2.find((inputTool2) => {
      var _a3;
      return ((_a3 = inputTool2.function) == null ? void 0 : _a3.name) === toolCall.function.name;
    });
    return isAutoParsableTool(inputTool) || (inputTool == null ? void 0 : inputTool.function.strict) || false;
  }
  function hasAutoParseableInput(params) {
    var _a2;
    if (isAutoParsableResponseFormat(params.response_format)) {
      return true;
    }
    return ((_a2 = params.tools) == null ? void 0 : _a2.some((t) => isAutoParsableTool(t) || t.type === "function" && t.function.strict === true)) ?? false;
  }
  function validateInputTools(tools) {
    for (const tool of tools ?? []) {
      if (tool.type !== "function") {
        throw new OpenAIError(`Currently only \`function\` tool types support auto-parsing; Received \`${tool.type}\``);
      }
      if (tool.function.strict !== true) {
        throw new OpenAIError(`The \`${tool.function.name}\` tool is not marked with \`strict: true\`. Only strict function tools can be auto-parsed`);
      }
    }
  }
  var __classPrivateFieldGet$2 = function(receiver, state, kind2, f) {
    if (kind2 === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind2 === "m" ? f : kind2 === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
  };
  var _AbstractChatCompletionRunner_instances, _AbstractChatCompletionRunner_getFinalContent, _AbstractChatCompletionRunner_getFinalMessage, _AbstractChatCompletionRunner_getFinalFunctionCall, _AbstractChatCompletionRunner_getFinalFunctionCallResult, _AbstractChatCompletionRunner_calculateTotalUsage, _AbstractChatCompletionRunner_validateParams, _AbstractChatCompletionRunner_stringifyFunctionCallResult;
  const DEFAULT_MAX_CHAT_COMPLETIONS = 10;
  class AbstractChatCompletionRunner extends EventStream {
    constructor() {
      super(...arguments);
      _AbstractChatCompletionRunner_instances.add(this);
      this._chatCompletions = [];
      this.messages = [];
    }
    _addChatCompletion(chatCompletion) {
      var _a2;
      this._chatCompletions.push(chatCompletion);
      this._emit("chatCompletion", chatCompletion);
      const message = (_a2 = chatCompletion.choices[0]) == null ? void 0 : _a2.message;
      if (message)
        this._addMessage(message);
      return chatCompletion;
    }
    _addMessage(message, emit2 = true) {
      if (!("content" in message))
        message.content = null;
      this.messages.push(message);
      if (emit2) {
        this._emit("message", message);
        if ((isFunctionMessage(message) || isToolMessage(message)) && message.content) {
          this._emit("functionCallResult", message.content);
        } else if (isAssistantMessage(message) && message.function_call) {
          this._emit("functionCall", message.function_call);
        } else if (isAssistantMessage(message) && message.tool_calls) {
          for (const tool_call of message.tool_calls) {
            if (tool_call.type === "function") {
              this._emit("functionCall", tool_call.function);
            }
          }
        }
      }
    }
    /**
     * @returns a promise that resolves with the final ChatCompletion, or rejects
     * if an error occurred or the stream ended prematurely without producing a ChatCompletion.
     */
    async finalChatCompletion() {
      await this.done();
      const completion = this._chatCompletions[this._chatCompletions.length - 1];
      if (!completion)
        throw new OpenAIError("stream ended without producing a ChatCompletion");
      return completion;
    }
    /**
     * @returns a promise that resolves with the content of the final ChatCompletionMessage, or rejects
     * if an error occurred or the stream ended prematurely without producing a ChatCompletionMessage.
     */
    async finalContent() {
      await this.done();
      return __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalContent).call(this);
    }
    /**
     * @returns a promise that resolves with the the final assistant ChatCompletionMessage response,
     * or rejects if an error occurred or the stream ended prematurely without producing a ChatCompletionMessage.
     */
    async finalMessage() {
      await this.done();
      return __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this);
    }
    /**
     * @returns a promise that resolves with the content of the final FunctionCall, or rejects
     * if an error occurred or the stream ended prematurely without producing a ChatCompletionMessage.
     */
    async finalFunctionCall() {
      await this.done();
      return __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionCall).call(this);
    }
    async finalFunctionCallResult() {
      await this.done();
      return __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionCallResult).call(this);
    }
    async totalUsage() {
      await this.done();
      return __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_calculateTotalUsage).call(this);
    }
    allChatCompletions() {
      return [...this._chatCompletions];
    }
    _emitFinal() {
      const completion = this._chatCompletions[this._chatCompletions.length - 1];
      if (completion)
        this._emit("finalChatCompletion", completion);
      const finalMessage = __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this);
      if (finalMessage)
        this._emit("finalMessage", finalMessage);
      const finalContent = __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalContent).call(this);
      if (finalContent)
        this._emit("finalContent", finalContent);
      const finalFunctionCall = __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionCall).call(this);
      if (finalFunctionCall)
        this._emit("finalFunctionCall", finalFunctionCall);
      const finalFunctionCallResult = __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionCallResult).call(this);
      if (finalFunctionCallResult != null)
        this._emit("finalFunctionCallResult", finalFunctionCallResult);
      if (this._chatCompletions.some((c) => c.usage)) {
        this._emit("totalUsage", __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_calculateTotalUsage).call(this));
      }
    }
    async _createChatCompletion(client, params, options) {
      const signal = options == null ? void 0 : options.signal;
      if (signal) {
        if (signal.aborted)
          this.controller.abort();
        signal.addEventListener("abort", () => this.controller.abort());
      }
      __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_validateParams).call(this, params);
      const chatCompletion = await client.chat.completions.create({ ...params, stream: false }, { ...options, signal: this.controller.signal });
      this._connected();
      return this._addChatCompletion(parseChatCompletion(chatCompletion, params));
    }
    async _runChatCompletion(client, params, options) {
      for (const message of params.messages) {
        this._addMessage(message, false);
      }
      return await this._createChatCompletion(client, params, options);
    }
    async _runFunctions(client, params, options) {
      var _a2;
      const role = "function";
      const { function_call = "auto", stream, ...restParams } = params;
      const singleFunctionToCall = typeof function_call !== "string" && (function_call == null ? void 0 : function_call.name);
      const { maxChatCompletions = DEFAULT_MAX_CHAT_COMPLETIONS } = options || {};
      const functionsByName = {};
      for (const f of params.functions) {
        functionsByName[f.name || f.function.name] = f;
      }
      const functions = params.functions.map((f) => ({
        name: f.name || f.function.name,
        parameters: f.parameters,
        description: f.description
      }));
      for (const message of params.messages) {
        this._addMessage(message, false);
      }
      for (let i = 0; i < maxChatCompletions; ++i) {
        const chatCompletion = await this._createChatCompletion(client, {
          ...restParams,
          function_call,
          functions,
          messages: [...this.messages]
        }, options);
        const message = (_a2 = chatCompletion.choices[0]) == null ? void 0 : _a2.message;
        if (!message) {
          throw new OpenAIError(`missing message in ChatCompletion response`);
        }
        if (!message.function_call)
          return;
        const { name, arguments: args } = message.function_call;
        const fn = functionsByName[name];
        if (!fn) {
          const content2 = `Invalid function_call: ${JSON.stringify(name)}. Available options are: ${functions.map((f) => JSON.stringify(f.name)).join(", ")}. Please try again`;
          this._addMessage({ role, name, content: content2 });
          continue;
        } else if (singleFunctionToCall && singleFunctionToCall !== name) {
          const content2 = `Invalid function_call: ${JSON.stringify(name)}. ${JSON.stringify(singleFunctionToCall)} requested. Please try again`;
          this._addMessage({ role, name, content: content2 });
          continue;
        }
        let parsed;
        try {
          parsed = isRunnableFunctionWithParse(fn) ? await fn.parse(args) : args;
        } catch (error) {
          this._addMessage({
            role,
            name,
            content: error instanceof Error ? error.message : String(error)
          });
          continue;
        }
        const rawContent = await fn.function(parsed, this);
        const content = __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_stringifyFunctionCallResult).call(this, rawContent);
        this._addMessage({ role, name, content });
        if (singleFunctionToCall)
          return;
      }
    }
    async _runTools(client, params, options) {
      var _a2, _b, _c;
      const role = "tool";
      const { tool_choice = "auto", stream, ...restParams } = params;
      const singleFunctionToCall = typeof tool_choice !== "string" && ((_a2 = tool_choice == null ? void 0 : tool_choice.function) == null ? void 0 : _a2.name);
      const { maxChatCompletions = DEFAULT_MAX_CHAT_COMPLETIONS } = options || {};
      const inputTools = params.tools.map((tool) => {
        if (isAutoParsableTool(tool)) {
          if (!tool.$callback) {
            throw new OpenAIError("Tool given to `.runTools()` that does not have an associated function");
          }
          return {
            type: "function",
            function: {
              function: tool.$callback,
              name: tool.function.name,
              description: tool.function.description || "",
              parameters: tool.function.parameters,
              parse: tool.$parseRaw,
              strict: true
            }
          };
        }
        return tool;
      });
      const functionsByName = {};
      for (const f of inputTools) {
        if (f.type === "function") {
          functionsByName[f.function.name || f.function.function.name] = f.function;
        }
      }
      const tools = "tools" in params ? inputTools.map((t) => t.type === "function" ? {
        type: "function",
        function: {
          name: t.function.name || t.function.function.name,
          parameters: t.function.parameters,
          description: t.function.description,
          strict: t.function.strict
        }
      } : t) : void 0;
      for (const message of params.messages) {
        this._addMessage(message, false);
      }
      for (let i = 0; i < maxChatCompletions; ++i) {
        const chatCompletion = await this._createChatCompletion(client, {
          ...restParams,
          tool_choice,
          tools,
          messages: [...this.messages]
        }, options);
        const message = (_b = chatCompletion.choices[0]) == null ? void 0 : _b.message;
        if (!message) {
          throw new OpenAIError(`missing message in ChatCompletion response`);
        }
        if (!((_c = message.tool_calls) == null ? void 0 : _c.length)) {
          return;
        }
        for (const tool_call of message.tool_calls) {
          if (tool_call.type !== "function")
            continue;
          const tool_call_id = tool_call.id;
          const { name, arguments: args } = tool_call.function;
          const fn = functionsByName[name];
          if (!fn) {
            const content2 = `Invalid tool_call: ${JSON.stringify(name)}. Available options are: ${Object.keys(functionsByName).map((name2) => JSON.stringify(name2)).join(", ")}. Please try again`;
            this._addMessage({ role, tool_call_id, content: content2 });
            continue;
          } else if (singleFunctionToCall && singleFunctionToCall !== name) {
            const content2 = `Invalid tool_call: ${JSON.stringify(name)}. ${JSON.stringify(singleFunctionToCall)} requested. Please try again`;
            this._addMessage({ role, tool_call_id, content: content2 });
            continue;
          }
          let parsed;
          try {
            parsed = isRunnableFunctionWithParse(fn) ? await fn.parse(args) : args;
          } catch (error) {
            const content2 = error instanceof Error ? error.message : String(error);
            this._addMessage({ role, tool_call_id, content: content2 });
            continue;
          }
          const rawContent = await fn.function(parsed, this);
          const content = __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_stringifyFunctionCallResult).call(this, rawContent);
          this._addMessage({ role, tool_call_id, content });
          if (singleFunctionToCall) {
            return;
          }
        }
      }
      return;
    }
  }
  _AbstractChatCompletionRunner_instances = /* @__PURE__ */ new WeakSet(), _AbstractChatCompletionRunner_getFinalContent = function _AbstractChatCompletionRunner_getFinalContent2() {
    return __classPrivateFieldGet$2(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this).content ?? null;
  }, _AbstractChatCompletionRunner_getFinalMessage = function _AbstractChatCompletionRunner_getFinalMessage2() {
    let i = this.messages.length;
    while (i-- > 0) {
      const message = this.messages[i];
      if (isAssistantMessage(message)) {
        const { function_call, ...rest } = message;
        const ret = {
          ...rest,
          content: message.content ?? null,
          refusal: message.refusal ?? null
        };
        if (function_call) {
          ret.function_call = function_call;
        }
        return ret;
      }
    }
    throw new OpenAIError("stream ended without producing a ChatCompletionMessage with role=assistant");
  }, _AbstractChatCompletionRunner_getFinalFunctionCall = function _AbstractChatCompletionRunner_getFinalFunctionCall2() {
    var _a2, _b;
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const message = this.messages[i];
      if (isAssistantMessage(message) && (message == null ? void 0 : message.function_call)) {
        return message.function_call;
      }
      if (isAssistantMessage(message) && ((_a2 = message == null ? void 0 : message.tool_calls) == null ? void 0 : _a2.length)) {
        return (_b = message.tool_calls.at(-1)) == null ? void 0 : _b.function;
      }
    }
    return;
  }, _AbstractChatCompletionRunner_getFinalFunctionCallResult = function _AbstractChatCompletionRunner_getFinalFunctionCallResult2() {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const message = this.messages[i];
      if (isFunctionMessage(message) && message.content != null) {
        return message.content;
      }
      if (isToolMessage(message) && message.content != null && typeof message.content === "string" && this.messages.some((x) => {
        var _a2;
        return x.role === "assistant" && ((_a2 = x.tool_calls) == null ? void 0 : _a2.some((y) => y.type === "function" && y.id === message.tool_call_id));
      })) {
        return message.content;
      }
    }
    return;
  }, _AbstractChatCompletionRunner_calculateTotalUsage = function _AbstractChatCompletionRunner_calculateTotalUsage2() {
    const total = {
      completion_tokens: 0,
      prompt_tokens: 0,
      total_tokens: 0
    };
    for (const { usage } of this._chatCompletions) {
      if (usage) {
        total.completion_tokens += usage.completion_tokens;
        total.prompt_tokens += usage.prompt_tokens;
        total.total_tokens += usage.total_tokens;
      }
    }
    return total;
  }, _AbstractChatCompletionRunner_validateParams = function _AbstractChatCompletionRunner_validateParams2(params) {
    if (params.n != null && params.n > 1) {
      throw new OpenAIError("ChatCompletion convenience helpers only support n=1 at this time. To use n>1, please use chat.completions.create() directly.");
    }
  }, _AbstractChatCompletionRunner_stringifyFunctionCallResult = function _AbstractChatCompletionRunner_stringifyFunctionCallResult2(rawContent) {
    return typeof rawContent === "string" ? rawContent : rawContent === void 0 ? "undefined" : JSON.stringify(rawContent);
  };
  class ChatCompletionRunner extends AbstractChatCompletionRunner {
    /** @deprecated - please use `runTools` instead. */
    static runFunctions(client, params, options) {
      const runner = new ChatCompletionRunner();
      const opts = {
        ...options,
        headers: { ...options == null ? void 0 : options.headers, "X-Stainless-Helper-Method": "runFunctions" }
      };
      runner._run(() => runner._runFunctions(client, params, opts));
      return runner;
    }
    static runTools(client, params, options) {
      const runner = new ChatCompletionRunner();
      const opts = {
        ...options,
        headers: { ...options == null ? void 0 : options.headers, "X-Stainless-Helper-Method": "runTools" }
      };
      runner._run(() => runner._runTools(client, params, opts));
      return runner;
    }
    _addMessage(message) {
      super._addMessage(message);
      if (isAssistantMessage(message) && message.content) {
        this._emit("content", message.content);
      }
    }
  }
  const tokenize = (input) => {
    let current = 0;
    let tokens = [];
    while (current < input.length) {
      let char = input[current];
      if (char === "\\") {
        current++;
        continue;
      }
      if (char === "{") {
        tokens.push({
          type: "brace",
          value: "{"
        });
        current++;
        continue;
      }
      if (char === "}") {
        tokens.push({
          type: "brace",
          value: "}"
        });
        current++;
        continue;
      }
      if (char === "[") {
        tokens.push({
          type: "paren",
          value: "["
        });
        current++;
        continue;
      }
      if (char === "]") {
        tokens.push({
          type: "paren",
          value: "]"
        });
        current++;
        continue;
      }
      if (char === ":") {
        tokens.push({
          type: "separator",
          value: ":"
        });
        current++;
        continue;
      }
      if (char === ",") {
        tokens.push({
          type: "delimiter",
          value: ","
        });
        current++;
        continue;
      }
      if (char === '"') {
        let value = "";
        let danglingQuote = false;
        char = input[++current];
        while (char !== '"') {
          if (current === input.length) {
            danglingQuote = true;
            break;
          }
          if (char === "\\") {
            current++;
            if (current === input.length) {
              danglingQuote = true;
              break;
            }
            value += char + input[current];
            char = input[++current];
          } else {
            value += char;
            char = input[++current];
          }
        }
        char = input[++current];
        if (!danglingQuote) {
          tokens.push({
            type: "string",
            value
          });
        }
        continue;
      }
      let WHITESPACE = /\s/;
      if (char && WHITESPACE.test(char)) {
        current++;
        continue;
      }
      let NUMBERS = /[0-9]/;
      if (char && NUMBERS.test(char) || char === "-" || char === ".") {
        let value = "";
        if (char === "-") {
          value += char;
          char = input[++current];
        }
        while (char && NUMBERS.test(char) || char === ".") {
          value += char;
          char = input[++current];
        }
        tokens.push({
          type: "number",
          value
        });
        continue;
      }
      let LETTERS = /[a-z]/i;
      if (char && LETTERS.test(char)) {
        let value = "";
        while (char && LETTERS.test(char)) {
          if (current === input.length) {
            break;
          }
          value += char;
          char = input[++current];
        }
        if (value == "true" || value == "false" || value === "null") {
          tokens.push({
            type: "name",
            value
          });
        } else {
          current++;
          continue;
        }
        continue;
      }
      current++;
    }
    return tokens;
  }, strip = (tokens) => {
    if (tokens.length === 0) {
      return tokens;
    }
    let lastToken = tokens[tokens.length - 1];
    switch (lastToken.type) {
      case "separator":
        tokens = tokens.slice(0, tokens.length - 1);
        return strip(tokens);
      case "number":
        let lastCharacterOfLastToken = lastToken.value[lastToken.value.length - 1];
        if (lastCharacterOfLastToken === "." || lastCharacterOfLastToken === "-") {
          tokens = tokens.slice(0, tokens.length - 1);
          return strip(tokens);
        }
      case "string":
        let tokenBeforeTheLastToken = tokens[tokens.length - 2];
        if ((tokenBeforeTheLastToken == null ? void 0 : tokenBeforeTheLastToken.type) === "delimiter") {
          tokens = tokens.slice(0, tokens.length - 1);
          return strip(tokens);
        } else if ((tokenBeforeTheLastToken == null ? void 0 : tokenBeforeTheLastToken.type) === "brace" && tokenBeforeTheLastToken.value === "{") {
          tokens = tokens.slice(0, tokens.length - 1);
          return strip(tokens);
        }
        break;
      case "delimiter":
        tokens = tokens.slice(0, tokens.length - 1);
        return strip(tokens);
    }
    return tokens;
  }, unstrip = (tokens) => {
    let tail = [];
    tokens.map((token) => {
      if (token.type === "brace") {
        if (token.value === "{") {
          tail.push("}");
        } else {
          tail.splice(tail.lastIndexOf("}"), 1);
        }
      }
      if (token.type === "paren") {
        if (token.value === "[") {
          tail.push("]");
        } else {
          tail.splice(tail.lastIndexOf("]"), 1);
        }
      }
    });
    if (tail.length > 0) {
      tail.reverse().map((item) => {
        if (item === "}") {
          tokens.push({
            type: "brace",
            value: "}"
          });
        } else if (item === "]") {
          tokens.push({
            type: "paren",
            value: "]"
          });
        }
      });
    }
    return tokens;
  }, generate = (tokens) => {
    let output = "";
    tokens.map((token) => {
      switch (token.type) {
        case "string":
          output += '"' + token.value + '"';
          break;
        default:
          output += token.value;
          break;
      }
    });
    return output;
  }, partialParse = (input) => JSON.parse(generate(unstrip(strip(tokenize(input)))));
  var __classPrivateFieldSet$1 = function(receiver, state, value, kind2, f) {
    if (kind2 === "m") throw new TypeError("Private method is not writable");
    if (kind2 === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind2 === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
  };
  var __classPrivateFieldGet$1 = function(receiver, state, kind2, f) {
    if (kind2 === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind2 === "m" ? f : kind2 === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
  };
  var _ChatCompletionStream_instances, _ChatCompletionStream_params, _ChatCompletionStream_choiceEventStates, _ChatCompletionStream_currentChatCompletionSnapshot, _ChatCompletionStream_beginRequest, _ChatCompletionStream_getChoiceEventState, _ChatCompletionStream_addChunk, _ChatCompletionStream_emitToolCallDoneEvent, _ChatCompletionStream_emitContentDoneEvents, _ChatCompletionStream_endRequest, _ChatCompletionStream_getAutoParseableResponseFormat, _ChatCompletionStream_accumulateChatCompletion;
  class ChatCompletionStream extends AbstractChatCompletionRunner {
    constructor(params) {
      super();
      _ChatCompletionStream_instances.add(this);
      _ChatCompletionStream_params.set(this, void 0);
      _ChatCompletionStream_choiceEventStates.set(this, void 0);
      _ChatCompletionStream_currentChatCompletionSnapshot.set(this, void 0);
      __classPrivateFieldSet$1(this, _ChatCompletionStream_params, params, "f");
      __classPrivateFieldSet$1(this, _ChatCompletionStream_choiceEventStates, [], "f");
    }
    get currentChatCompletionSnapshot() {
      return __classPrivateFieldGet$1(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
    }
    /**
     * Intended for use on the frontend, consuming a stream produced with
     * `.toReadableStream()` on the backend.
     *
     * Note that messages sent to the model do not appear in `.on('message')`
     * in this context.
     */
    static fromReadableStream(stream) {
      const runner = new ChatCompletionStream(null);
      runner._run(() => runner._fromReadableStream(stream));
      return runner;
    }
    static createChatCompletion(client, params, options) {
      const runner = new ChatCompletionStream(params);
      runner._run(() => runner._runChatCompletion(client, { ...params, stream: true }, { ...options, headers: { ...options == null ? void 0 : options.headers, "X-Stainless-Helper-Method": "stream" } }));
      return runner;
    }
    async _createChatCompletion(client, params, options) {
      var _a2;
      super._createChatCompletion;
      const signal = options == null ? void 0 : options.signal;
      if (signal) {
        if (signal.aborted)
          this.controller.abort();
        signal.addEventListener("abort", () => this.controller.abort());
      }
      __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_beginRequest).call(this);
      const stream = await client.chat.completions.create({ ...params, stream: true }, { ...options, signal: this.controller.signal });
      this._connected();
      for await (const chunk of stream) {
        __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_addChunk).call(this, chunk);
      }
      if ((_a2 = stream.controller.signal) == null ? void 0 : _a2.aborted) {
        throw new APIUserAbortError();
      }
      return this._addChatCompletion(__classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
    }
    async _fromReadableStream(readableStream, options) {
      var _a2;
      const signal = options == null ? void 0 : options.signal;
      if (signal) {
        if (signal.aborted)
          this.controller.abort();
        signal.addEventListener("abort", () => this.controller.abort());
      }
      __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_beginRequest).call(this);
      this._connected();
      const stream = Stream.fromReadableStream(readableStream, this.controller);
      let chatId;
      for await (const chunk of stream) {
        if (chatId && chatId !== chunk.id) {
          this._addChatCompletion(__classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
        }
        __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_addChunk).call(this, chunk);
        chatId = chunk.id;
      }
      if ((_a2 = stream.controller.signal) == null ? void 0 : _a2.aborted) {
        throw new APIUserAbortError();
      }
      return this._addChatCompletion(__classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
    }
    [(_ChatCompletionStream_params = /* @__PURE__ */ new WeakMap(), _ChatCompletionStream_choiceEventStates = /* @__PURE__ */ new WeakMap(), _ChatCompletionStream_currentChatCompletionSnapshot = /* @__PURE__ */ new WeakMap(), _ChatCompletionStream_instances = /* @__PURE__ */ new WeakSet(), _ChatCompletionStream_beginRequest = function _ChatCompletionStream_beginRequest2() {
      if (this.ended)
        return;
      __classPrivateFieldSet$1(this, _ChatCompletionStream_currentChatCompletionSnapshot, void 0, "f");
    }, _ChatCompletionStream_getChoiceEventState = function _ChatCompletionStream_getChoiceEventState2(choice) {
      let state = __classPrivateFieldGet$1(this, _ChatCompletionStream_choiceEventStates, "f")[choice.index];
      if (state) {
        return state;
      }
      state = {
        content_done: false,
        refusal_done: false,
        logprobs_content_done: false,
        logprobs_refusal_done: false,
        done_tool_calls: /* @__PURE__ */ new Set(),
        current_tool_call_index: null
      };
      __classPrivateFieldGet$1(this, _ChatCompletionStream_choiceEventStates, "f")[choice.index] = state;
      return state;
    }, _ChatCompletionStream_addChunk = function _ChatCompletionStream_addChunk2(chunk) {
      var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
      if (this.ended)
        return;
      const completion = __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_accumulateChatCompletion).call(this, chunk);
      this._emit("chunk", chunk, completion);
      for (const choice of chunk.choices) {
        const choiceSnapshot = completion.choices[choice.index];
        if (choice.delta.content != null && ((_a2 = choiceSnapshot.message) == null ? void 0 : _a2.role) === "assistant" && ((_b = choiceSnapshot.message) == null ? void 0 : _b.content)) {
          this._emit("content", choice.delta.content, choiceSnapshot.message.content);
          this._emit("content.delta", {
            delta: choice.delta.content,
            snapshot: choiceSnapshot.message.content,
            parsed: choiceSnapshot.message.parsed
          });
        }
        if (choice.delta.refusal != null && ((_c = choiceSnapshot.message) == null ? void 0 : _c.role) === "assistant" && ((_d = choiceSnapshot.message) == null ? void 0 : _d.refusal)) {
          this._emit("refusal.delta", {
            delta: choice.delta.refusal,
            snapshot: choiceSnapshot.message.refusal
          });
        }
        if (((_e = choice.logprobs) == null ? void 0 : _e.content) != null && ((_f = choiceSnapshot.message) == null ? void 0 : _f.role) === "assistant") {
          this._emit("logprobs.content.delta", {
            content: (_g = choice.logprobs) == null ? void 0 : _g.content,
            snapshot: ((_h = choiceSnapshot.logprobs) == null ? void 0 : _h.content) ?? []
          });
        }
        if (((_i = choice.logprobs) == null ? void 0 : _i.refusal) != null && ((_j = choiceSnapshot.message) == null ? void 0 : _j.role) === "assistant") {
          this._emit("logprobs.refusal.delta", {
            refusal: (_k = choice.logprobs) == null ? void 0 : _k.refusal,
            snapshot: ((_l = choiceSnapshot.logprobs) == null ? void 0 : _l.refusal) ?? []
          });
        }
        const state = __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getChoiceEventState).call(this, choiceSnapshot);
        if (choiceSnapshot.finish_reason) {
          __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitContentDoneEvents).call(this, choiceSnapshot);
          if (state.current_tool_call_index != null) {
            __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitToolCallDoneEvent).call(this, choiceSnapshot, state.current_tool_call_index);
          }
        }
        for (const toolCall of choice.delta.tool_calls ?? []) {
          if (state.current_tool_call_index !== toolCall.index) {
            __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitContentDoneEvents).call(this, choiceSnapshot);
            if (state.current_tool_call_index != null) {
              __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitToolCallDoneEvent).call(this, choiceSnapshot, state.current_tool_call_index);
            }
          }
          state.current_tool_call_index = toolCall.index;
        }
        for (const toolCallDelta of choice.delta.tool_calls ?? []) {
          const toolCallSnapshot = (_m = choiceSnapshot.message.tool_calls) == null ? void 0 : _m[toolCallDelta.index];
          if (!(toolCallSnapshot == null ? void 0 : toolCallSnapshot.type)) {
            continue;
          }
          if ((toolCallSnapshot == null ? void 0 : toolCallSnapshot.type) === "function") {
            this._emit("tool_calls.function.arguments.delta", {
              name: (_n = toolCallSnapshot.function) == null ? void 0 : _n.name,
              index: toolCallDelta.index,
              arguments: toolCallSnapshot.function.arguments,
              parsed_arguments: toolCallSnapshot.function.parsed_arguments,
              arguments_delta: ((_o = toolCallDelta.function) == null ? void 0 : _o.arguments) ?? ""
            });
          } else {
            assertNever(toolCallSnapshot == null ? void 0 : toolCallSnapshot.type);
          }
        }
      }
    }, _ChatCompletionStream_emitToolCallDoneEvent = function _ChatCompletionStream_emitToolCallDoneEvent2(choiceSnapshot, toolCallIndex) {
      var _a2, _b, _c;
      const state = __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getChoiceEventState).call(this, choiceSnapshot);
      if (state.done_tool_calls.has(toolCallIndex)) {
        return;
      }
      const toolCallSnapshot = (_a2 = choiceSnapshot.message.tool_calls) == null ? void 0 : _a2[toolCallIndex];
      if (!toolCallSnapshot) {
        throw new Error("no tool call snapshot");
      }
      if (!toolCallSnapshot.type) {
        throw new Error("tool call snapshot missing `type`");
      }
      if (toolCallSnapshot.type === "function") {
        const inputTool = (_c = (_b = __classPrivateFieldGet$1(this, _ChatCompletionStream_params, "f")) == null ? void 0 : _b.tools) == null ? void 0 : _c.find((tool) => tool.type === "function" && tool.function.name === toolCallSnapshot.function.name);
        this._emit("tool_calls.function.arguments.done", {
          name: toolCallSnapshot.function.name,
          index: toolCallIndex,
          arguments: toolCallSnapshot.function.arguments,
          parsed_arguments: isAutoParsableTool(inputTool) ? inputTool.$parseRaw(toolCallSnapshot.function.arguments) : (inputTool == null ? void 0 : inputTool.function.strict) ? JSON.parse(toolCallSnapshot.function.arguments) : null
        });
      } else {
        assertNever(toolCallSnapshot.type);
      }
    }, _ChatCompletionStream_emitContentDoneEvents = function _ChatCompletionStream_emitContentDoneEvents2(choiceSnapshot) {
      var _a2, _b;
      const state = __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getChoiceEventState).call(this, choiceSnapshot);
      if (choiceSnapshot.message.content && !state.content_done) {
        state.content_done = true;
        const responseFormat = __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getAutoParseableResponseFormat).call(this);
        this._emit("content.done", {
          content: choiceSnapshot.message.content,
          parsed: responseFormat ? responseFormat.$parseRaw(choiceSnapshot.message.content) : null
        });
      }
      if (choiceSnapshot.message.refusal && !state.refusal_done) {
        state.refusal_done = true;
        this._emit("refusal.done", { refusal: choiceSnapshot.message.refusal });
      }
      if (((_a2 = choiceSnapshot.logprobs) == null ? void 0 : _a2.content) && !state.logprobs_content_done) {
        state.logprobs_content_done = true;
        this._emit("logprobs.content.done", { content: choiceSnapshot.logprobs.content });
      }
      if (((_b = choiceSnapshot.logprobs) == null ? void 0 : _b.refusal) && !state.logprobs_refusal_done) {
        state.logprobs_refusal_done = true;
        this._emit("logprobs.refusal.done", { refusal: choiceSnapshot.logprobs.refusal });
      }
    }, _ChatCompletionStream_endRequest = function _ChatCompletionStream_endRequest2() {
      if (this.ended) {
        throw new OpenAIError(`stream has ended, this shouldn't happen`);
      }
      const snapshot = __classPrivateFieldGet$1(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
      if (!snapshot) {
        throw new OpenAIError(`request ended without sending any chunks`);
      }
      __classPrivateFieldSet$1(this, _ChatCompletionStream_currentChatCompletionSnapshot, void 0, "f");
      __classPrivateFieldSet$1(this, _ChatCompletionStream_choiceEventStates, [], "f");
      return finalizeChatCompletion(snapshot, __classPrivateFieldGet$1(this, _ChatCompletionStream_params, "f"));
    }, _ChatCompletionStream_getAutoParseableResponseFormat = function _ChatCompletionStream_getAutoParseableResponseFormat2() {
      var _a2;
      const responseFormat = (_a2 = __classPrivateFieldGet$1(this, _ChatCompletionStream_params, "f")) == null ? void 0 : _a2.response_format;
      if (isAutoParsableResponseFormat(responseFormat)) {
        return responseFormat;
      }
      return null;
    }, _ChatCompletionStream_accumulateChatCompletion = function _ChatCompletionStream_accumulateChatCompletion2(chunk) {
      var _a2, _b, _c, _d;
      let snapshot = __classPrivateFieldGet$1(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
      const { choices, ...rest } = chunk;
      if (!snapshot) {
        snapshot = __classPrivateFieldSet$1(this, _ChatCompletionStream_currentChatCompletionSnapshot, {
          ...rest,
          choices: []
        }, "f");
      } else {
        Object.assign(snapshot, rest);
      }
      for (const { delta, finish_reason, index, logprobs = null, ...other } of chunk.choices) {
        let choice = snapshot.choices[index];
        if (!choice) {
          choice = snapshot.choices[index] = { finish_reason, index, message: {}, logprobs, ...other };
        }
        if (logprobs) {
          if (!choice.logprobs) {
            choice.logprobs = Object.assign({}, logprobs);
          } else {
            const { content: content2, refusal: refusal2, ...rest3 } = logprobs;
            Object.assign(choice.logprobs, rest3);
            if (content2) {
              (_a2 = choice.logprobs).content ?? (_a2.content = []);
              choice.logprobs.content.push(...content2);
            }
            if (refusal2) {
              (_b = choice.logprobs).refusal ?? (_b.refusal = []);
              choice.logprobs.refusal.push(...refusal2);
            }
          }
        }
        if (finish_reason) {
          choice.finish_reason = finish_reason;
          if (__classPrivateFieldGet$1(this, _ChatCompletionStream_params, "f") && hasAutoParseableInput(__classPrivateFieldGet$1(this, _ChatCompletionStream_params, "f"))) {
            if (finish_reason === "length") {
              throw new LengthFinishReasonError();
            }
            if (finish_reason === "content_filter") {
              throw new ContentFilterFinishReasonError();
            }
          }
        }
        Object.assign(choice, other);
        if (!delta)
          continue;
        const { content, refusal, function_call, role, tool_calls, ...rest2 } = delta;
        Object.assign(choice.message, rest2);
        if (refusal) {
          choice.message.refusal = (choice.message.refusal || "") + refusal;
        }
        if (role)
          choice.message.role = role;
        if (function_call) {
          if (!choice.message.function_call) {
            choice.message.function_call = function_call;
          } else {
            if (function_call.name)
              choice.message.function_call.name = function_call.name;
            if (function_call.arguments) {
              (_c = choice.message.function_call).arguments ?? (_c.arguments = "");
              choice.message.function_call.arguments += function_call.arguments;
            }
          }
        }
        if (content) {
          choice.message.content = (choice.message.content || "") + content;
          if (!choice.message.refusal && __classPrivateFieldGet$1(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getAutoParseableResponseFormat).call(this)) {
            choice.message.parsed = partialParse(choice.message.content);
          }
        }
        if (tool_calls) {
          if (!choice.message.tool_calls)
            choice.message.tool_calls = [];
          for (const { index: index2, id, type: type2, function: fn, ...rest3 } of tool_calls) {
            const tool_call = (_d = choice.message.tool_calls)[index2] ?? (_d[index2] = {});
            Object.assign(tool_call, rest3);
            if (id)
              tool_call.id = id;
            if (type2)
              tool_call.type = type2;
            if (fn)
              tool_call.function ?? (tool_call.function = { name: fn.name ?? "", arguments: "" });
            if (fn == null ? void 0 : fn.name)
              tool_call.function.name = fn.name;
            if (fn == null ? void 0 : fn.arguments) {
              tool_call.function.arguments += fn.arguments;
              if (shouldParseToolCall(__classPrivateFieldGet$1(this, _ChatCompletionStream_params, "f"), tool_call)) {
                tool_call.function.parsed_arguments = partialParse(tool_call.function.arguments);
              }
            }
          }
        }
      }
      return snapshot;
    }, Symbol.asyncIterator)]() {
      const pushQueue = [];
      const readQueue = [];
      let done = false;
      this.on("chunk", (chunk) => {
        const reader = readQueue.shift();
        if (reader) {
          reader.resolve(chunk);
        } else {
          pushQueue.push(chunk);
        }
      });
      this.on("end", () => {
        done = true;
        for (const reader of readQueue) {
          reader.resolve(void 0);
        }
        readQueue.length = 0;
      });
      this.on("abort", (err) => {
        done = true;
        for (const reader of readQueue) {
          reader.reject(err);
        }
        readQueue.length = 0;
      });
      this.on("error", (err) => {
        done = true;
        for (const reader of readQueue) {
          reader.reject(err);
        }
        readQueue.length = 0;
      });
      return {
        next: async () => {
          if (!pushQueue.length) {
            if (done) {
              return { value: void 0, done: true };
            }
            return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
          }
          const chunk = pushQueue.shift();
          return { value: chunk, done: false };
        },
        return: async () => {
          this.abort();
          return { value: void 0, done: true };
        }
      };
    }
    toReadableStream() {
      const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
      return stream.toReadableStream();
    }
  }
  function finalizeChatCompletion(snapshot, params) {
    const { id, choices, created, model, system_fingerprint, ...rest } = snapshot;
    const completion = {
      ...rest,
      id,
      choices: choices.map(({ message, finish_reason, index, logprobs, ...choiceRest }) => {
        if (!finish_reason) {
          throw new OpenAIError(`missing finish_reason for choice ${index}`);
        }
        const { content = null, function_call, tool_calls, ...messageRest } = message;
        const role = message.role;
        if (!role) {
          throw new OpenAIError(`missing role for choice ${index}`);
        }
        if (function_call) {
          const { arguments: args, name } = function_call;
          if (args == null) {
            throw new OpenAIError(`missing function_call.arguments for choice ${index}`);
          }
          if (!name) {
            throw new OpenAIError(`missing function_call.name for choice ${index}`);
          }
          return {
            ...choiceRest,
            message: {
              content,
              function_call: { arguments: args, name },
              role,
              refusal: message.refusal ?? null
            },
            finish_reason,
            index,
            logprobs
          };
        }
        if (tool_calls) {
          return {
            ...choiceRest,
            index,
            finish_reason,
            logprobs,
            message: {
              ...messageRest,
              role,
              content,
              refusal: message.refusal ?? null,
              tool_calls: tool_calls.map((tool_call, i) => {
                const { function: fn, type: type2, id: id2, ...toolRest } = tool_call;
                const { arguments: args, name, ...fnRest } = fn || {};
                if (id2 == null) {
                  throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].id
${str(snapshot)}`);
                }
                if (type2 == null) {
                  throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].type
${str(snapshot)}`);
                }
                if (name == null) {
                  throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].function.name
${str(snapshot)}`);
                }
                if (args == null) {
                  throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].function.arguments
${str(snapshot)}`);
                }
                return { ...toolRest, id: id2, type: type2, function: { ...fnRest, name, arguments: args } };
              })
            }
          };
        }
        return {
          ...choiceRest,
          message: { ...messageRest, content, role, refusal: message.refusal ?? null },
          finish_reason,
          index,
          logprobs
        };
      }),
      created,
      model,
      object: "chat.completion",
      ...system_fingerprint ? { system_fingerprint } : {}
    };
    return maybeParseChatCompletion(completion, params);
  }
  function str(x) {
    return JSON.stringify(x);
  }
  function assertNever(_x) {
  }
  class ChatCompletionStreamingRunner extends ChatCompletionStream {
    static fromReadableStream(stream) {
      const runner = new ChatCompletionStreamingRunner(null);
      runner._run(() => runner._fromReadableStream(stream));
      return runner;
    }
    /** @deprecated - please use `runTools` instead. */
    static runFunctions(client, params, options) {
      const runner = new ChatCompletionStreamingRunner(null);
      const opts = {
        ...options,
        headers: { ...options == null ? void 0 : options.headers, "X-Stainless-Helper-Method": "runFunctions" }
      };
      runner._run(() => runner._runFunctions(client, params, opts));
      return runner;
    }
    static runTools(client, params, options) {
      const runner = new ChatCompletionStreamingRunner(
        // @ts-expect-error TODO these types are incompatible
        params
      );
      const opts = {
        ...options,
        headers: { ...options == null ? void 0 : options.headers, "X-Stainless-Helper-Method": "runTools" }
      };
      runner._run(() => runner._runTools(client, params, opts));
      return runner;
    }
  }
  let Completions$1 = class Completions extends APIResource {
    async parse(body, options) {
      validateInputTools(body.tools);
      const completion = await this._client.chat.completions.create(body, {
        ...options,
        headers: {
          ...options == null ? void 0 : options.headers,
          "X-Stainless-Helper-Method": "beta.chat.completions.parse"
        }
      });
      return parseChatCompletion(completion, body);
    }
    runFunctions(body, options) {
      if (body.stream) {
        return ChatCompletionStreamingRunner.runFunctions(this._client, body, options);
      }
      return ChatCompletionRunner.runFunctions(this._client, body, options);
    }
    runTools(body, options) {
      if (body.stream) {
        return ChatCompletionStreamingRunner.runTools(this._client, body, options);
      }
      return ChatCompletionRunner.runTools(this._client, body, options);
    }
    /**
     * Creates a chat completion stream
     */
    stream(body, options) {
      return ChatCompletionStream.createChatCompletion(this._client, body, options);
    }
  };
  class Chat extends APIResource {
    constructor() {
      super(...arguments);
      this.completions = new Completions$1(this._client);
    }
  }
  (function(Chat2) {
    Chat2.Completions = Completions$1;
  })(Chat || (Chat = {}));
  var __classPrivateFieldGet = function(receiver, state, kind2, f) {
    if (kind2 === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind2 === "m" ? f : kind2 === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
  };
  var __classPrivateFieldSet = function(receiver, state, value, kind2, f) {
    if (kind2 === "m") throw new TypeError("Private method is not writable");
    if (kind2 === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind2 === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
  };
  var _AssistantStream_instances, _AssistantStream_events, _AssistantStream_runStepSnapshots, _AssistantStream_messageSnapshots, _AssistantStream_messageSnapshot, _AssistantStream_finalRun, _AssistantStream_currentContentIndex, _AssistantStream_currentContent, _AssistantStream_currentToolCallIndex, _AssistantStream_currentToolCall, _AssistantStream_currentEvent, _AssistantStream_currentRunSnapshot, _AssistantStream_currentRunStepSnapshot, _AssistantStream_addEvent, _AssistantStream_endRequest, _AssistantStream_handleMessage, _AssistantStream_handleRunStep, _AssistantStream_handleEvent, _AssistantStream_accumulateRunStep, _AssistantStream_accumulateMessage, _AssistantStream_accumulateContent, _AssistantStream_handleRun;
  class AssistantStream extends EventStream {
    constructor() {
      super(...arguments);
      _AssistantStream_instances.add(this);
      _AssistantStream_events.set(this, []);
      _AssistantStream_runStepSnapshots.set(this, {});
      _AssistantStream_messageSnapshots.set(this, {});
      _AssistantStream_messageSnapshot.set(this, void 0);
      _AssistantStream_finalRun.set(this, void 0);
      _AssistantStream_currentContentIndex.set(this, void 0);
      _AssistantStream_currentContent.set(this, void 0);
      _AssistantStream_currentToolCallIndex.set(this, void 0);
      _AssistantStream_currentToolCall.set(this, void 0);
      _AssistantStream_currentEvent.set(this, void 0);
      _AssistantStream_currentRunSnapshot.set(this, void 0);
      _AssistantStream_currentRunStepSnapshot.set(this, void 0);
    }
    [(_AssistantStream_events = /* @__PURE__ */ new WeakMap(), _AssistantStream_runStepSnapshots = /* @__PURE__ */ new WeakMap(), _AssistantStream_messageSnapshots = /* @__PURE__ */ new WeakMap(), _AssistantStream_messageSnapshot = /* @__PURE__ */ new WeakMap(), _AssistantStream_finalRun = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentContentIndex = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentContent = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentToolCallIndex = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentToolCall = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentEvent = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentRunSnapshot = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentRunStepSnapshot = /* @__PURE__ */ new WeakMap(), _AssistantStream_instances = /* @__PURE__ */ new WeakSet(), Symbol.asyncIterator)]() {
      const pushQueue = [];
      const readQueue = [];
      let done = false;
      this.on("event", (event) => {
        const reader = readQueue.shift();
        if (reader) {
          reader.resolve(event);
        } else {
          pushQueue.push(event);
        }
      });
      this.on("end", () => {
        done = true;
        for (const reader of readQueue) {
          reader.resolve(void 0);
        }
        readQueue.length = 0;
      });
      this.on("abort", (err) => {
        done = true;
        for (const reader of readQueue) {
          reader.reject(err);
        }
        readQueue.length = 0;
      });
      this.on("error", (err) => {
        done = true;
        for (const reader of readQueue) {
          reader.reject(err);
        }
        readQueue.length = 0;
      });
      return {
        next: async () => {
          if (!pushQueue.length) {
            if (done) {
              return { value: void 0, done: true };
            }
            return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
          }
          const chunk = pushQueue.shift();
          return { value: chunk, done: false };
        },
        return: async () => {
          this.abort();
          return { value: void 0, done: true };
        }
      };
    }
    static fromReadableStream(stream) {
      const runner = new AssistantStream();
      runner._run(() => runner._fromReadableStream(stream));
      return runner;
    }
    async _fromReadableStream(readableStream, options) {
      var _a2;
      const signal = options == null ? void 0 : options.signal;
      if (signal) {
        if (signal.aborted)
          this.controller.abort();
        signal.addEventListener("abort", () => this.controller.abort());
      }
      this._connected();
      const stream = Stream.fromReadableStream(readableStream, this.controller);
      for await (const event of stream) {
        __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
      }
      if ((_a2 = stream.controller.signal) == null ? void 0 : _a2.aborted) {
        throw new APIUserAbortError();
      }
      return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
    }
    toReadableStream() {
      const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
      return stream.toReadableStream();
    }
    static createToolAssistantStream(threadId, runId, runs, params, options) {
      const runner = new AssistantStream();
      runner._run(() => runner._runToolAssistantStream(threadId, runId, runs, params, {
        ...options,
        headers: { ...options == null ? void 0 : options.headers, "X-Stainless-Helper-Method": "stream" }
      }));
      return runner;
    }
    async _createToolAssistantStream(run, threadId, runId, params, options) {
      var _a2;
      const signal = options == null ? void 0 : options.signal;
      if (signal) {
        if (signal.aborted)
          this.controller.abort();
        signal.addEventListener("abort", () => this.controller.abort());
      }
      const body = { ...params, stream: true };
      const stream = await run.submitToolOutputs(threadId, runId, body, {
        ...options,
        signal: this.controller.signal
      });
      this._connected();
      for await (const event of stream) {
        __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
      }
      if ((_a2 = stream.controller.signal) == null ? void 0 : _a2.aborted) {
        throw new APIUserAbortError();
      }
      return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
    }
    static createThreadAssistantStream(params, thread, options) {
      const runner = new AssistantStream();
      runner._run(() => runner._threadAssistantStream(params, thread, {
        ...options,
        headers: { ...options == null ? void 0 : options.headers, "X-Stainless-Helper-Method": "stream" }
      }));
      return runner;
    }
    static createAssistantStream(threadId, runs, params, options) {
      const runner = new AssistantStream();
      runner._run(() => runner._runAssistantStream(threadId, runs, params, {
        ...options,
        headers: { ...options == null ? void 0 : options.headers, "X-Stainless-Helper-Method": "stream" }
      }));
      return runner;
    }
    currentEvent() {
      return __classPrivateFieldGet(this, _AssistantStream_currentEvent, "f");
    }
    currentRun() {
      return __classPrivateFieldGet(this, _AssistantStream_currentRunSnapshot, "f");
    }
    currentMessageSnapshot() {
      return __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f");
    }
    currentRunStepSnapshot() {
      return __classPrivateFieldGet(this, _AssistantStream_currentRunStepSnapshot, "f");
    }
    async finalRunSteps() {
      await this.done();
      return Object.values(__classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f"));
    }
    async finalMessages() {
      await this.done();
      return Object.values(__classPrivateFieldGet(this, _AssistantStream_messageSnapshots, "f"));
    }
    async finalRun() {
      await this.done();
      if (!__classPrivateFieldGet(this, _AssistantStream_finalRun, "f"))
        throw Error("Final run was not received.");
      return __classPrivateFieldGet(this, _AssistantStream_finalRun, "f");
    }
    async _createThreadAssistantStream(thread, params, options) {
      var _a2;
      const signal = options == null ? void 0 : options.signal;
      if (signal) {
        if (signal.aborted)
          this.controller.abort();
        signal.addEventListener("abort", () => this.controller.abort());
      }
      const body = { ...params, stream: true };
      const stream = await thread.createAndRun(body, { ...options, signal: this.controller.signal });
      this._connected();
      for await (const event of stream) {
        __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
      }
      if ((_a2 = stream.controller.signal) == null ? void 0 : _a2.aborted) {
        throw new APIUserAbortError();
      }
      return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
    }
    async _createAssistantStream(run, threadId, params, options) {
      var _a2;
      const signal = options == null ? void 0 : options.signal;
      if (signal) {
        if (signal.aborted)
          this.controller.abort();
        signal.addEventListener("abort", () => this.controller.abort());
      }
      const body = { ...params, stream: true };
      const stream = await run.create(threadId, body, { ...options, signal: this.controller.signal });
      this._connected();
      for await (const event of stream) {
        __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
      }
      if ((_a2 = stream.controller.signal) == null ? void 0 : _a2.aborted) {
        throw new APIUserAbortError();
      }
      return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
    }
    static accumulateDelta(acc, delta) {
      for (const [key, deltaValue] of Object.entries(delta)) {
        if (!acc.hasOwnProperty(key)) {
          acc[key] = deltaValue;
          continue;
        }
        let accValue = acc[key];
        if (accValue === null || accValue === void 0) {
          acc[key] = deltaValue;
          continue;
        }
        if (key === "index" || key === "type") {
          acc[key] = deltaValue;
          continue;
        }
        if (typeof accValue === "string" && typeof deltaValue === "string") {
          accValue += deltaValue;
        } else if (typeof accValue === "number" && typeof deltaValue === "number") {
          accValue += deltaValue;
        } else if (isObj(accValue) && isObj(deltaValue)) {
          accValue = this.accumulateDelta(accValue, deltaValue);
        } else if (Array.isArray(accValue) && Array.isArray(deltaValue)) {
          if (accValue.every((x) => typeof x === "string" || typeof x === "number")) {
            accValue.push(...deltaValue);
            continue;
          }
        } else {
          throw Error(`Unhandled record type: ${key}, deltaValue: ${deltaValue}, accValue: ${accValue}`);
        }
        acc[key] = accValue;
      }
      return acc;
    }
    _addRun(run) {
      return run;
    }
    async _threadAssistantStream(params, thread, options) {
      return await this._createThreadAssistantStream(thread, params, options);
    }
    async _runAssistantStream(threadId, runs, params, options) {
      return await this._createAssistantStream(runs, threadId, params, options);
    }
    async _runToolAssistantStream(threadId, runId, runs, params, options) {
      return await this._createToolAssistantStream(runs, threadId, runId, params, options);
    }
  }
  _AssistantStream_addEvent = function _AssistantStream_addEvent2(event) {
    if (this.ended)
      return;
    __classPrivateFieldSet(this, _AssistantStream_currentEvent, event, "f");
    __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleEvent).call(this, event);
    switch (event.event) {
      case "thread.created":
        break;
      case "thread.run.created":
      case "thread.run.queued":
      case "thread.run.in_progress":
      case "thread.run.requires_action":
      case "thread.run.completed":
      case "thread.run.failed":
      case "thread.run.cancelling":
      case "thread.run.cancelled":
      case "thread.run.expired":
        __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleRun).call(this, event);
        break;
      case "thread.run.step.created":
      case "thread.run.step.in_progress":
      case "thread.run.step.delta":
      case "thread.run.step.completed":
      case "thread.run.step.failed":
      case "thread.run.step.cancelled":
      case "thread.run.step.expired":
        __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleRunStep).call(this, event);
        break;
      case "thread.message.created":
      case "thread.message.in_progress":
      case "thread.message.delta":
      case "thread.message.completed":
      case "thread.message.incomplete":
        __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleMessage).call(this, event);
        break;
      case "error":
        throw new Error("Encountered an error event in event processing - errors should be processed earlier");
    }
  }, _AssistantStream_endRequest = function _AssistantStream_endRequest2() {
    if (this.ended) {
      throw new OpenAIError(`stream has ended, this shouldn't happen`);
    }
    if (!__classPrivateFieldGet(this, _AssistantStream_finalRun, "f"))
      throw Error("Final run has not been received");
    return __classPrivateFieldGet(this, _AssistantStream_finalRun, "f");
  }, _AssistantStream_handleMessage = function _AssistantStream_handleMessage2(event) {
    const [accumulatedMessage, newContent] = __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_accumulateMessage).call(this, event, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
    __classPrivateFieldSet(this, _AssistantStream_messageSnapshot, accumulatedMessage, "f");
    __classPrivateFieldGet(this, _AssistantStream_messageSnapshots, "f")[accumulatedMessage.id] = accumulatedMessage;
    for (const content of newContent) {
      const snapshotContent = accumulatedMessage.content[content.index];
      if ((snapshotContent == null ? void 0 : snapshotContent.type) == "text") {
        this._emit("textCreated", snapshotContent.text);
      }
    }
    switch (event.event) {
      case "thread.message.created":
        this._emit("messageCreated", event.data);
        break;
      case "thread.message.in_progress":
        break;
      case "thread.message.delta":
        this._emit("messageDelta", event.data.delta, accumulatedMessage);
        if (event.data.delta.content) {
          for (const content of event.data.delta.content) {
            if (content.type == "text" && content.text) {
              let textDelta = content.text;
              let snapshot = accumulatedMessage.content[content.index];
              if (snapshot && snapshot.type == "text") {
                this._emit("textDelta", textDelta, snapshot.text);
              } else {
                throw Error("The snapshot associated with this text delta is not text or missing");
              }
            }
            if (content.index != __classPrivateFieldGet(this, _AssistantStream_currentContentIndex, "f")) {
              if (__classPrivateFieldGet(this, _AssistantStream_currentContent, "f")) {
                switch (__classPrivateFieldGet(this, _AssistantStream_currentContent, "f").type) {
                  case "text":
                    this._emit("textDone", __classPrivateFieldGet(this, _AssistantStream_currentContent, "f").text, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
                    break;
                  case "image_file":
                    this._emit("imageFileDone", __classPrivateFieldGet(this, _AssistantStream_currentContent, "f").image_file, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
                    break;
                }
              }
              __classPrivateFieldSet(this, _AssistantStream_currentContentIndex, content.index, "f");
            }
            __classPrivateFieldSet(this, _AssistantStream_currentContent, accumulatedMessage.content[content.index], "f");
          }
        }
        break;
      case "thread.message.completed":
      case "thread.message.incomplete":
        if (__classPrivateFieldGet(this, _AssistantStream_currentContentIndex, "f") !== void 0) {
          const currentContent = event.data.content[__classPrivateFieldGet(this, _AssistantStream_currentContentIndex, "f")];
          if (currentContent) {
            switch (currentContent.type) {
              case "image_file":
                this._emit("imageFileDone", currentContent.image_file, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
                break;
              case "text":
                this._emit("textDone", currentContent.text, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
                break;
            }
          }
        }
        if (__classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f")) {
          this._emit("messageDone", event.data);
        }
        __classPrivateFieldSet(this, _AssistantStream_messageSnapshot, void 0, "f");
    }
  }, _AssistantStream_handleRunStep = function _AssistantStream_handleRunStep2(event) {
    const accumulatedRunStep = __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_accumulateRunStep).call(this, event);
    __classPrivateFieldSet(this, _AssistantStream_currentRunStepSnapshot, accumulatedRunStep, "f");
    switch (event.event) {
      case "thread.run.step.created":
        this._emit("runStepCreated", event.data);
        break;
      case "thread.run.step.delta":
        const delta = event.data.delta;
        if (delta.step_details && delta.step_details.type == "tool_calls" && delta.step_details.tool_calls && accumulatedRunStep.step_details.type == "tool_calls") {
          for (const toolCall of delta.step_details.tool_calls) {
            if (toolCall.index == __classPrivateFieldGet(this, _AssistantStream_currentToolCallIndex, "f")) {
              this._emit("toolCallDelta", toolCall, accumulatedRunStep.step_details.tool_calls[toolCall.index]);
            } else {
              if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f")) {
                this._emit("toolCallDone", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
              }
              __classPrivateFieldSet(this, _AssistantStream_currentToolCallIndex, toolCall.index, "f");
              __classPrivateFieldSet(this, _AssistantStream_currentToolCall, accumulatedRunStep.step_details.tool_calls[toolCall.index], "f");
              if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"))
                this._emit("toolCallCreated", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
            }
          }
        }
        this._emit("runStepDelta", event.data.delta, accumulatedRunStep);
        break;
      case "thread.run.step.completed":
      case "thread.run.step.failed":
      case "thread.run.step.cancelled":
      case "thread.run.step.expired":
        __classPrivateFieldSet(this, _AssistantStream_currentRunStepSnapshot, void 0, "f");
        const details = event.data.step_details;
        if (details.type == "tool_calls") {
          if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f")) {
            this._emit("toolCallDone", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
            __classPrivateFieldSet(this, _AssistantStream_currentToolCall, void 0, "f");
          }
        }
        this._emit("runStepDone", event.data, accumulatedRunStep);
        break;
    }
  }, _AssistantStream_handleEvent = function _AssistantStream_handleEvent2(event) {
    __classPrivateFieldGet(this, _AssistantStream_events, "f").push(event);
    this._emit("event", event);
  }, _AssistantStream_accumulateRunStep = function _AssistantStream_accumulateRunStep2(event) {
    switch (event.event) {
      case "thread.run.step.created":
        __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = event.data;
        return event.data;
      case "thread.run.step.delta":
        let snapshot = __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
        if (!snapshot) {
          throw Error("Received a RunStepDelta before creation of a snapshot");
        }
        let data = event.data;
        if (data.delta) {
          const accumulated = AssistantStream.accumulateDelta(snapshot, data.delta);
          __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = accumulated;
        }
        return __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
      case "thread.run.step.completed":
      case "thread.run.step.failed":
      case "thread.run.step.cancelled":
      case "thread.run.step.expired":
      case "thread.run.step.in_progress":
        __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = event.data;
        break;
    }
    if (__classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id])
      return __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
    throw new Error("No snapshot available");
  }, _AssistantStream_accumulateMessage = function _AssistantStream_accumulateMessage2(event, snapshot) {
    let newContent = [];
    switch (event.event) {
      case "thread.message.created":
        return [event.data, newContent];
      case "thread.message.delta":
        if (!snapshot) {
          throw Error("Received a delta with no existing snapshot (there should be one from message creation)");
        }
        let data = event.data;
        if (data.delta.content) {
          for (const contentElement of data.delta.content) {
            if (contentElement.index in snapshot.content) {
              let currentContent = snapshot.content[contentElement.index];
              snapshot.content[contentElement.index] = __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_accumulateContent).call(this, contentElement, currentContent);
            } else {
              snapshot.content[contentElement.index] = contentElement;
              newContent.push(contentElement);
            }
          }
        }
        return [snapshot, newContent];
      case "thread.message.in_progress":
      case "thread.message.completed":
      case "thread.message.incomplete":
        if (snapshot) {
          return [snapshot, newContent];
        } else {
          throw Error("Received thread message event with no existing snapshot");
        }
    }
    throw Error("Tried to accumulate a non-message event");
  }, _AssistantStream_accumulateContent = function _AssistantStream_accumulateContent2(contentElement, currentContent) {
    return AssistantStream.accumulateDelta(currentContent, contentElement);
  }, _AssistantStream_handleRun = function _AssistantStream_handleRun2(event) {
    __classPrivateFieldSet(this, _AssistantStream_currentRunSnapshot, event.data, "f");
    switch (event.event) {
      case "thread.run.created":
        break;
      case "thread.run.queued":
        break;
      case "thread.run.in_progress":
        break;
      case "thread.run.requires_action":
      case "thread.run.cancelled":
      case "thread.run.failed":
      case "thread.run.completed":
      case "thread.run.expired":
        __classPrivateFieldSet(this, _AssistantStream_finalRun, event.data, "f");
        if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f")) {
          this._emit("toolCallDone", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
          __classPrivateFieldSet(this, _AssistantStream_currentToolCall, void 0, "f");
        }
        break;
    }
  };
  class Messages extends APIResource {
    /**
     * Create a message.
     */
    create(threadId, body, options) {
      return this._client.post(`/threads/${threadId}/messages`, {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Retrieve a message.
     */
    retrieve(threadId, messageId, options) {
      return this._client.get(`/threads/${threadId}/messages/${messageId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Modifies a message.
     */
    update(threadId, messageId, body, options) {
      return this._client.post(`/threads/${threadId}/messages/${messageId}`, {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    list(threadId, query = {}, options) {
      if (isRequestOptions(query)) {
        return this.list(threadId, {}, query);
      }
      return this._client.getAPIList(`/threads/${threadId}/messages`, MessagesPage, {
        query,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Deletes a message.
     */
    del(threadId, messageId, options) {
      return this._client.delete(`/threads/${threadId}/messages/${messageId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
  }
  class MessagesPage extends CursorPage {
  }
  (function(Messages2) {
    Messages2.MessagesPage = MessagesPage;
  })(Messages || (Messages = {}));
  class Steps extends APIResource {
    /**
     * Retrieves a run step.
     */
    retrieve(threadId, runId, stepId, options) {
      return this._client.get(`/threads/${threadId}/runs/${runId}/steps/${stepId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    list(threadId, runId, query = {}, options) {
      if (isRequestOptions(query)) {
        return this.list(threadId, runId, {}, query);
      }
      return this._client.getAPIList(`/threads/${threadId}/runs/${runId}/steps`, RunStepsPage, {
        query,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
  }
  class RunStepsPage extends CursorPage {
  }
  (function(Steps2) {
    Steps2.RunStepsPage = RunStepsPage;
  })(Steps || (Steps = {}));
  class Runs extends APIResource {
    constructor() {
      super(...arguments);
      this.steps = new Steps(this._client);
    }
    create(threadId, body, options) {
      return this._client.post(`/threads/${threadId}/runs`, {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers },
        stream: body.stream ?? false
      });
    }
    /**
     * Retrieves a run.
     */
    retrieve(threadId, runId, options) {
      return this._client.get(`/threads/${threadId}/runs/${runId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Modifies a run.
     */
    update(threadId, runId, body, options) {
      return this._client.post(`/threads/${threadId}/runs/${runId}`, {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    list(threadId, query = {}, options) {
      if (isRequestOptions(query)) {
        return this.list(threadId, {}, query);
      }
      return this._client.getAPIList(`/threads/${threadId}/runs`, RunsPage, {
        query,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Cancels a run that is `in_progress`.
     */
    cancel(threadId, runId, options) {
      return this._client.post(`/threads/${threadId}/runs/${runId}/cancel`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * A helper to create a run an poll for a terminal state. More information on Run
     * lifecycles can be found here:
     * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
     */
    async createAndPoll(threadId, body, options) {
      const run = await this.create(threadId, body, options);
      return await this.poll(threadId, run.id, options);
    }
    /**
     * Create a Run stream
     *
     * @deprecated use `stream` instead
     */
    createAndStream(threadId, body, options) {
      return AssistantStream.createAssistantStream(threadId, this._client.beta.threads.runs, body, options);
    }
    /**
     * A helper to poll a run status until it reaches a terminal state. More
     * information on Run lifecycles can be found here:
     * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
     */
    async poll(threadId, runId, options) {
      const headers = { ...options == null ? void 0 : options.headers, "X-Stainless-Poll-Helper": "true" };
      if (options == null ? void 0 : options.pollIntervalMs) {
        headers["X-Stainless-Custom-Poll-Interval"] = options.pollIntervalMs.toString();
      }
      while (true) {
        const { data: run, response } = await this.retrieve(threadId, runId, {
          ...options,
          headers: { ...options == null ? void 0 : options.headers, ...headers }
        }).withResponse();
        switch (run.status) {
          case "queued":
          case "in_progress":
          case "cancelling":
            let sleepInterval = 5e3;
            if (options == null ? void 0 : options.pollIntervalMs) {
              sleepInterval = options.pollIntervalMs;
            } else {
              const headerInterval = response.headers.get("openai-poll-after-ms");
              if (headerInterval) {
                const headerIntervalMs = parseInt(headerInterval);
                if (!isNaN(headerIntervalMs)) {
                  sleepInterval = headerIntervalMs;
                }
              }
            }
            await sleep$1(sleepInterval);
            break;
          case "requires_action":
          case "incomplete":
          case "cancelled":
          case "completed":
          case "failed":
          case "expired":
            return run;
        }
      }
    }
    /**
     * Create a Run stream
     */
    stream(threadId, body, options) {
      return AssistantStream.createAssistantStream(threadId, this._client.beta.threads.runs, body, options);
    }
    submitToolOutputs(threadId, runId, body, options) {
      return this._client.post(`/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers },
        stream: body.stream ?? false
      });
    }
    /**
     * A helper to submit a tool output to a run and poll for a terminal run state.
     * More information on Run lifecycles can be found here:
     * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
     */
    async submitToolOutputsAndPoll(threadId, runId, body, options) {
      const run = await this.submitToolOutputs(threadId, runId, body, options);
      return await this.poll(threadId, run.id, options);
    }
    /**
     * Submit the tool outputs from a previous run and stream the run to a terminal
     * state. More information on Run lifecycles can be found here:
     * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
     */
    submitToolOutputsStream(threadId, runId, body, options) {
      return AssistantStream.createToolAssistantStream(threadId, runId, this._client.beta.threads.runs, body, options);
    }
  }
  class RunsPage extends CursorPage {
  }
  (function(Runs2) {
    Runs2.RunsPage = RunsPage;
    Runs2.Steps = Steps;
    Runs2.RunStepsPage = RunStepsPage;
  })(Runs || (Runs = {}));
  class Threads extends APIResource {
    constructor() {
      super(...arguments);
      this.runs = new Runs(this._client);
      this.messages = new Messages(this._client);
    }
    create(body = {}, options) {
      if (isRequestOptions(body)) {
        return this.create({}, body);
      }
      return this._client.post("/threads", {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Retrieves a thread.
     */
    retrieve(threadId, options) {
      return this._client.get(`/threads/${threadId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Modifies a thread.
     */
    update(threadId, body, options) {
      return this._client.post(`/threads/${threadId}`, {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Delete a thread.
     */
    del(threadId, options) {
      return this._client.delete(`/threads/${threadId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    createAndRun(body, options) {
      return this._client.post("/threads/runs", {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers },
        stream: body.stream ?? false
      });
    }
    /**
     * A helper to create a thread, start a run and then poll for a terminal state.
     * More information on Run lifecycles can be found here:
     * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
     */
    async createAndRunPoll(body, options) {
      const run = await this.createAndRun(body, options);
      return await this.runs.poll(run.thread_id, run.id, options);
    }
    /**
     * Create a thread and stream the run back
     */
    createAndRunStream(body, options) {
      return AssistantStream.createThreadAssistantStream(body, this._client.beta.threads, options);
    }
  }
  (function(Threads2) {
    Threads2.Runs = Runs;
    Threads2.RunsPage = RunsPage;
    Threads2.Messages = Messages;
    Threads2.MessagesPage = MessagesPage;
  })(Threads || (Threads = {}));
  const allSettledWithThrow = async (promises) => {
    const results = await Promise.allSettled(promises);
    const rejected = results.filter((result) => result.status === "rejected");
    if (rejected.length) {
      for (const result of rejected) {
        console.error(result.reason);
      }
      throw new Error(`${rejected.length} promise(s) failed - see the above errors`);
    }
    const values = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        values.push(result.value);
      }
    }
    return values;
  };
  let Files$1 = class Files extends APIResource {
    /**
     * Create a vector store file by attaching a
     * [File](https://platform.openai.com/docs/api-reference/files) to a
     * [vector store](https://platform.openai.com/docs/api-reference/vector-stores/object).
     */
    create(vectorStoreId, body, options) {
      return this._client.post(`/vector_stores/${vectorStoreId}/files`, {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Retrieves a vector store file.
     */
    retrieve(vectorStoreId, fileId, options) {
      return this._client.get(`/vector_stores/${vectorStoreId}/files/${fileId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    list(vectorStoreId, query = {}, options) {
      if (isRequestOptions(query)) {
        return this.list(vectorStoreId, {}, query);
      }
      return this._client.getAPIList(`/vector_stores/${vectorStoreId}/files`, VectorStoreFilesPage, {
        query,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Delete a vector store file. This will remove the file from the vector store but
     * the file itself will not be deleted. To delete the file, use the
     * [delete file](https://platform.openai.com/docs/api-reference/files/delete)
     * endpoint.
     */
    del(vectorStoreId, fileId, options) {
      return this._client.delete(`/vector_stores/${vectorStoreId}/files/${fileId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Attach a file to the given vector store and wait for it to be processed.
     */
    async createAndPoll(vectorStoreId, body, options) {
      const file = await this.create(vectorStoreId, body, options);
      return await this.poll(vectorStoreId, file.id, options);
    }
    /**
     * Wait for the vector store file to finish processing.
     *
     * Note: this will return even if the file failed to process, you need to check
     * file.last_error and file.status to handle these cases
     */
    async poll(vectorStoreId, fileId, options) {
      const headers = { ...options == null ? void 0 : options.headers, "X-Stainless-Poll-Helper": "true" };
      if (options == null ? void 0 : options.pollIntervalMs) {
        headers["X-Stainless-Custom-Poll-Interval"] = options.pollIntervalMs.toString();
      }
      while (true) {
        const fileResponse = await this.retrieve(vectorStoreId, fileId, {
          ...options,
          headers
        }).withResponse();
        const file = fileResponse.data;
        switch (file.status) {
          case "in_progress":
            let sleepInterval = 5e3;
            if (options == null ? void 0 : options.pollIntervalMs) {
              sleepInterval = options.pollIntervalMs;
            } else {
              const headerInterval = fileResponse.response.headers.get("openai-poll-after-ms");
              if (headerInterval) {
                const headerIntervalMs = parseInt(headerInterval);
                if (!isNaN(headerIntervalMs)) {
                  sleepInterval = headerIntervalMs;
                }
              }
            }
            await sleep$1(sleepInterval);
            break;
          case "failed":
          case "completed":
            return file;
        }
      }
    }
    /**
     * Upload a file to the `files` API and then attach it to the given vector store.
     *
     * Note the file will be asynchronously processed (you can use the alternative
     * polling helper method to wait for processing to complete).
     */
    async upload(vectorStoreId, file, options) {
      const fileInfo = await this._client.files.create({ file, purpose: "assistants" }, options);
      return this.create(vectorStoreId, { file_id: fileInfo.id }, options);
    }
    /**
     * Add a file to a vector store and poll until processing is complete.
     */
    async uploadAndPoll(vectorStoreId, file, options) {
      const fileInfo = await this.upload(vectorStoreId, file, options);
      return await this.poll(vectorStoreId, fileInfo.id, options);
    }
  };
  class VectorStoreFilesPage extends CursorPage {
  }
  (function(Files2) {
    Files2.VectorStoreFilesPage = VectorStoreFilesPage;
  })(Files$1 || (Files$1 = {}));
  class FileBatches extends APIResource {
    /**
     * Create a vector store file batch.
     */
    create(vectorStoreId, body, options) {
      return this._client.post(`/vector_stores/${vectorStoreId}/file_batches`, {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Retrieves a vector store file batch.
     */
    retrieve(vectorStoreId, batchId, options) {
      return this._client.get(`/vector_stores/${vectorStoreId}/file_batches/${batchId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Cancel a vector store file batch. This attempts to cancel the processing of
     * files in this batch as soon as possible.
     */
    cancel(vectorStoreId, batchId, options) {
      return this._client.post(`/vector_stores/${vectorStoreId}/file_batches/${batchId}/cancel`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Create a vector store batch and poll until all files have been processed.
     */
    async createAndPoll(vectorStoreId, body, options) {
      const batch = await this.create(vectorStoreId, body);
      return await this.poll(vectorStoreId, batch.id, options);
    }
    listFiles(vectorStoreId, batchId, query = {}, options) {
      if (isRequestOptions(query)) {
        return this.listFiles(vectorStoreId, batchId, {}, query);
      }
      return this._client.getAPIList(`/vector_stores/${vectorStoreId}/file_batches/${batchId}/files`, VectorStoreFilesPage, { query, ...options, headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers } });
    }
    /**
     * Wait for the given file batch to be processed.
     *
     * Note: this will return even if one of the files failed to process, you need to
     * check batch.file_counts.failed_count to handle this case.
     */
    async poll(vectorStoreId, batchId, options) {
      const headers = { ...options == null ? void 0 : options.headers, "X-Stainless-Poll-Helper": "true" };
      if (options == null ? void 0 : options.pollIntervalMs) {
        headers["X-Stainless-Custom-Poll-Interval"] = options.pollIntervalMs.toString();
      }
      while (true) {
        const { data: batch, response } = await this.retrieve(vectorStoreId, batchId, {
          ...options,
          headers
        }).withResponse();
        switch (batch.status) {
          case "in_progress":
            let sleepInterval = 5e3;
            if (options == null ? void 0 : options.pollIntervalMs) {
              sleepInterval = options.pollIntervalMs;
            } else {
              const headerInterval = response.headers.get("openai-poll-after-ms");
              if (headerInterval) {
                const headerIntervalMs = parseInt(headerInterval);
                if (!isNaN(headerIntervalMs)) {
                  sleepInterval = headerIntervalMs;
                }
              }
            }
            await sleep$1(sleepInterval);
            break;
          case "failed":
          case "cancelled":
          case "completed":
            return batch;
        }
      }
    }
    /**
     * Uploads the given files concurrently and then creates a vector store file batch.
     *
     * The concurrency limit is configurable using the `maxConcurrency` parameter.
     */
    async uploadAndPoll(vectorStoreId, { files, fileIds = [] }, options) {
      if (files == null || files.length == 0) {
        throw new Error(`No \`files\` provided to process. If you've already uploaded files you should use \`.createAndPoll()\` instead`);
      }
      const configuredConcurrency = (options == null ? void 0 : options.maxConcurrency) ?? 5;
      const concurrencyLimit = Math.min(configuredConcurrency, files.length);
      const client = this._client;
      const fileIterator = files.values();
      const allFileIds = [...fileIds];
      async function processFiles(iterator2) {
        for (let item of iterator2) {
          const fileObj = await client.files.create({ file: item, purpose: "assistants" }, options);
          allFileIds.push(fileObj.id);
        }
      }
      const workers = Array(concurrencyLimit).fill(fileIterator).map(processFiles);
      await allSettledWithThrow(workers);
      return await this.createAndPoll(vectorStoreId, {
        file_ids: allFileIds
      });
    }
  }
  /* @__PURE__ */ (function(FileBatches2) {
  })(FileBatches || (FileBatches = {}));
  class VectorStores extends APIResource {
    constructor() {
      super(...arguments);
      this.files = new Files$1(this._client);
      this.fileBatches = new FileBatches(this._client);
    }
    /**
     * Create a vector store.
     */
    create(body, options) {
      return this._client.post("/vector_stores", {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Retrieves a vector store.
     */
    retrieve(vectorStoreId, options) {
      return this._client.get(`/vector_stores/${vectorStoreId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Modifies a vector store.
     */
    update(vectorStoreId, body, options) {
      return this._client.post(`/vector_stores/${vectorStoreId}`, {
        body,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    list(query = {}, options) {
      if (isRequestOptions(query)) {
        return this.list({}, query);
      }
      return this._client.getAPIList("/vector_stores", VectorStoresPage, {
        query,
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Delete a vector store.
     */
    del(vectorStoreId, options) {
      return this._client.delete(`/vector_stores/${vectorStoreId}`, {
        ...options,
        headers: { "OpenAI-Beta": "assistants=v2", ...options == null ? void 0 : options.headers }
      });
    }
  }
  class VectorStoresPage extends CursorPage {
  }
  (function(VectorStores2) {
    VectorStores2.VectorStoresPage = VectorStoresPage;
    VectorStores2.Files = Files$1;
    VectorStores2.VectorStoreFilesPage = VectorStoreFilesPage;
    VectorStores2.FileBatches = FileBatches;
  })(VectorStores || (VectorStores = {}));
  class Beta extends APIResource {
    constructor() {
      super(...arguments);
      this.vectorStores = new VectorStores(this._client);
      this.chat = new Chat(this._client);
      this.assistants = new Assistants(this._client);
      this.threads = new Threads(this._client);
    }
  }
  (function(Beta2) {
    Beta2.VectorStores = VectorStores;
    Beta2.VectorStoresPage = VectorStoresPage;
    Beta2.Chat = Chat;
    Beta2.Assistants = Assistants;
    Beta2.AssistantsPage = AssistantsPage;
    Beta2.Threads = Threads;
  })(Beta || (Beta = {}));
  class Completions extends APIResource {
    create(body, options) {
      return this._client.post("/completions", { body, ...options, stream: body.stream ?? false });
    }
  }
  /* @__PURE__ */ (function(Completions2) {
  })(Completions || (Completions = {}));
  class Embeddings extends APIResource {
    /**
     * Creates an embedding vector representing the input text.
     */
    create(body, options) {
      return this._client.post("/embeddings", { body, ...options });
    }
  }
  /* @__PURE__ */ (function(Embeddings2) {
  })(Embeddings || (Embeddings = {}));
  class Files extends APIResource {
    /**
     * Upload a file that can be used across various endpoints. Individual files can be
     * up to 512 MB, and the size of all files uploaded by one organization can be up
     * to 100 GB.
     *
     * The Assistants API supports files up to 2 million tokens and of specific file
     * types. See the
     * [Assistants Tools guide](https://platform.openai.com/docs/assistants/tools) for
     * details.
     *
     * The Fine-tuning API only supports `.jsonl` files. The input also has certain
     * required formats for fine-tuning
     * [chat](https://platform.openai.com/docs/api-reference/fine-tuning/chat-input) or
     * [completions](https://platform.openai.com/docs/api-reference/fine-tuning/completions-input)
     * models.
     *
     * The Batch API only supports `.jsonl` files up to 100 MB in size. The input also
     * has a specific required
     * [format](https://platform.openai.com/docs/api-reference/batch/request-input).
     *
     * Please [contact us](https://help.openai.com/) if you need to increase these
     * storage limits.
     */
    create(body, options) {
      return this._client.post("/files", multipartFormRequestOptions({ body, ...options }));
    }
    /**
     * Returns information about a specific file.
     */
    retrieve(fileId, options) {
      return this._client.get(`/files/${fileId}`, options);
    }
    list(query = {}, options) {
      if (isRequestOptions(query)) {
        return this.list({}, query);
      }
      return this._client.getAPIList("/files", FileObjectsPage, { query, ...options });
    }
    /**
     * Delete a file.
     */
    del(fileId, options) {
      return this._client.delete(`/files/${fileId}`, options);
    }
    /**
     * Returns the contents of the specified file.
     */
    content(fileId, options) {
      return this._client.get(`/files/${fileId}/content`, { ...options, __binaryResponse: true });
    }
    /**
     * Returns the contents of the specified file.
     *
     * @deprecated The `.content()` method should be used instead
     */
    retrieveContent(fileId, options) {
      return this._client.get(`/files/${fileId}/content`, {
        ...options,
        headers: { Accept: "application/json", ...options == null ? void 0 : options.headers }
      });
    }
    /**
     * Waits for the given file to be processed, default timeout is 30 mins.
     */
    async waitForProcessing(id, { pollInterval = 5e3, maxWait = 30 * 60 * 1e3 } = {}) {
      const TERMINAL_STATES = /* @__PURE__ */ new Set(["processed", "error", "deleted"]);
      const start = Date.now();
      let file = await this.retrieve(id);
      while (!file.status || !TERMINAL_STATES.has(file.status)) {
        await sleep$1(pollInterval);
        file = await this.retrieve(id);
        if (Date.now() - start > maxWait) {
          throw new APIConnectionTimeoutError({
            message: `Giving up on waiting for file ${id} to finish processing after ${maxWait} milliseconds.`
          });
        }
      }
      return file;
    }
  }
  class FileObjectsPage extends Page {
  }
  (function(Files2) {
    Files2.FileObjectsPage = FileObjectsPage;
  })(Files || (Files = {}));
  class Checkpoints extends APIResource {
    list(fineTuningJobId, query = {}, options) {
      if (isRequestOptions(query)) {
        return this.list(fineTuningJobId, {}, query);
      }
      return this._client.getAPIList(`/fine_tuning/jobs/${fineTuningJobId}/checkpoints`, FineTuningJobCheckpointsPage, { query, ...options });
    }
  }
  class FineTuningJobCheckpointsPage extends CursorPage {
  }
  (function(Checkpoints2) {
    Checkpoints2.FineTuningJobCheckpointsPage = FineTuningJobCheckpointsPage;
  })(Checkpoints || (Checkpoints = {}));
  class Jobs extends APIResource {
    constructor() {
      super(...arguments);
      this.checkpoints = new Checkpoints(this._client);
    }
    /**
     * Creates a fine-tuning job which begins the process of creating a new model from
     * a given dataset.
     *
     * Response includes details of the enqueued job including job status and the name
     * of the fine-tuned models once complete.
     *
     * [Learn more about fine-tuning](https://platform.openai.com/docs/guides/fine-tuning)
     */
    create(body, options) {
      return this._client.post("/fine_tuning/jobs", { body, ...options });
    }
    /**
     * Get info about a fine-tuning job.
     *
     * [Learn more about fine-tuning](https://platform.openai.com/docs/guides/fine-tuning)
     */
    retrieve(fineTuningJobId, options) {
      return this._client.get(`/fine_tuning/jobs/${fineTuningJobId}`, options);
    }
    list(query = {}, options) {
      if (isRequestOptions(query)) {
        return this.list({}, query);
      }
      return this._client.getAPIList("/fine_tuning/jobs", FineTuningJobsPage, { query, ...options });
    }
    /**
     * Immediately cancel a fine-tune job.
     */
    cancel(fineTuningJobId, options) {
      return this._client.post(`/fine_tuning/jobs/${fineTuningJobId}/cancel`, options);
    }
    listEvents(fineTuningJobId, query = {}, options) {
      if (isRequestOptions(query)) {
        return this.listEvents(fineTuningJobId, {}, query);
      }
      return this._client.getAPIList(`/fine_tuning/jobs/${fineTuningJobId}/events`, FineTuningJobEventsPage, {
        query,
        ...options
      });
    }
  }
  class FineTuningJobsPage extends CursorPage {
  }
  class FineTuningJobEventsPage extends CursorPage {
  }
  (function(Jobs2) {
    Jobs2.FineTuningJobsPage = FineTuningJobsPage;
    Jobs2.FineTuningJobEventsPage = FineTuningJobEventsPage;
    Jobs2.Checkpoints = Checkpoints;
    Jobs2.FineTuningJobCheckpointsPage = FineTuningJobCheckpointsPage;
  })(Jobs || (Jobs = {}));
  class FineTuning extends APIResource {
    constructor() {
      super(...arguments);
      this.jobs = new Jobs(this._client);
    }
  }
  (function(FineTuning2) {
    FineTuning2.Jobs = Jobs;
    FineTuning2.FineTuningJobsPage = FineTuningJobsPage;
    FineTuning2.FineTuningJobEventsPage = FineTuningJobEventsPage;
  })(FineTuning || (FineTuning = {}));
  class Images extends APIResource {
    /**
     * Creates a variation of a given image.
     */
    createVariation(body, options) {
      return this._client.post("/images/variations", multipartFormRequestOptions({ body, ...options }));
    }
    /**
     * Creates an edited or extended image given an original image and a prompt.
     */
    edit(body, options) {
      return this._client.post("/images/edits", multipartFormRequestOptions({ body, ...options }));
    }
    /**
     * Creates an image given a prompt.
     */
    generate(body, options) {
      return this._client.post("/images/generations", { body, ...options });
    }
  }
  /* @__PURE__ */ (function(Images2) {
  })(Images || (Images = {}));
  class Models extends APIResource {
    /**
     * Retrieves a model instance, providing basic information about the model such as
     * the owner and permissioning.
     */
    retrieve(model, options) {
      return this._client.get(`/models/${model}`, options);
    }
    /**
     * Lists the currently available models, and provides basic information about each
     * one such as the owner and availability.
     */
    list(options) {
      return this._client.getAPIList("/models", ModelsPage, options);
    }
    /**
     * Delete a fine-tuned model. You must have the Owner role in your organization to
     * delete a model.
     */
    del(model, options) {
      return this._client.delete(`/models/${model}`, options);
    }
  }
  class ModelsPage extends Page {
  }
  (function(Models2) {
    Models2.ModelsPage = ModelsPage;
  })(Models || (Models = {}));
  class Moderations extends APIResource {
    /**
     * Classifies if text is potentially harmful.
     */
    create(body, options) {
      return this._client.post("/moderations", { body, ...options });
    }
  }
  /* @__PURE__ */ (function(Moderations2) {
  })(Moderations || (Moderations = {}));
  class Parts extends APIResource {
    /**
     * Adds a
     * [Part](https://platform.openai.com/docs/api-reference/uploads/part-object) to an
     * [Upload](https://platform.openai.com/docs/api-reference/uploads/object) object.
     * A Part represents a chunk of bytes from the file you are trying to upload.
     *
     * Each Part can be at most 64 MB, and you can add Parts until you hit the Upload
     * maximum of 8 GB.
     *
     * It is possible to add multiple Parts in parallel. You can decide the intended
     * order of the Parts when you
     * [complete the Upload](https://platform.openai.com/docs/api-reference/uploads/complete).
     */
    create(uploadId, body, options) {
      return this._client.post(`/uploads/${uploadId}/parts`, multipartFormRequestOptions({ body, ...options }));
    }
  }
  /* @__PURE__ */ (function(Parts2) {
  })(Parts || (Parts = {}));
  class Uploads extends APIResource {
    constructor() {
      super(...arguments);
      this.parts = new Parts(this._client);
    }
    /**
     * Creates an intermediate
     * [Upload](https://platform.openai.com/docs/api-reference/uploads/object) object
     * that you can add
     * [Parts](https://platform.openai.com/docs/api-reference/uploads/part-object) to.
     * Currently, an Upload can accept at most 8 GB in total and expires after an hour
     * after you create it.
     *
     * Once you complete the Upload, we will create a
     * [File](https://platform.openai.com/docs/api-reference/files/object) object that
     * contains all the parts you uploaded. This File is usable in the rest of our
     * platform as a regular File object.
     *
     * For certain `purpose`s, the correct `mime_type` must be specified. Please refer
     * to documentation for the supported MIME types for your use case:
     *
     * - [Assistants](https://platform.openai.com/docs/assistants/tools/file-search/supported-files)
     *
     * For guidance on the proper filename extensions for each purpose, please follow
     * the documentation on
     * [creating a File](https://platform.openai.com/docs/api-reference/files/create).
     */
    create(body, options) {
      return this._client.post("/uploads", { body, ...options });
    }
    /**
     * Cancels the Upload. No Parts may be added after an Upload is cancelled.
     */
    cancel(uploadId, options) {
      return this._client.post(`/uploads/${uploadId}/cancel`, options);
    }
    /**
     * Completes the
     * [Upload](https://platform.openai.com/docs/api-reference/uploads/object).
     *
     * Within the returned Upload object, there is a nested
     * [File](https://platform.openai.com/docs/api-reference/files/object) object that
     * is ready to use in the rest of the platform.
     *
     * You can specify the order of the Parts by passing in an ordered list of the Part
     * IDs.
     *
     * The number of bytes uploaded upon completion must match the number of bytes
     * initially specified when creating the Upload object. No Parts may be added after
     * an Upload is completed.
     */
    complete(uploadId, body, options) {
      return this._client.post(`/uploads/${uploadId}/complete`, { body, ...options });
    }
  }
  (function(Uploads2) {
    Uploads2.Parts = Parts;
  })(Uploads || (Uploads = {}));
  var _a;
  class OpenAI extends APIClient {
    /**
     * API Client for interfacing with the OpenAI API.
     *
     * @param {string | undefined} [opts.apiKey=process.env['OPENAI_API_KEY'] ?? undefined]
     * @param {string | null | undefined} [opts.organization=process.env['OPENAI_ORG_ID'] ?? null]
     * @param {string | null | undefined} [opts.project=process.env['OPENAI_PROJECT_ID'] ?? null]
     * @param {string} [opts.baseURL=process.env['OPENAI_BASE_URL'] ?? https://api.openai.com/v1] - Override the default base URL for the API.
     * @param {number} [opts.timeout=10 minutes] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
     * @param {number} [opts.httpAgent] - An HTTP agent used to manage HTTP(s) connections.
     * @param {Core.Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
     * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
     * @param {Core.Headers} opts.defaultHeaders - Default headers to include with every request to the API.
     * @param {Core.DefaultQuery} opts.defaultQuery - Default query parameters to include with every request to the API.
     * @param {boolean} [opts.dangerouslyAllowBrowser=false] - By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
     */
    constructor({ baseURL = readEnv("OPENAI_BASE_URL"), apiKey = readEnv("OPENAI_API_KEY"), organization = readEnv("OPENAI_ORG_ID") ?? null, project = readEnv("OPENAI_PROJECT_ID") ?? null, ...opts } = {}) {
      if (apiKey === void 0) {
        throw new OpenAIError("The OPENAI_API_KEY environment variable is missing or empty; either provide it, or instantiate the OpenAI client with an apiKey option, like new OpenAI({ apiKey: 'My API Key' }).");
      }
      const options = {
        apiKey,
        organization,
        project,
        ...opts,
        baseURL: baseURL || `https://api.openai.com/v1`
      };
      if (!options.dangerouslyAllowBrowser && isRunningInBrowser()) {
        throw new OpenAIError("It looks like you're running in a browser-like environment.\n\nThis is disabled by default, as it risks exposing your secret API credentials to attackers.\nIf you understand the risks and have appropriate mitigations in place,\nyou can set the `dangerouslyAllowBrowser` option to `true`, e.g.,\n\nnew OpenAI({ apiKey, dangerouslyAllowBrowser: true });\n\nhttps://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety\n");
      }
      super({
        baseURL: options.baseURL,
        timeout: options.timeout ?? 6e5,
        httpAgent: options.httpAgent,
        maxRetries: options.maxRetries,
        fetch: options.fetch
      });
      this.completions = new Completions(this);
      this.chat = new Chat$1(this);
      this.embeddings = new Embeddings(this);
      this.files = new Files(this);
      this.images = new Images(this);
      this.audio = new Audio(this);
      this.moderations = new Moderations(this);
      this.models = new Models(this);
      this.fineTuning = new FineTuning(this);
      this.beta = new Beta(this);
      this.batches = new Batches(this);
      this.uploads = new Uploads(this);
      this._options = options;
      this.apiKey = apiKey;
      this.organization = organization;
      this.project = project;
    }
    defaultQuery() {
      return this._options.defaultQuery;
    }
    defaultHeaders(opts) {
      return {
        ...super.defaultHeaders(opts),
        "OpenAI-Organization": this.organization,
        "OpenAI-Project": this.project,
        ...this._options.defaultHeaders
      };
    }
    authHeaders(opts) {
      return { Authorization: `Bearer ${this.apiKey}` };
    }
  }
  _a = OpenAI;
  OpenAI.OpenAI = _a;
  OpenAI.DEFAULT_TIMEOUT = 6e5;
  OpenAI.OpenAIError = OpenAIError;
  OpenAI.APIError = APIError;
  OpenAI.APIConnectionError = APIConnectionError;
  OpenAI.APIConnectionTimeoutError = APIConnectionTimeoutError;
  OpenAI.APIUserAbortError = APIUserAbortError;
  OpenAI.NotFoundError = NotFoundError;
  OpenAI.ConflictError = ConflictError;
  OpenAI.RateLimitError = RateLimitError;
  OpenAI.BadRequestError = BadRequestError;
  OpenAI.AuthenticationError = AuthenticationError;
  OpenAI.InternalServerError = InternalServerError;
  OpenAI.PermissionDeniedError = PermissionDeniedError;
  OpenAI.UnprocessableEntityError = UnprocessableEntityError;
  OpenAI.toFile = toFile;
  OpenAI.fileFromPath = fileFromPath;
  (function(OpenAI2) {
    OpenAI2.Page = Page;
    OpenAI2.CursorPage = CursorPage;
    OpenAI2.Completions = Completions;
    OpenAI2.Chat = Chat$1;
    OpenAI2.Embeddings = Embeddings;
    OpenAI2.Files = Files;
    OpenAI2.FileObjectsPage = FileObjectsPage;
    OpenAI2.Images = Images;
    OpenAI2.Audio = Audio;
    OpenAI2.Moderations = Moderations;
    OpenAI2.Models = Models;
    OpenAI2.ModelsPage = ModelsPage;
    OpenAI2.FineTuning = FineTuning;
    OpenAI2.Beta = Beta;
    OpenAI2.Batches = Batches;
    OpenAI2.BatchesPage = BatchesPage;
    OpenAI2.Uploads = Uploads;
  })(OpenAI || (OpenAI = {}));
  var isVue2 = false;
  /*!
   * pinia v2.2.4
   * (c) 2024 Eduardo San Martin Morote
   * @license MIT
   */
  let activePinia;
  const setActivePinia = (pinia) => activePinia = pinia;
  const piniaSymbol = (
    /* istanbul ignore next */
    Symbol()
  );
  function isPlainObject(o) {
    return o && typeof o === "object" && Object.prototype.toString.call(o) === "[object Object]" && typeof o.toJSON !== "function";
  }
  var MutationType;
  (function(MutationType2) {
    MutationType2["direct"] = "direct";
    MutationType2["patchObject"] = "patch object";
    MutationType2["patchFunction"] = "patch function";
  })(MutationType || (MutationType = {}));
  function createPinia() {
    const scope = effectScope(true);
    const state = scope.run(() => ref({}));
    let _p = [];
    let toBeInstalled = [];
    const pinia = markRaw({
      install(app) {
        setActivePinia(pinia);
        {
          pinia._a = app;
          app.provide(piniaSymbol, pinia);
          app.config.globalProperties.$pinia = pinia;
          toBeInstalled.forEach((plugin) => _p.push(plugin));
          toBeInstalled = [];
        }
      },
      use(plugin) {
        if (!this._a && !isVue2) {
          toBeInstalled.push(plugin);
        } else {
          _p.push(plugin);
        }
        return this;
      },
      _p,
      // it's actually undefined here
      // @ts-expect-error
      _a: null,
      _e: scope,
      _s: /* @__PURE__ */ new Map(),
      state
    });
    return pinia;
  }
  const noop = () => {
  };
  function addSubscription(subscriptions, callback, detached, onCleanup = noop) {
    subscriptions.push(callback);
    const removeSubscription = () => {
      const idx = subscriptions.indexOf(callback);
      if (idx > -1) {
        subscriptions.splice(idx, 1);
        onCleanup();
      }
    };
    if (!detached && getCurrentScope()) {
      onScopeDispose(removeSubscription);
    }
    return removeSubscription;
  }
  function triggerSubscriptions(subscriptions, ...args) {
    subscriptions.slice().forEach((callback) => {
      callback(...args);
    });
  }
  const fallbackRunWithContext = (fn) => fn();
  const ACTION_MARKER = Symbol();
  const ACTION_NAME = Symbol();
  function mergeReactiveObjects(target, patchToApply) {
    if (target instanceof Map && patchToApply instanceof Map) {
      patchToApply.forEach((value, key) => target.set(key, value));
    } else if (target instanceof Set && patchToApply instanceof Set) {
      patchToApply.forEach(target.add, target);
    }
    for (const key in patchToApply) {
      if (!patchToApply.hasOwnProperty(key))
        continue;
      const subPatch = patchToApply[key];
      const targetValue = target[key];
      if (isPlainObject(targetValue) && isPlainObject(subPatch) && target.hasOwnProperty(key) && !isRef$1(subPatch) && !isReactive(subPatch)) {
        target[key] = mergeReactiveObjects(targetValue, subPatch);
      } else {
        target[key] = subPatch;
      }
    }
    return target;
  }
  const skipHydrateSymbol = (
    /* istanbul ignore next */
    Symbol()
  );
  function shouldHydrate(obj) {
    return !isPlainObject(obj) || !obj.hasOwnProperty(skipHydrateSymbol);
  }
  const { assign } = Object;
  function isComputed(o) {
    return !!(isRef$1(o) && o.effect);
  }
  function createOptionsStore(id, options, pinia, hot) {
    const { state, actions, getters } = options;
    const initialState = pinia.state.value[id];
    let store;
    function setup() {
      if (!initialState && true) {
        {
          pinia.state.value[id] = state ? state() : {};
        }
      }
      const localState = toRefs(pinia.state.value[id]);
      return assign(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
        computedGetters[name] = markRaw(computed(() => {
          setActivePinia(pinia);
          const store2 = pinia._s.get(id);
          return getters[name].call(store2, store2);
        }));
        return computedGetters;
      }, {}));
    }
    store = createSetupStore(id, setup, options, pinia, hot, true);
    return store;
  }
  function createSetupStore($id, setup, options = {}, pinia, hot, isOptionsStore) {
    let scope;
    const optionsForPlugin = assign({ actions: {} }, options);
    const $subscribeOptions = { deep: true };
    let isListening;
    let isSyncListening;
    let subscriptions = [];
    let actionSubscriptions = [];
    let debuggerEvents;
    const initialState = pinia.state.value[$id];
    if (!isOptionsStore && !initialState && true) {
      {
        pinia.state.value[$id] = {};
      }
    }
    ref({});
    let activeListener;
    function $patch(partialStateOrMutator) {
      let subscriptionMutation;
      isListening = isSyncListening = false;
      if (typeof partialStateOrMutator === "function") {
        partialStateOrMutator(pinia.state.value[$id]);
        subscriptionMutation = {
          type: MutationType.patchFunction,
          storeId: $id,
          events: debuggerEvents
        };
      } else {
        mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator);
        subscriptionMutation = {
          type: MutationType.patchObject,
          payload: partialStateOrMutator,
          storeId: $id,
          events: debuggerEvents
        };
      }
      const myListenerId = activeListener = Symbol();
      nextTick().then(() => {
        if (activeListener === myListenerId) {
          isListening = true;
        }
      });
      isSyncListening = true;
      triggerSubscriptions(subscriptions, subscriptionMutation, pinia.state.value[$id]);
    }
    const $reset = isOptionsStore ? function $reset2() {
      const { state } = options;
      const newState = state ? state() : {};
      this.$patch(($state) => {
        assign($state, newState);
      });
    } : (
      /* istanbul ignore next */
      noop
    );
    function $dispose() {
      scope.stop();
      subscriptions = [];
      actionSubscriptions = [];
      pinia._s.delete($id);
    }
    const action = (fn, name = "") => {
      if (ACTION_MARKER in fn) {
        fn[ACTION_NAME] = name;
        return fn;
      }
      const wrappedAction = function() {
        setActivePinia(pinia);
        const args = Array.from(arguments);
        const afterCallbackList = [];
        const onErrorCallbackList = [];
        function after(callback) {
          afterCallbackList.push(callback);
        }
        function onError(callback) {
          onErrorCallbackList.push(callback);
        }
        triggerSubscriptions(actionSubscriptions, {
          args,
          name: wrappedAction[ACTION_NAME],
          store,
          after,
          onError
        });
        let ret;
        try {
          ret = fn.apply(this && this.$id === $id ? this : store, args);
        } catch (error) {
          triggerSubscriptions(onErrorCallbackList, error);
          throw error;
        }
        if (ret instanceof Promise) {
          return ret.then((value) => {
            triggerSubscriptions(afterCallbackList, value);
            return value;
          }).catch((error) => {
            triggerSubscriptions(onErrorCallbackList, error);
            return Promise.reject(error);
          });
        }
        triggerSubscriptions(afterCallbackList, ret);
        return ret;
      };
      wrappedAction[ACTION_MARKER] = true;
      wrappedAction[ACTION_NAME] = name;
      return wrappedAction;
    };
    const partialStore = {
      _p: pinia,
      // _s: scope,
      $id,
      $onAction: addSubscription.bind(null, actionSubscriptions),
      $patch,
      $reset,
      $subscribe(callback, options2 = {}) {
        const removeSubscription = addSubscription(subscriptions, callback, options2.detached, () => stopWatcher());
        const stopWatcher = scope.run(() => watch(() => pinia.state.value[$id], (state) => {
          if (options2.flush === "sync" ? isSyncListening : isListening) {
            callback({
              storeId: $id,
              type: MutationType.direct,
              events: debuggerEvents
            }, state);
          }
        }, assign({}, $subscribeOptions, options2)));
        return removeSubscription;
      },
      $dispose
    };
    const store = reactive(partialStore);
    pinia._s.set($id, store);
    const runWithContext = pinia._a && pinia._a.runWithContext || fallbackRunWithContext;
    const setupStore = runWithContext(() => pinia._e.run(() => (scope = effectScope()).run(() => setup({ action }))));
    for (const key in setupStore) {
      const prop = setupStore[key];
      if (isRef$1(prop) && !isComputed(prop) || isReactive(prop)) {
        if (!isOptionsStore) {
          if (initialState && shouldHydrate(prop)) {
            if (isRef$1(prop)) {
              prop.value = initialState[key];
            } else {
              mergeReactiveObjects(prop, initialState[key]);
            }
          }
          {
            pinia.state.value[$id][key] = prop;
          }
        }
      } else if (typeof prop === "function") {
        const actionValue = action(prop, key);
        {
          setupStore[key] = actionValue;
        }
        optionsForPlugin.actions[key] = prop;
      } else ;
    }
    {
      assign(store, setupStore);
      assign(toRaw(store), setupStore);
    }
    Object.defineProperty(store, "$state", {
      get: () => pinia.state.value[$id],
      set: (state) => {
        $patch(($state) => {
          assign($state, state);
        });
      }
    });
    pinia._p.forEach((extender) => {
      {
        assign(store, scope.run(() => extender({
          store,
          app: pinia._a,
          pinia,
          options: optionsForPlugin
        })));
      }
    });
    if (initialState && isOptionsStore && options.hydrate) {
      options.hydrate(store.$state, initialState);
    }
    isListening = true;
    isSyncListening = true;
    return store;
  }
  // @__NO_SIDE_EFFECTS__
  function defineStore(idOrOptions, setup, setupOptions) {
    let id;
    let options;
    const isSetupStore = typeof setup === "function";
    {
      id = idOrOptions;
      options = isSetupStore ? setupOptions : setup;
    }
    function useStore(pinia, hot) {
      const hasContext = hasInjectionContext();
      pinia = // in test mode, ignore the argument provided as we can always retrieve a
      // pinia instance with getActivePinia()
      pinia || (hasContext ? inject(piniaSymbol, null) : null);
      if (pinia)
        setActivePinia(pinia);
      pinia = activePinia;
      if (!pinia._s.has(id)) {
        if (isSetupStore) {
          createSetupStore(id, setup, options, pinia);
        } else {
          createOptionsStore(id, options, pinia);
        }
      }
      const store = pinia._s.get(id);
      return store;
    }
    useStore.$id = id;
    return useStore;
  }
  function isPromise(obj) {
    return obj && typeof obj.then === "function";
  }
  Promise.resolve(false);
  Promise.resolve(true);
  var PROMISE_RESOLVED_VOID = Promise.resolve();
  function sleep(time, resolveWith) {
    if (!time) time = 0;
    return new Promise(function(res) {
      return setTimeout(function() {
        return res(resolveWith);
      }, time);
    });
  }
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  function randomToken() {
    return Math.random().toString(36).substring(2);
  }
  var lastMs = 0;
  function microSeconds$4() {
    var ret = Date.now() * 1e3;
    if (ret <= lastMs) {
      ret = lastMs + 1;
    }
    lastMs = ret;
    return ret;
  }
  var microSeconds$3 = microSeconds$4;
  var type$3 = "native";
  function create$3(channelName) {
    var state = {
      time: microSeconds$4(),
      messagesCallback: null,
      bc: new BroadcastChannel(channelName),
      subFns: []
      // subscriberFunctions
    };
    state.bc.onmessage = function(msgEvent) {
      if (state.messagesCallback) {
        state.messagesCallback(msgEvent.data);
      }
    };
    return state;
  }
  function close$3(channelState) {
    channelState.bc.close();
    channelState.subFns = [];
  }
  function postMessage$3(channelState, messageJson) {
    try {
      channelState.bc.postMessage(messageJson, false);
      return PROMISE_RESOLVED_VOID;
    } catch (err) {
      return Promise.reject(err);
    }
  }
  function onMessage$3(channelState, fn) {
    channelState.messagesCallback = fn;
  }
  function canBeUsed$3() {
    if (typeof globalThis !== "undefined" && globalThis.Deno && globalThis.Deno.args) {
      return true;
    }
    if ((typeof window !== "undefined" || typeof self !== "undefined") && typeof BroadcastChannel === "function") {
      if (BroadcastChannel._pubkey) {
        throw new Error("BroadcastChannel: Do not overwrite window.BroadcastChannel with this module, this is not a polyfill");
      }
      return true;
    } else {
      return false;
    }
  }
  function averageResponseTime$3() {
    return 150;
  }
  var NativeMethod = {
    create: create$3,
    close: close$3,
    onMessage: onMessage$3,
    postMessage: postMessage$3,
    canBeUsed: canBeUsed$3,
    type: type$3,
    averageResponseTime: averageResponseTime$3,
    microSeconds: microSeconds$3
  };
  class ObliviousSet {
    constructor(ttl) {
      __publicField(this, "ttl");
      __publicField(this, "map", /* @__PURE__ */ new Map());
      /**
       * Creating calls to setTimeout() is expensive,
       * so we only do that if there is not timeout already open.
       */
      __publicField(this, "_to", false);
      this.ttl = ttl;
    }
    has(value) {
      return this.map.has(value);
    }
    add(value) {
      this.map.set(value, now());
      if (!this._to) {
        this._to = true;
        setTimeout(() => {
          this._to = false;
          removeTooOldValues(this);
        }, 0);
      }
    }
    clear() {
      this.map.clear();
    }
  }
  function removeTooOldValues(obliviousSet) {
    const olderThen = now() - obliviousSet.ttl;
    const iterator2 = obliviousSet.map[Symbol.iterator]();
    while (true) {
      const next = iterator2.next().value;
      if (!next) {
        return;
      }
      const value = next[0];
      const time = next[1];
      if (time < olderThen) {
        obliviousSet.map.delete(value);
      } else {
        return;
      }
    }
  }
  function now() {
    return Date.now();
  }
  function fillOptionsWithDefaults() {
    var originalOptions = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    var options = JSON.parse(JSON.stringify(originalOptions));
    if (typeof options.webWorkerSupport === "undefined") options.webWorkerSupport = true;
    if (!options.idb) options.idb = {};
    if (!options.idb.ttl) options.idb.ttl = 1e3 * 45;
    if (!options.idb.fallbackInterval) options.idb.fallbackInterval = 150;
    if (originalOptions.idb && typeof originalOptions.idb.onclose === "function") options.idb.onclose = originalOptions.idb.onclose;
    if (!options.localstorage) options.localstorage = {};
    if (!options.localstorage.removeTimeout) options.localstorage.removeTimeout = 1e3 * 60;
    if (originalOptions.methods) options.methods = originalOptions.methods;
    if (!options.node) options.node = {};
    if (!options.node.ttl) options.node.ttl = 1e3 * 60 * 2;
    if (!options.node.maxParallelWrites) options.node.maxParallelWrites = 2048;
    if (typeof options.node.useFastPath === "undefined") options.node.useFastPath = true;
    return options;
  }
  var microSeconds$2 = microSeconds$4;
  var DB_PREFIX = "pubkey.broadcast-channel-0-";
  var OBJECT_STORE_ID = "messages";
  var TRANSACTION_SETTINGS = {
    durability: "relaxed"
  };
  var type$2 = "idb";
  function getIdb() {
    if (typeof indexedDB !== "undefined") return indexedDB;
    if (typeof window !== "undefined") {
      if (typeof window.mozIndexedDB !== "undefined") return window.mozIndexedDB;
      if (typeof window.webkitIndexedDB !== "undefined") return window.webkitIndexedDB;
      if (typeof window.msIndexedDB !== "undefined") return window.msIndexedDB;
    }
    return false;
  }
  function commitIndexedDBTransaction(tx) {
    if (tx.commit) {
      tx.commit();
    }
  }
  function createDatabase(channelName) {
    var IndexedDB = getIdb();
    var dbName = DB_PREFIX + channelName;
    var openRequest = IndexedDB.open(dbName);
    openRequest.onupgradeneeded = function(ev) {
      var db = ev.target.result;
      db.createObjectStore(OBJECT_STORE_ID, {
        keyPath: "id",
        autoIncrement: true
      });
    };
    return new Promise(function(res, rej) {
      openRequest.onerror = function(ev) {
        return rej(ev);
      };
      openRequest.onsuccess = function() {
        res(openRequest.result);
      };
    });
  }
  function writeMessage(db, readerUuid, messageJson) {
    var time = Date.now();
    var writeObject = {
      uuid: readerUuid,
      time,
      data: messageJson
    };
    var tx = db.transaction([OBJECT_STORE_ID], "readwrite", TRANSACTION_SETTINGS);
    return new Promise(function(res, rej) {
      tx.oncomplete = function() {
        return res();
      };
      tx.onerror = function(ev) {
        return rej(ev);
      };
      var objectStore = tx.objectStore(OBJECT_STORE_ID);
      objectStore.add(writeObject);
      commitIndexedDBTransaction(tx);
    });
  }
  function getMessagesHigherThan(db, lastCursorId) {
    var tx = db.transaction(OBJECT_STORE_ID, "readonly", TRANSACTION_SETTINGS);
    var objectStore = tx.objectStore(OBJECT_STORE_ID);
    var ret = [];
    var keyRangeValue = IDBKeyRange.bound(lastCursorId + 1, Infinity);
    if (objectStore.getAll) {
      var getAllRequest = objectStore.getAll(keyRangeValue);
      return new Promise(function(res, rej) {
        getAllRequest.onerror = function(err) {
          return rej(err);
        };
        getAllRequest.onsuccess = function(e) {
          res(e.target.result);
        };
      });
    }
    function openCursor() {
      try {
        keyRangeValue = IDBKeyRange.bound(lastCursorId + 1, Infinity);
        return objectStore.openCursor(keyRangeValue);
      } catch (e) {
        return objectStore.openCursor();
      }
    }
    return new Promise(function(res, rej) {
      var openCursorRequest = openCursor();
      openCursorRequest.onerror = function(err) {
        return rej(err);
      };
      openCursorRequest.onsuccess = function(ev) {
        var cursor = ev.target.result;
        if (cursor) {
          if (cursor.value.id < lastCursorId + 1) {
            cursor["continue"](lastCursorId + 1);
          } else {
            ret.push(cursor.value);
            cursor["continue"]();
          }
        } else {
          commitIndexedDBTransaction(tx);
          res(ret);
        }
      };
    });
  }
  function removeMessagesById(channelState, ids) {
    if (channelState.closed) {
      return Promise.resolve([]);
    }
    var tx = channelState.db.transaction(OBJECT_STORE_ID, "readwrite", TRANSACTION_SETTINGS);
    var objectStore = tx.objectStore(OBJECT_STORE_ID);
    return Promise.all(ids.map(function(id) {
      var deleteRequest = objectStore["delete"](id);
      return new Promise(function(res) {
        deleteRequest.onsuccess = function() {
          return res();
        };
      });
    }));
  }
  function getOldMessages(db, ttl) {
    var olderThen = Date.now() - ttl;
    var tx = db.transaction(OBJECT_STORE_ID, "readonly", TRANSACTION_SETTINGS);
    var objectStore = tx.objectStore(OBJECT_STORE_ID);
    var ret = [];
    return new Promise(function(res) {
      objectStore.openCursor().onsuccess = function(ev) {
        var cursor = ev.target.result;
        if (cursor) {
          var msgObk = cursor.value;
          if (msgObk.time < olderThen) {
            ret.push(msgObk);
            cursor["continue"]();
          } else {
            commitIndexedDBTransaction(tx);
            res(ret);
          }
        } else {
          res(ret);
        }
      };
    });
  }
  function cleanOldMessages(channelState) {
    return getOldMessages(channelState.db, channelState.options.idb.ttl).then(function(tooOld) {
      return removeMessagesById(channelState, tooOld.map(function(msg) {
        return msg.id;
      }));
    });
  }
  function create$2(channelName, options) {
    options = fillOptionsWithDefaults(options);
    return createDatabase(channelName).then(function(db) {
      var state = {
        closed: false,
        lastCursorId: 0,
        channelName,
        options,
        uuid: randomToken(),
        /**
         * emittedMessagesIds
         * contains all messages that have been emitted before
         * @type {ObliviousSet}
         */
        eMIs: new ObliviousSet(options.idb.ttl * 2),
        // ensures we do not read messages in parallel
        writeBlockPromise: PROMISE_RESOLVED_VOID,
        messagesCallback: null,
        readQueuePromises: [],
        db
      };
      db.onclose = function() {
        state.closed = true;
        if (options.idb.onclose) options.idb.onclose();
      };
      _readLoop(state);
      return state;
    });
  }
  function _readLoop(state) {
    if (state.closed) return;
    readNewMessages(state).then(function() {
      return sleep(state.options.idb.fallbackInterval);
    }).then(function() {
      return _readLoop(state);
    });
  }
  function _filterMessage(msgObj, state) {
    if (msgObj.uuid === state.uuid) return false;
    if (state.eMIs.has(msgObj.id)) return false;
    if (msgObj.data.time < state.messagesCallbackTime) return false;
    return true;
  }
  function readNewMessages(state) {
    if (state.closed) return PROMISE_RESOLVED_VOID;
    if (!state.messagesCallback) return PROMISE_RESOLVED_VOID;
    return getMessagesHigherThan(state.db, state.lastCursorId).then(function(newerMessages) {
      var useMessages = newerMessages.filter(function(msgObj) {
        return !!msgObj;
      }).map(function(msgObj) {
        if (msgObj.id > state.lastCursorId) {
          state.lastCursorId = msgObj.id;
        }
        return msgObj;
      }).filter(function(msgObj) {
        return _filterMessage(msgObj, state);
      }).sort(function(msgObjA, msgObjB) {
        return msgObjA.time - msgObjB.time;
      });
      useMessages.forEach(function(msgObj) {
        if (state.messagesCallback) {
          state.eMIs.add(msgObj.id);
          state.messagesCallback(msgObj.data);
        }
      });
      return PROMISE_RESOLVED_VOID;
    });
  }
  function close$2(channelState) {
    channelState.closed = true;
    channelState.db.close();
  }
  function postMessage$2(channelState, messageJson) {
    channelState.writeBlockPromise = channelState.writeBlockPromise.then(function() {
      return writeMessage(channelState.db, channelState.uuid, messageJson);
    }).then(function() {
      if (randomInt(0, 10) === 0) {
        cleanOldMessages(channelState);
      }
    });
    return channelState.writeBlockPromise;
  }
  function onMessage$2(channelState, fn, time) {
    channelState.messagesCallbackTime = time;
    channelState.messagesCallback = fn;
    readNewMessages(channelState);
  }
  function canBeUsed$2() {
    return !!getIdb();
  }
  function averageResponseTime$2(options) {
    return options.idb.fallbackInterval * 2;
  }
  var IndexedDBMethod = {
    create: create$2,
    close: close$2,
    onMessage: onMessage$2,
    postMessage: postMessage$2,
    canBeUsed: canBeUsed$2,
    type: type$2,
    averageResponseTime: averageResponseTime$2,
    microSeconds: microSeconds$2
  };
  var microSeconds$1 = microSeconds$4;
  var KEY_PREFIX = "pubkey.broadcastChannel-";
  var type$1 = "localstorage";
  function getLocalStorage() {
    var localStorage;
    if (typeof window === "undefined") return null;
    try {
      localStorage = window.localStorage;
      localStorage = window["ie8-eventlistener/storage"] || window.localStorage;
    } catch (e) {
    }
    return localStorage;
  }
  function storageKey(channelName) {
    return KEY_PREFIX + channelName;
  }
  function postMessage$1(channelState, messageJson) {
    return new Promise(function(res) {
      sleep().then(function() {
        var key = storageKey(channelState.channelName);
        var writeObj = {
          token: randomToken(),
          time: Date.now(),
          data: messageJson,
          uuid: channelState.uuid
        };
        var value = JSON.stringify(writeObj);
        getLocalStorage().setItem(key, value);
        var ev = document.createEvent("Event");
        ev.initEvent("storage", true, true);
        ev.key = key;
        ev.newValue = value;
        window.dispatchEvent(ev);
        res();
      });
    });
  }
  function addStorageEventListener(channelName, fn) {
    var key = storageKey(channelName);
    var listener = function listener2(ev) {
      if (ev.key === key) {
        fn(JSON.parse(ev.newValue));
      }
    };
    window.addEventListener("storage", listener);
    return listener;
  }
  function removeStorageEventListener(listener) {
    window.removeEventListener("storage", listener);
  }
  function create$1(channelName, options) {
    options = fillOptionsWithDefaults(options);
    if (!canBeUsed$1()) {
      throw new Error("BroadcastChannel: localstorage cannot be used");
    }
    var uuid = randomToken();
    var eMIs = new ObliviousSet(options.localstorage.removeTimeout);
    var state = {
      channelName,
      uuid,
      eMIs
      // emittedMessagesIds
    };
    state.listener = addStorageEventListener(channelName, function(msgObj) {
      if (!state.messagesCallback) return;
      if (msgObj.uuid === uuid) return;
      if (!msgObj.token || eMIs.has(msgObj.token)) return;
      if (msgObj.data.time && msgObj.data.time < state.messagesCallbackTime) return;
      eMIs.add(msgObj.token);
      state.messagesCallback(msgObj.data);
    });
    return state;
  }
  function close$1(channelState) {
    removeStorageEventListener(channelState.listener);
  }
  function onMessage$1(channelState, fn, time) {
    channelState.messagesCallbackTime = time;
    channelState.messagesCallback = fn;
  }
  function canBeUsed$1() {
    var ls = getLocalStorage();
    if (!ls) return false;
    try {
      var key = "__broadcastchannel_check";
      ls.setItem(key, "works");
      ls.removeItem(key);
    } catch (e) {
      return false;
    }
    return true;
  }
  function averageResponseTime$1() {
    var defaultTime = 120;
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
      return defaultTime * 2;
    }
    return defaultTime;
  }
  var LocalstorageMethod = {
    create: create$1,
    close: close$1,
    onMessage: onMessage$1,
    postMessage: postMessage$1,
    canBeUsed: canBeUsed$1,
    type: type$1,
    averageResponseTime: averageResponseTime$1,
    microSeconds: microSeconds$1
  };
  var microSeconds = microSeconds$4;
  var type = "simulate";
  var SIMULATE_CHANNELS = /* @__PURE__ */ new Set();
  function create(channelName) {
    var state = {
      time: microSeconds(),
      name: channelName,
      messagesCallback: null
    };
    SIMULATE_CHANNELS.add(state);
    return state;
  }
  function close(channelState) {
    SIMULATE_CHANNELS["delete"](channelState);
  }
  var SIMULATE_DELAY_TIME = 5;
  function postMessage(channelState, messageJson) {
    return new Promise(function(res) {
      return setTimeout(function() {
        var channelArray = Array.from(SIMULATE_CHANNELS);
        channelArray.forEach(function(channel) {
          if (channel.name === channelState.name && // has same name
          channel !== channelState && // not own channel
          !!channel.messagesCallback && // has subscribers
          channel.time < messageJson.time) {
            channel.messagesCallback(messageJson);
          }
        });
        res();
      }, SIMULATE_DELAY_TIME);
    });
  }
  function onMessage(channelState, fn) {
    channelState.messagesCallback = fn;
  }
  function canBeUsed() {
    return true;
  }
  function averageResponseTime() {
    return SIMULATE_DELAY_TIME;
  }
  var SimulateMethod = {
    create,
    close,
    onMessage,
    postMessage,
    canBeUsed,
    type,
    averageResponseTime,
    microSeconds
  };
  var METHODS = [
    NativeMethod,
    // fastest
    IndexedDBMethod,
    LocalstorageMethod
  ];
  function chooseMethod(options) {
    var chooseMethods = [].concat(options.methods, METHODS).filter(Boolean);
    if (options.type) {
      if (options.type === "simulate") {
        return SimulateMethod;
      }
      var ret = chooseMethods.find(function(m) {
        return m.type === options.type;
      });
      if (!ret) throw new Error("method-type " + options.type + " not found");
      else return ret;
    }
    if (!options.webWorkerSupport) {
      chooseMethods = chooseMethods.filter(function(m) {
        return m.type !== "idb";
      });
    }
    var useMethod = chooseMethods.find(function(method) {
      return method.canBeUsed();
    });
    if (!useMethod) {
      throw new Error("No usable method found in " + JSON.stringify(METHODS.map(function(m) {
        return m.type;
      })));
    } else {
      return useMethod;
    }
  }
  var OPEN_BROADCAST_CHANNELS = /* @__PURE__ */ new Set();
  var lastId = 0;
  var BroadcastChannel$1 = function BroadcastChannel2(name, options) {
    this.id = lastId++;
    OPEN_BROADCAST_CHANNELS.add(this);
    this.name = name;
    if (ENFORCED_OPTIONS) {
      options = ENFORCED_OPTIONS;
    }
    this.options = fillOptionsWithDefaults(options);
    this.method = chooseMethod(this.options);
    this._iL = false;
    this._onML = null;
    this._addEL = {
      message: [],
      internal: []
    };
    this._uMP = /* @__PURE__ */ new Set();
    this._befC = [];
    this._prepP = null;
    _prepareChannel(this);
  };
  BroadcastChannel$1._pubkey = true;
  var ENFORCED_OPTIONS;
  BroadcastChannel$1.prototype = {
    postMessage: function postMessage2(msg) {
      if (this.closed) {
        throw new Error("BroadcastChannel.postMessage(): Cannot post message after channel has closed " + /**
         * In the past when this error appeared, it was really hard to debug.
         * So now we log the msg together with the error so it at least
         * gives some clue about where in your application this happens.
         */
        JSON.stringify(msg));
      }
      return _post(this, "message", msg);
    },
    postInternal: function postInternal(msg) {
      return _post(this, "internal", msg);
    },
    set onmessage(fn) {
      var time = this.method.microSeconds();
      var listenObj = {
        time,
        fn
      };
      _removeListenerObject(this, "message", this._onML);
      if (fn && typeof fn === "function") {
        this._onML = listenObj;
        _addListenerObject(this, "message", listenObj);
      } else {
        this._onML = null;
      }
    },
    addEventListener: function addEventListener2(type2, fn) {
      var time = this.method.microSeconds();
      var listenObj = {
        time,
        fn
      };
      _addListenerObject(this, type2, listenObj);
    },
    removeEventListener: function removeEventListener2(type2, fn) {
      var obj = this._addEL[type2].find(function(obj2) {
        return obj2.fn === fn;
      });
      _removeListenerObject(this, type2, obj);
    },
    close: function close2() {
      var _this = this;
      if (this.closed) {
        return;
      }
      OPEN_BROADCAST_CHANNELS["delete"](this);
      this.closed = true;
      var awaitPrepare = this._prepP ? this._prepP : PROMISE_RESOLVED_VOID;
      this._onML = null;
      this._addEL.message = [];
      return awaitPrepare.then(function() {
        return Promise.all(Array.from(_this._uMP));
      }).then(function() {
        return Promise.all(_this._befC.map(function(fn) {
          return fn();
        }));
      }).then(function() {
        return _this.method.close(_this._state);
      });
    },
    get type() {
      return this.method.type;
    },
    get isClosed() {
      return this.closed;
    }
  };
  function _post(broadcastChannel, type2, msg) {
    var time = broadcastChannel.method.microSeconds();
    var msgObj = {
      time,
      type: type2,
      data: msg
    };
    var awaitPrepare = broadcastChannel._prepP ? broadcastChannel._prepP : PROMISE_RESOLVED_VOID;
    return awaitPrepare.then(function() {
      var sendPromise = broadcastChannel.method.postMessage(broadcastChannel._state, msgObj);
      broadcastChannel._uMP.add(sendPromise);
      sendPromise["catch"]().then(function() {
        return broadcastChannel._uMP["delete"](sendPromise);
      });
      return sendPromise;
    });
  }
  function _prepareChannel(channel) {
    var maybePromise = channel.method.create(channel.name, channel.options);
    if (isPromise(maybePromise)) {
      channel._prepP = maybePromise;
      maybePromise.then(function(s) {
        channel._state = s;
      });
    } else {
      channel._state = maybePromise;
    }
  }
  function _hasMessageListeners(channel) {
    if (channel._addEL.message.length > 0) return true;
    if (channel._addEL.internal.length > 0) return true;
    return false;
  }
  function _addListenerObject(channel, type2, obj) {
    channel._addEL[type2].push(obj);
    _startListening(channel);
  }
  function _removeListenerObject(channel, type2, obj) {
    channel._addEL[type2] = channel._addEL[type2].filter(function(o) {
      return o !== obj;
    });
    _stopListening(channel);
  }
  function _startListening(channel) {
    if (!channel._iL && _hasMessageListeners(channel)) {
      var listenerFn = function listenerFn2(msgObj) {
        channel._addEL[msgObj.type].forEach(function(listenerObject) {
          if (msgObj.time >= listenerObject.time) {
            listenerObject.fn(msgObj.data);
          }
        });
      };
      var time = channel.method.microSeconds();
      if (channel._prepP) {
        channel._prepP.then(function() {
          channel._iL = true;
          channel.method.onMessage(channel._state, listenerFn, time);
        });
      } else {
        channel._iL = true;
        channel.method.onMessage(channel._state, listenerFn, time);
      }
    }
  }
  function _stopListening(channel) {
    if (channel._iL && !_hasMessageListeners(channel)) {
      channel._iL = false;
      var time = channel.method.microSeconds();
      channel.method.onMessage(channel._state, null, time);
    }
  }
  function serialize(obj, serializer = { serialize: JSON.stringify, deserialize: JSON.parse }) {
    return serializer.deserialize(serializer.serialize(obj));
  }
  function stateHasKey(key, $state) {
    return Object.keys($state).includes(key);
  }
  function PiniaSharedState({
    enable = true,
    initialize = true,
    type: type2,
    serializer
  }) {
    return ({ store, options }) => {
      var _a2, _b, _c;
      const isEnabled = ((_a2 = options == null ? void 0 : options.share) == null ? void 0 : _a2.enable) ?? enable;
      const omittedKeys = ((_b = options == null ? void 0 : options.share) == null ? void 0 : _b.omit) ?? [];
      if (!isEnabled)
        return;
      const channel = new BroadcastChannel$1(store.$id, {
        type: type2
      });
      let timestamp = 0;
      let externalUpdate = false;
      const keysToUpdate = Object.keys(store.$state).filter((key) => !omittedKeys.includes(key) && stateHasKey(key, store.$state));
      channel.onmessage = (newState) => {
        if (newState === void 0) {
          channel.postMessage({
            timestamp,
            state: serialize(store.$state, serializer)
          });
          return;
        }
        if (newState.timestamp <= timestamp)
          return;
        externalUpdate = true;
        timestamp = Date.now();
        store.$patch((state) => {
          keysToUpdate.forEach((key) => {
            state[key] = newState.state[key];
          });
        });
      };
      const shouldInitialize = ((_c = options == null ? void 0 : options.share) == null ? void 0 : _c.initialize) ?? initialize;
      if (shouldInitialize)
        channel.postMessage(void 0);
      store.$subscribe((_, state) => {
        if (!externalUpdate) {
          timestamp = Date.now();
          channel.postMessage({
            timestamp,
            state: serialize(state, serializer)
          });
        }
        externalUpdate = false;
      });
    };
  }
  const AI_CLIENT_PROVIDER = Symbol("client");
  const configureAppWithProviders = ({ client, systemPrompt }) => (app) => {
    const pinia = createPinia();
    pinia.use(PiniaSharedState({ enable: true, initialize: false, type: "localstorage" }));
    app.use(pinia).provide(AI_CLIENT_PROVIDER, {
      client,
      systemPrompt
    });
  };
  function useAI() {
    return inject(AI_CLIENT_PROVIDER);
  }
  const useChatboxStore = /* @__PURE__ */ defineStore("chatbox", {
    state: () => ({
      models: [],
      selectedModel: "",
      systemPrompt: "",
      userMessages: [],
      newMessage: "",
      maxTokens: 5e3
    }),
    actions: {
      setSystemPrompt(prompt) {
        this.systemPrompt = prompt;
      },
      setModels(models) {
        this.models = models;
      },
      setSelectedModel(model) {
        this.selectedModel = model;
      },
      addMessage(message) {
        this.userMessages.push(message);
      },
      setNewMessage(message) {
        this.newMessage = message;
      },
      clearNewMessage() {
        this.newMessage = "";
      },
      clearMessages() {
        this.userMessages = [];
      }
    },
    getters: {
      messages: (state) => {
        return [
          { role: "system", content: state.systemPrompt },
          ...state.userMessages
        ];
      }
    }
  });
  function _getDefaults() {
    return {
      async: false,
      breaks: false,
      extensions: null,
      gfm: true,
      hooks: null,
      pedantic: false,
      renderer: null,
      silent: false,
      tokenizer: null,
      walkTokens: null
    };
  }
  let _defaults = _getDefaults();
  function changeDefaults(newDefaults) {
    _defaults = newDefaults;
  }
  const escapeTest = /[&<>"']/;
  const escapeReplace = new RegExp(escapeTest.source, "g");
  const escapeTestNoEncode = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/;
  const escapeReplaceNoEncode = new RegExp(escapeTestNoEncode.source, "g");
  const escapeReplacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  const getEscapeReplacement = (ch) => escapeReplacements[ch];
  function escape$1(html2, encode) {
    if (encode) {
      if (escapeTest.test(html2)) {
        return html2.replace(escapeReplace, getEscapeReplacement);
      }
    } else {
      if (escapeTestNoEncode.test(html2)) {
        return html2.replace(escapeReplaceNoEncode, getEscapeReplacement);
      }
    }
    return html2;
  }
  const caret = /(^|[^\[])\^/g;
  function edit(regex, opt) {
    let source = typeof regex === "string" ? regex : regex.source;
    opt = opt || "";
    const obj = {
      replace: (name, val) => {
        let valSource = typeof val === "string" ? val : val.source;
        valSource = valSource.replace(caret, "$1");
        source = source.replace(name, valSource);
        return obj;
      },
      getRegex: () => {
        return new RegExp(source, opt);
      }
    };
    return obj;
  }
  function cleanUrl(href) {
    try {
      href = encodeURI(href).replace(/%25/g, "%");
    } catch {
      return null;
    }
    return href;
  }
  const noopTest = { exec: () => null };
  function splitCells(tableRow, count) {
    const row = tableRow.replace(/\|/g, (match, offset, str2) => {
      let escaped = false;
      let curr = offset;
      while (--curr >= 0 && str2[curr] === "\\")
        escaped = !escaped;
      if (escaped) {
        return "|";
      } else {
        return " |";
      }
    }), cells = row.split(/ \|/);
    let i = 0;
    if (!cells[0].trim()) {
      cells.shift();
    }
    if (cells.length > 0 && !cells[cells.length - 1].trim()) {
      cells.pop();
    }
    if (count) {
      if (cells.length > count) {
        cells.splice(count);
      } else {
        while (cells.length < count)
          cells.push("");
      }
    }
    for (; i < cells.length; i++) {
      cells[i] = cells[i].trim().replace(/\\\|/g, "|");
    }
    return cells;
  }
  function rtrim(str2, c, invert) {
    const l = str2.length;
    if (l === 0) {
      return "";
    }
    let suffLen = 0;
    while (suffLen < l) {
      const currChar = str2.charAt(l - suffLen - 1);
      if (currChar === c && !invert) {
        suffLen++;
      } else if (currChar !== c && invert) {
        suffLen++;
      } else {
        break;
      }
    }
    return str2.slice(0, l - suffLen);
  }
  function findClosingBracket(str2, b) {
    if (str2.indexOf(b[1]) === -1) {
      return -1;
    }
    let level = 0;
    for (let i = 0; i < str2.length; i++) {
      if (str2[i] === "\\") {
        i++;
      } else if (str2[i] === b[0]) {
        level++;
      } else if (str2[i] === b[1]) {
        level--;
        if (level < 0) {
          return i;
        }
      }
    }
    return -1;
  }
  function outputLink(cap, link2, raw, lexer) {
    const href = link2.href;
    const title = link2.title ? escape$1(link2.title) : null;
    const text = cap[1].replace(/\\([\[\]])/g, "$1");
    if (cap[0].charAt(0) !== "!") {
      lexer.state.inLink = true;
      const token = {
        type: "link",
        raw,
        href,
        title,
        text,
        tokens: lexer.inlineTokens(text)
      };
      lexer.state.inLink = false;
      return token;
    }
    return {
      type: "image",
      raw,
      href,
      title,
      text: escape$1(text)
    };
  }
  function indentCodeCompensation(raw, text) {
    const matchIndentToCode = raw.match(/^(\s+)(?:```)/);
    if (matchIndentToCode === null) {
      return text;
    }
    const indentToCode = matchIndentToCode[1];
    return text.split("\n").map((node) => {
      const matchIndentInNode = node.match(/^\s+/);
      if (matchIndentInNode === null) {
        return node;
      }
      const [indentInNode] = matchIndentInNode;
      if (indentInNode.length >= indentToCode.length) {
        return node.slice(indentToCode.length);
      }
      return node;
    }).join("\n");
  }
  class _Tokenizer {
    // set by the lexer
    constructor(options) {
      __publicField(this, "options");
      __publicField(this, "rules");
      // set by the lexer
      __publicField(this, "lexer");
      this.options = options || _defaults;
    }
    space(src) {
      const cap = this.rules.block.newline.exec(src);
      if (cap && cap[0].length > 0) {
        return {
          type: "space",
          raw: cap[0]
        };
      }
    }
    code(src) {
      const cap = this.rules.block.code.exec(src);
      if (cap) {
        const text = cap[0].replace(/^(?: {1,4}| {0,3}\t)/gm, "");
        return {
          type: "code",
          raw: cap[0],
          codeBlockStyle: "indented",
          text: !this.options.pedantic ? rtrim(text, "\n") : text
        };
      }
    }
    fences(src) {
      const cap = this.rules.block.fences.exec(src);
      if (cap) {
        const raw = cap[0];
        const text = indentCodeCompensation(raw, cap[3] || "");
        return {
          type: "code",
          raw,
          lang: cap[2] ? cap[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : cap[2],
          text
        };
      }
    }
    heading(src) {
      const cap = this.rules.block.heading.exec(src);
      if (cap) {
        let text = cap[2].trim();
        if (/#$/.test(text)) {
          const trimmed = rtrim(text, "#");
          if (this.options.pedantic) {
            text = trimmed.trim();
          } else if (!trimmed || / $/.test(trimmed)) {
            text = trimmed.trim();
          }
        }
        return {
          type: "heading",
          raw: cap[0],
          depth: cap[1].length,
          text,
          tokens: this.lexer.inline(text)
        };
      }
    }
    hr(src) {
      const cap = this.rules.block.hr.exec(src);
      if (cap) {
        return {
          type: "hr",
          raw: rtrim(cap[0], "\n")
        };
      }
    }
    blockquote(src) {
      const cap = this.rules.block.blockquote.exec(src);
      if (cap) {
        let lines = rtrim(cap[0], "\n").split("\n");
        let raw = "";
        let text = "";
        const tokens = [];
        while (lines.length > 0) {
          let inBlockquote = false;
          const currentLines = [];
          let i;
          for (i = 0; i < lines.length; i++) {
            if (/^ {0,3}>/.test(lines[i])) {
              currentLines.push(lines[i]);
              inBlockquote = true;
            } else if (!inBlockquote) {
              currentLines.push(lines[i]);
            } else {
              break;
            }
          }
          lines = lines.slice(i);
          const currentRaw = currentLines.join("\n");
          const currentText = currentRaw.replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, "\n    $1").replace(/^ {0,3}>[ \t]?/gm, "");
          raw = raw ? `${raw}
${currentRaw}` : currentRaw;
          text = text ? `${text}
${currentText}` : currentText;
          const top = this.lexer.state.top;
          this.lexer.state.top = true;
          this.lexer.blockTokens(currentText, tokens, true);
          this.lexer.state.top = top;
          if (lines.length === 0) {
            break;
          }
          const lastToken = tokens[tokens.length - 1];
          if ((lastToken == null ? void 0 : lastToken.type) === "code") {
            break;
          } else if ((lastToken == null ? void 0 : lastToken.type) === "blockquote") {
            const oldToken = lastToken;
            const newText = oldToken.raw + "\n" + lines.join("\n");
            const newToken = this.blockquote(newText);
            tokens[tokens.length - 1] = newToken;
            raw = raw.substring(0, raw.length - oldToken.raw.length) + newToken.raw;
            text = text.substring(0, text.length - oldToken.text.length) + newToken.text;
            break;
          } else if ((lastToken == null ? void 0 : lastToken.type) === "list") {
            const oldToken = lastToken;
            const newText = oldToken.raw + "\n" + lines.join("\n");
            const newToken = this.list(newText);
            tokens[tokens.length - 1] = newToken;
            raw = raw.substring(0, raw.length - lastToken.raw.length) + newToken.raw;
            text = text.substring(0, text.length - oldToken.raw.length) + newToken.raw;
            lines = newText.substring(tokens[tokens.length - 1].raw.length).split("\n");
            continue;
          }
        }
        return {
          type: "blockquote",
          raw,
          tokens,
          text
        };
      }
    }
    list(src) {
      let cap = this.rules.block.list.exec(src);
      if (cap) {
        let bull = cap[1].trim();
        const isordered = bull.length > 1;
        const list2 = {
          type: "list",
          raw: "",
          ordered: isordered,
          start: isordered ? +bull.slice(0, -1) : "",
          loose: false,
          items: []
        };
        bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;
        if (this.options.pedantic) {
          bull = isordered ? bull : "[*+-]";
        }
        const itemRegex = new RegExp(`^( {0,3}${bull})((?:[	 ][^\\n]*)?(?:\\n|$))`);
        let endsWithBlankLine = false;
        while (src) {
          let endEarly = false;
          let raw = "";
          let itemContents = "";
          if (!(cap = itemRegex.exec(src))) {
            break;
          }
          if (this.rules.block.hr.test(src)) {
            break;
          }
          raw = cap[0];
          src = src.substring(raw.length);
          let line = cap[2].split("\n", 1)[0].replace(/^\t+/, (t) => " ".repeat(3 * t.length));
          let nextLine = src.split("\n", 1)[0];
          let blankLine = !line.trim();
          let indent = 0;
          if (this.options.pedantic) {
            indent = 2;
            itemContents = line.trimStart();
          } else if (blankLine) {
            indent = cap[1].length + 1;
          } else {
            indent = cap[2].search(/[^ ]/);
            indent = indent > 4 ? 1 : indent;
            itemContents = line.slice(indent);
            indent += cap[1].length;
          }
          if (blankLine && /^[ \t]*$/.test(nextLine)) {
            raw += nextLine + "\n";
            src = src.substring(nextLine.length + 1);
            endEarly = true;
          }
          if (!endEarly) {
            const nextBulletRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`);
            const hrRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`);
            const fencesBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:\`\`\`|~~~)`);
            const headingBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}#`);
            while (src) {
              const rawLine = src.split("\n", 1)[0];
              let nextLineWithoutTabs;
              nextLine = rawLine;
              if (this.options.pedantic) {
                nextLine = nextLine.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ");
                nextLineWithoutTabs = nextLine;
              } else {
                nextLineWithoutTabs = nextLine.replace(/\t/g, "    ");
              }
              if (fencesBeginRegex.test(nextLine)) {
                break;
              }
              if (headingBeginRegex.test(nextLine)) {
                break;
              }
              if (nextBulletRegex.test(nextLine)) {
                break;
              }
              if (hrRegex.test(nextLine)) {
                break;
              }
              if (nextLineWithoutTabs.search(/[^ ]/) >= indent || !nextLine.trim()) {
                itemContents += "\n" + nextLineWithoutTabs.slice(indent);
              } else {
                if (blankLine) {
                  break;
                }
                if (line.replace(/\t/g, "    ").search(/[^ ]/) >= 4) {
                  break;
                }
                if (fencesBeginRegex.test(line)) {
                  break;
                }
                if (headingBeginRegex.test(line)) {
                  break;
                }
                if (hrRegex.test(line)) {
                  break;
                }
                itemContents += "\n" + nextLine;
              }
              if (!blankLine && !nextLine.trim()) {
                blankLine = true;
              }
              raw += rawLine + "\n";
              src = src.substring(rawLine.length + 1);
              line = nextLineWithoutTabs.slice(indent);
            }
          }
          if (!list2.loose) {
            if (endsWithBlankLine) {
              list2.loose = true;
            } else if (/\n[ \t]*\n[ \t]*$/.test(raw)) {
              endsWithBlankLine = true;
            }
          }
          let istask = null;
          let ischecked;
          if (this.options.gfm) {
            istask = /^\[[ xX]\] /.exec(itemContents);
            if (istask) {
              ischecked = istask[0] !== "[ ] ";
              itemContents = itemContents.replace(/^\[[ xX]\] +/, "");
            }
          }
          list2.items.push({
            type: "list_item",
            raw,
            task: !!istask,
            checked: ischecked,
            loose: false,
            text: itemContents,
            tokens: []
          });
          list2.raw += raw;
        }
        list2.items[list2.items.length - 1].raw = list2.items[list2.items.length - 1].raw.trimEnd();
        list2.items[list2.items.length - 1].text = list2.items[list2.items.length - 1].text.trimEnd();
        list2.raw = list2.raw.trimEnd();
        for (let i = 0; i < list2.items.length; i++) {
          this.lexer.state.top = false;
          list2.items[i].tokens = this.lexer.blockTokens(list2.items[i].text, []);
          if (!list2.loose) {
            const spacers = list2.items[i].tokens.filter((t) => t.type === "space");
            const hasMultipleLineBreaks = spacers.length > 0 && spacers.some((t) => /\n.*\n/.test(t.raw));
            list2.loose = hasMultipleLineBreaks;
          }
        }
        if (list2.loose) {
          for (let i = 0; i < list2.items.length; i++) {
            list2.items[i].loose = true;
          }
        }
        return list2;
      }
    }
    html(src) {
      const cap = this.rules.block.html.exec(src);
      if (cap) {
        const token = {
          type: "html",
          block: true,
          raw: cap[0],
          pre: cap[1] === "pre" || cap[1] === "script" || cap[1] === "style",
          text: cap[0]
        };
        return token;
      }
    }
    def(src) {
      const cap = this.rules.block.def.exec(src);
      if (cap) {
        const tag2 = cap[1].toLowerCase().replace(/\s+/g, " ");
        const href = cap[2] ? cap[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "";
        const title = cap[3] ? cap[3].substring(1, cap[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : cap[3];
        return {
          type: "def",
          tag: tag2,
          raw: cap[0],
          href,
          title
        };
      }
    }
    table(src) {
      const cap = this.rules.block.table.exec(src);
      if (!cap) {
        return;
      }
      if (!/[:|]/.test(cap[2])) {
        return;
      }
      const headers = splitCells(cap[1]);
      const aligns = cap[2].replace(/^\||\| *$/g, "").split("|");
      const rows = cap[3] && cap[3].trim() ? cap[3].replace(/\n[ \t]*$/, "").split("\n") : [];
      const item = {
        type: "table",
        raw: cap[0],
        header: [],
        align: [],
        rows: []
      };
      if (headers.length !== aligns.length) {
        return;
      }
      for (const align of aligns) {
        if (/^ *-+: *$/.test(align)) {
          item.align.push("right");
        } else if (/^ *:-+: *$/.test(align)) {
          item.align.push("center");
        } else if (/^ *:-+ *$/.test(align)) {
          item.align.push("left");
        } else {
          item.align.push(null);
        }
      }
      for (let i = 0; i < headers.length; i++) {
        item.header.push({
          text: headers[i],
          tokens: this.lexer.inline(headers[i]),
          header: true,
          align: item.align[i]
        });
      }
      for (const row of rows) {
        item.rows.push(splitCells(row, item.header.length).map((cell, i) => {
          return {
            text: cell,
            tokens: this.lexer.inline(cell),
            header: false,
            align: item.align[i]
          };
        }));
      }
      return item;
    }
    lheading(src) {
      const cap = this.rules.block.lheading.exec(src);
      if (cap) {
        return {
          type: "heading",
          raw: cap[0],
          depth: cap[2].charAt(0) === "=" ? 1 : 2,
          text: cap[1],
          tokens: this.lexer.inline(cap[1])
        };
      }
    }
    paragraph(src) {
      const cap = this.rules.block.paragraph.exec(src);
      if (cap) {
        const text = cap[1].charAt(cap[1].length - 1) === "\n" ? cap[1].slice(0, -1) : cap[1];
        return {
          type: "paragraph",
          raw: cap[0],
          text,
          tokens: this.lexer.inline(text)
        };
      }
    }
    text(src) {
      const cap = this.rules.block.text.exec(src);
      if (cap) {
        return {
          type: "text",
          raw: cap[0],
          text: cap[0],
          tokens: this.lexer.inline(cap[0])
        };
      }
    }
    escape(src) {
      const cap = this.rules.inline.escape.exec(src);
      if (cap) {
        return {
          type: "escape",
          raw: cap[0],
          text: escape$1(cap[1])
        };
      }
    }
    tag(src) {
      const cap = this.rules.inline.tag.exec(src);
      if (cap) {
        if (!this.lexer.state.inLink && /^<a /i.test(cap[0])) {
          this.lexer.state.inLink = true;
        } else if (this.lexer.state.inLink && /^<\/a>/i.test(cap[0])) {
          this.lexer.state.inLink = false;
        }
        if (!this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          this.lexer.state.inRawBlock = true;
        } else if (this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          this.lexer.state.inRawBlock = false;
        }
        return {
          type: "html",
          raw: cap[0],
          inLink: this.lexer.state.inLink,
          inRawBlock: this.lexer.state.inRawBlock,
          block: false,
          text: cap[0]
        };
      }
    }
    link(src) {
      const cap = this.rules.inline.link.exec(src);
      if (cap) {
        const trimmedUrl = cap[2].trim();
        if (!this.options.pedantic && /^</.test(trimmedUrl)) {
          if (!/>$/.test(trimmedUrl)) {
            return;
          }
          const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), "\\");
          if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
            return;
          }
        } else {
          const lastParenIndex = findClosingBracket(cap[2], "()");
          if (lastParenIndex > -1) {
            const start = cap[0].indexOf("!") === 0 ? 5 : 4;
            const linkLen = start + cap[1].length + lastParenIndex;
            cap[2] = cap[2].substring(0, lastParenIndex);
            cap[0] = cap[0].substring(0, linkLen).trim();
            cap[3] = "";
          }
        }
        let href = cap[2];
        let title = "";
        if (this.options.pedantic) {
          const link2 = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);
          if (link2) {
            href = link2[1];
            title = link2[3];
          }
        } else {
          title = cap[3] ? cap[3].slice(1, -1) : "";
        }
        href = href.trim();
        if (/^</.test(href)) {
          if (this.options.pedantic && !/>$/.test(trimmedUrl)) {
            href = href.slice(1);
          } else {
            href = href.slice(1, -1);
          }
        }
        return outputLink(cap, {
          href: href ? href.replace(this.rules.inline.anyPunctuation, "$1") : href,
          title: title ? title.replace(this.rules.inline.anyPunctuation, "$1") : title
        }, cap[0], this.lexer);
      }
    }
    reflink(src, links) {
      let cap;
      if ((cap = this.rules.inline.reflink.exec(src)) || (cap = this.rules.inline.nolink.exec(src))) {
        const linkString = (cap[2] || cap[1]).replace(/\s+/g, " ");
        const link2 = links[linkString.toLowerCase()];
        if (!link2) {
          const text = cap[0].charAt(0);
          return {
            type: "text",
            raw: text,
            text
          };
        }
        return outputLink(cap, link2, cap[0], this.lexer);
      }
    }
    emStrong(src, maskedSrc, prevChar = "") {
      let match = this.rules.inline.emStrongLDelim.exec(src);
      if (!match)
        return;
      if (match[3] && prevChar.match(/[\p{L}\p{N}]/u))
        return;
      const nextChar = match[1] || match[2] || "";
      if (!nextChar || !prevChar || this.rules.inline.punctuation.exec(prevChar)) {
        const lLength = [...match[0]].length - 1;
        let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;
        const endReg = match[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
        endReg.lastIndex = 0;
        maskedSrc = maskedSrc.slice(-1 * src.length + lLength);
        while ((match = endReg.exec(maskedSrc)) != null) {
          rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
          if (!rDelim)
            continue;
          rLength = [...rDelim].length;
          if (match[3] || match[4]) {
            delimTotal += rLength;
            continue;
          } else if (match[5] || match[6]) {
            if (lLength % 3 && !((lLength + rLength) % 3)) {
              midDelimTotal += rLength;
              continue;
            }
          }
          delimTotal -= rLength;
          if (delimTotal > 0)
            continue;
          rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
          const lastCharLength = [...match[0]][0].length;
          const raw = src.slice(0, lLength + match.index + lastCharLength + rLength);
          if (Math.min(lLength, rLength) % 2) {
            const text2 = raw.slice(1, -1);
            return {
              type: "em",
              raw,
              text: text2,
              tokens: this.lexer.inlineTokens(text2)
            };
          }
          const text = raw.slice(2, -2);
          return {
            type: "strong",
            raw,
            text,
            tokens: this.lexer.inlineTokens(text)
          };
        }
      }
    }
    codespan(src) {
      const cap = this.rules.inline.code.exec(src);
      if (cap) {
        let text = cap[2].replace(/\n/g, " ");
        const hasNonSpaceChars = /[^ ]/.test(text);
        const hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
        if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
          text = text.substring(1, text.length - 1);
        }
        text = escape$1(text, true);
        return {
          type: "codespan",
          raw: cap[0],
          text
        };
      }
    }
    br(src) {
      const cap = this.rules.inline.br.exec(src);
      if (cap) {
        return {
          type: "br",
          raw: cap[0]
        };
      }
    }
    del(src) {
      const cap = this.rules.inline.del.exec(src);
      if (cap) {
        return {
          type: "del",
          raw: cap[0],
          text: cap[2],
          tokens: this.lexer.inlineTokens(cap[2])
        };
      }
    }
    autolink(src) {
      const cap = this.rules.inline.autolink.exec(src);
      if (cap) {
        let text, href;
        if (cap[2] === "@") {
          text = escape$1(cap[1]);
          href = "mailto:" + text;
        } else {
          text = escape$1(cap[1]);
          href = text;
        }
        return {
          type: "link",
          raw: cap[0],
          text,
          href,
          tokens: [
            {
              type: "text",
              raw: text,
              text
            }
          ]
        };
      }
    }
    url(src) {
      var _a2;
      let cap;
      if (cap = this.rules.inline.url.exec(src)) {
        let text, href;
        if (cap[2] === "@") {
          text = escape$1(cap[0]);
          href = "mailto:" + text;
        } else {
          let prevCapZero;
          do {
            prevCapZero = cap[0];
            cap[0] = ((_a2 = this.rules.inline._backpedal.exec(cap[0])) == null ? void 0 : _a2[0]) ?? "";
          } while (prevCapZero !== cap[0]);
          text = escape$1(cap[0]);
          if (cap[1] === "www.") {
            href = "http://" + cap[0];
          } else {
            href = cap[0];
          }
        }
        return {
          type: "link",
          raw: cap[0],
          text,
          href,
          tokens: [
            {
              type: "text",
              raw: text,
              text
            }
          ]
        };
      }
    }
    inlineText(src) {
      const cap = this.rules.inline.text.exec(src);
      if (cap) {
        let text;
        if (this.lexer.state.inRawBlock) {
          text = cap[0];
        } else {
          text = escape$1(cap[0]);
        }
        return {
          type: "text",
          raw: cap[0],
          text
        };
      }
    }
  }
  const newline = /^(?:[ \t]*(?:\n|$))+/;
  const blockCode = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
  const fences = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
  const hr = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
  const heading = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
  const bullet = /(?:[*+-]|\d{1,9}[.)])/;
  const lheading = edit(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, bullet).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex();
  const _paragraph = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
  const blockText = /^[^\n]+/;
  const _blockLabel = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
  const def = edit(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", _blockLabel).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
  const list = edit(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, bullet).getRegex();
  const _tag = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
  const _comment = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
  const html = edit("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", _comment).replace("tag", _tag).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
  const paragraph = edit(_paragraph).replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex();
  const blockquote = edit(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", paragraph).getRegex();
  const blockNormal = {
    blockquote,
    code: blockCode,
    def,
    fences,
    heading,
    hr,
    html,
    lheading,
    list,
    newline,
    paragraph,
    table: noopTest,
    text: blockText
  };
  const gfmTable = edit("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex();
  const blockGfm = {
    ...blockNormal,
    table: gfmTable,
    paragraph: edit(_paragraph).replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", gfmTable).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex()
  };
  const blockPedantic = {
    ...blockNormal,
    html: edit(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", _comment).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: noopTest,
    // fences not supported
    lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
    paragraph: edit(_paragraph).replace("hr", hr).replace("heading", " *#{1,6} *[^\n]").replace("lheading", lheading).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
  };
  const escape = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
  const inlineCode = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
  const br = /^( {2,}|\\)\n(?!\s*$)/;
  const inlineText = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
  const _punctuation = "\\p{P}\\p{S}";
  const punctuation = edit(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, _punctuation).getRegex();
  const blockSkip = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g;
  const emStrongLDelim = edit(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, _punctuation).getRegex();
  const emStrongRDelimAst = edit("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, _punctuation).getRegex();
  const emStrongRDelimUnd = edit("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, _punctuation).getRegex();
  const anyPunctuation = edit(/\\([punct])/, "gu").replace(/punct/g, _punctuation).getRegex();
  const autolink = edit(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
  const _inlineComment = edit(_comment).replace("(?:-->|$)", "-->").getRegex();
  const tag = edit("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", _inlineComment).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
  const _inlineLabel = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
  const link = edit(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", _inlineLabel).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
  const reflink = edit(/^!?\[(label)\]\[(ref)\]/).replace("label", _inlineLabel).replace("ref", _blockLabel).getRegex();
  const nolink = edit(/^!?\[(ref)\](?:\[\])?/).replace("ref", _blockLabel).getRegex();
  const reflinkSearch = edit("reflink|nolink(?!\\()", "g").replace("reflink", reflink).replace("nolink", nolink).getRegex();
  const inlineNormal = {
    _backpedal: noopTest,
    // only used for GFM url
    anyPunctuation,
    autolink,
    blockSkip,
    br,
    code: inlineCode,
    del: noopTest,
    emStrongLDelim,
    emStrongRDelimAst,
    emStrongRDelimUnd,
    escape,
    link,
    nolink,
    punctuation,
    reflink,
    reflinkSearch,
    tag,
    text: inlineText,
    url: noopTest
  };
  const inlinePedantic = {
    ...inlineNormal,
    link: edit(/^!?\[(label)\]\((.*?)\)/).replace("label", _inlineLabel).getRegex(),
    reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", _inlineLabel).getRegex()
  };
  const inlineGfm = {
    ...inlineNormal,
    escape: edit(escape).replace("])", "~|])").getRegex(),
    url: edit(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
    _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
    text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
  };
  const inlineBreaks = {
    ...inlineGfm,
    br: edit(br).replace("{2,}", "*").getRegex(),
    text: edit(inlineGfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
  };
  const block = {
    normal: blockNormal,
    gfm: blockGfm,
    pedantic: blockPedantic
  };
  const inline = {
    normal: inlineNormal,
    gfm: inlineGfm,
    breaks: inlineBreaks,
    pedantic: inlinePedantic
  };
  class _Lexer {
    constructor(options) {
      __publicField(this, "tokens");
      __publicField(this, "options");
      __publicField(this, "state");
      __publicField(this, "tokenizer");
      __publicField(this, "inlineQueue");
      this.tokens = [];
      this.tokens.links = /* @__PURE__ */ Object.create(null);
      this.options = options || _defaults;
      this.options.tokenizer = this.options.tokenizer || new _Tokenizer();
      this.tokenizer = this.options.tokenizer;
      this.tokenizer.options = this.options;
      this.tokenizer.lexer = this;
      this.inlineQueue = [];
      this.state = {
        inLink: false,
        inRawBlock: false,
        top: true
      };
      const rules = {
        block: block.normal,
        inline: inline.normal
      };
      if (this.options.pedantic) {
        rules.block = block.pedantic;
        rules.inline = inline.pedantic;
      } else if (this.options.gfm) {
        rules.block = block.gfm;
        if (this.options.breaks) {
          rules.inline = inline.breaks;
        } else {
          rules.inline = inline.gfm;
        }
      }
      this.tokenizer.rules = rules;
    }
    /**
     * Expose Rules
     */
    static get rules() {
      return {
        block,
        inline
      };
    }
    /**
     * Static Lex Method
     */
    static lex(src, options) {
      const lexer = new _Lexer(options);
      return lexer.lex(src);
    }
    /**
     * Static Lex Inline Method
     */
    static lexInline(src, options) {
      const lexer = new _Lexer(options);
      return lexer.inlineTokens(src);
    }
    /**
     * Preprocessing
     */
    lex(src) {
      src = src.replace(/\r\n|\r/g, "\n");
      this.blockTokens(src, this.tokens);
      for (let i = 0; i < this.inlineQueue.length; i++) {
        const next = this.inlineQueue[i];
        this.inlineTokens(next.src, next.tokens);
      }
      this.inlineQueue = [];
      return this.tokens;
    }
    blockTokens(src, tokens = [], lastParagraphClipped = false) {
      if (this.options.pedantic) {
        src = src.replace(/\t/g, "    ").replace(/^ +$/gm, "");
      }
      let token;
      let lastToken;
      let cutSrc;
      while (src) {
        if (this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((extTokenizer) => {
          if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            return true;
          }
          return false;
        })) {
          continue;
        }
        if (token = this.tokenizer.space(src)) {
          src = src.substring(token.raw.length);
          if (token.raw.length === 1 && tokens.length > 0) {
            tokens[tokens.length - 1].raw += "\n";
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (token = this.tokenizer.code(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && (lastToken.type === "paragraph" || lastToken.type === "text")) {
            lastToken.raw += "\n" + token.raw;
            lastToken.text += "\n" + token.text;
            this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (token = this.tokenizer.fences(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.heading(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.hr(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.blockquote(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.list(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.html(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.def(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && (lastToken.type === "paragraph" || lastToken.type === "text")) {
            lastToken.raw += "\n" + token.raw;
            lastToken.text += "\n" + token.raw;
            this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
          } else if (!this.tokens.links[token.tag]) {
            this.tokens.links[token.tag] = {
              href: token.href,
              title: token.title
            };
          }
          continue;
        }
        if (token = this.tokenizer.table(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.lheading(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        cutSrc = src;
        if (this.options.extensions && this.options.extensions.startBlock) {
          let startIndex = Infinity;
          const tempSrc = src.slice(1);
          let tempStart;
          this.options.extensions.startBlock.forEach((getStartIndex) => {
            tempStart = getStartIndex.call({ lexer: this }, tempSrc);
            if (typeof tempStart === "number" && tempStart >= 0) {
              startIndex = Math.min(startIndex, tempStart);
            }
          });
          if (startIndex < Infinity && startIndex >= 0) {
            cutSrc = src.substring(0, startIndex + 1);
          }
        }
        if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
          lastToken = tokens[tokens.length - 1];
          if (lastParagraphClipped && (lastToken == null ? void 0 : lastToken.type) === "paragraph") {
            lastToken.raw += "\n" + token.raw;
            lastToken.text += "\n" + token.text;
            this.inlineQueue.pop();
            this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
          } else {
            tokens.push(token);
          }
          lastParagraphClipped = cutSrc.length !== src.length;
          src = src.substring(token.raw.length);
          continue;
        }
        if (token = this.tokenizer.text(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && lastToken.type === "text") {
            lastToken.raw += "\n" + token.raw;
            lastToken.text += "\n" + token.text;
            this.inlineQueue.pop();
            this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (src) {
          const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
          if (this.options.silent) {
            console.error(errMsg);
            break;
          } else {
            throw new Error(errMsg);
          }
        }
      }
      this.state.top = true;
      return tokens;
    }
    inline(src, tokens = []) {
      this.inlineQueue.push({ src, tokens });
      return tokens;
    }
    /**
     * Lexing/Compiling
     */
    inlineTokens(src, tokens = []) {
      let token, lastToken, cutSrc;
      let maskedSrc = src;
      let match;
      let keepPrevChar, prevChar;
      if (this.tokens.links) {
        const links = Object.keys(this.tokens.links);
        if (links.length > 0) {
          while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
            if (links.includes(match[0].slice(match[0].lastIndexOf("[") + 1, -1))) {
              maskedSrc = maskedSrc.slice(0, match.index) + "[" + "a".repeat(match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
            }
          }
        }
      }
      while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
        maskedSrc = maskedSrc.slice(0, match.index) + "[" + "a".repeat(match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
      }
      while ((match = this.tokenizer.rules.inline.anyPunctuation.exec(maskedSrc)) != null) {
        maskedSrc = maskedSrc.slice(0, match.index) + "++" + maskedSrc.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
      }
      while (src) {
        if (!keepPrevChar) {
          prevChar = "";
        }
        keepPrevChar = false;
        if (this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((extTokenizer) => {
          if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            return true;
          }
          return false;
        })) {
          continue;
        }
        if (token = this.tokenizer.escape(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.tag(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && token.type === "text" && lastToken.type === "text") {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (token = this.tokenizer.link(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.reflink(src, this.tokens.links)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && token.type === "text" && lastToken.type === "text") {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (token = this.tokenizer.emStrong(src, maskedSrc, prevChar)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.codespan(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.br(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.del(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.autolink(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (!this.state.inLink && (token = this.tokenizer.url(src))) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        cutSrc = src;
        if (this.options.extensions && this.options.extensions.startInline) {
          let startIndex = Infinity;
          const tempSrc = src.slice(1);
          let tempStart;
          this.options.extensions.startInline.forEach((getStartIndex) => {
            tempStart = getStartIndex.call({ lexer: this }, tempSrc);
            if (typeof tempStart === "number" && tempStart >= 0) {
              startIndex = Math.min(startIndex, tempStart);
            }
          });
          if (startIndex < Infinity && startIndex >= 0) {
            cutSrc = src.substring(0, startIndex + 1);
          }
        }
        if (token = this.tokenizer.inlineText(cutSrc)) {
          src = src.substring(token.raw.length);
          if (token.raw.slice(-1) !== "_") {
            prevChar = token.raw.slice(-1);
          }
          keepPrevChar = true;
          lastToken = tokens[tokens.length - 1];
          if (lastToken && lastToken.type === "text") {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (src) {
          const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
          if (this.options.silent) {
            console.error(errMsg);
            break;
          } else {
            throw new Error(errMsg);
          }
        }
      }
      return tokens;
    }
  }
  class _Renderer {
    // set by the parser
    constructor(options) {
      __publicField(this, "options");
      __publicField(this, "parser");
      this.options = options || _defaults;
    }
    space(token) {
      return "";
    }
    code({ text, lang, escaped }) {
      var _a2;
      const langString = (_a2 = (lang || "").match(/^\S*/)) == null ? void 0 : _a2[0];
      const code = text.replace(/\n$/, "") + "\n";
      if (!langString) {
        return "<pre><code>" + (escaped ? code : escape$1(code, true)) + "</code></pre>\n";
      }
      return '<pre><code class="language-' + escape$1(langString) + '">' + (escaped ? code : escape$1(code, true)) + "</code></pre>\n";
    }
    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      return `<blockquote>
${body}</blockquote>
`;
    }
    html({ text }) {
      return text;
    }
    heading({ tokens, depth }) {
      return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>
`;
    }
    hr(token) {
      return "<hr>\n";
    }
    list(token) {
      const ordered = token.ordered;
      const start = token.start;
      let body = "";
      for (let j = 0; j < token.items.length; j++) {
        const item = token.items[j];
        body += this.listitem(item);
      }
      const type2 = ordered ? "ol" : "ul";
      const startAttr = ordered && start !== 1 ? ' start="' + start + '"' : "";
      return "<" + type2 + startAttr + ">\n" + body + "</" + type2 + ">\n";
    }
    listitem(item) {
      let itemBody = "";
      if (item.task) {
        const checkbox = this.checkbox({ checked: !!item.checked });
        if (item.loose) {
          if (item.tokens.length > 0 && item.tokens[0].type === "paragraph") {
            item.tokens[0].text = checkbox + " " + item.tokens[0].text;
            if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === "text") {
              item.tokens[0].tokens[0].text = checkbox + " " + item.tokens[0].tokens[0].text;
            }
          } else {
            item.tokens.unshift({
              type: "text",
              raw: checkbox + " ",
              text: checkbox + " "
            });
          }
        } else {
          itemBody += checkbox + " ";
        }
      }
      itemBody += this.parser.parse(item.tokens, !!item.loose);
      return `<li>${itemBody}</li>
`;
    }
    checkbox({ checked }) {
      return "<input " + (checked ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
    }
    paragraph({ tokens }) {
      return `<p>${this.parser.parseInline(tokens)}</p>
`;
    }
    table(token) {
      let header = "";
      let cell = "";
      for (let j = 0; j < token.header.length; j++) {
        cell += this.tablecell(token.header[j]);
      }
      header += this.tablerow({ text: cell });
      let body = "";
      for (let j = 0; j < token.rows.length; j++) {
        const row = token.rows[j];
        cell = "";
        for (let k = 0; k < row.length; k++) {
          cell += this.tablecell(row[k]);
        }
        body += this.tablerow({ text: cell });
      }
      if (body)
        body = `<tbody>${body}</tbody>`;
      return "<table>\n<thead>\n" + header + "</thead>\n" + body + "</table>\n";
    }
    tablerow({ text }) {
      return `<tr>
${text}</tr>
`;
    }
    tablecell(token) {
      const content = this.parser.parseInline(token.tokens);
      const type2 = token.header ? "th" : "td";
      const tag2 = token.align ? `<${type2} align="${token.align}">` : `<${type2}>`;
      return tag2 + content + `</${type2}>
`;
    }
    /**
     * span level renderer
     */
    strong({ tokens }) {
      return `<strong>${this.parser.parseInline(tokens)}</strong>`;
    }
    em({ tokens }) {
      return `<em>${this.parser.parseInline(tokens)}</em>`;
    }
    codespan({ text }) {
      return `<code>${text}</code>`;
    }
    br(token) {
      return "<br>";
    }
    del({ tokens }) {
      return `<del>${this.parser.parseInline(tokens)}</del>`;
    }
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const cleanHref = cleanUrl(href);
      if (cleanHref === null) {
        return text;
      }
      href = cleanHref;
      let out = '<a href="' + href + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += ">" + text + "</a>";
      return out;
    }
    image({ href, title, text }) {
      const cleanHref = cleanUrl(href);
      if (cleanHref === null) {
        return text;
      }
      href = cleanHref;
      let out = `<img src="${href}" alt="${text}"`;
      if (title) {
        out += ` title="${title}"`;
      }
      out += ">";
      return out;
    }
    text(token) {
      return "tokens" in token && token.tokens ? this.parser.parseInline(token.tokens) : token.text;
    }
  }
  class _TextRenderer {
    // no need for block level renderers
    strong({ text }) {
      return text;
    }
    em({ text }) {
      return text;
    }
    codespan({ text }) {
      return text;
    }
    del({ text }) {
      return text;
    }
    html({ text }) {
      return text;
    }
    text({ text }) {
      return text;
    }
    link({ text }) {
      return "" + text;
    }
    image({ text }) {
      return "" + text;
    }
    br() {
      return "";
    }
  }
  class _Parser {
    constructor(options) {
      __publicField(this, "options");
      __publicField(this, "renderer");
      __publicField(this, "textRenderer");
      this.options = options || _defaults;
      this.options.renderer = this.options.renderer || new _Renderer();
      this.renderer = this.options.renderer;
      this.renderer.options = this.options;
      this.renderer.parser = this;
      this.textRenderer = new _TextRenderer();
    }
    /**
     * Static Parse Method
     */
    static parse(tokens, options) {
      const parser = new _Parser(options);
      return parser.parse(tokens);
    }
    /**
     * Static Parse Inline Method
     */
    static parseInline(tokens, options) {
      const parser = new _Parser(options);
      return parser.parseInline(tokens);
    }
    /**
     * Parse Loop
     */
    parse(tokens, top = true) {
      let out = "";
      for (let i = 0; i < tokens.length; i++) {
        const anyToken = tokens[i];
        if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[anyToken.type]) {
          const genericToken = anyToken;
          const ret = this.options.extensions.renderers[genericToken.type].call({ parser: this }, genericToken);
          if (ret !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(genericToken.type)) {
            out += ret || "";
            continue;
          }
        }
        const token = anyToken;
        switch (token.type) {
          case "space": {
            out += this.renderer.space(token);
            continue;
          }
          case "hr": {
            out += this.renderer.hr(token);
            continue;
          }
          case "heading": {
            out += this.renderer.heading(token);
            continue;
          }
          case "code": {
            out += this.renderer.code(token);
            continue;
          }
          case "table": {
            out += this.renderer.table(token);
            continue;
          }
          case "blockquote": {
            out += this.renderer.blockquote(token);
            continue;
          }
          case "list": {
            out += this.renderer.list(token);
            continue;
          }
          case "html": {
            out += this.renderer.html(token);
            continue;
          }
          case "paragraph": {
            out += this.renderer.paragraph(token);
            continue;
          }
          case "text": {
            let textToken = token;
            let body = this.renderer.text(textToken);
            while (i + 1 < tokens.length && tokens[i + 1].type === "text") {
              textToken = tokens[++i];
              body += "\n" + this.renderer.text(textToken);
            }
            if (top) {
              out += this.renderer.paragraph({
                type: "paragraph",
                raw: body,
                text: body,
                tokens: [{ type: "text", raw: body, text: body }]
              });
            } else {
              out += body;
            }
            continue;
          }
          default: {
            const errMsg = 'Token with "' + token.type + '" type was not found.';
            if (this.options.silent) {
              console.error(errMsg);
              return "";
            } else {
              throw new Error(errMsg);
            }
          }
        }
      }
      return out;
    }
    /**
     * Parse Inline Tokens
     */
    parseInline(tokens, renderer2) {
      renderer2 = renderer2 || this.renderer;
      let out = "";
      for (let i = 0; i < tokens.length; i++) {
        const anyToken = tokens[i];
        if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[anyToken.type]) {
          const ret = this.options.extensions.renderers[anyToken.type].call({ parser: this }, anyToken);
          if (ret !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(anyToken.type)) {
            out += ret || "";
            continue;
          }
        }
        const token = anyToken;
        switch (token.type) {
          case "escape": {
            out += renderer2.text(token);
            break;
          }
          case "html": {
            out += renderer2.html(token);
            break;
          }
          case "link": {
            out += renderer2.link(token);
            break;
          }
          case "image": {
            out += renderer2.image(token);
            break;
          }
          case "strong": {
            out += renderer2.strong(token);
            break;
          }
          case "em": {
            out += renderer2.em(token);
            break;
          }
          case "codespan": {
            out += renderer2.codespan(token);
            break;
          }
          case "br": {
            out += renderer2.br(token);
            break;
          }
          case "del": {
            out += renderer2.del(token);
            break;
          }
          case "text": {
            out += renderer2.text(token);
            break;
          }
          default: {
            const errMsg = 'Token with "' + token.type + '" type was not found.';
            if (this.options.silent) {
              console.error(errMsg);
              return "";
            } else {
              throw new Error(errMsg);
            }
          }
        }
      }
      return out;
    }
  }
  class _Hooks {
    constructor(options) {
      __publicField(this, "options");
      __publicField(this, "block");
      this.options = options || _defaults;
    }
    /**
     * Process markdown before marked
     */
    preprocess(markdown) {
      return markdown;
    }
    /**
     * Process HTML after marked is finished
     */
    postprocess(html2) {
      return html2;
    }
    /**
     * Process all tokens before walk tokens
     */
    processAllTokens(tokens) {
      return tokens;
    }
    /**
     * Provide function to tokenize markdown
     */
    provideLexer() {
      return this.block ? _Lexer.lex : _Lexer.lexInline;
    }
    /**
     * Provide function to parse tokens
     */
    provideParser() {
      return this.block ? _Parser.parse : _Parser.parseInline;
    }
  }
  __publicField(_Hooks, "passThroughHooks", /* @__PURE__ */ new Set([
    "preprocess",
    "postprocess",
    "processAllTokens"
  ]));
  class Marked {
    constructor(...args) {
      __publicField(this, "defaults", _getDefaults());
      __publicField(this, "options", this.setOptions);
      __publicField(this, "parse", this.parseMarkdown(true));
      __publicField(this, "parseInline", this.parseMarkdown(false));
      __publicField(this, "Parser", _Parser);
      __publicField(this, "Renderer", _Renderer);
      __publicField(this, "TextRenderer", _TextRenderer);
      __publicField(this, "Lexer", _Lexer);
      __publicField(this, "Tokenizer", _Tokenizer);
      __publicField(this, "Hooks", _Hooks);
      this.use(...args);
    }
    /**
     * Run callback for every token
     */
    walkTokens(tokens, callback) {
      var _a2, _b;
      let values = [];
      for (const token of tokens) {
        values = values.concat(callback.call(this, token));
        switch (token.type) {
          case "table": {
            const tableToken = token;
            for (const cell of tableToken.header) {
              values = values.concat(this.walkTokens(cell.tokens, callback));
            }
            for (const row of tableToken.rows) {
              for (const cell of row) {
                values = values.concat(this.walkTokens(cell.tokens, callback));
              }
            }
            break;
          }
          case "list": {
            const listToken = token;
            values = values.concat(this.walkTokens(listToken.items, callback));
            break;
          }
          default: {
            const genericToken = token;
            if ((_b = (_a2 = this.defaults.extensions) == null ? void 0 : _a2.childTokens) == null ? void 0 : _b[genericToken.type]) {
              this.defaults.extensions.childTokens[genericToken.type].forEach((childTokens) => {
                const tokens2 = genericToken[childTokens].flat(Infinity);
                values = values.concat(this.walkTokens(tokens2, callback));
              });
            } else if (genericToken.tokens) {
              values = values.concat(this.walkTokens(genericToken.tokens, callback));
            }
          }
        }
      }
      return values;
    }
    use(...args) {
      const extensions = this.defaults.extensions || { renderers: {}, childTokens: {} };
      args.forEach((pack) => {
        const opts = { ...pack };
        opts.async = this.defaults.async || opts.async || false;
        if (pack.extensions) {
          pack.extensions.forEach((ext) => {
            if (!ext.name) {
              throw new Error("extension name required");
            }
            if ("renderer" in ext) {
              const prevRenderer = extensions.renderers[ext.name];
              if (prevRenderer) {
                extensions.renderers[ext.name] = function(...args2) {
                  let ret = ext.renderer.apply(this, args2);
                  if (ret === false) {
                    ret = prevRenderer.apply(this, args2);
                  }
                  return ret;
                };
              } else {
                extensions.renderers[ext.name] = ext.renderer;
              }
            }
            if ("tokenizer" in ext) {
              if (!ext.level || ext.level !== "block" && ext.level !== "inline") {
                throw new Error("extension level must be 'block' or 'inline'");
              }
              const extLevel = extensions[ext.level];
              if (extLevel) {
                extLevel.unshift(ext.tokenizer);
              } else {
                extensions[ext.level] = [ext.tokenizer];
              }
              if (ext.start) {
                if (ext.level === "block") {
                  if (extensions.startBlock) {
                    extensions.startBlock.push(ext.start);
                  } else {
                    extensions.startBlock = [ext.start];
                  }
                } else if (ext.level === "inline") {
                  if (extensions.startInline) {
                    extensions.startInline.push(ext.start);
                  } else {
                    extensions.startInline = [ext.start];
                  }
                }
              }
            }
            if ("childTokens" in ext && ext.childTokens) {
              extensions.childTokens[ext.name] = ext.childTokens;
            }
          });
          opts.extensions = extensions;
        }
        if (pack.renderer) {
          const renderer2 = this.defaults.renderer || new _Renderer(this.defaults);
          for (const prop in pack.renderer) {
            if (!(prop in renderer2)) {
              throw new Error(`renderer '${prop}' does not exist`);
            }
            if (["options", "parser"].includes(prop)) {
              continue;
            }
            const rendererProp = prop;
            const rendererFunc = pack.renderer[rendererProp];
            const prevRenderer = renderer2[rendererProp];
            renderer2[rendererProp] = (...args2) => {
              let ret = rendererFunc.apply(renderer2, args2);
              if (ret === false) {
                ret = prevRenderer.apply(renderer2, args2);
              }
              return ret || "";
            };
          }
          opts.renderer = renderer2;
        }
        if (pack.tokenizer) {
          const tokenizer = this.defaults.tokenizer || new _Tokenizer(this.defaults);
          for (const prop in pack.tokenizer) {
            if (!(prop in tokenizer)) {
              throw new Error(`tokenizer '${prop}' does not exist`);
            }
            if (["options", "rules", "lexer"].includes(prop)) {
              continue;
            }
            const tokenizerProp = prop;
            const tokenizerFunc = pack.tokenizer[tokenizerProp];
            const prevTokenizer = tokenizer[tokenizerProp];
            tokenizer[tokenizerProp] = (...args2) => {
              let ret = tokenizerFunc.apply(tokenizer, args2);
              if (ret === false) {
                ret = prevTokenizer.apply(tokenizer, args2);
              }
              return ret;
            };
          }
          opts.tokenizer = tokenizer;
        }
        if (pack.hooks) {
          const hooks = this.defaults.hooks || new _Hooks();
          for (const prop in pack.hooks) {
            if (!(prop in hooks)) {
              throw new Error(`hook '${prop}' does not exist`);
            }
            if (["options", "block"].includes(prop)) {
              continue;
            }
            const hooksProp = prop;
            const hooksFunc = pack.hooks[hooksProp];
            const prevHook = hooks[hooksProp];
            if (_Hooks.passThroughHooks.has(prop)) {
              hooks[hooksProp] = (arg) => {
                if (this.defaults.async) {
                  return Promise.resolve(hooksFunc.call(hooks, arg)).then((ret2) => {
                    return prevHook.call(hooks, ret2);
                  });
                }
                const ret = hooksFunc.call(hooks, arg);
                return prevHook.call(hooks, ret);
              };
            } else {
              hooks[hooksProp] = (...args2) => {
                let ret = hooksFunc.apply(hooks, args2);
                if (ret === false) {
                  ret = prevHook.apply(hooks, args2);
                }
                return ret;
              };
            }
          }
          opts.hooks = hooks;
        }
        if (pack.walkTokens) {
          const walkTokens = this.defaults.walkTokens;
          const packWalktokens = pack.walkTokens;
          opts.walkTokens = function(token) {
            let values = [];
            values.push(packWalktokens.call(this, token));
            if (walkTokens) {
              values = values.concat(walkTokens.call(this, token));
            }
            return values;
          };
        }
        this.defaults = { ...this.defaults, ...opts };
      });
      return this;
    }
    setOptions(opt) {
      this.defaults = { ...this.defaults, ...opt };
      return this;
    }
    lexer(src, options) {
      return _Lexer.lex(src, options ?? this.defaults);
    }
    parser(tokens, options) {
      return _Parser.parse(tokens, options ?? this.defaults);
    }
    parseMarkdown(blockType) {
      const parse = (src, options) => {
        const origOpt = { ...options };
        const opt = { ...this.defaults, ...origOpt };
        const throwError = this.onError(!!opt.silent, !!opt.async);
        if (this.defaults.async === true && origOpt.async === false) {
          return throwError(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
        }
        if (typeof src === "undefined" || src === null) {
          return throwError(new Error("marked(): input parameter is undefined or null"));
        }
        if (typeof src !== "string") {
          return throwError(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(src) + ", string expected"));
        }
        if (opt.hooks) {
          opt.hooks.options = opt;
          opt.hooks.block = blockType;
        }
        const lexer = opt.hooks ? opt.hooks.provideLexer() : blockType ? _Lexer.lex : _Lexer.lexInline;
        const parser = opt.hooks ? opt.hooks.provideParser() : blockType ? _Parser.parse : _Parser.parseInline;
        if (opt.async) {
          return Promise.resolve(opt.hooks ? opt.hooks.preprocess(src) : src).then((src2) => lexer(src2, opt)).then((tokens) => opt.hooks ? opt.hooks.processAllTokens(tokens) : tokens).then((tokens) => opt.walkTokens ? Promise.all(this.walkTokens(tokens, opt.walkTokens)).then(() => tokens) : tokens).then((tokens) => parser(tokens, opt)).then((html2) => opt.hooks ? opt.hooks.postprocess(html2) : html2).catch(throwError);
        }
        try {
          if (opt.hooks) {
            src = opt.hooks.preprocess(src);
          }
          let tokens = lexer(src, opt);
          if (opt.hooks) {
            tokens = opt.hooks.processAllTokens(tokens);
          }
          if (opt.walkTokens) {
            this.walkTokens(tokens, opt.walkTokens);
          }
          let html2 = parser(tokens, opt);
          if (opt.hooks) {
            html2 = opt.hooks.postprocess(html2);
          }
          return html2;
        } catch (e) {
          return throwError(e);
        }
      };
      return parse;
    }
    onError(silent, async) {
      return (e) => {
        e.message += "\nPlease report this to https://github.com/markedjs/marked.";
        if (silent) {
          const msg = "<p>An error occurred:</p><pre>" + escape$1(e.message + "", true) + "</pre>";
          if (async) {
            return Promise.resolve(msg);
          }
          return msg;
        }
        if (async) {
          return Promise.reject(e);
        }
        throw e;
      };
    }
  }
  const markedInstance = new Marked();
  function marked(src, opt) {
    return markedInstance.parse(src, opt);
  }
  marked.options = marked.setOptions = function(options) {
    markedInstance.setOptions(options);
    marked.defaults = markedInstance.defaults;
    changeDefaults(marked.defaults);
    return marked;
  };
  marked.getDefaults = _getDefaults;
  marked.defaults = _defaults;
  marked.use = function(...args) {
    markedInstance.use(...args);
    marked.defaults = markedInstance.defaults;
    changeDefaults(marked.defaults);
    return marked;
  };
  marked.walkTokens = function(tokens, callback) {
    return markedInstance.walkTokens(tokens, callback);
  };
  marked.parseInline = markedInstance.parseInline;
  marked.Parser = _Parser;
  marked.parser = _Parser.parse;
  marked.Renderer = _Renderer;
  marked.TextRenderer = _TextRenderer;
  marked.Lexer = _Lexer;
  marked.lexer = _Lexer.lex;
  marked.Tokenizer = _Tokenizer;
  marked.Hooks = _Hooks;
  marked.parse = marked;
  marked.options;
  marked.setOptions;
  marked.use;
  marked.walkTokens;
  marked.parseInline;
  _Parser.parse;
  _Lexer.lex;
  const _hoisted_1 = {
    "data-theme": "light",
    class: "max-w-lg mx-auto p-4 border border-gray-300 rounded-lg shadow-md"
  };
  const _hoisted_2 = { class: "mb-4" };
  const _hoisted_3 = { class: "mb-2" };
  const _hoisted_4 = ["value"];
  const _hoisted_5 = { class: "mb-4" };
  const _hoisted_6 = {
    key: 0,
    class: "text-center"
  };
  const _hoisted_7 = { class: "text-gray-500" };
  const _hoisted_8 = ["innerHTML"];
  const _hoisted_9 = { class: "flex" };
  const _sfc_main = /* @__PURE__ */ defineComponent({
    __name: "SimpleChat",
    props: {
      text: { type: String }
    },
    setup(__props) {
      const chatbox = useChatboxStore();
      const { client, systemPrompt } = useAI();
      const fetchModels = async () => {
        try {
          const response = await client.models.list();
          chatbox.setModels(response.data.map((model) => model.id));
          chatbox.setSelectedModel(chatbox.models[0]);
        } catch (error) {
          console.error("Failed to fetch models:", error);
        }
      };
      const controller = new AbortController();
      const sendMessage = async () => {
        if (!chatbox.newMessage) return;
        chatbox.addMessage({
          content: chatbox.newMessage,
          role: "user"
        });
        try {
          const response = await client.chat.completions.create(
            {
              model: chatbox.selectedModel,
              messages: chatbox.messages,
              max_tokens: chatbox.maxTokens
            },
            { signal: controller.signal }
          );
          chatbox.addMessage({
            content: response.choices[0].message.content,
            role: "assistant"
          });
        } catch (error) {
          console.error("Failed to send message:", error);
        } finally {
          chatbox.clearNewMessage();
        }
      };
      const clearMessages = () => {
        controller.abort();
        chatbox.clearMessages();
      };
      const copyText = async () => {
        try {
          console.log(`userMessages ${typeof chatbox.userMessages}`);
          console.log(chatbox.userMessages.length);
          console.log(chatbox.userMessages);
          if (chatbox.userMessages.length > 0) {
          }
        } catch (err) {
          console.error("Failed to copy:", err);
        }
      };
      onMounted(async () => {
        await fetchModels();
        chatbox.setSystemPrompt(systemPrompt);
      });
      return (_ctx, _cache) => {
        return openBlock(), createElementBlock("div", _hoisted_1, [
          createBaseVNode("div", _hoisted_2, [
            createBaseVNode("button", {
              onClick: clearMessages,
              class: "btn btn-error btn-sm float-right"
            }, " Clear Messages "),
            createBaseVNode("button", {
              onClick: copyText,
              class: "px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            }, " Copy Last Response "),
            _cache[3] || (_cache[3] = createBaseVNode("h2", { class: "text-xl font-semibold" }, "Chat", -1)),
            createBaseVNode("div", _hoisted_3, [
              _cache[2] || (_cache[2] = createBaseVNode("label", {
                for: "model-select",
                class: "block text-gray-700"
              }, "Select Model:", -1)),
              withDirectives(createBaseVNode("select", {
                id: "model-select",
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => unref(chatbox).selectedModel = $event),
                class: "select select-bordered select-sm w-full max-w-xs"
              }, [
                (openBlock(true), createElementBlock(Fragment, null, renderList(unref(chatbox).models, (model) => {
                  return openBlock(), createElementBlock("option", {
                    key: model,
                    value: model
                  }, toDisplayString(model), 9, _hoisted_4);
                }), 128))
              ], 512), [
                [vModelSelect, unref(chatbox).selectedModel]
              ])
            ])
          ]),
          createBaseVNode("div", _hoisted_5, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(unref(chatbox).messages, (message, index) => {
              return openBlock(), createElementBlock("div", {
                key: index,
                class: "mb-2"
              }, [
                message.role === "system" ? (openBlock(), createElementBlock("div", _hoisted_6, [
                  createBaseVNode("p", _hoisted_7, toDisplayString(message.content), 1)
                ])) : createCommentVNode("", true),
                message.role !== "system" ? (openBlock(), createElementBlock("div", {
                  key: 1,
                  class: normalizeClass({ "text-right": message.role === "user" })
                }, [
                  createBaseVNode("div", {
                    class: normalizeClass(["inline-block p-2 rounded-lg", message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"]),
                    innerHTML: unref(marked).parse(message.content)
                  }, null, 10, _hoisted_8)
                ], 2)) : createCommentVNode("", true)
              ]);
            }), 128))
          ]),
          createBaseVNode("div", _hoisted_9, [
            withDirectives(createBaseVNode("input", {
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => unref(chatbox).newMessage = $event),
              onKeyup: withKeys(sendMessage, ["enter"]),
              type: "text",
              placeholder: "Type a message...",
              class: "w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            }, null, 544), [
              [vModelText, unref(chatbox).newMessage]
            ]),
            createBaseVNode("button", {
              onClick: sendMessage,
              class: "ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            }, " Send ")
          ])
        ]);
      };
    }
  });
  const _style_0 = '[data-v-1d30cf0f]:root,\n[data-theme][data-v-1d30cf0f] {\n    background-color: var(--fallback-b1,oklch(var(--b1)/1));\n    color: var(--fallback-bc,oklch(var(--bc)/1))\n}\n@supports not (color: oklch(0% 0 0)) {\n[data-v-1d30cf0f]:root {\n        color-scheme: light;\n        --fallback-p: #491eff;\n        --fallback-pc: #d4dbff;\n        --fallback-s: #ff41c7;\n        --fallback-sc: #fff9fc;\n        --fallback-a: #00cfbd;\n        --fallback-ac: #00100d;\n        --fallback-n: #2b3440;\n        --fallback-nc: #d7dde4;\n        --fallback-b1: #ffffff;\n        --fallback-b2: #e5e6e6;\n        --fallback-b3: #e5e6e6;\n        --fallback-bc: #1f2937;\n        --fallback-in: #00b3f0;\n        --fallback-inc: #000000;\n        --fallback-su: #00ca92;\n        --fallback-suc: #000000;\n        --fallback-wa: #ffc22d;\n        --fallback-wac: #000000;\n        --fallback-er: #ff6f70;\n        --fallback-erc: #000000\n    }\n@media (prefers-color-scheme: dark) {\n[data-v-1d30cf0f]:root {\n            color-scheme: dark;\n            --fallback-p: #7582ff;\n            --fallback-pc: #050617;\n            --fallback-s: #ff71cf;\n            --fallback-sc: #190211;\n            --fallback-a: #00c7b5;\n            --fallback-ac: #000e0c;\n            --fallback-n: #2a323c;\n            --fallback-nc: #a6adbb;\n            --fallback-b1: #1d232a;\n            --fallback-b2: #191e24;\n            --fallback-b3: #15191e;\n            --fallback-bc: #a6adbb;\n            --fallback-in: #00b3f0;\n            --fallback-inc: #000000;\n            --fallback-su: #00ca92;\n            --fallback-suc: #000000;\n            --fallback-wa: #ffc22d;\n            --fallback-wac: #000000;\n            --fallback-er: #ff6f70;\n            --fallback-erc: #000000\n        }\n}\n}\nhtml[data-v-1d30cf0f] {\n    -webkit-tap-highlight-color: transparent\n}\n[data-v-1d30cf0f] {\n    scrollbar-color: color-mix(in oklch, currentColor 35%, transparent) transparent\n}\n[data-v-1d30cf0f]:hover {\n    scrollbar-color: color-mix(in oklch, currentColor 60%, transparent) transparent\n}\n[data-v-1d30cf0f]:root {\n    color-scheme: light;\n    --in: 72.06% 0.191 231.6;\n    --su: 64.8% 0.150 160;\n    --wa: 84.71% 0.199 83.87;\n    --er: 71.76% 0.221 22.18;\n    --pc: 89.824% 0.06192 275.75;\n    --ac: 15.352% 0.0368 183.61;\n    --inc: 0% 0 0;\n    --suc: 0% 0 0;\n    --wac: 0% 0 0;\n    --erc: 0% 0 0;\n    --rounded-box: 1rem;\n    --rounded-btn: 0.5rem;\n    --rounded-badge: 1.9rem;\n    --animation-btn: 0.25s;\n    --animation-input: .2s;\n    --btn-focus-scale: 0.95;\n    --border-btn: 1px;\n    --tab-border: 1px;\n    --tab-radius: 0.5rem;\n    --p: 49.12% 0.3096 275.75;\n    --s: 69.71% 0.329 342.55;\n    --sc: 98.71% 0.0106 342.55;\n    --a: 76.76% 0.184 183.61;\n    --n: 32.1785% 0.02476 255.701624;\n    --nc: 89.4994% 0.011585 252.096176;\n    --b1: 100% 0 0;\n    --b2: 96.1151% 0 0;\n    --b3: 92.4169% 0.00108 197.137559;\n    --bc: 27.8078% 0.029596 256.847952\n}\n@media (prefers-color-scheme: dark) {\n[data-v-1d30cf0f]:root {\n        color-scheme: dark;\n        --in: 72.06% 0.191 231.6;\n        --su: 64.8% 0.150 160;\n        --wa: 84.71% 0.199 83.87;\n        --er: 71.76% 0.221 22.18;\n        --pc: 13.138% 0.0392 275.75;\n        --sc: 14.96% 0.052 342.55;\n        --ac: 14.902% 0.0334 183.61;\n        --inc: 0% 0 0;\n        --suc: 0% 0 0;\n        --wac: 0% 0 0;\n        --erc: 0% 0 0;\n        --rounded-box: 1rem;\n        --rounded-btn: 0.5rem;\n        --rounded-badge: 1.9rem;\n        --animation-btn: 0.25s;\n        --animation-input: .2s;\n        --btn-focus-scale: 0.95;\n        --border-btn: 1px;\n        --tab-border: 1px;\n        --tab-radius: 0.5rem;\n        --p: 65.69% 0.196 275.75;\n        --s: 74.8% 0.26 342.55;\n        --a: 74.51% 0.167 183.61;\n        --n: 31.3815% 0.021108 254.139175;\n        --nc: 74.6477% 0.0216 264.435964;\n        --b1: 25.3267% 0.015896 252.417568;\n        --b2: 23.2607% 0.013807 253.100675;\n        --b3: 21.1484% 0.01165 254.087939;\n        --bc: 74.6477% 0.0216 264.435964\n    }\n}\n[data-theme=light][data-v-1d30cf0f] {\n    color-scheme: light;\n    --in: 72.06% 0.191 231.6;\n    --su: 64.8% 0.150 160;\n    --wa: 84.71% 0.199 83.87;\n    --er: 71.76% 0.221 22.18;\n    --pc: 89.824% 0.06192 275.75;\n    --ac: 15.352% 0.0368 183.61;\n    --inc: 0% 0 0;\n    --suc: 0% 0 0;\n    --wac: 0% 0 0;\n    --erc: 0% 0 0;\n    --rounded-box: 1rem;\n    --rounded-btn: 0.5rem;\n    --rounded-badge: 1.9rem;\n    --animation-btn: 0.25s;\n    --animation-input: .2s;\n    --btn-focus-scale: 0.95;\n    --border-btn: 1px;\n    --tab-border: 1px;\n    --tab-radius: 0.5rem;\n    --p: 49.12% 0.3096 275.75;\n    --s: 69.71% 0.329 342.55;\n    --sc: 98.71% 0.0106 342.55;\n    --a: 76.76% 0.184 183.61;\n    --n: 32.1785% 0.02476 255.701624;\n    --nc: 89.4994% 0.011585 252.096176;\n    --b1: 100% 0 0;\n    --b2: 96.1151% 0 0;\n    --b3: 92.4169% 0.00108 197.137559;\n    --bc: 27.8078% 0.029596 256.847952\n}\n[data-theme=dark][data-v-1d30cf0f] {\n    color-scheme: dark;\n    --in: 72.06% 0.191 231.6;\n    --su: 64.8% 0.150 160;\n    --wa: 84.71% 0.199 83.87;\n    --er: 71.76% 0.221 22.18;\n    --pc: 13.138% 0.0392 275.75;\n    --sc: 14.96% 0.052 342.55;\n    --ac: 14.902% 0.0334 183.61;\n    --inc: 0% 0 0;\n    --suc: 0% 0 0;\n    --wac: 0% 0 0;\n    --erc: 0% 0 0;\n    --rounded-box: 1rem;\n    --rounded-btn: 0.5rem;\n    --rounded-badge: 1.9rem;\n    --animation-btn: 0.25s;\n    --animation-input: .2s;\n    --btn-focus-scale: 0.95;\n    --border-btn: 1px;\n    --tab-border: 1px;\n    --tab-radius: 0.5rem;\n    --p: 65.69% 0.196 275.75;\n    --s: 74.8% 0.26 342.55;\n    --a: 74.51% 0.167 183.61;\n    --n: 31.3815% 0.021108 254.139175;\n    --nc: 74.6477% 0.0216 264.435964;\n    --b1: 25.3267% 0.015896 252.417568;\n    --b2: 23.2607% 0.013807 253.100675;\n    --b3: 21.1484% 0.01165 254.087939;\n    --bc: 74.6477% 0.0216 264.435964\n}\n[data-v-1d30cf0f],[data-v-1d30cf0f]::before,[data-v-1d30cf0f]::after {\n    --tw-border-spacing-x: 0;\n    --tw-border-spacing-y: 0;\n    --tw-translate-x: 0;\n    --tw-translate-y: 0;\n    --tw-rotate: 0;\n    --tw-skew-x: 0;\n    --tw-skew-y: 0;\n    --tw-scale-x: 1;\n    --tw-scale-y: 1;\n    --tw-pan-x:  ;\n    --tw-pan-y:  ;\n    --tw-pinch-zoom:  ;\n    --tw-scroll-snap-strictness: proximity;\n    --tw-gradient-from-position:  ;\n    --tw-gradient-via-position:  ;\n    --tw-gradient-to-position:  ;\n    --tw-ordinal:  ;\n    --tw-slashed-zero:  ;\n    --tw-numeric-figure:  ;\n    --tw-numeric-spacing:  ;\n    --tw-numeric-fraction:  ;\n    --tw-ring-inset:  ;\n    --tw-ring-offset-width: 0px;\n    --tw-ring-offset-color: #fff;\n    --tw-ring-color: rgb(59 130 246 / 0.5);\n    --tw-ring-offset-shadow: 0 0 #0000;\n    --tw-ring-shadow: 0 0 #0000;\n    --tw-shadow: 0 0 #0000;\n    --tw-shadow-colored: 0 0 #0000;\n    --tw-blur:  ;\n    --tw-brightness:  ;\n    --tw-contrast:  ;\n    --tw-grayscale:  ;\n    --tw-hue-rotate:  ;\n    --tw-invert:  ;\n    --tw-saturate:  ;\n    --tw-sepia:  ;\n    --tw-drop-shadow:  ;\n    --tw-backdrop-blur:  ;\n    --tw-backdrop-brightness:  ;\n    --tw-backdrop-contrast:  ;\n    --tw-backdrop-grayscale:  ;\n    --tw-backdrop-hue-rotate:  ;\n    --tw-backdrop-invert:  ;\n    --tw-backdrop-opacity:  ;\n    --tw-backdrop-saturate:  ;\n    --tw-backdrop-sepia:  ;\n    --tw-contain-size:  ;\n    --tw-contain-layout:  ;\n    --tw-contain-paint:  ;\n    --tw-contain-style:  \n}\n[data-v-1d30cf0f]::backdrop {\n    --tw-border-spacing-x: 0;\n    --tw-border-spacing-y: 0;\n    --tw-translate-x: 0;\n    --tw-translate-y: 0;\n    --tw-rotate: 0;\n    --tw-skew-x: 0;\n    --tw-skew-y: 0;\n    --tw-scale-x: 1;\n    --tw-scale-y: 1;\n    --tw-pan-x:  ;\n    --tw-pan-y:  ;\n    --tw-pinch-zoom:  ;\n    --tw-scroll-snap-strictness: proximity;\n    --tw-gradient-from-position:  ;\n    --tw-gradient-via-position:  ;\n    --tw-gradient-to-position:  ;\n    --tw-ordinal:  ;\n    --tw-slashed-zero:  ;\n    --tw-numeric-figure:  ;\n    --tw-numeric-spacing:  ;\n    --tw-numeric-fraction:  ;\n    --tw-ring-inset:  ;\n    --tw-ring-offset-width: 0px;\n    --tw-ring-offset-color: #fff;\n    --tw-ring-color: rgb(59 130 246 / 0.5);\n    --tw-ring-offset-shadow: 0 0 #0000;\n    --tw-ring-shadow: 0 0 #0000;\n    --tw-shadow: 0 0 #0000;\n    --tw-shadow-colored: 0 0 #0000;\n    --tw-blur:  ;\n    --tw-brightness:  ;\n    --tw-contrast:  ;\n    --tw-grayscale:  ;\n    --tw-hue-rotate:  ;\n    --tw-invert:  ;\n    --tw-saturate:  ;\n    --tw-sepia:  ;\n    --tw-drop-shadow:  ;\n    --tw-backdrop-blur:  ;\n    --tw-backdrop-brightness:  ;\n    --tw-backdrop-contrast:  ;\n    --tw-backdrop-grayscale:  ;\n    --tw-backdrop-hue-rotate:  ;\n    --tw-backdrop-invert:  ;\n    --tw-backdrop-opacity:  ;\n    --tw-backdrop-saturate:  ;\n    --tw-backdrop-sepia:  ;\n    --tw-contain-size:  ;\n    --tw-contain-layout:  ;\n    --tw-contain-paint:  ;\n    --tw-contain-style:  \n}\n.alert[data-v-1d30cf0f] {\n    display: grid;\n    width: 100%;\n    grid-auto-flow: row;\n    align-content: flex-start;\n    align-items: center;\n    justify-items: center;\n    gap: 1rem;\n    text-align: center;\n    border-radius: var(--rounded-box, 1rem);\n    border-width: 1px;\n    --tw-border-opacity: 1;\n    border-color: var(--fallback-b2,oklch(var(--b2)/var(--tw-border-opacity)));\n    padding: 1rem;\n    --tw-text-opacity: 1;\n    color: var(--fallback-bc,oklch(var(--bc)/var(--tw-text-opacity)));\n    --alert-bg: var(--fallback-b2,oklch(var(--b2)/1));\n    --alert-bg-mix: var(--fallback-b1,oklch(var(--b1)/1));\n    background-color: var(--alert-bg)\n}\n@media (min-width: 640px) {\n.alert[data-v-1d30cf0f] {\n        grid-auto-flow: column;\n        grid-template-columns: auto minmax(auto,1fr);\n        justify-items: start;\n        text-align: start\n}\n}\n.avatar.placeholder > div[data-v-1d30cf0f] {\n    display: flex;\n    align-items: center;\n    justify-content: center\n}\n@media (hover:hover) {\n.label a[data-v-1d30cf0f]:hover {\n        --tw-text-opacity: 1;\n        color: var(--fallback-bc,oklch(var(--bc)/var(--tw-text-opacity)))\n}\n}\n.btn[data-v-1d30cf0f] {\n    display: inline-flex;\n    height: 3rem;\n    min-height: 3rem;\n    flex-shrink: 0;\n    cursor: pointer;\n    -webkit-user-select: none;\n       -moz-user-select: none;\n            user-select: none;\n    flex-wrap: wrap;\n    align-items: center;\n    justify-content: center;\n    border-radius: var(--rounded-btn, 0.5rem);\n    border-color: transparent;\n    border-color: oklch(var(--btn-color, var(--b2)) / var(--tw-border-opacity));\n    padding-left: 1rem;\n    padding-right: 1rem;\n    text-align: center;\n    font-size: 0.875rem;\n    line-height: 1em;\n    gap: 0.5rem;\n    font-weight: 600;\n    text-decoration-line: none;\n    transition-duration: 200ms;\n    transition-timing-function: cubic-bezier(0, 0, 0.2, 1);\n    border-width: var(--border-btn, 1px);\n    transition-property: color, background-color, border-color, opacity, box-shadow, transform;\n    --tw-text-opacity: 1;\n    color: var(--fallback-bc,oklch(var(--bc)/var(--tw-text-opacity)));\n    --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);\n    --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);\n    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n    outline-color: var(--fallback-bc,oklch(var(--bc)/1));\n    background-color: oklch(var(--btn-color, var(--b2)) / var(--tw-bg-opacity));\n    --tw-bg-opacity: 1;\n    --tw-border-opacity: 1\n}\n.btn-disabled[data-v-1d30cf0f],\n  .btn[disabled][data-v-1d30cf0f],\n  .btn[data-v-1d30cf0f]:disabled {\n    pointer-events: none\n}\n:where(.btn[data-v-1d30cf0f]:is(input[type="checkbox"])),\n:where(.btn[data-v-1d30cf0f]:is(input[type="radio"])) {\n    width: auto;\n    -webkit-appearance: none;\n       -moz-appearance: none;\n            appearance: none\n}\n.btn[data-v-1d30cf0f]:is(input[type="checkbox"]):after,\n.btn[data-v-1d30cf0f]:is(input[type="radio"]):after {\n    --tw-content: attr(aria-label);\n    content: var(--tw-content)\n}\n.chat[data-v-1d30cf0f] {\n    display: grid;\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n    -moz-column-gap: 0.75rem;\n         column-gap: 0.75rem;\n    padding-top: 0.25rem;\n    padding-bottom: 0.25rem\n}\n@media (hover: hover) {\n.btn[data-v-1d30cf0f]:hover {\n        --tw-border-opacity: 1;\n        border-color: var(--fallback-b3,oklch(var(--b3)/var(--tw-border-opacity)));\n        --tw-bg-opacity: 1;\n        background-color: var(--fallback-b3,oklch(var(--b3)/var(--tw-bg-opacity)))\n}\n@supports (color: color-mix(in oklab, black, black)) {\n.btn[data-v-1d30cf0f]:hover {\n            background-color: color-mix(\n            in oklab,\n            oklch(var(--btn-color, var(--b2)) / var(--tw-bg-opacity, 1)) 90%,\n            black\n          );\n            border-color: color-mix(\n            in oklab,\n            oklch(var(--btn-color, var(--b2)) / var(--tw-border-opacity, 1)) 90%,\n            black\n          )\n}\n}\n@supports not (color: oklch(0% 0 0)) {\n.btn[data-v-1d30cf0f]:hover {\n            background-color: var(--btn-color, var(--fallback-b2));\n            border-color: var(--btn-color, var(--fallback-b2))\n}\n}\n.btn.glass[data-v-1d30cf0f]:hover {\n        --glass-opacity: 25%;\n        --glass-border-opacity: 15%\n    }\n.btn-outline.btn-error[data-v-1d30cf0f]:hover {\n        --tw-text-opacity: 1;\n        color: var(--fallback-erc,oklch(var(--erc)/var(--tw-text-opacity)))\n}\n@supports (color: color-mix(in oklab, black, black)) {\n.btn-outline.btn-error[data-v-1d30cf0f]:hover {\n            background-color: color-mix(in oklab, var(--fallback-er,oklch(var(--er)/1)) 90%, black);\n            border-color: color-mix(in oklab, var(--fallback-er,oklch(var(--er)/1)) 90%, black)\n}\n}\n.btn-disabled[data-v-1d30cf0f]:hover,\n    .btn[disabled][data-v-1d30cf0f]:hover,\n    .btn[data-v-1d30cf0f]:disabled:hover {\n        --tw-border-opacity: 0;\n        background-color: var(--fallback-n,oklch(var(--n)/var(--tw-bg-opacity)));\n        --tw-bg-opacity: 0.2;\n        color: var(--fallback-bc,oklch(var(--bc)/var(--tw-text-opacity)));\n        --tw-text-opacity: 0.2\n    }\n@supports (color: color-mix(in oklab, black, black)) {\n.btn[data-v-1d30cf0f]:is(input[type="checkbox"]:checked):hover, .btn[data-v-1d30cf0f]:is(input[type="radio"]:checked):hover {\n            background-color: color-mix(in oklab, var(--fallback-p,oklch(var(--p)/1)) 90%, black);\n            border-color: color-mix(in oklab, var(--fallback-p,oklch(var(--p)/1)) 90%, black)\n}\n}\n}\n.label[data-v-1d30cf0f] {\n    display: flex;\n    -webkit-user-select: none;\n       -moz-user-select: none;\n            user-select: none;\n    align-items: center;\n    justify-content: space-between;\n    padding-left: 0.25rem;\n    padding-right: 0.25rem;\n    padding-top: 0.5rem;\n    padding-bottom: 0.5rem\n}\n.input[data-v-1d30cf0f] {\n    flex-shrink: 1;\n    -webkit-appearance: none;\n       -moz-appearance: none;\n            appearance: none;\n    height: 3rem;\n    padding-left: 1rem;\n    padding-right: 1rem;\n    font-size: 1rem;\n    line-height: 2;\n    line-height: 1.5rem;\n    border-radius: var(--rounded-btn, 0.5rem);\n    border-width: 1px;\n    border-color: transparent;\n    --tw-bg-opacity: 1;\n    background-color: var(--fallback-b1,oklch(var(--b1)/var(--tw-bg-opacity)))\n}\n.input[type="number"][data-v-1d30cf0f]::-webkit-inner-spin-button,\n.input-md[type="number"][data-v-1d30cf0f]::-webkit-inner-spin-button {\n    margin-top: -1rem;\n    margin-bottom: -1rem;\n    margin-inline-end: -1rem\n}\n.select[data-v-1d30cf0f] {\n    display: inline-flex;\n    cursor: pointer;\n    -webkit-user-select: none;\n       -moz-user-select: none;\n            user-select: none;\n    -webkit-appearance: none;\n       -moz-appearance: none;\n            appearance: none;\n    height: 3rem;\n    min-height: 3rem;\n    padding-inline-start: 1rem;\n    padding-inline-end: 2.5rem;\n    font-size: 0.875rem;\n    line-height: 1.25rem;\n    line-height: 2;\n    border-radius: var(--rounded-btn, 0.5rem);\n    border-width: 1px;\n    border-color: transparent;\n    --tw-bg-opacity: 1;\n    background-color: var(--fallback-b1,oklch(var(--b1)/var(--tw-bg-opacity)));\n    background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),\n    linear-gradient(135deg, currentColor 50%, transparent 50%);\n    background-position: calc(100% - 20px) calc(1px + 50%),\n    calc(100% - 16.1px) calc(1px + 50%);\n    background-size: 4px 4px,\n    4px 4px;\n    background-repeat: no-repeat\n}\n.select[multiple][data-v-1d30cf0f] {\n    height: auto\n}\n.btm-nav > * .label[data-v-1d30cf0f] {\n    font-size: 1rem;\n    line-height: 1.5rem\n}\n@media (prefers-reduced-motion: no-preference) {\n.btn[data-v-1d30cf0f] {\n        animation: button-pop-1d30cf0f var(--animation-btn, 0.25s) ease-out\n}\n}\n.btn[data-v-1d30cf0f]:active:hover,\n  .btn[data-v-1d30cf0f]:active:focus {\n    animation: button-pop-1d30cf0f 0s ease-out;\n    transform: scale(var(--btn-focus-scale, 0.97))\n}\n@supports not (color: oklch(0% 0 0)) {\n.btn[data-v-1d30cf0f] {\n        background-color: var(--btn-color, var(--fallback-b2));\n        border-color: var(--btn-color, var(--fallback-b2))\n}\n.btn-error[data-v-1d30cf0f] {\n        --btn-color: var(--fallback-er)\n    }\n}\n@supports (color: color-mix(in oklab, black, black)) {\n.btn-outline.btn-error.btn-active[data-v-1d30cf0f] {\n        background-color: color-mix(in oklab, var(--fallback-er,oklch(var(--er)/1)) 90%, black);\n        border-color: color-mix(in oklab, var(--fallback-er,oklch(var(--er)/1)) 90%, black)\n}\n}\n.btn[data-v-1d30cf0f]:focus-visible {\n    outline-style: solid;\n    outline-width: 2px;\n    outline-offset: 2px\n}\n@supports (color: oklch(0% 0 0)) {\n.btn-error[data-v-1d30cf0f] {\n        --btn-color: var(--er)\n    }\n}\n.btn-error[data-v-1d30cf0f] {\n    --tw-text-opacity: 1;\n    color: var(--fallback-erc,oklch(var(--erc)/var(--tw-text-opacity)));\n    outline-color: var(--fallback-er,oklch(var(--er)/1))\n}\n.btn.glass[data-v-1d30cf0f] {\n    --tw-shadow: 0 0 #0000;\n    --tw-shadow-colored: 0 0 #0000;\n    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n    outline-color: currentColor\n}\n.btn.glass.btn-active[data-v-1d30cf0f] {\n    --glass-opacity: 25%;\n    --glass-border-opacity: 15%\n}\n.btn-outline.btn-error[data-v-1d30cf0f] {\n    --tw-text-opacity: 1;\n    color: var(--fallback-er,oklch(var(--er)/var(--tw-text-opacity)))\n}\n.btn-outline.btn-error.btn-active[data-v-1d30cf0f] {\n    --tw-text-opacity: 1;\n    color: var(--fallback-erc,oklch(var(--erc)/var(--tw-text-opacity)))\n}\n.btn.btn-disabled[data-v-1d30cf0f],\n  .btn[disabled][data-v-1d30cf0f],\n  .btn[data-v-1d30cf0f]:disabled {\n    --tw-border-opacity: 0;\n    background-color: var(--fallback-n,oklch(var(--n)/var(--tw-bg-opacity)));\n    --tw-bg-opacity: 0.2;\n    color: var(--fallback-bc,oklch(var(--bc)/var(--tw-text-opacity)));\n    --tw-text-opacity: 0.2\n}\n.btn[data-v-1d30cf0f]:is(input[type="checkbox"]:checked),\n.btn[data-v-1d30cf0f]:is(input[type="radio"]:checked) {\n    --tw-border-opacity: 1;\n    border-color: var(--fallback-p,oklch(var(--p)/var(--tw-border-opacity)));\n    --tw-bg-opacity: 1;\n    background-color: var(--fallback-p,oklch(var(--p)/var(--tw-bg-opacity)));\n    --tw-text-opacity: 1;\n    color: var(--fallback-pc,oklch(var(--pc)/var(--tw-text-opacity)))\n}\n.btn[data-v-1d30cf0f]:is(input[type="checkbox"]:checked):focus-visible, .btn[data-v-1d30cf0f]:is(input[type="radio"]:checked):focus-visible {\n    outline-color: var(--fallback-p,oklch(var(--p)/1))\n}\n@keyframes button-pop-1d30cf0f {\n0% {\n        transform: scale(var(--btn-focus-scale, 0.98))\n}\n40% {\n        transform: scale(1.02)\n}\n100% {\n        transform: scale(1)\n}\n}\n@keyframes checkmark-1d30cf0f {\n0% {\n        background-position-y: 5px\n}\n50% {\n        background-position-y: -2px\n}\n100% {\n        background-position-y: 0\n}\n}\n.input input[data-v-1d30cf0f] {\n    --tw-bg-opacity: 1;\n    background-color: var(--fallback-p,oklch(var(--p)/var(--tw-bg-opacity)));\n    background-color: transparent\n}\n.input input[data-v-1d30cf0f]:focus {\n    outline: 2px solid transparent;\n    outline-offset: 2px\n}\n.input[list][data-v-1d30cf0f]::-webkit-calendar-picker-indicator {\n    line-height: 1em\n}\n.input[data-v-1d30cf0f]:focus,\n  .input[data-v-1d30cf0f]:focus-within {\n    box-shadow: none;\n    border-color: var(--fallback-bc,oklch(var(--bc)/0.2));\n    outline-style: solid;\n    outline-width: 2px;\n    outline-offset: 2px;\n    outline-color: var(--fallback-bc,oklch(var(--bc)/0.2))\n}\n.input[data-v-1d30cf0f]:has(> input[disabled]),\n  .input-disabled[data-v-1d30cf0f],\n  .input[data-v-1d30cf0f]:disabled,\n  .input[disabled][data-v-1d30cf0f] {\n    cursor: not-allowed;\n    --tw-border-opacity: 1;\n    border-color: var(--fallback-b2,oklch(var(--b2)/var(--tw-border-opacity)));\n    --tw-bg-opacity: 1;\n    background-color: var(--fallback-b2,oklch(var(--b2)/var(--tw-bg-opacity)));\n    color: var(--fallback-bc,oklch(var(--bc)/0.4))\n}\n.input[data-v-1d30cf0f]:has(> input[disabled])::-moz-placeholder, .input-disabled[data-v-1d30cf0f]::-moz-placeholder, .input[data-v-1d30cf0f]:disabled::-moz-placeholder, .input[disabled][data-v-1d30cf0f]::-moz-placeholder {\n    color: var(--fallback-bc,oklch(var(--bc)/var(--tw-placeholder-opacity)));\n    --tw-placeholder-opacity: 0.2\n}\n.input[data-v-1d30cf0f]:has(> input[disabled])::placeholder,\n  .input-disabled[data-v-1d30cf0f]::placeholder,\n  .input[data-v-1d30cf0f]:disabled::placeholder,\n  .input[disabled][data-v-1d30cf0f]::placeholder {\n    color: var(--fallback-bc,oklch(var(--bc)/var(--tw-placeholder-opacity)));\n    --tw-placeholder-opacity: 0.2\n}\n.input:has(> input[disabled]) > input[disabled][data-v-1d30cf0f] {\n    cursor: not-allowed\n}\n.input[data-v-1d30cf0f]::-webkit-date-and-time-value {\n    text-align: inherit\n}\n.join[data-v-1d30cf0f] > :where(*:not(:first-child)):is(.btn) {\n    margin-inline-start: calc(var(--border-btn) * -1)\n}\n.mockup-browser .mockup-browser-toolbar .input[data-v-1d30cf0f] {\n    position: relative;\n    margin-left: auto;\n    margin-right: auto;\n    display: block;\n    height: 1.75rem;\n    width: 24rem;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n    --tw-bg-opacity: 1;\n    background-color: var(--fallback-b2,oklch(var(--b2)/var(--tw-bg-opacity)));\n    padding-left: 2rem;\n    direction: ltr\n}\n.mockup-browser .mockup-browser-toolbar .input[data-v-1d30cf0f]:before {\n    content: "";\n    position: absolute;\n    left: 0.5rem;\n    top: 50%;\n    aspect-ratio: 1 / 1;\n    height: 0.75rem;\n    --tw-translate-y: -50%;\n    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n    border-radius: 9999px;\n    border-width: 2px;\n    border-color: currentColor;\n    opacity: 0.6\n}\n.mockup-browser .mockup-browser-toolbar .input[data-v-1d30cf0f]:after {\n    content: "";\n    position: absolute;\n    left: 1.25rem;\n    top: 50%;\n    height: 0.5rem;\n    --tw-translate-y: 25%;\n    --tw-rotate: -45deg;\n    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n    border-radius: 9999px;\n    border-width: 1px;\n    border-color: currentColor;\n    opacity: 0.6\n}\n@keyframes modal-pop-1d30cf0f {\n0% {\n        opacity: 0\n}\n}\n@keyframes progress-loading-1d30cf0f {\n50% {\n        background-position-x: -115%\n}\n}\n@keyframes radiomark-1d30cf0f {\n0% {\n        box-shadow: 0 0 0 12px var(--fallback-b1,oklch(var(--b1)/1)) inset,\n      0 0 0 12px var(--fallback-b1,oklch(var(--b1)/1)) inset\n}\n50% {\n        box-shadow: 0 0 0 3px var(--fallback-b1,oklch(var(--b1)/1)) inset,\n      0 0 0 3px var(--fallback-b1,oklch(var(--b1)/1)) inset\n}\n100% {\n        box-shadow: 0 0 0 4px var(--fallback-b1,oklch(var(--b1)/1)) inset,\n      0 0 0 4px var(--fallback-b1,oklch(var(--b1)/1)) inset\n}\n}\n@keyframes rating-pop-1d30cf0f {\n0% {\n        transform: translateY(-0.125em)\n}\n40% {\n        transform: translateY(-0.125em)\n}\n100% {\n        transform: translateY(0)\n}\n}\n.select-bordered[data-v-1d30cf0f] {\n    border-color: var(--fallback-bc,oklch(var(--bc)/0.2))\n}\n.select[data-v-1d30cf0f]:focus {\n    box-shadow: none;\n    border-color: var(--fallback-bc,oklch(var(--bc)/0.2));\n    outline-style: solid;\n    outline-width: 2px;\n    outline-offset: 2px;\n    outline-color: var(--fallback-bc,oklch(var(--bc)/0.2))\n}\n.select-disabled[data-v-1d30cf0f],\n  .select[data-v-1d30cf0f]:disabled,\n  .select[disabled][data-v-1d30cf0f] {\n    cursor: not-allowed;\n    --tw-border-opacity: 1;\n    border-color: var(--fallback-b2,oklch(var(--b2)/var(--tw-border-opacity)));\n    --tw-bg-opacity: 1;\n    background-color: var(--fallback-b2,oklch(var(--b2)/var(--tw-bg-opacity)));\n    color: var(--fallback-bc,oklch(var(--bc)/0.4))\n}\n.select-disabled[data-v-1d30cf0f]::-moz-placeholder, .select[data-v-1d30cf0f]:disabled::-moz-placeholder, .select[disabled][data-v-1d30cf0f]::-moz-placeholder {\n    color: var(--fallback-bc,oklch(var(--bc)/var(--tw-placeholder-opacity)));\n    --tw-placeholder-opacity: 0.2\n}\n.select-disabled[data-v-1d30cf0f]::placeholder,\n  .select[data-v-1d30cf0f]:disabled::placeholder,\n  .select[disabled][data-v-1d30cf0f]::placeholder {\n    color: var(--fallback-bc,oklch(var(--bc)/var(--tw-placeholder-opacity)));\n    --tw-placeholder-opacity: 0.2\n}\n.select-multiple[data-v-1d30cf0f],\n  .select[multiple][data-v-1d30cf0f],\n  .select[size].select[data-v-1d30cf0f]:not([size="1"]) {\n    background-image: none;\n    padding-right: 1rem\n}\n[dir="rtl"] .select[data-v-1d30cf0f] {\n    background-position: calc(0% + 12px) calc(1px + 50%),\n    calc(0% + 16px) calc(1px + 50%)\n}\n@keyframes skeleton-1d30cf0f {\nfrom {\n        background-position: 150%\n}\nto {\n        background-position: -50%\n}\n}\n@keyframes toast-pop-1d30cf0f {\n0% {\n        transform: scale(0.9);\n        opacity: 0\n}\n100% {\n        transform: scale(1);\n        opacity: 1\n}\n}\n.btn-sm[data-v-1d30cf0f] {\n    height: 2rem;\n    min-height: 2rem;\n    padding-left: 0.75rem;\n    padding-right: 0.75rem;\n    font-size: 0.875rem\n}\n.btn-square[data-v-1d30cf0f]:where(.btn-sm) {\n    height: 2rem;\n    width: 2rem;\n    padding: 0px\n}\n.btn-circle[data-v-1d30cf0f]:where(.btn-sm) {\n    height: 2rem;\n    width: 2rem;\n    border-radius: 9999px;\n    padding: 0px\n}\n.select-sm[data-v-1d30cf0f] {\n    height: 2rem;\n    min-height: 2rem;\n    padding-left: 0.75rem;\n    padding-right: 2rem;\n    font-size: 0.875rem;\n    line-height: 2rem\n}\n[dir="rtl"] .select-sm[data-v-1d30cf0f] {\n    padding-left: 2rem;\n    padding-right: 0.75rem\n}\n.join.join-vertical[data-v-1d30cf0f] > :where(*:not(:first-child)):is(.btn) {\n    margin-top: calc(var(--border-btn) * -1)\n}\n.join.join-horizontal[data-v-1d30cf0f] > :where(*:not(:first-child)):is(.btn) {\n    margin-inline-start: calc(var(--border-btn) * -1)\n}\n.float-right[data-v-1d30cf0f] {\n    float: right\n}\n.mx-auto[data-v-1d30cf0f] {\n    margin-left: auto;\n    margin-right: auto\n}\n.mb-2[data-v-1d30cf0f] {\n    margin-bottom: 0.5rem\n}\n.mb-4[data-v-1d30cf0f] {\n    margin-bottom: 1rem\n}\n.ml-2[data-v-1d30cf0f] {\n    margin-left: 0.5rem\n}\n.block[data-v-1d30cf0f] {\n    display: block\n}\n.inline-block[data-v-1d30cf0f] {\n    display: inline-block\n}\n.flex[data-v-1d30cf0f] {\n    display: flex\n}\n.w-full[data-v-1d30cf0f] {\n    width: 100%\n}\n.max-w-lg[data-v-1d30cf0f] {\n    max-width: 32rem\n}\n.max-w-xs[data-v-1d30cf0f] {\n    max-width: 20rem\n}\n.rounded-lg[data-v-1d30cf0f] {\n    border-radius: 0.5rem\n}\n.border[data-v-1d30cf0f] {\n    border-width: 1px\n}\n.border-gray-300[data-v-1d30cf0f] {\n    --tw-border-opacity: 1;\n    border-color: rgb(209 213 219 / var(--tw-border-opacity))\n}\n.bg-blue-500[data-v-1d30cf0f] {\n    --tw-bg-opacity: 1;\n    background-color: rgb(59 130 246 / var(--tw-bg-opacity))\n}\n.bg-gray-300[data-v-1d30cf0f] {\n    --tw-bg-opacity: 1;\n    background-color: rgb(209 213 219 / var(--tw-bg-opacity))\n}\n.bg-green-500[data-v-1d30cf0f] {\n    --tw-bg-opacity: 1;\n    background-color: rgb(34 197 94 / var(--tw-bg-opacity))\n}\n.p-2[data-v-1d30cf0f] {\n    padding: 0.5rem\n}\n.p-4[data-v-1d30cf0f] {\n    padding: 1rem\n}\n.px-4[data-v-1d30cf0f] {\n    padding-left: 1rem;\n    padding-right: 1rem\n}\n.py-2[data-v-1d30cf0f] {\n    padding-top: 0.5rem;\n    padding-bottom: 0.5rem\n}\n.text-center[data-v-1d30cf0f] {\n    text-align: center\n}\n.text-right[data-v-1d30cf0f] {\n    text-align: right\n}\n.text-xl[data-v-1d30cf0f] {\n    font-size: 1.25rem;\n    line-height: 1.75rem\n}\n.font-semibold[data-v-1d30cf0f] {\n    font-weight: 600\n}\n.text-black[data-v-1d30cf0f] {\n    --tw-text-opacity: 1;\n    color: rgb(0 0 0 / var(--tw-text-opacity))\n}\n.text-gray-500[data-v-1d30cf0f] {\n    --tw-text-opacity: 1;\n    color: rgb(107 114 128 / var(--tw-text-opacity))\n}\n.text-gray-700[data-v-1d30cf0f] {\n    --tw-text-opacity: 1;\n    color: rgb(55 65 81 / var(--tw-text-opacity))\n}\n.text-white[data-v-1d30cf0f] {\n    --tw-text-opacity: 1;\n    color: rgb(255 255 255 / var(--tw-text-opacity))\n}\n.shadow-md[data-v-1d30cf0f] {\n    --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);\n    --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);\n    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)\n}\n.hover\\:bg-blue-600[data-v-1d30cf0f]:hover {\n    --tw-bg-opacity: 1;\n    background-color: rgb(37 99 235 / var(--tw-bg-opacity))\n}\n.hover\\:bg-green-600[data-v-1d30cf0f]:hover {\n    --tw-bg-opacity: 1;\n    background-color: rgb(22 163 74 / var(--tw-bg-opacity))\n}\n.focus\\:outline-none[data-v-1d30cf0f]:focus {\n    outline: 2px solid transparent;\n    outline-offset: 2px\n}\n.focus\\:ring-2[data-v-1d30cf0f]:focus {\n    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);\n    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)\n}\n.focus\\:ring-blue-500[data-v-1d30cf0f]:focus {\n    --tw-ring-opacity: 1;\n    --tw-ring-color: rgb(59 130 246 / var(--tw-ring-opacity))\n}\n.focus\\:ring-green-500[data-v-1d30cf0f]:focus {\n    --tw-ring-opacity: 1;\n    --tw-ring-color: rgb(34 197 94 / var(--tw-ring-opacity))\n}\n';
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const SimpleChat = /* @__PURE__ */ _export_sfc(_sfc_main, [["styles", [_style_0]], ["__scopeId", "data-v-1d30cf0f"]]);
  async function fetchThroughlocalTeacheraideOpenAIGateway({
    endpoint,
    method,
    params
  }) {
    return ajax.call([
      {
        methodname: "local_teacheraide_openai_gateway",
        args: {
          endpoint,
          method,
          params
        }
      }
    ])[0];
  }
  const wwwroot = M.cfg.wwwroot;
  const webserviceBaseUrl = `${wwwroot}/webservice/restful/server.php/local_teacheraide_openai_gateway`;
  const webserviceFetch = async (url, init2) => {
    const endpoint = `${url}`.replace(webserviceBaseUrl, "");
    const method = init2 == null ? void 0 : init2.method;
    const body = init2 == null ? void 0 : init2.body;
    const res = await fetchThroughlocalTeacheraideOpenAIGateway({
      endpoint,
      method,
      params: body
    });
    return new Response(res.data, {
      // create standard Response object
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  };
  async function init({ systemPrompt }) {
    const client = new OpenAI({
      baseURL: webserviceBaseUrl,
      apiKey: "dummy",
      // This is a dummy API key, as the API key is not needed for using the webservice
      dangerouslyAllowBrowser: true,
      fetch: webserviceFetch
    });
    const configureApp = configureAppWithProviders({ client, systemPrompt });
    customElements.define(
      "teacheraide-simple-chat",
      /* @__PURE__ */ defineCustomElement(SimpleChat, { configureApp })
    );
  }
  exports.init = init;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
});