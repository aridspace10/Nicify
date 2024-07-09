// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const jsonData = require(path.resolve(__dirname, 'guide.json'));
const LOWER_CASE_EDGES = [65, 90];
const UPPER_CASE_EDGES = [97,122];

class Logger {
	constructor(convention) {
		this.namingChanges = new Map();
		this.report = {"naming": []};
		this.conventions = convention;
	}

	addToReport(typeChange, lineNum, orginal = "", processed = "") {
		if (typeChange == "Naming") {
			this.report["naming"].push("Changed ${orginal} to ${processed} to fit with naming conventions for ${logger.conventions} (declared at line: ${lineNum}");
		}
	}
	createReport() {
		let content = "";
		for (const key of this.report) {
			content += key + "\n"
			for (let change of this.report[key]) {
				content += change + "\n"
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

function checkCasing(type, name, namingRules, lineNum) {
	newName = "";
	if (namingRules[type] == "SnakeCasing") {
		// for every uppercase, lower it and put a _ before it
		for (let i = 1; i < name.length; i++) {
			if (name.charCodeAt(i) >= LOWER_CASE_EDGES[0] && name.charCodeAt(i) < LOWER_CASE_EDGES[1]) {
				newName += "_" + name[i].toLowerCase()
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

function checkNaming(type, name, namingRules, lineNum) {
	if (namingRules[type] == "LowerCamel" && name.charCodeAt(0) >= LOWER_CASE_EDGES[0] && name.charCodeAt(0) < LOWER_CASE_EDGES[1]) {
		name = String.fromCharCode(name.charCodeAt(0) + 32) + name.substring(1);
	}
	if (namingRules[type] == "UpperCamel" && name.charCodeAt(0) >= UPPER_CASE_EDGES[0] && name.charCodeAt(0) < LOWER_CASE_EDGES[1]) {
		name = String.fromCharCode(name.charCodeAt(0) - 32) + name.substring(1);
	}
	return checkCasing(type, name, namingRules, lineNum);
}

function checkFuncNaming(line, rules) {
	const chars = line.join(" ").split("")
	// finds name by looking for (, slicing the name from the chars and then turning it into a string
	let funcName = checkNaming("method", (chars.slice("function ".length, chars.indexOf("("))).join(""), rules);
	const raw_parameters = chars.slice(chars.indexOf("("));
	const params = [];
	let temp = "";
	for (let char of raw_parameters) {
		if (char == ",") {
			params.push(checkNaming("variable", temp, rules));
			temp = "";
		} else {
			temp += char
			if (char == ")") {
				params.push(checkNaming("variable", temp, rules));
				break;
			}
		}
	}
	return new [funcName, params]  
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

function checkJSDOC(text, commentingRules, funcLine, funcName) {
	if (text[lineNum-1].includes(commentingRules["singleComment"]) || 
			text[lineNum-1].includes(commentingRules["multiComment"][0]) || 
			text[lineNum-1].includes(commentingRules["multiComment"][1])) {
		let index = funcLine;
		while (text[index].startsWith(commentingRules["multiComment"][0])) {
			index -= 1;
		}
		let jsdoc = text.slice(index, funcLine).join(" ")
	} else {
		logger.addToReport("JSDoc", funcLine, orginal = funcName)
	}
}

function checkLine(language, line, varDeclarations, namingRules, commentingRules, lineNum, text) {
	// check for end of funtion line
	if (line[0] === "}" && line.length == 2) {
		return "}\n\n";
	}

	if (line.trim() != "") {
		let indentation = "";
		const array = line.split(" ");
		while (array[0] == "") {
			indentation += " "
			array.shift()
		}

		if (array[0] == "function" || (array[0] == "async" && array[1] == "function")) {
			const info = checkFuncNaming(array, namingRules)
			checkJSDOC(text, commentingRules, lineNum, funcName);
			return "function " + info[0] + "" + info[1].join(",") + " {\n";  
		} else if (varDeclarations.includes(array[0])) {
			if (language == "Javascript" && array[0] == "var") {
				array[0] = "let";
			}
			if (line[0] != " ") {
				//checkUse(array[1], text, lineNum)
			}
			logger.namingChanges.set(array[1], checkNaming("variable", array[1], namingRules, lineNum))
			array[1] = logger.namingChanges.get(array[1])
		} else if (array[0] == "class") {
			array[1] = checkNaming("class", array[1], namingRules, lineNum)
		}

		for (word in array) {
			if (logger.namingChanges.get(array[word]) !== undefined) {
				array[word] = logger.namingChanges.get(array[word])
			}
		} 

		let last = array[array.length - 1].slice(0,-1);
		if (!last.endsWith(";") && !last.endsWith("{") && !last.endsWith("}")) {
			array[array.length - 1] = last + ";\n";
		}

		let newLine = indentation + array.join(" ");
		let temp = ""
		let index = 0;
		const allowed = ["<", ">", "!", " ", "="];
		while (index < newLine.length) {
			if (newLine[index] == "=") {
				if (!allowed.includes(newLine[index-1])) {
					temp += " "
				}
				temp += "="
				if (!allowed.includes(newLine[index+1])) {
					temp += " "
				}
			} else {
				temp += newLine[index]
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
	commands = ["nicify.styleFix", "nicify.styleNaming"];
	const disposable = vscode.commands.registerCommand('nicify.styleFix', function () {
		const info = setup()
		let new_text = [];
		for (lineNum in info[1]) {
			new_text.push(checkLine(info[2], info[1][lineNum], info[3]["general"]["varDeclaration"], 
				info[3]["conventions"][logger.conventions]["naming"], 
				info[3]["general"]["commenting"], lineNum, info[1]))
		}
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

