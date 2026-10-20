#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const runtime = ['index.html','styles.css','app.js','navigation.js','state.js','platform.js','config.xml'];

function packageApplication(source, destination) {
  source = path.resolve(source);
  const entries = runtime.slice();
  for (const file of runtime) {
    const full = path.join(source,file);
    if (!fs.existsSync(full)) throw new Error('Missing runtime file: ' + file);
    if (fs.lstatSync(full).isSymbolicLink()) throw new Error('Refusing symbolic link: ' + file);
    if (!fs.statSync(full).isFile()) throw new Error('Invalid runtime file: ' + file);
  }
  const collect = relative => {
    const full = path.join(source,relative);
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink()) throw new Error('Refusing symbolic link: ' + relative);
    if (stat.isDirectory()) fs.readdirSync(full).sort().forEach(name => collect(path.join(relative,name)));
    else if (stat.isFile()) {
      if (!/\.(png|jpe?g|webp|svg|ttf|woff2?|txt)$/i.test(relative)) throw new Error('Unexpected asset type: ' + relative);
      entries.push(relative);
    }
  };
  if (fs.existsSync(path.join(source,'assets'))) collect('assets');
  const manifest = fs.readFileSync(path.join(source,'config.xml'),'utf8');
  if (!/<widget\b/.test(manifest) || !/<content\s+[^>]*src=["']index\.html["']/.test(manifest)) throw new Error('Manifest must launch index.html');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(),'vibe-package-'));
  try {
    const archive = path.join(temp,'VibeTV-unsigned.wgt');
    execFileSync('zip',['-q','-X',archive].concat(entries),{cwd:source,stdio:'pipe'});
    fs.mkdirSync(path.dirname(path.resolve(destination)),{recursive:true});
    fs.copyFileSync(archive,destination);
    return entries;
  } finally {
    fs.rmSync(temp,{recursive:true,force:true});
  }
}

if (require.main === module) {
  const root = path.join(__dirname,'..');
  const out = path.join(root,'dist','VibeTV-unsigned.wgt');
  const entries = packageApplication(path.join(root,'tizen'),out);
  console.log('Prepared ' + out + ' (' + entries.length + ' files). UNSIGNED: source package only; no TV installation performed.');
}
module.exports = { packageApplication };
