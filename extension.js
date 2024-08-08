// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const jsonData = require(path.resolve(__dirname, 'guide.json'));
const UPPER_CASE_EDGES = [65, 90];
const LOWER_CASE_EDGES = [97, 122];
const OPERATORS = ["=",">","+","-","*","/","%", "**", "&&", "||"];

class Stack {
	constructor() {
		this.data = [];
		this.length = 0;
	}
	push(item) {
		this.data.unshift(item);
		this.length++;
	}
	pop() {
		if (!this.length) {
			throw new Error("List is already empty")
		}
		let removed = this.data.shift();
		this.length--;
		return removed;
	}
	peek() {
		if (!this.length) {
			throw new Error("List is empty")
		}
		return this.data[0]
	}
}

class Logger {
	constructor() {
		this.namingChanges = new Map();
		this.report = {"naming": [], "Misc": []};
		this.conventions = "";
		this.starts = new Map()
		this.imports = [];
		this.constants = [];
		this.replace = true;
		this.exp_indentation = [];
	}

	addToReport(typeChange, lineNum, orginal = "", processed = "") {
		switch (typeChange) {
			case "Naming":
				if (logger.replace) {
					this.report["naming"].push(`Changed ${orginal} to ${processed} to fit with naming conventions for ${logger.conventions} (declared at line: ${lineNum}`);
				} else {
					this.report["naming"].push(`You should change ${orginal} to ${processed} to fit with naming conventions for ${logger.conventions} (declared at line: ${lineNum}`);
				}
			case "Misc":
				this.report["Misc"].push(`${orginal} (declared at line: ${lineNum})`);
			case "Literal":
				if (this.replace) {
					this.report["Misc"].push(`Changed string ${orginal} to ${processed} to be a string literal (declared at line: ${lineNum})`);
				} else {
					this.report["Misc"].push(`Should change string ${orginal} to ${processed} to be a string literal (declared at line: ${lineNum})`);
				}
			case "funcDec":
				if (logger.replace) {
					this.report["naming"].push(`Changed function ${orginal} to ${processed} (declared at line: ${lineNum})`)
				} else {
					this.report["naming"].push(`Should change function ${orginal} to ${processed} (declared at line: ${lineNum})`)
				}
			case "language":
				if (orginal === "JS_ARRAY") {
					if (logger.replace) {
						this.report["language"].push(`Changed use of new Array() to [] as forbidden (declared at line: ${lineNum})`)
					} else {
						this.report["language"].push(`Replace use of new Array() to [] as forbidden (declared at line: ${lineNum})`)
					}
				} 
			}
	}
	createReport() {
		let content = "";
        for (const [key, changes] of Object.entries(this.report)) {
            content += `${key}\n`;
            for (const change of changes) {
                content += `${change}\n`;
            }
        }
		vscode.window.showInformationMessage('HEREEEEE');
		try {
			fs.writeFileSync('HelloThere.txt', 'Hello, world!');
			console.log('File created and data written!');
		} catch (err) {
			console.error('Error creating file:', err);
		}
	}
}

const logger = new Logger();

function addAtIndex(str, index, char) {
	return str.slice(0, index) + char + str.slice(index, str.length);
}

String.prototype.isUpperCase = function() {
	return [...this].every((char) => {
		return char.charCodeAt(0) >= UPPER_CASE_EDGES[0] && char.charCodeAt(0) < UPPER_CASE_EDGES[1]
	})
}

String.prototype.isLowerCase = function() {
	return [...this].every((char) => {
		return char.charCodeAt(0) >= LOWER_CASE_EDGES[0] && char.charCodeAt(0) < LOWER_CASE_EDGES[1]
	})
}

String.prototype.count = function(search) {
	let sum = 0;
    [...this].forEach((item) => {
        if (item === search) {
            sum++;
        }
    });
    return sum;
}

function clangFormat(text) {
	const formatted_text = [];
	for (let line of text) {
		let index = 0;
		let modified = "";
		let charFound = false;
		let len = line.length;
		let indentation = [];
		while (index < len) {
			if (!charFound) {
				if (line[index] === " ") {
					indentation.push(" ")
					index++;
				} else {
					charFound = true;
				}
		 	} else if (len > index + 2 && line.substr(index, 2) === "if" && line[index + 2] !== " ") {
				modified += "if "
				index += 2
			} else if (len > index + 3 && line.substr(index, 3) === "for" && line[index + 3] !== " ") {
				modified += "for "
				index += 3
			} else if (len > index + 5 && line.substr(index, 5) === "while" && line[index + 5] !== " ") {
				modified += "while "
				index += 5
			} else if (len > index + 1 && line[index] === " " && line[index+1] === ";" ) {
				index++;
			} else if (OPERATORS.includes(line[index])) {
				if (line[index-1] !== " ") {
          			modified += " "
				}
				while (OPERATORS.includes(line[index])) {
					modified += line[index++]
				}
				if (!OPERATORS.includes(line[index]) && line[index] !== " ") {
					modified += " ";
				}
			} else if (line[index] !== " " && line[index+1] === "{") {
				modified += line[index] + " "
				index++;
			} else if (line[index] === "}" && line[index + 1] !== " ") {
				modified += "} "
				index++;
			} else {
				modified += line[index++]
			}
		}
		formatted_text.push(indentation.join("") + modified.trim())
	}
	return formatted_text;
}

/** convertToLiteral
This function will take in a string and convert it to a template literal
Parameters:
 @param str - the string to be modifed
 @param lineNum - the number of the line where str defined
*/
function convertToLiteral(str, lineNum) {
	let index = 1;
	let mod = "`";
	let instring = true;
	let opened = false;
	while (index < str.length) {
		if (str[index] === "\"" || str[index] === "'") {
      		instring = !instring
			index += 1
		} else {
			if (str[index] == ";") {
				return mod + "\`;\n"
			} else if (instring) {
				mod += str[index++];
			} else {
				if (str[index] === "+") {
					if (!opened) {
						mod += "${"
						opened = true;
					} else {
						mod += "}"
						opened = false;   
					}
					index += 1
				} else if (str[index] === " ") {
					index += 1
				} else {
					mod += str[index++];
				}
			}
		}
	}
	mod += "`";
	logger.addToReport("Literal", lineNum, str, mod)
	return (mod);
}

/* checkCasing
This function will check the casing of the variable name and its conforms to given rules
Parameters:
 @param type - a string representing the type of name
 @param name - the name of the variable
 @param lineNum - the number of the line where the variable was declared
*/
function checkCasing(type, name, lineNum) {
	let newName = "";
	let namingRules = logger.c_rules["naming"]
	if (namingRules[type] == "SnakeCasing") {
		// for every uppercase, lower it and put a _ before it
		for (let i = 1; i < name.length; i++) {
			if (name[i].isUpperCase()) {
				newName += "_" + name[i].toLowerCase()
			} else {
				newName += name[i];
			}
		}
	} else {
		for (let i = 0; i < name.length; i++) {
			if (name[i] == "_") {
				i++;
				newName += name[i].toUpperCase()
			} else {
				newName += name[i]
			}
		}
	}
	if (newName != name) {
		logger.addToReport("naming", lineNum, orginal = name, processed = newName);
	}
	return newName;
}
/** checkNaming
This function checks the naming of the function for the first letter and runs check casing function to check rest of name
*/
function checkNaming(type, name, lineNum) {
	let namingRules = logger.c_rules["naming"]
	if (namingRules[type] == "LowerCamel" && name[0].isLowerCase()) {
		name = String.fromCharCode(name.charCodeAt(0) + 32) + name.substring(1);
	}
	if (namingRules[type] == "UpperCamel" && name[0].isUpperCase()) {
		name = String.fromCharCode(name.charCodeAt(0) - 32) + name.substring(1);
	}
	return checkCasing(type, name, lineNum);
}
/* checkFuncNaming
This function checks the naming of function and also the parameters given in
*/
function checkFuncNaming(line) {
	const chars = line.join(" ").split("")
	// finds name by looking for (, slicing the name from the chars and then turning it into a string
	let funcName = checkNaming("method", (chars.slice("function ".length, chars.indexOf("("))).join(""));
	const raw_parameters = chars.slice(chars.indexOf("("));
	const params = [];
	let temp = "";
	for (let char of raw_parameters) {
		if (char == ",") {
			params.push(checkNaming("variable", temp));
			temp = "";
		} else if (char !== " ") {
			temp += char
			if (char == ")") {
				params.push(checkNaming("variable", temp));
				break;
			}
		}
	}
	return [funcName, params];
}

function checkJSDOC(text, funcLine, funcName, params) {
	let commentingRules = logger.g_rules["commenting"];
	if (text[funcLine-1].includes(commentingRules["singleComment"]) || 
		text[funcLine-1].includes(commentingRules["multiLineComment"][0]) || 
		text[funcLine-1].includes(commentingRules["multiLineComment"][1])) 
	{
		let index = funcLine;
		while (!text[index].startsWith(commentingRules["multiLineComment"][0])) {
			index -= 1;
		}
		let jsdoc = text.slice(index, funcLine).join(" ")
		let position = 0
		while (true) {
			position = jsdoc.indexOf("@param", position)
			// if no more @parmas exist
			if (position === -1) {
				break
			}
			// includes all except for the parameter found
			params = params.filter(item => item !== jsdoc[position])
		}
		for (let param of params) {
			logger.addToReport("MissParam", funcLine, orginal = funcName, processed = param)
		}
	} else {
		logger.addToReport("JSDoc", funcLine, orginal = funcName)
	}
}

/** checkLineLength
This function which will take in a line and will validate the line number and 
implent line wrapping if needed
Parameters:
 @param type - the type of code decleration given in
 @param line - the line which will be check
 @param lineNum - the number of the line it is on in the codebase
*/
function checkLineLength(type, line, lineNum) {
	let limit = logger.c_rules["limits"]["column"];
	if (line.length <= limit) {
		return line;
	} else {
		if (logger.replace) {
			let split = line.split("=");
			if (type === "variable" && split[0].length <= limit && split[1].length <= limit) {
				return split[0] + "\n=" + split[1]
			} else {
				let mod = "";
				let current = "";
				let len = 0;
				let array = line.split(" ");
				let instring = false;
				let index = 0;
				while (index < array.length) {
					if (array[index].includes('"')) {
						instring = !instring
					}
					//if adding another element to the line doesn't cause it to go over
					if (len + array[index].length < limit) {
						// added + 1 for " "
						len += array[index].length + 1;
						//if element is an operation
						if (OPERATORS.includes(array[index])) {
							//if language roles say we should break before or after operation
							if (logger.c_rules["rules"]["breakBinarOperation"] === "After") {
								mod += current;
								current = array[index] + " ";
							} else {
								mod += current + array[index] + " ";
								current = "";
							}
						} else {
							current += array[index] + " ";
						}
					} else {
						if (instring) {
							mod += current + "\"" + " + " + "\n";
						} else {
              				mod += current + "\n";
            			}
						current = array[index] + " ";
						len = current.length;
					}
					index += 1
				}
				return mod + current + '\n';
			}
		}
		logger.report.addToReport("columnLength", lineNum)
  	}
}

function checkVarDecleration(array, language, lineNum, indentation) {
	let equalsIndex = array.indexOf("=")
	if (logger.g_rules["varDeclaration"].includes(array[0])) {
		if (language == "Javascript" && array[0] == "var") {
			array[0] = "let";
			logger.addToReport("Misc", lineNum, orginal = "Keyword var should not be used and replaced with let or const");
		}	
	}
	
	logger.namingChanges.set(array[equalsIndex - 1], checkNaming("variable", array[equalsIndex - 1], lineNum));
	array[equalsIndex - 1] = logger.namingChanges.get(array[equalsIndex - 1]);

	// Check if constant
	if (array[equalsIndex - 1].isUpperCase()) {
		logger.constants.push(array.join(" "));
		return "";
	}

	let subject = array.slice(equalsIndex + 1).join(" ");
	if (subject.count("\"") > 2 || subject.count("\'") > 2) {
		array.splice(equalsIndex + 1);
		array.push(convertToLiteral(subject, lineNum));
		return indentation.join("") + array.join(" ");
	}
	
	for (let index in array) {
		if (language === "Javascript") {
			if (array[index - 1] === "new" && array[index].startsWith("Array")) {
				array[index - 1] = "";
				array[index] = "[" + array[index].slice("Array(".length, array[index].indexOf(")")) + "];";
				logger.addToReport("Language", lineNum, orginal = "JS_ARRAY");
			}
		}
	}
	return array
}

/** checkLine
This function checks a given line for incorrect styling and will return a reformatted text
Parameters:
 @param language - A string which is the language the code is written in
 @param line - A string the content of the line which will be checked
 @param lineNum - An integer which is the number of the line 
 @param text - An array which conistr of the entire code text split by line
*/
function checkLine(language, line, lineNum, text) {
	// check for end of funtion line

	if (line[0] === "}" && line.trim().length === 2) {
		logger.exp_indentation = []
		if (text[lineNum + 1] && text[lineNum + 1].length) {
			return "}\n\n"
		}
		return "}\n";
	}
	
	if (line.includes(logger.importHeader) || line.includes(logger.constantHeader)) {
		return "";
	}
	
	if (line.length && line.trim() != "") {
		let indentation = [];
		let array = line.split(" ");
		while (array[0] == "") {
			indentation.push(" ")
			array.shift()
		}
		vscode.window.showInformationMessage("Array: " + array)

		if (line.includes("}")) {
			for (let i = 0; i < 4; i++) {
				logger.exp_indentation.pop();
				//vscode.window.showInformationMessage("Expected indentation: " + logger.exp_indentation.length)
			}
		}

		if (indentation.length !== logger.exp_indentation.length) {
			/*if (logger.replace) {
				indentation = logger.exp_indentation;
			}*/
			logger.addToReport("Indentation", lineNum);
		}

		if (array.includes(logger.g_rules["methodDeclaration"])) {
			const info = checkFuncNaming(array);
			checkJSDOC(text, lineNum, info[0], info[1]);  
			line = checkLineLength("function", logger.g_rules["methodDeclaration"] + " " + info[0] + "" + info[1].join(", ") + " {\n", lineNum);
			if (line !== array.join) {
				logger.addToReport("funcDec", lineNum);
			}
			return line
		} else if (array.includes("=")) {
			array = checkVarDecleration(array, language, lineNum, indentation)
		} else if (array[0] == "class") {
			array[1] = checkNaming("class", array[1], lineNum)
		} else if (array[0] == "import") {
			logger.imports.push(line);
			return "";
		} else {
			if (array.includes("return")) {
				let nextLine = (text[lineNum + 1]).split(" ")
				if (nextLine.includes("else") && !nextLine.includes("if")) {
					vscode.window.showInformationMessage('Shoudn\'t else after return');
					logger.addToReport("Misc", lineNum, "ElseReturn");
				}
			}
		}
		line = checkLineLength("variable", line, lineNum);

		for (let word in array) {
			let progress = "";
			let index = 0;
			while (index <= array[word].length) {
				progress += array[word][index]
				index += 1
				if (logger.namingChanges.get(progress) !== undefined) {
					array[word] = logger.namingChanges.get(progress) + array[word].slice(index);
					break;
				}

				if (language === "Javascript" && progress === "require(") {
					logger.imports.push(line)
					return "";
				}
			}

			if (language === "Javascript" && (array[word] === "==" || array[word] === "!=")) {
				array[word] += "="
			}
		}

		if (logger.c_rules["rules"]["semiColonAlways"]) {
			let last = array.at(-1);
			if (!last.endsWith(";") && !last.endsWith("{") && !last.endsWith("}") && 
			!last.endsWith("(") && !(text[lineNum + 1].trim()[0] === ".")) {
				array[array.length-1] = last + ";";
			}
			array[array.length-1] += "\n"
		}

		let newLine = indentation.join("") + array.join(" ");

		if (line.includes("{")) {
			for (let i = 0; i < 4; i++) {
				logger.exp_indentation.push(" ".repeat(4))
			}
		}

		let temp = "";
		let index = 0;
		const allowed = ["<", ">", "!", " ", "="];
		let opened = new Stack();
		while (index < newLine.length) {
			let element = newLine[index];
			if (logger.c_rules["rules"]["preferQuotes"] && (element === "\"" || element === "'")) {
				temp += logger.c_rules["rules"]["preferQuotes"];
			} else if ((element == ";" && index + 2 < newLine.length) || (element === "," && !opened.length)) {
				temp += ";\n" + indentation;
				if (logger.g_rules["varDeclaration"]) {
					temp += array[0] + " "
				}
				while (newLine[++index] === " ");
				continue;
			} else if (element === "(" || element === "[") {
				opened.push(element)
				temp += element
			} else if (element === ")" || element === "]") {
				opened.pop()
				temp += element
			} else if (!isNaN(parseInt(element)) && !array.includes("=")) {
				let num = "";
				while (!isNaN(parseInt(newLine[index]))) {
					temp += newLine[index];
					num += newLine[index++];
				}
				logger.addToReport("Misc", lineNum, orginal = `${num} should be defined`);
				continue;
			} else {
				temp += element
			}
			index++;
		}
		return temp
	}
	return line
}

function setup() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const text = editor.document.getText().split("\n");
		const language = determineLanguage(editor);
		const data = jsonData[language]
		logger.g_rules = data["general"]
		logger.c_rules = data["conventions"][logger.conventions]
		logger.importHeader = logger.g_rules["commenting"]["singleComment"].repeat(2) + " IMPORTS " + logger.g_rules["commenting"]["singleComment"].repeat(2)
		logger.constantHeader = logger.g_rules["commenting"]["singleComment"].repeat(2) + " CONSTANTS " + logger.g_rules["commenting"]["singleComment"].repeat(2)
		const settings = vscode.workspace.getConfiguration('nicify');
		logger.replace = settings.get("replace")
		logger.conventions = logger.conventions ? logger.conventions : settings.get("convention")
		return [editor, text, language, data]
	}
}

function editDocument(editor, document, text) {
	editor.edit(editBuilder => {
		const docLength = new vscode.Range(
			new vscode.Position(0, 0), 
			document.positionAt(document.getText().length)
		);
		editBuilder.replace(docLength, text);
		}).then(success => {
		if (success) {
			vscode.window.showInformationMessage('Document content replaced with correct style');
		} else {
			vscode.window.showErrorMessage('Failed to replace document content.');
		}
	});
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let commands = ["nicify.styleFix", "nicify.styleNaming"];
	const disposable = vscode.commands.registerCommand('nicify.styleFix', function () {
		const info = setup();
		const formatted_text = clangFormat(info[1]);
		vscode.window.showInformationMessage("Formatted Text: " + formatted_text)
		let new_text = [];
		for (let lineNum in formatted_text) {
			new_text.push(checkLine(info[2], formatted_text[parseInt(lineNum)], parseInt(lineNum), formatted_text));
		}
		if (logger.replace) {
			while (logger.constants.length) {
				new_text.splice(0, 0, logger.constants[0] + "\n");
				logger.constants.shift();
			}
			new_text.splice(0, 0, logger.constantHeader + "\n");
			while (logger.imports.length) {
				new_text.splice(0, 0, logger.imports[0] + "\n");
				logger.imports.shift();
			}
			new_text.splice(0, 0, logger.importHeader + "\n");
			new_text = new_text.join("")
			editDocument(info[0], info[0].document, new_text);
		}
		logger.createReport()
	});
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

function determineLanguage(editor) {
	if (editor.document.fileName.endsWith('.js')) {
		logger.conventions = "google";
		return "Javascript";
	} else if (editor.document.fileName.endsWith('.py')) {
		return "Python";
	} else if (editor.document.fileName.endsWith(".html")) {
		return "HTML";
	} else if (editor.document.fileName.endsWith(".c")) {
		return "C";
	} else if (editor.document.fileName.endsWith(".java")) {
		return "Java"
	} else if (editor.document.fileName.endsWith(".css")) {
		return "CSS"
	}
}

module.exports = {
	activate,
	deactivate
}

