/**
 * ESLint: Config
 *
 * @author      Esteban Rocha
 * @link        https://github.com/Esteban-Rocha
 * @since       1.0.0
 */

// Readable settings flags
const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = exports = {
	env: {
		amd: true,
		browser: true,
		es6: true,
		jquery: true,
		node: true,
		serviceworker: true,
		webextensions: true,
		worker: true,
	},

	extends: "airbnb-base",
	parserOptions: {
		ecmaVersion: 8,
		sourceType: "module",
	},

	rules: {
		"accessor-pairs": [
			ERROR,
			{
				getWithoutSet: false,
				setWithoutGet: true,
			},
		],
		"arrow-body-style": [WARN, "as-needed"],
		"arrow-parens": [ERROR, "as-needed", { requireForBlockBody: false }],
		"block-scoped-var": WARN,
		"comma-dangle": [
			ERROR,
			{
				arrays: "only-multiline",
				objects: "only-multiline",
				imports: "only-multiline",
				exports: "only-multiline",
				functions: "ignore",
			},
		],
		// the dot goes with the property when doing multiline
		"dot-location": [WARN, "property"],
		"implicit-arrow-linebreak": OFF,
		indent: [ERROR, "tab"],
		"max-len": [WARN, { code: 110, ignoreUrls: true }],
		"no-console": OFF,
		"no-tabs": OFF,
		"no-unused-expressions": [WARN, { allowShortCircuit: true, allowTernary: true }],
		"space-before-function-paren": [
			ERROR,
			{
				anonymous: "never",
				named: "never",
				asyncArrow: "ignore",
			},
		],
		quotes: [ERROR, "double", { allowTemplateLiterals: true }],
		"vars-on-top": WARN,
		"wrap-iife": [ERROR, "any"],
		yoda: ERROR,
	},
};
