import builtinReplacements from './replacements.js';
import localeReplacements from './locale-replacements.js';

// TODO: Use Regex.escape when targeting Node.js 24.
const escapeRegex = string => string.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const buildReplacementPattern = replacements => {
	// Sort by key length descending so longer patterns match first (e.g., 'ու' before 'ո')
	const sortedKeys = [...replacements.keys()].sort((a, b) => b.length - a.length);
	return new RegExp(sortedKeys.map(key => escapeRegex(key)).join('|'), 'gu');
};

// Pre-compile the default pattern for performance
const defaultPattern = buildReplacementPattern(builtinReplacements);

const getLocaleReplacements = locale => {
	if (!locale) {
		return undefined;
	}

	const normalizedLocale = locale.toLowerCase()
		// Norwegian (no) is an alias for Norwegian Bokmål (nb)
		.replace(/^no(-|$)/, 'nb$1');

	return localeReplacements[normalizedLocale]
		|| localeReplacements[normalizedLocale.split('-')[0]]
		|| undefined;
};

export default function transliterate(string, options) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a string, got \`${typeof string}\``);
	}

	options = {
		customReplacements: [],
		...options,
	};

	const localeMap = getLocaleReplacements(options.locale);

	const hasCustomReplacements = options.customReplacements.length > 0 || options.customReplacements.size > 0;

	let replacements = builtinReplacements;
	let pattern = defaultPattern;

	if (localeMap || hasCustomReplacements) {
		replacements = new Map(builtinReplacements);

		if (localeMap) {
			for (const [key, value] of localeMap) {
				replacements.set(key, value);
			}
		}

		for (const [key, value] of options.customReplacements) {
			replacements.set(key, value);
		}

		pattern = buildReplacementPattern(replacements);
	}

	string = string.normalize();
	string = string.replace(pattern, match => replacements.get(match) ?? match);
	string = string.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '').normalize();

	// Normalize all dash types to hyphen-minus
	string = string.replaceAll(/\p{Dash_Punctuation}/gu, '-');

	return string;
}
