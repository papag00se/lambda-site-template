import nodeResolve from "@rollup/plugin-node-resolve";
import fs from "fs";

const distDir = `frontend/dist`;
let indexHtml = fs.readFileSync(`frontend/index.html`).toString('utf8');
const inputs = [...indexHtml.matchAll(/(?:'|")(?!http)(.*\.js)(?:'|")/gm)].map(m => m[1]);
const input = inputs.map(m =>{
	let file = m;
	if (file.startsWith(`/node_modules`)) {
		file = file.slice(1);
	}
	else if (file.startsWith('@')) {
		file = `node_modules/${file}`;
	}
	if (!file.startsWith(`node_modules/`)) {
		file = `frontend${file}`;
	}
	indexHtml = indexHtml.replace(file, file.split('/')[file.split('/').length-1])
	return file;
});

for (const m of indexHtml.matchAll(/(?:src|href|import\()=?(?:'|")(?!http)(.*\.(?:[a-z]{1,5}))(?:'|")/gm)) {
	indexHtml = indexHtml.replace(m[1], `https://cdn.${process.env.SITE_DOMAIN}/${process.env.FINGERPRINT}${m[1]}`);
};
//                                                                         m[1]
for (const m of indexHtml.matchAll(/(?:src|href|import\()=?(?:'|")(?!http)(\/.*)(?:'|")/gm)) {
	indexHtml = indexHtml.replace(m[1], `${process.env.BASE_FOLDER ?? ''}${m[1]}`);
};

if (!fs.existsSync(distDir)){
    fs.mkdirSync(distDir);
}

fs.appendFileSync(`${distDir}/index.html`, indexHtml);

export default (async () => ({
	input,
	plugins: [
		nodeResolve()
	],
	output: {
		dir: distDir,
		format: 'es'
	}
}))();
