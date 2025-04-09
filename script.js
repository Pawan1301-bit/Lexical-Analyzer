const patterns = [
    ['PREPROCESSOR', /^\s*#\s*\w+/],
    ['STRING_LITERAL', /^"(?:\\.|[^"\\])*"/],
    ['CHAR_LITERAL', /^'(?:\\.|[^'\\])'/],
    ['KEYWORD', /\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/],
    ['DATATYPE', /\b(int|float|char|double|void|short|long|signed|unsigned)\b/],
    ['OPERATOR', /^(\+\+|--|->|==|!=|>=|<=|&&|\|\||<<|>>|[-+*/%=<>&|!~^])/],
    ['PUNCTUATOR', /^[()[\]{}.,;:]/],
    ['NUMBER', /^\b\d+(\.\d+)?([eE][+-]?\d+)?\b/],
    ['IDENTIFIER', /^\b[a-zA-Z_]\w*\b/],
    ['WHITESPACE', /^\s+/],
    ['SINGLELINE_COMMENT', /^\/\/.*$/],
    ['MULTILINE_COMMENT', /^\/\*[\s\S]*?\*\//]
  ];
  
  function analyzeCode() {
    const code = document.getElementById('codeInput').value;
    const tableBody = document.querySelector('#resultTable tbody');
    tableBody.innerHTML = '';
    
    if (!code.trim()) {
      alert("Please enter some C code to analyze.");
      return;
    }
  
    const lines = code.split('\n');
  
    lines.forEach((line, lineNumber) => {
      let position = 0;
      while (position < line.length) {
        let matched = false;
  
        for (const [type, pattern] of patterns) {
          const slice = line.slice(position);
          const match = slice.match(pattern);
          if (match && match.index === 0) {
            const value = match[0];
  
            if (!['WHITESPACE', 'SINGLELINE_COMMENT', 'MULTILINE_COMMENT'].includes(type)) {
              const row = document.createElement('tr');
              row.innerHTML = `
                <td>${value}</td>
                <td>${type}</td>
                <td>${lineNumber + 1}</td>
                <td>${position + 1}</td>
              `;
              tableBody.appendChild(row);
            }
  
            position += value.length;
            matched = true;
            break;
          }
        }
  
        if (!matched) {
          const unknownChar = line[position];
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${unknownChar}</td>
            <td>UNKNOWN</td>
            <td>${lineNumber + 1}</td>
            <td>${position + 1}</td>
          `;
          tableBody.appendChild(row);
          position++;
        }
      }
    });
  
    alert("Analysis complete!");
  }
  
  function clearAll() {
    document.getElementById('codeInput').value = '';
    document.querySelector('#resultTable tbody').innerHTML = '';
  }
  


/* test case
#include<stdio.h>
int main()
{
  int a = 10;
  printf("%d", a);
  return 0;
}
*/