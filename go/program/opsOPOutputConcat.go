package program

import (
	"github.com/jplorg/jpl/go/definition"
	"github.com/jplorg/jpl/go/jpl"
	"github.com/jplorg/jpl/go/library"
)

type opOutputConcat struct{}

// { pipes: [[op]] }
func (opOutputConcat) OP(runtime jpl.JPLRuntime, input any, params definition.JPLInstructionParams, scope jpl.JPLRuntimeScope, next jpl.JPLScopedPiper) ([]any, jpl.JPLError) {
	return library.MuxAll([][]definition.Pipe{params.Pipes}, jpl.IOMuxerFunc[definition.Pipe, []any](func(args ...definition.Pipe) ([]any, jpl.JPLError) {
		return runtime.ExecuteInstructions(args[0], []any{input}, scope, jpl.JPLScopedPiperFunc(func(output any, _ jpl.JPLRuntimeScope) ([]any, jpl.JPLError) {
			return next.Pipe(output, scope)
		}))
	}))
}

// { pipes: [function] }
func (opOutputConcat) Map(runtime jpl.JPLRuntime, params jpl.JPLInstructionParams) (result definition.JPLInstructionParams, err jpl.JPLError) {
	if result.Pipes, err = library.MuxOne([][]jpl.JPLFunc{params.Pipes}, jpl.IOMuxerFunc[jpl.JPLFunc, definition.Pipe](func(args ...jpl.JPLFunc) (definition.Pipe, jpl.JPLError) {
		return call(args[0]), nil
	})); err != nil {
		return
	}
	return
}
