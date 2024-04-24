package interpreter

import (
	"github.com/2manyvcos/jpl/go/jpl"
	"github.com/2manyvcos/jpl/go/library"
)

// Create an orphan JPL function from the specified source program string.
//
// Some optional scope presets may be specified, e.g. for allowing the function access to some specified variables.
// Other than that, the function does not have access to any external variables.
func ParseFunction(argNames []string, source string, presets *jpl.JPLRuntimeScopeConfig) (jpl.JPLFunc, jpl.JPLSyntaxError) {
	instructions, err := SystemInterpreter.ParseInstructions(source)
	if err != nil {
		return nil, err
	}

	return library.OrphanFunction(argNames, instructions, presets), nil
}
