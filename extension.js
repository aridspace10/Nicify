// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

function readJSON() {
	const filePath = path.resolve(__dirname, 'guide.json');
	fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) {
		  console.error('Error reading the file:', err);
		  return;
		}
		try {
		  const jsonData = JSON.parse(data);
		  return jsonData;
		} catch (err) {
		  console.error('Error parsing JSON:', err);
		}
	});
}

function checkNaming(line, varDeclarations, namingRules) {
	const array = line.split(" ")
	if (array[0] in varDeclarations) {
		if (namingRules["variable"] == "LowerCamel" && array[1].charCodeAt(0) >= 65 && array[1].charCodeAt(0) < 90) {
			array[1] = String.fromCharCode(array[1].charCodeAt(0) + 32) + array[1].substr(1)
		}
		if (namingRules["variable"] == "UpperCamel" && array[1].charCodeAt(0) >= 97 && array[1].charCodeAt(0) < 122) {
			array[1] = String.fromCharCode(array[1].charCodeAt(0) - 32) + array[1].substr(1)
		}
	}
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "nicify" is now active!');
	const jsonData = readJSON();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('nicify.helloWorld', function () {
		const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            /*const selection = editor.selection;
            const text = document.getText(selection);*/
			const text = document.getText();
			const language = determineLanguage(editor);
			vscode.window.showInformationMessage('The language is ' + language);
        }
	});
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

function determineLanguage(editor) {
	if (editor.document.fileName.endsWith('.js')) {
		return "Javascript"
	} else if (editor.document.fileName.endsWith('.py')) {
		return "Python"
	} else if (editor.document.fileName.endsWith(".html")) {
		return "HTML"
	}
}

module.exports = {
	activate,
	deactivate
}

