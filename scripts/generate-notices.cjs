const fs = require("node:fs");
const path = require("node:path");
const licenseChecker = require("license-checker");

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "THIRD_PARTY_NOTICES.md");

function readJson(fileName) {
	return JSON.parse(fs.readFileSync(path.join(ROOT, fileName), "utf8"));
}

const manifest = readJson("package.json");
const lockfile = readJson("package-lock.json");

function splitPackageKey(key) {
	const at = key.lastIndexOf("@");

	return { name: key.slice(0, at), version: key.slice(at + 1) };
}

function normalizeRepository(repository) {
	if (!repository) return null;

	return repository.replace(/^git\+/, "").replace(/\.git$/, "");
}

function formatLicense(info) {
	if (Array.isArray(info.licenses)) {
		return info.licenses.join(", ");
	}

	if (info.licenses && typeof info.licenses === "object") {
		return info.licenses.type || "Unknown";
	}

	return info.licenses || "Unknown";
}

function readLicenseText(info) {
	if (!info.licenseFile || !fs.existsSync(info.licenseFile)) {
		return null;
	}

	return fs.readFileSync(info.licenseFile, "utf8").replace(/\r\n?/g, "\n").trim();
}

// License files are embedded verbatim, so pick a fence longer than any run of
// backticks inside the text (a few packages document Markdown in their README).
function fenced(text) {
	const longestRun = Math.max(0, ...[...text.matchAll(/`+/g)].map((match) => match[0].length));

	const fence = "`".repeat(Math.max(3, longestRun + 1));

	return [`${fence}text`, text, fence];
}

// A package is shipped only when package-lock.json does not mark it dev-only.
// `devOptional` stays in the shipped tree, so it is not treated as dev.
function isBuildOnly(info) {
	const relative = path.relative(ROOT, info.path).split(path.sep).join("/");
	const entry = lockfile.packages[relative];

	return entry ? entry.dev === true : false;
}

function collectPackages(packages) {
	const shipped = [];
	const buildOnly = [];

	for (const [key, info] of Object.entries(packages)) {
		const { name, version } = splitPackageKey(key);

		const entry = {
			name,
			version,
			license: formatLicense(info),
			repository: normalizeRepository(info.repository),
			text: readLicenseText(info),
		};

		(isBuildOnly(info) ? buildOnly : shipped).push(entry);
	}

	const byName = (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version);

	return { shipped: shipped.sort(byName), buildOnly: buildOnly.sort(byName) };
}

function renderShipped(lines, entries) {
	// Many packages share one license text (the MIT block, mostly), so the text
	// is written once and later packages point back at the first occurrence.
	const firstWithText = new Map();

	for (const entry of entries) {
		lines.push(`### ${entry.name}@${entry.version}`, "");
		lines.push(`- **License:** ${entry.license}`);

		if (entry.repository) {
			lines.push(`- **Source:** ${entry.repository}`);
		}

		lines.push("");

		if (!entry.text) {
			lines.push("> **NOTICE:** License file could not be located automatically.", "");
			continue;
		}

		const original = firstWithText.get(entry.text);

		if (original) {
			lines.push(`> License text matches \`${original}\` above.`, "");
			continue;
		}

		firstWithText.set(entry.text, `${entry.name}@${entry.version}`);

		lines.push(...fenced(entry.text), "");
	}
}

function renderBuildOnly(lines, entries) {
	if (entries.length === 0) return;

	lines.push(
		`## Build-time dependencies (${entries.length})`,
		"",
		"These packages run during development and build only. They are not included in `dist/`.",
		"",
		"| Package | Version | License |",
		"| ------- | ------- | ------- |",
	);

	for (const entry of entries) {
		lines.push(`| \`${entry.name}\` | ${entry.version} | ${entry.license} |`);
	}

	lines.push("");
}

function generateNotices({ shipped, buildOnly }) {
	const lines = [
		"## Bundled dependencies",
		"",
		"The production bundle (`npm run build`) contains the following packages.",
		"",
	];

	const warnings = [];

	renderShipped(lines, shipped);
	renderBuildOnly(lines, buildOnly);

	fs.writeFileSync(OUTPUT, lines.join("\n"), "utf8");

	console.log(`Generated: ${OUTPUT}`);
	console.log(`Bundled packages: ${shipped.length}`);
	console.log(`Build-time packages: ${buildOnly.length}`);

	for (const entry of shipped) {
		if (!entry.text) {
			warnings.push(`${entry.name}@${entry.version}: bundled, but no license file found`);
		}
	}

	if (warnings.length > 0) {
		console.warn("\nPackages requiring manual review:");

		for (const warning of warnings) {
			console.warn(`- ${warning}`);
		}

		process.exitCode = 1;
	}
}

// Do not pass `production` or `development`: license-checker treats either one
// as a filter, and setting both drops every dependency. Leaving both unset
// walks the full installed tree, transitive dependencies included.
licenseChecker.init({ start: ROOT }, (error, packages) => {
	if (error) {
		console.error("Failed to scan dependencies:", error);
		process.exitCode = 1;
		return;
	}

	// license-checker includes the project itself in the results.
	delete packages[`${manifest.name}@${manifest.version}`];

	generateNotices(collectPackages(packages));
});
