import * as escodegen from "escodegen";
import * as espree from "espree";
import * as estraverse from "estraverse";
import fs from "fs";

/**
 * Read the file with the js program, calls addLogin to add the login messages and writes the output
 * @param {string} input_file - The name of the input file
 * @param {string} output_file - The name of the output file
 */
export async function transpile(inputFile, outputFile) {
  let output = fs.readFileSync(inputFile, 'utf8');
  fs.writeFileSync(outputFile, addLogging(output));
}

/** 
 * Builds the AST and
 * Traverses it searching for function nodes and callas addBeforeNode to transform the AST
 * @param {string} code -the source code 
 * @returns -- The transformed AST 
 */
export function addLogging(code) {
  let ast = espree.parse(code, {ecmaVersion:6, loc:true});

  estraverse.traverse(ast, {
    enter: function(node, parent) {
      if (node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression') {
        addBeforeCode(node);
      }
    }
  });
  return escodegen.generate(ast);
}

/**
 * AST transformation
 * @param {AST function type node} node 
 */
function addBeforeCode(node) {
  let name = node.id ? node.id.name : '<anonymous function>';
  let line = node.loc.start.line;
  let params = [];
  for (let i = 0; i < node.params.length; ++i) {
    if (i === 0) {
      params.push(`\$\{ ${node.params[i].name} \}`);
    } else {
      params.push(` \$\{ ${node.params[i].name} \}`);
    }
  }

  let beforeCode = `console.log(\`Entering ${name}(${params}) at line ${line}\`);`;
  let beforeNodes = espree.parse(beforeCode, {ecmaVersion:6}).body; // Is an Array of ASTs
  node.body.body = beforeNodes.concat(node.body.body);
}
