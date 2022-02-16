module.exports = {
	globDirectory: './',
	globPatterns: [
		'**/*.{scss,md,css,js,eot,ttf,woff,txt,wav,png,html,json,svg,woff2}'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};