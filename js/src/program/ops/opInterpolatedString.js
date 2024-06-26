import { call } from './utils';

export default {
  /** { interpolations: [{ before: string, pipe: [op] }], after: string } */
  async op(runtime, input, params, scope, next) {
    const interpolations = await runtime.muxAsync([params.interpolations ?? []], (interpolation) =>
      runtime.executeInstructions(interpolation.pipe ?? [], [input], scope, (output) => [
        (interpolation.before ?? '') + runtime.stringifyJSON(output, true),
      ]),
    );

    return runtime.muxAll(interpolations, (...parts) =>
      next(parts.join('') + (params.after ?? ''), scope),
    );
  },

  /** { interpolations: [{ before: string, pipe: function }], after: string } */
  map(runtime, params) {
    return {
      interpolations: runtime.muxOne([params.interpolations], (entry) => ({
        before: runtime.assertType(entry.before, 'string'),
        pipe: call(entry.pipe),
      })),
      after: runtime.assertType(params.after, 'string'),
    };
  },
};
