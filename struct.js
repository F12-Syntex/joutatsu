const fs = require('fs');
const path = require('path');

const IGNORED = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  'coverage',
];

function printTree(dir, prefix = '', isRoot = true) {
  const name = path.basename(dir);

  if (isRoot) {
    console.log(name + '/');
  }

  if (!fs.statSync(dir).isDirectory()) return;

  const entries = fs.readdirSync(dir)
    .filter(e => !IGNORED.includes(e) && !e.startsWith('.'))
    .map(e => ({
      name: e,
      path: path.join(dir, e),
      isDir: fs.statSync(path.join(dir, e)).isDirectory()
    }))
    .sort((a, b) => {
      if (a.isDir === b.isDir) return a.name.localeCompare(b.name);
      return a.isDir ? -1 : 1;
    });

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? '+-- ' : '|-- ';
    const extension = isLast ? '    ' : '|   ';

    console.log(prefix + connector + entry.name + (entry.isDir ? '/' : ''));

    if (entry.isDir) {
      printTree(entry.path, prefix + extension, false);
    }
  });
}

console.log('\nProject Structure\n' + '='.repeat(40) + '\n');
printTree(process.cwd());
console.log('\n' + '='.repeat(40));
