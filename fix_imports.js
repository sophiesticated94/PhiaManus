const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            if (content.includes('from \'react-native\'') || content.includes('from \"react-native\"')) {
                const hasTO = content.match(/\bTouchableOpacity\b/);
                const hasSV = content.match(/\bScrollView\b/);
                const hasFL = content.match(/\bFlatList\b/);
                const hasTI = content.match(/\bTextInput\b/); // TextInput from RNGH handles touches better sometimes but let's stick to standard unless needed. Actually just TO, SV, FL
                
                if (hasTO || hasSV || hasFL) {
                    // Check if already has gesture handler import
                    if (!content.includes('react-native-gesture-handler')) {
                        // Remove from react-native import line
                        let lines = content.split('\n');
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i].includes('from \'react-native\'') || lines[i].includes('from \"react-native\"')) {
                                lines[i] = lines[i].replace(/\bTouchableOpacity\b\s*,?/g, '');
                                lines[i] = lines[i].replace(/\bScrollView\b\s*,?/g, '');
                                lines[i] = lines[i].replace(/\bFlatList\b\s*,?/g, '');
                                // Clean up empty commas and braces
                                lines[i] = lines[i].replace(/,\s*,/g, ',');
                                lines[i] = lines[i].replace(/{\s*,/g, '{');
                                lines[i] = lines[i].replace(/,\s*}/g, '}');
                            }
                        }
                        content = lines.join('\n');
                        
                        const imports = [];
                        if (hasTO) imports.push('TouchableOpacity');
                        if (hasSV) imports.push('ScrollView');
                        if (hasFL) imports.push('FlatList');
                        
                        if (imports.length > 0) {
                            const newImport = `import { ${imports.join(', ')} } from 'react-native-gesture-handler';\n`;
                            content = content.replace(/(import.*['"]react-native['"];?\r?\n)/, '$1' + newImport);
                            modified = true;
                        }
                    }
                }
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated', fullPath);
            }
        }
    }
}

processDir('./client/src/screens/more');
processDir('./client/src/components/more');
