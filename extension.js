// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');
const jsonData = require(path.resolve(__dirname, 'guide.json'));

function checkCasing(type, name, namingRules) {
	newName = "";
	if (namingRules[type] == "SnakeCasing") {
		for (let i = 1; i < name.length; i++) {
			if (name.charCodeAt(i) >= 65 && name.charCodeAt(i) < 90) {
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
	return newName;
}

function checkNaming(type, name, namingRules) {
	if (namingRules[type] == "LowerCamel" && name.charCodeAt(0) >= 65 && name.charCodeAt(0) < 90) {
		name = String.fromCharCode(name.charCodeAt(0) + 32) + name.substring(1);
	}
	if (namingRules[type] == "UpperCamel" && name.charCodeAt(0) >= 97 && name.charCodeAt(0) < 122) {
		name = String.fromCharCode(name.charCodeAt(0) - 32) + name.substring(1);
	}
	vscode.window.showInformationMessage('Hello ' + name);
	return checkCasing(type, name, namingRules);
}

function checkLine(language, line, varDeclarations, namingRules) {
	const array = line.split(" ");
	if (varDeclarations.includes(array[0])) {
		if (language == "Javascript" && array[0] == "var") {
			array[0] = "let";
		}
		array[1] = checkNaming("variable", array[1], namingRules)
	}
	let last = array[array.length - 1].slice(0,-1);
	if (!last.endsWith(";") && !last.endsWith("{") && !last.endsWith("}")) {
		array[array.length - 1] = last + ";\n";
	}
	return array.join(" ");
}

function checkFunc(text, rules) {
	const lines = text.split("\n");
	let count = 0;
	while (count < lines.length) {
		const line = lines[count].split(" ")
		if (line[0] == "function") {
			const chars = line.split("")
			// finds name by looking for (, slicing the name from the chars and then turning it into a string
			let funcName = checkNaming("method", (chars.slice(0, chars.indexOf("(") + 1)).join(""), rules["naming"]);
			const raw_parameters = chars.slice(chars.indexOf("("));
			const params = [];
			let temp = "";
			for (let char of chars) {
				if (char == ",") {
					params.push(checkNaming("variable", temp, rules["naming"]));
					temp = "";
				} else {
					temp += char
					if (char != ")") {
						break;
					}
				}
			}
			lines[count] = "function " + funcName + "(" + params.join(" , ") + ") {  ";  
		}
	}
}

function setup() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const text = document.getText().split("\n");
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
		let new_text = "";
		for (line of info[1]) {
			new_text += checkLine(info[2], line, info[3]["general"]["varDeclaration"], info[3]["conventions"]["google"]["naming"])
		}
		new_text = new_text.substring(0, new_text.length - 1)
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
	}
}

module.exports = {
	activate,
	deactivate
}

