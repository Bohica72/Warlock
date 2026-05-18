/**
 * Simple module-level store for navigation callbacks.
 * Prevents non-serializable values being passed through navigation params.
 */
const _callbacks = {};

export function setNavCallback(key, fn) {
  _callbacks[key] = fn;
}

export function callNavCallback(key, ...args) {
  const fn = _callbacks[key];
  if (typeof fn === 'function') {
    return fn(...args);
  }
}

export function clearNavCallback(key) {
  delete _callbacks[key];
}
