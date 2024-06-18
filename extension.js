// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "nicify" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('nicify.helloWorld', function () {
		const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selection = editor.selection;

            const text = document.getText(selection);
			console.log(text);
        }
	});
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

function determineLanguage(text) {
	let array = text.split(" ");
	for (let word of array) {
		if (word == "elif" || word == "def") {
			return "Python";
		}
		if (word == "<!DOCTYPE") {
			return "HTML";
		}
		if  (word == "of" || word == "var" || word == "function") {
			return "Javascript";
		}
	}
}

module.exports = {
	activate,
	deactivate
}
