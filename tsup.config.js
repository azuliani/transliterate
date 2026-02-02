import {defineConfig} from 'tsup';

export default defineConfig({
	entry: ['index.js'],
	format: ['cjs'],
	outDir: 'dist',
	clean: true,
	splitting: false,
	// Bundle the local dependencies into the CJS output
	noExternal: ['./replacements.js', './locale-replacements.js'],
	// Ensure default export works properly for CJS consumers
	cjsInterop: true,
});
