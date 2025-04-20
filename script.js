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
          } else if (line[j] === '}') {
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
}

// Clear Input and Output
function clearAll() {
  document.getElementById("codeInput").value = "";
  document.getElementById("resultTable").getElementsByTagName('tbody')[0].innerHTML = "";
  document.getElementById("syntaxResult").innerHTML = "";
}