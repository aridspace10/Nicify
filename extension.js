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

function increment_count(map, str) {
	if (!map.get(str)) {
		map.set(str, 1)
	} else {
		map.set(str, map.get(str) + 1)
	}
	return map
}

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
