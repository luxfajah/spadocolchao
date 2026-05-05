const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, '../src/app/dashboard/cadastros'));
let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    content = content.replace(/bg-slate-900/g, 'bg-card');
    content = content.replace(/border-slate-800/g, 'border-border');
    content = content.replace(/bg-slate-800/g, 'bg-card hover:bg-muted/10');
    content = content.replace(/border-slate-700/g, 'border-input');
    
    // Fix over-replacements
    content = content.replace(/hover:bg-muted\/10\/50/g, 'hover:bg-muted/50'); 
    
    // Specific text colors
    content = content.replace(/text-slate-400/g, 'text-muted-foreground');
    content = content.replace(/text-slate-300/g, 'text-muted-foreground');
    content = content.replace(/text-slate-200/g, 'text-foreground');
    content = content.replace(/text-slate-100/g, 'text-foreground');
    content = content.replace(/text-white/g, 'text-foreground');
    
    // Structure updates
    content = content.split('rounded-md').join('rounded-xl');
    content = content.split('rounded-lg').join('rounded-2xl');
    
    // Title headers
    content = content.replace(/text-2xl font-bold text-foreground mb-2/g, 'text-3xl font-bold tracking-tight text-brand-950 mb-1');
    content = content.replace(/text-2xl font-bold text-foreground/g, 'text-3xl font-bold tracking-tight text-brand-950');

    // Forms layout
    content = content.replace(/className=\"space-y-4 bg-card border border-border p-6 rounded-2xl\"/g, 'className=\"space-y-6 bg-card border border-border p-8 rounded-2xl shadow-sm\"');
    content = content.replace(/p-4 rounded-2xl/g, 'p-6 rounded-2xl shadow-sm');
    
    // Modals/Cards background fallback fix
    content = content.replace(/hover:bg-card hover:bg-muted\/10/g, 'hover:bg-muted/50 transition-colors');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
    }
}
console.log('Modified ' + modifiedCount + ' files.');
