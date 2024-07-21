// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const jsonData = require(path.resolve(__dirname, 'guide.json'));
const UPPER_CASE_EDGES = [65, 90];
const LOWER_CASE_EDGES = [97, 122];
const OPERATORS = ["+","-","*","/","%", "**"];

class Logger {
	constructor(convention) {
		this.namingChanges = new Map();
		this.report = {"naming": []};
		this.conventions = convention;
		this.starts = new Map()
		this.imports = [];
		this.constants = [];
	}

	addToReport(typeChange, lineNum, orginal = "", processed = "") {
		if (typeChange == "Naming") {
			this.report["naming"].push("Changed ${orginal} to ${processed} to fit with naming conventions for ${logger.conventions} (declared at line: ${lineNum}");
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
		fs.writeFile("demo.txt", content, "utf8", (error, data) => {
			console.log("Write complete");
			console.log(error);
			console.log(data);
		});
	}
}

const logger = new Logger("google");

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

function convertToLiteral(str) {
	let index = 1;
	let mod = "\'";
	while (index < str.length) {
		if (str[index] == "\"" || str[index] == "\'") {
			if (index + 1 === str.length) {
				mod += "\'"
			} else {
				mod += "{"
				while (str[index].toUpperCase() == str[index].toLowerCase()) {
					index += 1
				}
				while (str[index] != " ") {
					mod += str[index]
					index += 1  
				}
				mod += "}"
				while (str[index] != "\"") {
					index += 1
				}
			}
		} else {
			mod += str[index]
		}
	}
	return mod
}

function checkCasing(type, name, lineNum) {
	newName = "";
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
		} else {
			temp += char
			if (char == ")") {
				params.push(checkNaming("variable", temp));
				break;
			}
		}
	}
	return [funcName, params];
}
function checkWhiteSpaces(language, line) {
	let index = 0;
	let new_line = "";
	while (index != line.length) {
		if (["+","=","-"].includes(line[index])) {
			if (line[index - 1] != " ") {
				new_line += " "
			}
			new_line += line[index]
			if (line[index + 1] != " ") {
				new_line += " "
			}
		} else {
			new_line += line[index]
		}
		index++;
	}
	return new_line
}

function checkSpacing(line) {
	let modified = "";
	for (let i in line) {
		let index = line[i].indexOf("=")
		if (index === -1 || line[i] == "=") {
			modified += line[i]
		} else {
			if (index === 0) {
				modified += "= " + line[i].slice(1)
			} else if (index == line[i].length - 1) {
				modified += line[i].slice(0, line[i].length - 1) + " ="
			}
		}
	}
}

function checkJSDOC(text, funcLine, funcName, params) {
	let commentingRules = logger.g_rules["commenting"];
	if (text[lineNum-1].includes(commentingRules["singleComment"]) || 
		text[lineNum-1].includes(commentingRules["multiLineComment"][0]) || 
		text[lineNum-1].includes(commentingRules["multiLineComment"][1])) 
	{
		let index = funcLine;
		while (!text[index].startsWith(commentingRules["multiLineComment"][0])) {
			index -= 1;
		}
		let jsdoc = text.slice(index, funcLine).join(" ")
		let position = 0;
		while (jsdoc.indexOf("@param", position) !== -1) {
			params.filter(item => item !== jsdoc[indexOf("@param", position)+1])
		}
		for (param of params) {
			logger.addToReport("MissParam", funcLine, orginal = funcName, processed = param)
		}
	} else {
		logger.addToReport("JSDoc", funcLine, orginal = funcName)
	}
}

function checkLineLength(type, line) {
	let limit = logger.c_rules["limits"]["column"];
	if (line.length <= limit) {
		return line;
	} else {
		let split = line.split("=")
		if (type === "variable" && split[0].length <= limit && split[1].length <= limit) {
			return split[0] + "\n=" + split[1]
		} else {
			let mod = "";
			let current = "";
			let array = line.split(" ");
			let index = 0;
			while (index < array.length) {
				if ((current + array[index]).length < limit) {
					if (OPERATORS.includes(array[index])) {
						if (logger.c_rules["rules"]["breakBinarOperation"] === "After") {
							mod += current;
							current = array[index] + " ";
						} else {
							mod += current + array[index] + " "
							current = "";
						}
					} else {
						current += array[index] + " "
					}
				} else {
					console.log("HEY");
					mod += current + "\n";
					current = array[index];
				}
        		index += 1
			}
			return mod
    	}
  	}
}

function checkLine(language, line, lineNum, text) {
	// check for end of funtion line
	if (line[0] === "}" && line.length == 2) {
		return "}\n\n";
	}
	
	if (line.includes(logger.importHeader) || line.includes(logger.constantHeader)) {
		return "";
	}
	
	if (line.length && line.trim() != "") {
		let indentation = "";
		const array = line.split(" ");
		while (array[0] == "") {
			indentation += " "
			array.shift()
		}

		let maxLineLength = logger.c_rules["limits"]["column"]
		if (array[0] == logger.g_rules["methodDeclaration"] || (array[0] == "async" && array[1] == logger.g_rules["methodDeclaration"])) {
			const info = checkFuncNaming(array);
			checkJSDOC(text, lineNum, info[0], info[1]);
			line = logger.g_rules["methodDeclaration"] + " " + info[0] + "" + info[1].join(",") + " {\n";  
			if (line.length > maxLineLength) {
				if (line.slice(line.indexOf("(")).length < maxLineLength) {
					line = line.slice(0, line.indexOf("(")) + "\n" + indentation + line.slice(line.indexOf("(") + 1);
				}
			}
			return line
		} else if (array.includes("=")) {
			let equalsIndex = array.indexOf("=")
			if (logger.g_rules["varDeclaration"].includes(array[0])) {
				if (language == "Javascript" && array[0] == "var") {
					array[0] = "let";
				}	
			}
			logger.namingChanges.set(array[equalsIndex - 1], checkNaming("variable", array[equalsIndex - 1], lineNum));
			array[equalsIndex - 1] = logger.namingChanges.get(array[equalsIndex - 1]);
			// Check if constant
			if (array[equalsIndex - 1].isUpperCase()) {
				logger.constants.push(array.join(" "));
				return "";
			}
			
			for (let index in array) {
				if (language === "Javascript") {
					if (array[index - 1] === "new" && array[index].startsWith("Array")) {
						array[index - 1] = "";
						array[index] = "[" + array[index].slice("Array(".length, array[index].indexOf(")")) + "];";
					}
					if (!logger.c_rules["rules"]["multiVarDeclaration"]) {
						array[index] = array[index].replace(",", ";\n" + array[0])
					}
				}
			}

			if (line.length > maxLineLength) {
				if (array.slice(3).join(" ").length < maxLineLength) {
					array[2] = "= \n";
				}
			}
		} else if (array[0] == "class") {
			array[1] = checkNaming("class", array[1], lineNum)
		} else if (array[0] == "import") {
			logger.imports.push(line)
			return "";
		}

		for (word in array) {
			let progress = "";
			let index = 0;
			while (index <= array[word].length) {
				progress += array[word][index]
				index += 1
				if (logger.namingChanges.get(progress) !== undefined) {
					array[word] = logger.namingChanges.get(progress) + array[word].slice(index);
					break;
				}
			}
		}
		if (logger.c_rules["rules"]["semiColonAlways"]) {
			let last = array[array.length - 1].slice(0,-1);
			if (!last.endsWith(";") && !last.endsWith("{") && !last.endsWith("}")) {
				array[array.length - 1] = last + ";\n";
			}
		}

		let newLine = indentation + array.join(" ");
		let temp = "";
		let index = 0;
		const allowed = ["<", ">", "!", " ", "="];
		while (index < newLine.length) {
			let element = newLine[index];
			if (element == "=") {
				if (!allowed.includes(newLine[index-1])) {
					temp += " ";
				}
				temp += "=";
				if (!allowed.includes(newLine[index+1])) {
					temp += " ";
				}
			} else if (element === "\"") {
				temp += "\'";
			} else if (element === ";" && index + 1 !== newLine.length) {
				temp += ";\n";
				if (newLine[index+1] === " ") {
					index++;
				}
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
		if (!(logger.conventions in data)) {
			vscode.window.showErrorMessage('Failed to replace document content.');
			process.exit();
		}
		logger.g_rules = data["general"]
		logger.c_rules = data["conventions"][logger.conventions]
		logger.importHeader = logger.g_rules["commenting"]["singleComment"].repeat(2) + " IMPORTS " + logger.g_rules["commenting"]["singleComment"].repeat(2)
		logger.constantHeader = logger.g_rules["commenting"]["singleComment"].repeat(2) + " CONSTANTS " + logger.g_rules["commenting"]["singleComment"].repeat(2)
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
	logger.createReport()
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	commands = ["nicify.styleFix", "nicify.styleNaming"];
	const disposable = vscode.commands.registerCommand('nicify.styleFix', function () {
		const info = setup()
		let new_text = [];
		for (lineNum in info[1]) {
			new_text.push(checkLine(info[2], info[1][lineNum], lineNum, info[1]));
		}
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
	});
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

function determineLanguage(editor) {
	if (editor.document.fileName.endsWith('.js')) {
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

