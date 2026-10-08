const fs = require('fs');
const path = require('path');
const dir = './client/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
files.forEach(file => {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf-8');
  if (content.includes('alert(')) {
    content = content.replace(/alert\((.*?(?:Failed|Error|Please|network|fail).*?)\)/gi, 'toast.error($1)');
    content = content.replace(/alert\((.*?)\)/g, 'toast.success($1)');
    if (!content.includes('react-hot-toast')) {
      content = "import toast from 'react-hot-toast';\n" + content;
    }
    fs.writeFileSync(p, content);
    console.log(`Updated ${file}`);
  }
});
