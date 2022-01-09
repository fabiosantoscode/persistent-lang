const HOP = {}.hasOwnProperty

export function hasOwn(obj, prop) {
  return HOP.call(obj, prop)
}

export function readFromAny(prop, ...objs) {
  for (const obj of objs) {
    if (obj && HOP.call(obj, prop)) {
      return obj[prop]
    }
  }

  return null
}
