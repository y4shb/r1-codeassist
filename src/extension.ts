// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Stream } from 'stream';
import * as vscode from 'vscode';
import ollama from 'ollama';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "r1-codeassist" is now active!');

	const disposable = vscode.commands.registerCommand('r1-codeassist.deepChat', () => {
		vscode.window.showInformationMessage('Initializing Deepseek Chat!');
		const panel = vscode.window.createWebviewPanel(
			'deepChat',
			'DeepSeek Chat',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		panel.webview.html = getWebViewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			if(message.command === 'chat'){
				const userPrompt = message.text;
				let responseText = '';

				try {
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:14b',
						messages: [{role: 'user', content: userPrompt}],
						stream: true
					});

					for await (const partialResponse of streamResponse) {
						responseText += partialResponse.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: responseText});
					}

				} catch (error) {
					console.log(`Error Occurred with DeepSeek Chat : ${error}`);
					vscode.window.showErrorMessage(`Error Occurred with DeepSeek Chat`);
				}
			}
		});

	});
}

// HTML Content for the Webview Panel
function getWebViewContent(): string {
	// Note - this *html comment is only to enable highlighting in vscode for the HTML String literal using the ES6 HTML extension 
	return /*html*/`
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>
			body { font-family: Helvetica, Arial, sans-serif; margin: 1rem;}
			#prompt { width: 100%; box-sizing: border-box; min-height: 200px; }
			#response { border: 1px solid #ccc; padding: 0.5rem; margin-top: 1rem; min-height: 200px; }
		</style>
	</head>
	<body>
		<h2>DeepSeek Chat</h2>
		<textarea id="prompt" rows="4" placeholder="Ask DeepSeek R1..."></textarea><br>
		<button id="askBtn">Ask</button>
		<div id="response"></div>
		<script>
			//connect to vscode API for messaging
			const vscode = acquireVsCodeApi();

			// listener for when Ask Button is clicked
			document.getElementById('askBtn').addEventListener('click', () => {
				const text = document.getElementById('prompt').value;
				vscode.postMessage({ command: 'chat', text });
			});

			//listener for ollama text
			window.addEventListener('message', event => {
				const { command, text } = event.data;
				if (command === 'chatResponse') {
					document.getElementById('response').innerText = text;
				}
			});

		</script>
	</body>`;
			
}

// This method is called when your extension is deactivated
export function deactivate() {}
