import applyDefaults from '../applyDefaults';
import {
  JPLFatalError,
  JPLType,
  JPLRuntimeScope,
  adaptErrorsAsync,
  applyObject,
  assertType,
  mux,
  muxAll,
  muxAsync,
  muxOne,
  normalize,
  stringify,
  strip,
  typeOf,
  typeOrder,
  unwrap,
} from '../library';

const defaultOptions = {
  vars: {},
};

export function applyRuntimeDefaults(options = {}, defaults = {}) {
  return applyDefaults(options, defaults, 'vars');
}

/** JPL runtime */
class JPLRuntime {
  constructor(program, options) {
    this._options = applyRuntimeDefaults(options?.runtime, defaultOptions);

    this._program = program;
  }

  /** Return the runtime's options */
  get options() {
    return this._options;
  }

  /** Return the runtime's program */
  get program() {
    return this._program;
  }

  /** Create a new orphan scope */
  createScope = (presets) => new JPLRuntimeScope(presets);

  /** Execute a new dedicated program */
  execute = async (inputs) => {
    const scope = this.createScope({
      vars: Object.fromEntries(
        this.muxOne([Object.entries(this.options.vars)], ([name, value]) => [
          name,
          this.normalizeValue(value),
        ]),
      ),
    });

    try {
      return await this.executeInstructions(
        this.program.definition.instructions ?? [],
        inputs,
        scope,
        this.options.adjustResult,
      );
    } finally {
      scope.signal.exit();
    }
  };

  /** Execute the specified instructions */
  executeInstructions = (instructions, inputs, scope, next = (output) => [output]) => {
    const iter = async (from, input, currentScope) => {
      // Call stack decoupling - This is necessary as some browsers (i.e. Safari) have very limited call stack sizes which result in stack overflow exceptions in certain situations.
      await undefined;

      currentScope.signal.checkHealth();

      if (from >= instructions.length) return next(input, currentScope);

      const { op, params } = instructions[from];
      const operator = this.program.ops[op];
      if (!operator) throw new JPLFatalError(`invalid OP '${op}'`);

      return operator.op(this, input, params ?? {}, currentScope, (output, nextScope) =>
        iter(from + 1, output, nextScope),
      );
    };

    return this.muxAll([inputs], (input) => iter(0, input, scope));
  };

  /** Execute the specified OP */
  op(op, params, inputs, scope, next = (output) => [output]) {
    const operator = this.program.ops[op];
    if (!operator) throw new JPLFatalError(`invalid OP '${op}'`);

    const opParams = operator.map(this, params);
    return this.muxAll([inputs], (input) => operator.op(this, input, opParams ?? {}, scope, next));
  }

  /** Normalize the specified external value */
  normalizeValue = normalize;

  /** Normalize the specified array of external values */
  normalizeValues = (values = [], name = 'values') => {
    if (!Array.isArray(values)) throw new JPLFatalError(`expected ${name} to be an array`);
    return this.normalizeValue(values);
  };

  /** Unwrap the specified normalized value for usage in JPL operations */
  unwrapValue = unwrap;

  /** Unwrap the specified array of normalized values for usage in JPL operations */
  unwrapValues = (values = [], name = 'values') => {
    if (!Array.isArray(values)) throw new JPLFatalError(`expected ${name} to be an array`);
    return this.muxOne([values], (value) => this.unwrapValue(value));
  };

  /** Strip the specified normalized value for usage in JPL operations */
  stripValue = (value) => strip(value, (k, v) => this.unwrapValue(v));

  /** Strip the specified array of normalized values for usage in JPL operations */
  stripValues = (values = [], name = 'values') => {
    if (!Array.isArray(values)) throw new JPLFatalError(`expected ${name} to be an array`);
    return this.muxOne([values], (value) => this.stripValue(value));
  };

  /** Alter the specified normalized value using the specified updater */
  alterValue = async (value, updater) =>
    JPLType.is(value)
      ? adaptErrorsAsync(() => value.alter(updater))
      : this.normalizeValue(await updater(value));

  /** Resolve the type of the specified normalized value for JPL operations */
  type = typeOf;

  /** Assert the type for the specified unwrapped value for JPL operations */
  assertType = assertType;

  /** Determine whether the specified normalized value should be considered as truthy in JPL operations */
  truthy = (value) => {
    const raw = this.unwrapValue(value);
    return raw !== null && raw !== false;
  };

  /** Compare the specified normalized values */
  compare = compare.bind(this);

  /** Compare the specified normalized strings based on their unicode code points */
  compareStrings = (a, b) => {
    const ta = this.type(a);
    if (ta !== 'string') throw new JPLFatalError(`unexpected type ${ta}`);
    const tb = this.type(b);
    if (tb !== 'string') throw new JPLFatalError(`unexpected type ${tb}`);
    return compareStrings(this.unwrapValue(a), this.unwrapValue(b));
  };

  /** Compare the specified normalized arrays based on their lexical order */
  compareArrays = (a, b) => {
    const ta = this.type(a);
    if (ta !== 'array') throw new JPLFatalError(`unexpected type ${ta}`);
    const tb = this.type(b);
    if (tb !== 'array') throw new JPLFatalError(`unexpected type ${tb}`);

    return compareArrays.call(this, this.unwrapValue(a), this.unwrapValue(b));
  };

  /** Compare the specified normalized objects */
  compareObjects = (a, b) => {
    const ta = this.type(a);
    if (ta !== 'object') throw new JPLFatalError(`unexpected type ${ta}`);
    const tb = this.type(b);
    if (tb !== 'object') throw new JPLFatalError(`unexpected type ${tb}`);

    return compareObjects.call(this, this.unwrapValue(a), this.unwrapValue(b));
  };

  /** Determine if the specified normalized values can be considered to be equal */
  equals = (a, b) => this.compare(a, b) === 0;

  /** Deep merge the specified normalized values */
  merge = async (a, b) => {
    // Call stack decoupling - This is necessary as some browsers (i.e. Safari) have very limited call stack sizes which result in stack overflow exceptions in certain situations.
    await undefined;

    if (this.type(a) !== 'object' || this.type(b) !== 'object') return b;

    return this.alterValue(a, async (value) => {
      const changes = await Promise.all(
        Object.entries(this.unwrapValue(b)).map(async ([k, v]) => [
          k,
          await this.merge(value[k] ?? null, v),
        ]),
      );

      return applyObject(value, changes);
    });
  };

  /** Stringify the specified normalized value for usage in program outputs */
  stringifyJSON = (value, unescapeString) => stringify(value, unescapeString);

  /** Strip the specified normalized value for usage in program outputs */
  stripJSON = (value) => strip(value);

  /**
   * Multiplex the specified array of arguments by calling cb for all possible combinations of arguments.
   *
   * `mux([[1,2], [3,4]], cb)` for example yields:
   * - `cb(1, 3)`
   * - `cb(1, 4)`
   * - `cb(2, 3)`
   * - `cb(2, 4)`
   */
  mux = mux;

  /** Multiplex the specified array of arguments and return the results produced by the callbacks */
  muxOne = muxOne;

  /** Multiplex the specified array of arguments asynchronously and return the results produced by the callbacks */
  muxAsync = muxAsync;

  /** Multiplex the specified array of arguments asynchronously and return a single array of all merged result arrays produced by the callbacks */
  muxAll = muxAll;
}

export default JPLRuntime;

/** Compare the specified normalized values */
function compare(a, b) {
  const ta = this.type(a);
  const tb = this.type(b);

  if (ta !== tb) return typeOrder.indexOf(ta) - typeOrder.indexOf(tb);

  const ua = this.unwrapValue(a);
  const ub = this.unwrapValue(b);

  switch (ta) {
    case 'null':
    case 'function':
      return 0;

    case 'boolean':
    case 'number':
      return +ua - +ub;

    case 'string':
      return compareStrings(ua, ub);

    case 'array':
      return compareArrays.call(this, ua, ub);

    case 'object':
      return compareObjects.call(this, ua, ub);

    default:
      throw new JPLFatalError(`unexpected type ${ta}`);
  }
}

/** Compare the specified normalized strings based on their unicode code points */
function compareStrings(a, b) {
  const min = Math.min(a.length, b.length);
  let i = 0;
  // eslint-disable-next-line no-unused-vars
  for (const _ of a) {
    if (i >= min) {
      break;
    }
    const cp1 = a.codePointAt(i);
    const cp2 = b.codePointAt(i);
    const order = cp1 - cp2;
    if (order !== 0) {
      return order;
    }
    i += 1;
    if (cp1 > 0xffff) {
      i += 1;
    }
  }
  return a.length - b.length;
}

/** Compare the specified normalized arrays based on their lexical order */
function compareArrays(a, b) {
  const min = Math.min(a.length, b.length);
  for (let i = 0; i < min; i += 1) {
    const c = compare.call(this, a[i], b[i]);
    if (c !== 0) return c;
  }
  return a.length - b.length;
}

/** Compare the specified normalized objects */
function compareObjects(a, b) {
  const aKeys = Object.keys(a).sort(compareStrings);
  const bKeys = Object.keys(b).sort(compareStrings);
  let order = compareArrays.call(this, aKeys, bKeys);
  if (order !== 0) return order;
  for (const key of aKeys) {
    order = compare.call(this, a[key], b[key]);
    if (order !== 0) return order;
  }
  return 0;
}
