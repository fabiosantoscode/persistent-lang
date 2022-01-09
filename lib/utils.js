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

export function checkSerializable(obj) {
  switch (typeof obj) {
    case 'boolean':
    case 'string': {
      return true
    }

    case 'number': {
      return isFinite(obj)
    }

    case 'object': {
      if (obj === null) return true
      if (Array.isArray(obj))
        return obj.every((item) => checkSerializable(item))
      if (Object.getPrototypeOf(obj) !== Object.prototype) return false

      return Object.values(obj).every((item) => checkSerializable(item))
    }

    default: {
      return false
    }
  }
}
