const fs = require('fs');
const files = [
  'src/app/shared/components/summary-card/summary-card.component.ts',
  'src/app/shared/components/loading-spinner/loading-spinner.component.ts',
  'src/app/features/transactions/transactions.component.ts',
  'src/app/features/insights/insights.component.ts',
  'src/app/core/services/finance.service.ts',
  'src/app/app.component.ts',
  'src/styles.css'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the exact hex (case-insensitive)
    content = content.replace(/#6366f1/gi, '#1482C4');
    
    // Replace the gradient lighter shade
    content = content.replace(/#818cf8/gi, '#4AA8E2');
    
    // Replace rgba values
    content = content.replace(/99,\s*102,\s*241/g, '20,130,196');
    
    // Replace URL encoded hex
    content = content.replace(/%236366f1/gi, '%231482C4');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
