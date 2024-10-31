const assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const {clangFormat, convertToLiteral} = require('../extension');

suite('1. Clang Formatting Testing', () => {
	vscode.window.showInformationMessage('Start all clang formatting tests.');

	test('1.1 Keyword spacing', () => {
		assert.deepStrictEqual(clangFormat(["if(true) {"]), ["if (true) {"]);
		assert.deepStrictEqual(clangFormat(["for(true) {"]), ["for (true) {"]);
		assert.deepStrictEqual(clangFormat(["while(true) {"]), ["while (true) {"]);
		assert.deepStrictEqual(clangFormat(["if (true){"]), ["if (true) {"]);
		assert.deepStrictEqual(clangFormat(["for(true){"]), ["for (true) {"]);
	});

	test('1.2 Single operator spacing', () => {
		assert.deepStrictEqual(clangFormat(["let num =5"]), ["let num = 5"])
		assert.deepStrictEqual(clangFormat(["let num= 5"]), ["let num = 5"])
		assert.deepStrictEqual(clangFormat(["let num=5"]), ["let num = 5"])
	})

	test("1.3 Multi operator spacing", () => {
		assert.deepStrictEqual(clangFormat(["if (temp ==1) {"]), ["if (temp == 1) {"])
		assert.deepStrictEqual(clangFormat(["if (temp== 1) {"]), ["if (temp == 1) {"])
		assert.deepStrictEqual(clangFormat(["if (temp==1) {"]), ["if (temp == 1) {"])
	})

    test("1.4 ; Use checking", () => {
        assert.deepStrictEqual(clangFormat(["let var1 = 5 ;"]), ["let var1 = 5;"])
		assert.deepStrictEqual(clangFormat(["let var1 = 5; "]), ["let var1 = 5;"])
		assert.deepStrictEqual(clangFormat(["let var1 = 5  ;  "]), ["let var1 = 5;"])
    })

    test("1.5 Multivariable Declaration checking", () => {
        assert.deepStrictEqual(clangFormat(["let var1 = 5; let var2 = 10;"]), ["let var1 = 5;\nlet var2 = 10;"])
		assert.deepStrictEqual(clangFormat(["let var1 = 5; let var2 = 10;let var3 = 2"]), ["let var1 = 5;\nlet var2 = 10;\nlet var3 = 2;"])
		assert.deepStrictEqual(clangFormat(["let var1 = 5; const var2 = 10;"]), ["let var1 = 5;\nconst var2 = 10;"])
    })
});

suite("2. String literal Testing", () => {
	test("1.1.1 Simple", () => {assert.equal(convertToLiteral("\"Hello There!!!\""), "`Hello There!!!`")});
	test("1.1.2 Simple", () => {assert.equal(convertToLiteral("'Hello There!!!'"), "`Hello There!!!`")});
	test("1.2.1 Regular", () => {assert.equal(convertToLiteral("\"Hello \" + name \""), "`Hello ${name}")});
	test("", () => {});
	test("", () => {});
})

//test("", () => {});