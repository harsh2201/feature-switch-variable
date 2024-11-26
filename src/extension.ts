import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const decorationType = vscode.window.createTextEditorDecorationType({});

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.logVariable",
      (variableName: string, lineNumber: number) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const document = editor.document;
          const line = document.lineAt(lineNumber);
          const text = line.text;
          const commentMatch = text.match(/\/\/\s*(.*)/);
          const comment = commentMatch ? commentMatch[1] : "";

          const logStatement = `console.log('${variableName}: ${comment}', ${variableName});\n`;
          editor.edit((editBuilder) => {
            editBuilder.insert(
              new vscode.Position(lineNumber + 1, 0),
              logStatement
            );
          });
        }
      }
    )
  );

  function updateDecorations() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const cursorPosition = editor.selection.active;
    const lineText = editor.document.lineAt(cursorPosition.line).text;
    const regex = /\b(const|let|var)\s+(\w+)/;
    const match = lineText.match(regex);

    const decorations: vscode.DecorationOptions[] = [];

    if (match) {
      const variableName = match[2];
      const startPos = new vscode.Position(
        cursorPosition.line,
        lineText.length
      );
      const range = new vscode.Range(startPos, startPos);

      const markdownString = new vscode.MarkdownString();
      markdownString.isTrusted = true;

      const decoration: vscode.DecorationOptions = {
        range,
        renderOptions: {
          after: {
            contentText: " [Log]",
            color: "#8fc3fe",
            // fontStyle: "italic",
            // textDecoration: "underline",
          },
        },
        hoverMessage: markdownString.appendMarkdown(
          `[Log ${variableName}](command:extension.logVariable?${encodeURIComponent(
            JSON.stringify([variableName, cursorPosition.line])
          )})`
        ),
      };
      decorations.push(decoration);
    }

    editor.setDecorations(decorationType, decorations);
  }

  vscode.window.onDidChangeActiveTextEditor(
    updateDecorations,
    null,
    context.subscriptions
  );
  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (event.document === vscode.window.activeTextEditor?.document) {
        updateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  vscode.window.onDidChangeTextEditorSelection(
    (event) => {
      if (event.textEditor === vscode.window.activeTextEditor) {
        updateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  updateDecorations();
}
