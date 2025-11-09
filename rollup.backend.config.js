import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from '@rollup/plugin-commonjs'
import json from "@rollup/plugin-json";

import fs from "fs";

const distDir = `backend/dist`;
if (!fs.existsSync(distDir)){
    fs.mkdirSync(distDir);
}
fs.writeFileSync(`${distDir}/package.json`, '{"type":"module"}');

export default (async () => ({
	input: `backend/lambda.js`,
	plugins: [
		commonjs(),
		nodeResolve({dedupe: ['@koralabs/kora-labs-common', '@koralabs/kora-labs-databases', '@hyperionbt/helios']}),
		json(),
	],
	output: {
		dir: distDir,
		inlineDynamicImports: true,
		format: 'es'
	},
	external: [ '@aws-sdk/client-s3' ]
}))();
