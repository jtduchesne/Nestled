var cleanup = require('rollup-plugin-cleanup');
var commonjs = require('rollup-plugin-commonjs');
var resolve = require('rollup-plugin-node-resolve');
import {terser} from 'rollup-plugin-terser';
 
module.exports = {
    input: 'src/main.js',
    output: [
        {
            file: 'public/javascripts/nestled.cjs.js',
            format: 'cjs',
            name: 'Nestled',
            sourcemap: true
        }, {
            file: 'public/javascripts/nestled.min.js',
            format: 'iife',
            plugins: [terser()],
            name: 'Nestled',
            sourcemap: true
        }, {
            file: 'public/javascripts/nestled.js',
            format: 'esm',
            sourcemap: true
        }
    ],
    watch: {
        include: 'src/**'
    },
    plugins: [
        cleanup(),
        commonjs(),
        resolve()
    ]
};
