package program

import (
	"github.com/jplorg/jpl/go/definition"
	"github.com/jplorg/jpl/go/jpl"
	"github.com/jplorg/jpl/go/library"
)

type opuNullCoalescence struct{}

// { pipe: [op] }
func (opuNullCoalescence) OP(runtime jpl.JPLRuntime, input any, target any, params definition.JPLAssignmentParams, scope jpl.JPLRuntimeScope, next jpl.JPLPiper) ([]any, jpl.JPLError) {
	return runtime.ExecuteInstructions(definition.Pipe{{
		OP:     definition.OP_NULL_COALESCENCE,
		Params: definition.JPLInstructionParams{Pipes: []definition.Pipe{constant(target), params.Pipe}},
	}}, []any{input}, scope, library.NewPiperWithScope(next))
}

// { pipe: function }
func (opuNullCoalescence) Map(runtime jpl.JPLRuntime, params jpl.JPLAssignmentParams) (result definition.JPLAssignmentParams, err jpl.JPLError) {
	result.Pipe = call(params.Pipe)
	return
}
