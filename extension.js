// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const FILE = 'guide.json';

function readJSON() {
	const filePath = path.resolve(__dirname, FILE);
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

function checkCasing(type, name, namingRules) {
	newName = "";
	if (namingRules[type] == "SnakeCasing") {
		for (let i = 1; i < name.length; i++) {
			if (name.charCodeAt(i) >= 65 && name.charCodeAt(i) < 90) {
				newName += "_" + name[i].toLowerCase()
			}
		}
	} else {
		for (let i = 0; i < name.length - 1; i++) {
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


function checkNaming(language, line, varDeclarations, namingRules) {
	const array = line.split(" ");
	if (array[0] in varDeclarations) {
		if (language == "Javascript" && array[0] == "var") {
			array[0] = "let";
		}
		if (namingRules["variable"] == "LowerCamel" && array[1].charCodeAt(0) >= 65 && array[1].charCodeAt(0) < 90) {
			array[1] = String.fromCharCode(array[1].charCodeAt(0) + 32) + array[1].substr(1);
		}
		if (namingRules["variable"] == "UpperCamel" && array[1].charCodeAt(0) >= 97 && array[1].charCodeAt(0) < 122) {
			array[1] = String.fromCharCode(array[1].charCodeAt(0) - 32) + array[1].substr(1);
		}
		array[1] = checkCasing("variable", array[1], namingRules);
		return array.join(" ");
	}
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Congratulations, your extension "nicify" is now active!');
	const jsonData = readJSON();
	const disposable = vscode.commands.registerCommand('nicify.helloWorld', function () {
		const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            /*const selection = editor.selection;
            const text = document.getText(selection);*/
			const text = document.getText().split("\n");
			let new_text = ""
			//const language = jsonData[determineLanguage(editor)];
			const language = jsonData["Javascript"]
			for (line of text) {
				new_text += checkNaming("Javascript", line, language["general"]["varDeclaration"], language["conventions"]["google"]["naming"])
			}
			vscode.window.showInformationMessage('The language is ' + language);
			editor.edit(editBuilder => {
				const docLength = new vscode.Range(
				  document.positionAt(0), 
				  document.positionAt(text.length)
				);
				editBuilder.replace(docLength, new_text);
			  }).then(success => {
				if (success) {
				  vscode.window.showInformationMessage('Document content replaced with correct style');
				} else {
				  vscode.window.showErrorMessage('Failed to replace document content.');
				}
			});
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

