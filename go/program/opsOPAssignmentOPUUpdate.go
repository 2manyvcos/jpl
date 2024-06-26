package program

import (
	"github.com/jplorg/jpl/go/definition"
	"github.com/jplorg/jpl/go/jpl"
	"github.com/jplorg/jpl/go/library"
)

type opuUpdate struct{}

// { pipe: [op] }
func (opuUpdate) OP(runtime jpl.JPLRuntime, input any, target any, params definition.JPLAssignmentParams, scope jpl.JPLRuntimeScope, next jpl.JPLPiper) ([]any, jpl.JPLError) {
	return runtime.ExecuteInstructions(params.Pipe, []any{target}, scope, library.NewPiperWithScope(next))
}

// { pipe: function }
func (opuUpdate) Map(runtime jpl.JPLRuntime, params jpl.JPLAssignmentParams) (result definition.JPLAssignmentParams, err jpl.JPLError) {
	result.Pipe = call(params.Pipe)
	return
}
