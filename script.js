// Lexical Analyzer Function
function performLexicalAnalysis(code) {
    const keywords = ["int", "return", "if", "else", "for", "while", "printf", "main", "#include"];
    const operators = ["=", "+", "-", "*", "/", ">", "<", ">=", "<=", "==", "!="];
    const punctuation = [";", "(", ")", "{", "}", ","];
    const lines = code.split("\n");
    const tokens = [];

    lines.forEach((line, lineIndex) => {
        const parts = line.trim().split(/(\s+|;|\(|\)|\{|\}|,|\+|\-|\*|\/|==|=|>=|<=|<|>)/).filter(Boolean);

        parts.forEach((part, index) => {
            let type = "Identifier";

            if (keywords.includes(part)) type = "Keyword";
            else if (operators.includes(part)) type = "Operator";
            else if (punctuation.includes(part)) type = "Punctuation";
            else if (!isNaN(part)) type = "Number";
            else if (/^".*"$/.test(part)) type = "String";

            tokens.push({
                token: part,
                type: type,
                line: lineIndex + 1,
                position: index + 1
            });
        });
    });

    return tokens;
}

// Syntax Analyzer Function
function syntaxAnalyzer(code) {
    let lines = code.split('\n');
    let errors = [];

    // Check for matching braces and parentheses
    let stack = [];

    // Loop through each line to check for braces and parentheses
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        for (let j = 0; j < line.length; j++) {
            if (line[j] === '{') {
                stack.push({ char: '{', line: i + 1, position: j + 1 });
            } else if (line[j] === '(') {
                stack.push({ char: '(', line: i + 1, position: j + 1 });
            }
            else if (line[j] === '}') {
                if (stack.length > 0 && stack[stack.length - 1].char === '{') {
                    stack.pop();
                } else {
                    errors.push(`Mismatched closing brace at line ${i + 1}, position ${j + 1}`);
                }
            } else if (line[j] === ')') {
                if (stack.length > 0 && stack[stack.length - 1].char === '(') {
                    stack.pop();
                } else {
                    errors.push(`Mismatched closing parenthesis at line ${i + 1}, position ${j + 1}`);
                }
            }
        }
    }

    // After going through all lines, check for any unmatched opening braces or parentheses
    stack.forEach(item => {
        errors.push(`Unmatched opening ${item.char === '{' ? 'brace' : 'parenthesis'} at line ${item.line}, position ${item.position}`);
    });

    // Check for basic function declaration validation
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Check for incorrect function declarations - this handles the "int main" without () case
        if (/^(int|void|char|float|double)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(line)) {
            errors.push(`Invalid function declaration at line ${i + 1}. Missing parentheses "()" after function name.`);
        }
    }

    // Check for missing semicolons at the end of statements
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip certain lines that don't need semicolons
        if (line === "" ||
            line.startsWith("//") ||
            line.startsWith("#") ||
            line === "{" ||
            line === "}" ||
            line.match(/^(if|else|for|while)\s*\(.+\)\s*$/) ||
            line.match(/^(int|void|char|float|double)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*$/) // Function declaration
        ) {
            continue;
        }

        // Check if line ends with a semicolon or opening/closing brace
        if (!line.endsWith(";") &&
            !line.endsWith("{") &&
            !line.endsWith("}")) {
            errors.push(`Missing semicolon at line ${i + 1}`);
        }
    }

    // Check for printf statements with proper format
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        const printfMatch = line.match(/printf\s*\((.*)\)/);

        if (printfMatch) {
            const content = printfMatch[1].trim();
            // Check if the printf argument starts with a quote
            if (content.length > 0 && !content.startsWith('"') && !content.match(/^[a-zA-Z0-9_]+$/)) {
                errors.push(`Incorrect printf statement at line ${i + 1}, missing quotes`);
            }
        }
    }

    return errors;
}

function semanticAnalyzer(code) {
    const lines = code.split('\n');
    const declaredVars = new Map(); // varName -> type
    const errors = [];

    const varDeclarationRegex = /\b(int|float|char|double|bool)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(=\s*[^;]+)?;/;
    const assignmentRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+);/;
    const validTypes = ["int", "float", "char", "double", "bool"];
    const keywords = ["int", "float", "char", "double", "void", "bool", "printf", "function", "if", "else", "return", "include", "main", "for", "while"];
    const operators = ["=", "+", "-", "*", "/", ">", "<", ">=", "<=", "==", "!="];
    const punctuation = [";", "(", ")", "{", "}", ","];

    const includesBool = code.includes("#include <stdbool.h>");

    lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();

        // Skip preprocessor
        if (trimmed.startsWith("#")) return;

        // Handle declarations
        const declMatch = trimmed.match(varDeclarationRegex);
        if (declMatch) {
            const type = declMatch[1];
            const name = declMatch[2];
            const rhs = declMatch[3]; // e.g., = true

            if (type === "bool" && !includesBool) {
                errors.push(`"bool" used without including <stdbool.h> at line ${lineIndex + 1}`);
            }

            if (declaredVars.has(name)) {
                errors.push(`Variable "${name}" redeclared at line ${lineIndex + 1}`);
            } else {
                declaredVars.set(name, type);
            }

            if (rhs) {
                const value = rhs.split('=')[1].trim();
                if (!isTypeCompatible(type, value)) {
                    errors.push(`Type mismatch for variable "${name}" at line ${lineIndex + 1}`);
                }
            }

            return;
        }

        // Handle assignments
        const assignMatch = trimmed.match(assignmentRegex);
        if (assignMatch) {
            const name = assignMatch[1];
            const value = assignMatch[2].trim();

            if (!declaredVars.has(name)) {
                errors.push(`Undeclared variable "${name}" used at line ${lineIndex + 1}`);
            } else {
                const expectedType = declaredVars.get(name);
                if (!isTypeCompatible(expectedType, value)) {
                    errors.push(`Type mismatch for variable "${name}" at line ${lineIndex + 1}`);
                }
            }

            return;
        }

        // Check for any usage of undeclared identifiers (except keywords, literals)
        const cleanedLine = trimmed.replace(/"([^"\\]|\\.)*"/g, '').replace(/'[^']*'/g, '');
        const tokens = cleanedLine.split(/[^a-zA-Z0-9_]+/).filter(Boolean);
        tokens.forEach(token => {
            if (
                !declaredVars.has(token) &&
                !keywords.includes(token) &&
                !["true", "false"].includes(token) &&
                !operators.includes(token) &&
                !punctuation.includes(token) &&
                !/^\d+$/.test(token)
            ) {
                errors.push(`Undeclared variable "${token}" used at line ${lineIndex + 1}`);
            }
        });

       // 3. Handle printf format specifier validation
const printfRegex = /printf\s*\(\s*("(.*?)")\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/;
const printfStringOnlyRegex = /printf\s*\(\s*("(.*?)")\s*\)/; // regex to match printf with only string literals

// Check if the line is a printf with just a string literal
const printfStringMatch = trimmed.match(printfStringOnlyRegex);
if (printfStringMatch) {
    // If it's just a string literal inside printf, no error should occur
    return;
}

const printfMatch = trimmed.match(printfRegex);
if (printfMatch) {
    const formatString = printfMatch[1]; // full string with quotes
    const formatContent = printfMatch[2]; // inside the quotes
    const varName = printfMatch[3];

    if (!declaredVars.has(varName)) {
        errors.push(`Undeclared variable "${varName}" used in printf at line ${lineIndex + 1}`);
    } else {
        const varType = declaredVars.get(varName);
        const formatMap = {
            int: "%d",
            float: "%f",
            double: "%lf",
            char: "%c",
            bool: "%d", // C prints bool as 0/1
        };

        const expectedFormat = formatMap[varType];

        if (!formatContent.includes("%")) {
            // No format specifier, check if it's a simple string output
            if (!formatContent.includes("\"")) {
                errors.push(`Missing format specifier in printf at line ${lineIndex + 1}`);
            }
        } else if (!formatContent.includes(expectedFormat)) {
            errors.push(`Incorrect format specifier "${formatContent}" for variable "${varName}" of type "${varType}" at line ${lineIndex + 1}`);
        }
    }
} else if (trimmed.startsWith("printf") && !trimmed.includes(",")) {
    errors.push(`Missing format specifier or variable in printf at line ${lineIndex + 1}`);
}


    });

    return errors;
}

// Helper
function isTypeCompatible(expectedType, value) {
    value = value.trim();

    if (/^".*"$/.test(value)) return expectedType === "char"; // Treat as string literal
    if (/^'.'$/.test(value)) return expectedType === "char";
    if (!isNaN(value)) return ["int", "float", "double"].includes(expectedType);
    if (value === "true" || value === "false") return expectedType === "bool";
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) return true; // can't resolve another variable

    return false;
}




// Display Results
function analyzeCode() {
    const code = document.getElementById("codeInput").value;
    const resultTable = document.getElementById("resultTable").getElementsByTagName('tbody')[0];
    const syntaxResult = document.getElementById("syntaxResult");

    resultTable.innerHTML = "";
    syntaxResult.innerHTML = "";

    // Lexical analysis
    const lexicalTokens = performLexicalAnalysis(code);
    lexicalTokens.forEach(token => {
        const row = resultTable.insertRow();
        row.insertCell(0).innerText = token.token;
        row.insertCell(1).innerText = token.type;
        row.insertCell(2).innerText = token.line;
        row.insertCell(3).innerText = token.position;
    });

    // Syntax analysis
    const syntaxErrors = syntaxAnalyzer(code);
    if (syntaxErrors.length === 0) {
        syntaxResult.innerHTML = `<h3 style="color:green;">Syntax is correct ✅</h3>`;
    } else {
        syntaxResult.innerHTML = "<h3 style='color:red;'>Errors found:</h3>";
        syntaxErrors.forEach(err => {
            syntaxResult.innerHTML += `<p style="color:red;">${err}</p>`;
        });
    }

    // Semantic analysis
    const semanticErrors = semanticAnalyzer(code);
    const semanticResult = document.getElementById("semanticResult");
    semanticResult.innerHTML = "";

    if (semanticErrors.length === 0) {
        semanticResult.innerHTML = `<h3 style="color:green;">No semantic errors ✅</h3>`;
    } else {
        semanticResult.innerHTML = "<h3 style='color:red;'>Semantic Errors:</h3>";
        semanticErrors.forEach(err => {
            semanticResult.innerHTML += `<p style="color:red;">${err}</p>`;
        });
    }

}

// Clear Input and Output
function clearAll() {
    document.getElementById("codeInput").value = "";
    document.getElementById("resultTable").getElementsByTagName('tbody')[0].innerHTML = "";
    document.getElementById("syntaxResult").innerHTML = "";
}

// function semanticAnalyzer(code) {
//     //this phase give the meaning to the program
//     let lines = code.split('\n');
//     let errors = [];

//     //check for undeclare variables
//     //incorrect datatypes
//     //scope of varialble
//     //structure of program
// }