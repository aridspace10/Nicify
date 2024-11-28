/* eslint-disable no-undef */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const jsonData = require(path.resolve(__dirname, 'guide.json'));
const UPPER_CASE_EDGES = [65, 90];
const LOWER_CASE_EDGES = [97, 122];
const OPERATORS = ["=",">","+","-","*","/","%", "**", "&&", "||"];
const MULTIPLESELECTORSTEXT = "We have found two selectors of the same type, what would you like to do?";
const MULTIPLESELECTORSCHOICES = ["Merge"];
const MERGECONFLICTTEXT = "We have found two field which are the same, what would you like to do?"
const ELEMENTNONINDENT = ["<p>"]

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
        this.language = "";
		this.report = {"naming": [], "Misc": [], "Format": []};
		this.conventions = "";
		this.starts = new Map()
		this.imports = [];
		this.constants = [];
		this.replace = true;
		this.exp_indentation = 0;
        this.unused = [];
	}

	addToReport(typeChange, lineNum, original = "", processed = "") {
		switch (typeChange) {
			case "Naming":
				if (logger.replace) {
					this.report["naming"].push(`Changed ${original} to ${processed} to fit with naming conventions for ${logger.conventions} (declared at line: ${lineNum}`);
				} else {
					this.report["naming"].push(`You should change ${original} to ${processed} to fit with naming conventions for ${logger.conventions} (declared at line: ${lineNum}`);
				}
			case "Misc":
				this.report["Misc"].push(`${original} (declared at line: ${lineNum})`);
			case "Literal":
				if (this.replace) {
					this.report["Misc"].push(`Changed string ${original} to ${processed} to be a string literal (declared at line: ${lineNum})`);
				} else {
					this.report["Misc"].push(`Should change string ${original} to ${processed} to be a string literal (declared at line: ${lineNum})`);
				}
			case "funcDec":
				if (logger.replace) {
					this.report["naming"].push(`Changed function ${original} to ${processed} (declared at line: ${lineNum})`);
				} else {
					this.report["naming"].push(`Should change function ${original} to ${processed} (declared at line: ${lineNum})`);
				}
			case "language":
				if (original === "JS_ARRAY") {
					if (logger.replace) {
						this.report["language"].push(`Changed use of new Array() to [] as forbidden (declared at line: ${lineNum})`);
					} else {
						this.report["language"].push(`Replace use of new Array() to [] as forbidden (declared at line: ${lineNum})`);
					}
				} 
            case "unused":
                this.report["Misc"].push(`Consider removing the ${original} named ${processed} as it has not been used (declared at line: ${lineNum})`);
            case "Format":
                this.report["Format"].push(`Adjust as ${original} (declared at line: ${lineNum})`);
			}
        
	}
	createReport() {
		let content = "";
        for (const [key, changes] of Object.entries(this.report)) {
            content += `${key}\n`;
            for (let change of changes) {
                content += `${change}\n`;
            }
        }
		try {
			fs.writeFileSync('HelloThere.txt', content);
			console.log('File created and data written!');
		} catch (err) {
			console.error('Error creating file:', err);
		}
	}
}

const logger = new Logger();

String.prototype.isUpperCase = function() {
	return [...this].every((char) => {
		return char.charCodeAt(0) >= UPPER_CASE_EDGES[0] && char.charCodeAt(0) < UPPER_CASE_EDGES[1];
	})
}

String.prototype.isLowerCase = function() {
	return [...this].every((char) => {
		return char.charCodeAt(0) >= LOWER_CASE_EDGES[0] && char.charCodeAt(0) < LOWER_CASE_EDGES[1];
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

String.prototype.nextChar = function(start = 0) {
	while (this[start] === " ") {
		start++;
		if (start === this.length - 1) {
			return -1;
		}
	}
	return start;
}

/**
 * Like the included function but for nested array 
 * @param {*} str - the str we are testing
 * @param {*} index - the index of the nested array we want to test
 * @returns 
 */
String.prototype.includes_nested = function(str, index) {
    for (let x of this) {
        if (x[index] == str) {
            return x;
        }
    }
    return false;
}

function clangFormat(text) {
	const formatted_text = [];
    let lineNum = 1;
	for (let line of text) {
		let index = 0;
		let modified = "";
		let charFound = false;
		let len = line.length;
		let indentation = [];
		let opened = new Stack();
		while (index < len) {
			let element = line[index];
			if (!charFound) {
				if (element === " ") {
					indentation.push(" ");
					index++;
				} else {
					charFound = true;
				}
		 	} else if (len > index + 2 && line.substr(index, 2) === "if" && line[index + 2] !== " ") {
				modified += "if ";
				index += 2;
                logger.addToReport("Format", lineNum, "Keywords (if) require space after it");
			} else if (len > index + 3 && line.substr(index, 3) === "for" && line[index + 3] !== " ") {
				modified += "for ";
				index += 3;
                logger.addToReport("Format", lineNum, "Keywords (for) require space after it");
			} else if (len > index + 5 && line.substr(index, 5) === "while" && line[index + 5] !== " ") {
				modified += "while ";
				index += 5;
                logger.addToReport("Format", lineNum, "Keywords (while) require space after it");
			} else if (element === ";") {
                while (modified[-1] === " ") {
                    modified.slice(0, -1);
                }
                index++;
                modified += ";";
                while (len > index) {
                    if (line[index] === " ") {
                        index++;
                    } else if (line[index] === "/") {
                        modified += " " + line;
                        index = len;
                        break
                    } else {
                        modified += "\n";
                        logger.addToReport("Format", lineNum, "Only one statement per line")
                        break
                    }
                }
			} else if (OPERATORS.includes(element)) {
				if (line[index-1] !== " ") {
          			modified += " ";
                    logger.addToReport("Format", lineNum, "Spacing needed between operator");
				}
				while (OPERATORS.includes(line[index])) {
					modified += line[index++];
				}
				if (line[index] !== " ") {
					modified += " ";
                    logger.addToReport("Format", lineNum, "Spacing needed between operator");
				}
			} else if (element !== " " && line[index+1] === "{") { // checks for ){
				modified += element + " ";
				index++;
                logger.addToReport("Format", lineNum, "Spacing needed between ) and {");
			} else if (element === "}" && line[index + 1] !== " ") { // checks for }if
				modified += "} ";
				index++;
                logger.addToReport("Format", lineNum, "Spacing needed between } and any str");
			} else if ((element == ";" && index + 2 < len) || (element === "," && !opened.length)) {
				modified += ";\n" + indentation.join("");
				if (logger.g_rules["varDeclaration"]) {
					modified += line.split(" ")[0] + " ";
				}
				while (line[++index] === " ");
				continue;
			} else if (element === "(" || element === "[") {
				opened.push(element);
				modified += element;
				index++;
			} else if (element === ")" || element === "]") {
				opened.pop();
				modified += element;
				index++;
			} else {
				modified += line[index++];
			}
		}
		formatted_text.push(" ".repeat(indentation) + modified.trim());
        lineNum += 1;
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
	let instring;
	let opened;
	let mod = "`";
	if (str[0] === "\"" || str[0] === "'") {
		instring = true;
	} else {
		mod += "${";
		index -= 1;
		instring = false;
	}
	opened = !instring;
	str.forEach((char, index) => {
		if (char === ";") {
			return mod + "\`;\n";
		}
		if (char === "\"" || char === "'") {
      		instring = !instring;
		} else if (instring) {
			mod += str[index];
		} else {
			if (char === "+") {
				if (!opened) {
					mod += "${";
					opened = true;
				} else {
					mod += "}";
					opened = false;   
				}
			} else if (char !== " ") {
				mod += str[index];
			}
		}
	});
	if (opened) {
		mod += "}"
	}
	mod += "`";
	logger.addToReport("Literal", lineNum, str, mod);
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
	let namingRules = logger.c_rules["naming"];
	if (namingRules[type] === "SnakeCasing") {
		// for every uppercase, lower it and put a _ before it
		for (let i = 1; i < name.length; i++) {
			if (name[i].isUpperCase()) {
				newName += "_" + name[i].toLowerCase();
			} else {
				newName += name[i];
			}
		}
	} else {
        // For every _, remove it and uppercase the following letter
		for (let i = 0; i < name.length; i++) {
			if (name[i] === "_") {
				while (name[i] === "_") {i++};
				newName += name[i].toUpperCase();
			} else {
				newName += name[i];
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
	let namingRules = logger.c_rules["naming"];
	if (namingRules[type] === "LowerCamel" && name[0].isLowerCase()) {
		name = String.fromCharCode(name.charCodeAt(0) + 32) + name.substring(1);
	}
	if (namingRules[type] === "UpperCamel" && name[0].isUpperCase()) {
		name = String.fromCharCode(name.charCodeAt(0) - 32) + name.substring(1);
	}
	return checkCasing(type, name, lineNum);
}
/* checkFuncNaming
This function checks the naming of function and also the parameters given in
*/
function checkFuncNaming(line, lineNum) {
	const chars = line.join(" ").split("");
	// finds name by looking for (, slicing the name from the chars and then turning it into a string
	let funcName = checkNaming("method", (chars.slice("function ".length, chars.indexOf("("))).join(""));
    logger.unused.push(["Function", lineNum, funcName])
	const raw_parameters = chars.slice(chars.indexOf("("));
	const params = [];
	let temp = "";
    // For each char, if "," then add to parameters else add to progress
	for (let char of raw_parameters) {
		if (char === ",") {
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

/** Checks JSDOC given works with format
 * @param {*} text - the text of the jsdoc 
 * @param {*} funcLine - the line the text starts at
 * @param {*} funcName - the name of the function
 * @param {*} params - the params of the function
 */
function checkJSDOC(text, funcLine, funcName, params) {
    console.log("HERE")
	let commentingRules = logger.g_rules["commenting"];
	if (funcLine && text[funcLine-1].includes(commentingRules["singleComment"]) || 
		text[funcLine-1].includes(commentingRules["multiLineComment"][0]) || 
		text[funcLine-1].includes(commentingRules["multiLineComment"][1])) 
	{
		let index = funcLine;
		while (!text[index].startsWith(commentingRules["multiLineComment"][0])) {
			index -= 1;
		}
		let jsdoc = text.slice(index, funcLine).join(" ");
		let position = 0;
		while (true) {
			position = jsdoc.indexOf("@param", position);
			// if no more @parmas exist
			if (position === -1) {
				break;
			}
			// includes all except for the parameter found
			params = params.filter(item => item !== jsdoc[position]);
		}
		for (let param of params) {
			logger.addToReport("MissParam", funcLine, orginal = funcName, processed = param);
		}
        return "";
	} else {
        logger.addToReport("JSDoc", funcLine, orginal = funcName);
        if (logger.replace) {
            return `/** Description \n${params.map(param => `* @param {type} ${param} - Description of variable '${param}' \n`).join("")}*/ \n`;
        }
	}
}

/** checkLineLength
This function which will take in a line and will validate the line number and 
implent line wrapping if needed
Parameters:
 @param {string} type - the type of code decleration given in
 @param {string} line - the line which will be check
 @param {number} lineNum - the number of the line it is on in the codebase
*/
function checkLineLength(type, line, lineNum) {
	let limit = logger.c_rules["limits"]["column"];
	if (line.length <= limit) {
		return line;
	} else {
		if (logger.replace) {
			let split = line.split("=");
			if (type === "variable" && split[0].length <= limit && split[1].length <= limit) {
				return split[0] + "\n=" + split[1];
			} else {
				let mod = "";
				let current = "";
				let len = 0;
				let array = line.split(" ");
				let instring = false;
				let index = 0;
				while (index < array.length) {
					if (array[index].includes('"')) {
						instring = !instring;
					}
					//if adding another element to the line doesn't cause it to go over
					if (len + array[index].length < limit) {
						// added + 1 for " "
						len += array[index].length + 1;
						//if element is an operation
						if (OPERATORS.includes(array[index]) || array[index] === ".") {
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
					index += 1;
				}
				return mod + current + '\n';
			}
		}
		logger.report.addToReport("columnLength", lineNum);
  	}
}

function checkVarDecleration(array, language, lineNum, indentation) {
	let equalsIndex = array.indexOf("=");
    //check if language is includes variable decleration
	if (logger.g_rules["varDeclaration"].includes(array[0])) {
		if (language == "Javascript" && array[0] == "var") {
			array[0] = "let";
			logger.addToReport("Misc", lineNum, original = "Keyword var should not be used and replaced with let or const");
		}	
	}
	
    if (logger.namingChanges.get(array[equalsIndex - 1]) !== null) {
        if (logger.unused.includes_nested(array[equalsIndex - 1], 2)) {
            let index = logger.unused.indexOf(array[equalsIndex - 1]);
            logger.unused.splice(index, index + 1);
        }
    } else {
        // add variable to naming changes to keep track of naming changes and change as needed
        logger.namingChanges.set(array[equalsIndex - 1], checkNaming("variable", array[equalsIndex - 1], lineNum));
        logger.unused.push(["Variable", lineNum, array[equalsIndex - 1]]);
        array[equalsIndex - 1] = logger.namingChanges.get(array[equalsIndex - 1]);
    }

	// Check if constant
	if (array[equalsIndex - 1].isUpperCase()) {
		logger.constants.push(array.join(" "));
		return "";
	}

	// check for use of not using template literal
	let subject = array.slice(equalsIndex + 1).join(" ");
	if (subject.count("\"") > 2 || subject.count("\'") > 2) {
		array.splice(equalsIndex + 1);
		array.push(convertToLiteral(subject, lineNum));
		return " ".repeat(indentation) + array.join(" ");
	}
	
    // check for language specific problems of each word
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
		logger.exp_indentation = 0;
		if (text[lineNum + 1] && text[lineNum + 1].length) {
			return "}\n\n";
		}
		return "}\n";
	}
	
	if (line.includes(logger.importHeader) || line.includes(logger.constantHeader)) {
		return "";
	}
	if (line && line.trim() !== "") {
		let indentation = 0;
		while (line[0] === " ") {
			indentation += 1;
			line.shift();
		}
        let array = line.split(" ");

		if (line.includes("}")) {
			logger.exp_indentation -= 4
		}

		if (indentation !== logger.exp_indentation) {
            console.log("Wrong Indentation");
			if (logger.replace) {
				indentation = logger.exp_indentation;
			}
			logger.addToReport("Indentation", lineNum);
		}

		if (array.includes(logger.g_rules["methodDeclaration"])) {
			const info = checkFuncNaming(array, lineNum);
			line = checkJSDOC(text, lineNum, info[0], info[1]) + checkLineLength("function", 
                logger.g_rules["methodDeclaration"] + " " + info[0] + "" + info[1].join(", ") + " {\n", lineNum);
			if (line !== array.join) {
				logger.addToReport("funcDec", lineNum);
			}
			return line
		} else if (array.includes("=")) {
			array = checkVarDecleration(array, language, lineNum, indentation);
		} else if (array[0] === "class") {
			array[1] = checkNaming("class", array[1], lineNum);
            logger.unused.push(["Class", lineNum, array[1]]);
		} else if (array[0] === "import") {
			logger.imports.push(line);
			return "";
		} else {
			if (array.includes("return")) {
				let nextLine = (text[lineNum + 1]).split(" ");
				if (nextLine.includes("else") && !nextLine.includes("if")) {
					vscode.window.showInformationMessage('Shoudn\'t else after return');
					logger.addToReport("Misc", lineNum, "ElseReturn");
				}
			}
		}

		line = checkLineLength("variable", line, lineNum);

		for (let word in array) {
			let progress = "";
            for (let i = 0; i < array[word].length; i++) {
                const element = array[word][i];
                progress += element;
            
                if (logger.namingChanges.get(progress) !== undefined) {
                    array[word] = logger.namingChanges.get(progress);
                    break
                }
            
                if (language === "Javascript" && progress === "require(") {
                    logger.imports.push(line);
                    return "";  // Exits the function
                }
            
                if (progress === "//") {
                    return " ".repeat(indentation) + array.join(" ") + "\n";
                }
            }

			if (language === "Javascript" && (array[word] === "==" || array[word] === "!=")) {
				array[word] += "=";
			}
		}


		if (logger.c_rules["rules"]["semiColonAlways"]) {
			let last = array.at(-1);
			// check if there should be a ; added at the end 
			if (!last.endsWith(";") && !last.endsWith("{") && !last.endsWith("}") && 
			!last.endsWith("(") && text.length > lineNum + 1 && !(text[lineNum + 1].trim()[0] === ".")) {
				array[array.length-1] = last + ";";
			}
			array[array.length-1] += "\n";
		}

		let newLine = " ".repeat(indentation < 0 ? 0 : indentation) + array.join(" ");

		if (line.includes("{")) {
			logger.exp_indentation += 4;
		}

		let temp = "";
		let index = 0;
		while (index < newLine.length) {
			let element = newLine[index];
			if (logger.c_rules["rules"]["preferQuotes"] && (element === "\"" || element === "'")) {
				temp += logger.c_rules["rules"]["preferQuotes"];
			} else if (!isNaN(parseInt(element)) && !array.includes("=")) {
				let num = "";
				while (!isNaN(parseInt(newLine[index]))) {
					temp += newLine[index];
					num += newLine[index++];
				}
				logger.addToReport("Misc", lineNum, orginal = `${num} should be defined`);
				continue;
			} else {
				temp += element;
			}
			index++;
		}
		return temp;
	}
	return line;
}

function determineFieldType(field) {
    const BOXTYPE = [""];
    const TYPOGRAPHYTYPE = ["color", "font-size"];
    if (field.startsWith("margin") || field.startsWith("padding")) {
        return 0;
    } else if (TYPOGRAPHYTYPE.includes(field)) {
        return 1;
    } else {
        return 2;
    }
}

async function styleCSS(text) {
    const processed = new Map();
    let cur = [[], [], []]
    let key = "";
    let lineNum = 0;
    for (const line of text) { // Can't use await in forEach
        let firstChar = line.nextChar();
        if (line.includes(":")) { // if a field
            let lst = line.split(":");
            cur[determineFieldType(lst[0].trim())].push([lst[0].trim(), lst[1].trim()]);
            if (line.indexOf(firstChar) != 4) { // if there is not an indentation of 4
                logger.addToReport("indententation", lineNum, line.indexOf(firstChar), 4);
            }
        } else if (line.includes("{")) { // if the start of a selector
            key = line.split("{")[0].trim();
            if (line.indexOf(firstChar)) { // if there is an indentation
                logger.addToReport("indententation", lineNum, line.indexOf(firstChar), 0);
            }
        } else if (line.includes("}")) { // if the end of the selector
            if (line.indexOf(firstChar)) { // if there is an indentation
                logger.addToReport("indententation", lineNum, line.indexOf(firstChar), 0);
            }

            // if the selector has already been used
            if (processed.get(key)) {
                let old = processed.get(key);
                let choice = await vscode.window.showQuickPick(MULTIPLESELECTORSCHOICES, {placeHolder: MULTIPLESELECTORSTEXT});
                if (choice == "Merge") {
                    for (let element of old) {
                        if (!cur.filter(type => type.includes_nested(element[0], 0)).length) { // if the both selector don't use the same field
                            cur[determineFieldType(element[0])].push(element);
                        } else {
                            let options = [`1. Pick ${element[1]}`, `2. Pick ${temp[1]}`];
                            choice = await vscode.window.showQuickPick(options, {placeHolder: MERGECONFLICTTEXT});
                            if (choice[0] == 1) {
                                let index = determineFieldType(element[0]);
                                cur[index].splice(cur.indexOf(temp), 1);
                                cur[index].push(element);
                            } // Nothing needed to be done if pick option 2 
                        }
                    }
                }
            }
            processed.set(key, cur[0].concat(cur[1]).concat(cur[2]));
            cur = [[], [], []];
        }
        lineNum++;
    };
    let new_text = "";
    processed.forEach((value, key) => {
        new_text += `${key} {\n${value.map(element => `    ${element[0]}: ${element[1]}\n`).join("")}}\n\n`;
    });
    return new_text;
}

async function styleHTML(text) {
    let exp_indentation = 0;
    let lineNum = 0;
    let processed = "";
    const inCSS = [];
    if (text[0] !== "<!DOCTYPE html>") {
        processed = "<!DOCTYPE html>\n";
    }
    for (const line of text) {
        let arr = line.trim().split(" ");
        if (inCSS) {
            if (arr.includes("</style>")) {
                inCSS.shift(); //remove placeholder empty string
                processed += styleCSS(inCSS);
                inCSS = "";
            } else {
                inCSS.push(line);
            }
            continue
        }
        let indentation = line.nextChar();
        if (indentation !== -1 && indentation !== exp_indentation) {
            logger.addToReport("indententation", lineNum, indentation, exp_indentation);
        }
        if (arr[0][1] != "h" && !ELEMENTNONINDENT.includes_nested(arr[0])) {
            exp_indentation += 4;
        } else if (arr[0][1] != "h" && !ELEMENTNONINDENT.includes_nested(arr[0].toSpliced(1, 1))) {
            exp_indentation -= 4;
        }
        if (arr[0].startsWith("<div>")) {
            logger.addToReport("warning", lineNum, "Consider using semantic elements such <nav>, <body>, <main> etc");
        }
        if (arr[0].startsWith("<style>")) {
            inCSS.push(""); // start looking for the end of the CSS
        }
        lineNum++;
        processed += " ".repeat(exp_indentation) + line.trim() + "\n";
    };
    return processed
}

function setup() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const text = editor.document.getText().split("\n");
		logger.language = determineLanguage(editor);
        if (logger.language !== "CSS") {
            const data = jsonData[logger.language];
            logger.g_rules = data["general"];
            logger.c_rules = data["conventions"][logger.conventions];
            logger.importHeader = logger.g_rules["commenting"]["singleComment"].repeat(2) + " IMPORTS " + logger.g_rules["commenting"]["singleComment"].repeat(2);
            logger.constantHeader = logger.g_rules["commenting"]["singleComment"].repeat(2) + " CONSTANTS " + logger.g_rules["commenting"]["singleComment"].repeat(2);
            const settings = vscode.workspace.getConfiguration('nicify');
            logger.replace = settings.get("replace");
            logger.conventions = logger.conventions ? logger.conventions : settings.get("convention");
            return [editor, text, data];
        } else {
            return [editor, text];
        }
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
async function activate(context) {
	let commands = ["nicify.styleFix", "nicify.styleNaming"];
	const disposable = vscode.commands.registerCommand('nicify.styleFix', async function () {
		const info = setup();
        if (logger.language !== "UNKNOWN") {
            let new_text = "";
            if (logger.language === "HTML") {
                new_text = await styleHTML(info[1]);
            } else if (logger.language === "CSS") {
                new_text = await styleCSS(info[1])
            } else {
                const formatted_text = clangFormat(info[1]);
                let new_text = [];
                for (let lineNum in formatted_text) {
                    new_text.push(checkLine(info[2], formatted_text[parseInt(lineNum)], parseInt(lineNum), formatted_text));
                }
                if (logger.replace) {
                    logger.constants.sort()
                    while (logger.constants.length) {
                        new_text.splice(0, 0, logger.constants[0] + "\n");
                        logger.constants.shift();
                    }
                    new_text.splice(0, 0, logger.constantHeader + "\n");
                    logger.imports.sort()
                    while (logger.imports.length) {
                        new_text.splice(0, 0, logger.imports[0] + "\n");
                        logger.imports.shift();
                    }
                    new_text.splice(0, 0, logger.importHeader + "\n");
                    new_text = new_text.join("");
                    
                }
                logger.unused.forEach(variable => logger.addToReport("unused", 0, "", variable));
            }
            if (logger.replace) {
                editDocument(info[0], info[0].document, new_text);
            }
            logger.createReport();
        } else {
            vscode.window.showInformationMessage('Unknown Document Used');
        }
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
		return "Java";
	} else if (editor.document.fileName.endsWith(".css")) {
		return "CSS";
	} else {
        return "UNKNOWN";
    }
}

module.exports = {
	activate,
	deactivate,
	clangFormat,
	convertToLiteral
}
