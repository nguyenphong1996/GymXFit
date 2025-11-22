const fs = require('fs');
const path = require('path');

const targetDir = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-vector-icons',
  'fontawesome6',
  'android',
  'build',
  'generated',
  'source',
  'codegen',
);

try {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('Created missing vector-icons codegen directory to satisfy Metro watcher');
  }
} catch (error) {
  console.warn('Could not create vector-icons codegen directory:', error?.message || error);
}
