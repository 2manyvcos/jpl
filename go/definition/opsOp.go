package definition

// JPL operator type
type JPLOP string

// { pipe: function, selectors: [opa] }
//
// { pipe: [op], selectors: [opa] }
const OP_ACCESS = JPLOP("$.")

// { pipes: [function] }
//
// { pipes: [[op]] }
const OP_AND = JPLOP("and")

// { pipe: function }
//
// { pipe: [op] }
const OP_ARRAY_CONSTRUCTOR = JPLOP("[]")

// { pipe: function, selectors: [opa], assignment: opu }
//
// { pipe: [op], selectors: [opa], assignment: [opu] }
const OP_ASSIGNMENT = JPLOP("$=")

// { pipe: function, operations: [opm] }
//
// { pipe: [op], operations: [opm] }
const OP_CALCULATION = JPLOP("clc")

// { pipe: function, comparisons: [opc] }
//
// { pipe: [op], comparisons: [opc] }
const OP_COMPARISON = JPLOP("cmp")

// { value: any }
//
// { value: any }
const OP_CONSTANT = JPLOP("cnt")

// {}
//
// {}
const OP_CONSTANT_FALSE = JPLOP("fls")

// {}
//
// {}
const OP_CONSTANT_NULL = JPLOP("nul")

// {}
//
// {}
const OP_CONSTANT_TRUE = JPLOP("tru")

// { argNames: [string], pipe: function }
//
// { argNames: [string], pipe: [op] }
const OP_FUNCTION_DEFINITION = JPLOP("fun")

// { ifs: [{ if: function, then: function }], else: function }
//
// { ifs: [{ if: [op], then: [op] }], else: [op] }
const OP_IF = JPLOP("if")

// { interpolations: [{ before: string, pipe: function }], after: string }
//
// { interpolations: [{ before: string, pipe: [op] }], after: string }
const OP_INTERPOLATED_STRING = JPLOP(`"$"`)

// {}
//
// {}
const OP_NEGATION = JPLOP("neg")

// {}
//
// {}
const OP_NOT = JPLOP("not")

// { pipes: [function] }
//
// { pipes: [[op]] }
const OP_NULL_COALESCENCE = JPLOP("??")

// { number: number }
//
// { number: number }
const OP_NUMBER = JPLOP("nbr")

// { fields: [{ key: function, value: function, optional: boolean }] }
//
// { fields: [{ key: [op], value: [op], optional: boolean }] }
const OP_OBJECT_CONSTRUCTOR = JPLOP("{}")

// { pipes: [function] }
//
// { pipes: [[op]] }
const OP_OR = JPLOP("or")

// { pipes: [function] }
//
// { pipes: [[op]] }
const OP_OUTPUT_CONCAT = JPLOP(",")

// { string: string }
//
// { string: string }
const OP_STRING = JPLOP(`""`)

// { try: function, catch: function }
//
// { try: [op], catch: [op] }
const OP_TRY = JPLOP("try")

// { name: string }
//
// { name: string }
const OP_VARIABLE = JPLOP("var")

// { name: string, pipe: function }
//
// { name: string, pipe: [op] }
const OP_VARIABLE_DEFINITION = JPLOP("va=")

// {}
//
// {}
const OP_VOID = JPLOP("vod")
