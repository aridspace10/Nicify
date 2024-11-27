const assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const {clangFormat, convertToLiteral} = require('../extension');

suite('1. Clang Formatting Testing', () => {
	vscode.window.showInformationMessage('Start all clang formatting tests.');
	// 1.1 Keyword spacing
	test('1.1.1 if keyword spacing', () => {
		assert.deepStrictEqual(clangFormat(["if(true) {"]), ["if (true) {"]);
	});
	test('1.1.2 for keyword spacing', () => {
		assert.deepStrictEqual(clangFormat(["for(true) {"]), ["for (true) {"]);
	});
	test('1.1.3 while keyword spacing', () => {
		assert.deepStrictEqual(clangFormat(["while(true) {"]), ["while (true) {"]);
	});
	test('1.1.4 if keyword spacing with space before brace', () => {
		assert.deepStrictEqual(clangFormat(["if (true){"]), ["if (true) {"]);
	});
	test('1.1.5 for keyword spacing with no space', () => {
		assert.deepStrictEqual(clangFormat(["for(true){"]), ["for (true) {"]);
	});

	// 1.2 Single operator spacing
	test('1.2.1 Single operator spacing with space before value', () => {
		assert.deepStrictEqual(clangFormat(["let num =5"]), ["let num = 5"]);
	});
	test('1.2.2 Single operator spacing with space after operator', () => {
		assert.deepStrictEqual(clangFormat(["let num= 5"]), ["let num = 5"]);
	});
	test('1.2.3 Single operator spacing with no spaces', () => {
		assert.deepStrictEqual(clangFormat(["let num=5"]), ["let num = 5"]);
	});

	// 1.3 Multi operator spacing
	test('1.3.1 Multi operator spacing with space before value', () => {
		assert.deepStrictEqual(clangFormat(["if (temp ==1) {"]), ["if (temp == 1) {"]);
	});
	test('1.3.2 Multi operator spacing with space after operator', () => {
		assert.deepStrictEqual(clangFormat(["if (temp== 1) {"]), ["if (temp == 1) {"]);
	});
	test('1.3.3 Multi operator spacing with no spaces', () => {
		assert.deepStrictEqual(clangFormat(["if (temp==1) {"]), ["if (temp == 1) {"]);
	});

	// 1.4 ; Use checking
	test('1.4.1 Semicolon spacing - trailing space', () => {
		assert.deepStrictEqual(clangFormat(["let var1 = 5 ;"]), ["let var1 = 5;"]);
	});
	test('1.4.2 Semicolon spacing - leading space', () => {
		assert.deepStrictEqual(clangFormat(["let var1 = 5; "]), ["let var1 = 5;"]);
	});
	test('1.4.3 Semicolon spacing - multiple spaces', () => {
		assert.deepStrictEqual(clangFormat(["let var1 = 5  ;  "]), ["let var1 = 5;"]);
	});

	// 1.5 Multivariable Declaration checking
	test('1.5.1 Multivariable declaration on the same line', () => {
		assert.deepStrictEqual(clangFormat(["let var1 = 5; let var2 = 10;"]), ["let var1 = 5;\nlet var2 = 10;"]);
	});
	test('1.5.2 Multiple declarations without space', () => {
		assert.deepStrictEqual(clangFormat(["let var1 = 5; let var2 = 10;let var3 = 2"]), ["let var1 = 5;\nlet var2 = 10;\nlet var3 = 2;"]);
	});
	test('1.5.3 Multivariable declaration with `const`', () => {
		assert.deepStrictEqual(clangFormat(["let var1 = 5; const var2 = 10;"]), ["let var1 = 5;\nconst var2 = 10;"]);
	});
});

suite("2. String literal Testing", () => {
	test("1.1.1 Simple", () => {assert.equal(convertToLiteral("\"Hello There!!!\""), "`Hello There!!!`")});
	test("1.1.2 Simple", () => {assert.equal(convertToLiteral("'Hello There!!!'"), "`Hello There!!!`")});
	test("1.2.1 Regular", () => {assert.equal(convertToLiteral("\"Hello \" + name \""), "`Hello ${name}")});
	test("", () => {});
	test("", () => {});
})

//test("", () => {});