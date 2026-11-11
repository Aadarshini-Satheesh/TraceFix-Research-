"""
Python AST Code Analysis Engine.
Extracts functions, classes, complexity metrics, call dependencies, and validates syntax.
"""
import ast
from pathlib import Path
from typing import Dict, List, Any, Optional

class CodeVisitor(ast.NodeVisitor):
    def __init__(self, filename: str, source_lines: List[str]):
        self.filename = filename
        self.source_lines = source_lines
        self.functions: List[Dict[str, Any]] = []
        self.classes: List[Dict[str, Any]] = []
        self.imports: List[str] = []
        self.current_class: Optional[str] = None

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            self.imports.append(alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        mod = node.module or ""
        for alias in node.names:
            self.imports.append(f"{mod}.{alias.name}")
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef):
        class_info = {
            "name": node.name,
            "lineno": node.lineno,
            "end_lineno": getattr(node, "end_lineno", node.lineno),
            "docstring": ast.get_docstring(node),
            "methods": []
        }
        self.classes.append(class_info)
        old_class = self.current_class
        self.current_class = node.name
        self.generic_visit(node)
        self.current_class = old_class

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self._record_function(node, is_async=False)
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self._record_function(node, is_async=True)
        self.generic_visit(node)

    def _record_function(self, node: Any, is_async: bool):
        # Calculate cyclomatic complexity approximation (branching nodes)
        branches = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.AsyncFor, ast.ExceptHandler, ast.With, ast.Assert)):
                branches += 1
            elif isinstance(child, ast.BoolOp):
                branches += len(child.values) - 1

        args = [a.arg for a in node.args.args]
        start_line = node.lineno
        end_line = getattr(node, "end_lineno", node.lineno)
        code_snippet = "\n".join(self.source_lines[start_line - 1:end_line])

        fn_data = {
            "name": node.name,
            "qualified_name": f"{self.current_class}.{node.name}" if self.current_class else node.name,
            "parent_class": self.current_class,
            "lineno": start_line,
            "end_lineno": end_line,
            "args": args,
            "docstring": ast.get_docstring(node),
            "complexity": branches,
            "is_async": is_async,
            "code": code_snippet
        }
        self.functions.append(fn_data)
        if self.current_class:
            for cls in self.classes:
                if cls["name"] == self.current_class:
                    cls["methods"].append(node.name)

class ASTAnalyzer:
    @staticmethod
    def parse_file(file_path: Path) -> Dict[str, Any]:
        """Parses a Python file and returns structured AST metadata."""
        if not file_path.exists() or not file_path.name.endswith(".py"):
            return {"error": "Invalid or missing Python file"}

        try:
            content = file_path.read_text(encoding="utf-8", errors="replace")
            source_lines = content.splitlines()
            tree = ast.parse(content, filename=str(file_path))
            
            visitor = CodeVisitor(file_path.name, source_lines)
            visitor.visit(tree)
            
            return {
                "file_path": str(file_path),
                "filename": file_path.name,
                "total_lines": len(source_lines),
                "functions": visitor.functions,
                "classes": visitor.classes,
                "imports": visitor.imports,
                "syntax_valid": True,
                "error": None
            }
        except SyntaxError as se:
            return {
                "file_path": str(file_path),
                "filename": file_path.name,
                "syntax_valid": False,
                "error": f"SyntaxError at line {se.lineno}: {se.msg}",
                "functions": [],
                "classes": [],
                "imports": []
            }
        except Exception as e:
            return {
                "file_path": str(file_path),
                "filename": file_path.name,
                "syntax_valid": False,
                "error": str(e),
                "functions": [],
                "classes": [],
                "imports": []
            }

    @staticmethod
    def validate_syntax(code_string: str) -> Dict[str, Any]:
        """Checks if a generated code string or patch is syntactically valid Python."""
        try:
            ast.parse(code_string)
            return {"valid": True, "error": None}
        except SyntaxError as se:
            return {
                "valid": False,
                "error": f"SyntaxError: line {se.lineno}, col {se.offset}: {se.msg}",
                "lineno": se.lineno,
                "offset": se.offset
            }

    @staticmethod
    def extract_function_slice(file_path: Path, function_name: str) -> Optional[Dict[str, Any]]:
        """Extracts exact source code slice for a given function."""
        meta = ASTAnalyzer.parse_file(file_path)
        if not meta.get("syntax_valid"):
            return None
        for fn in meta.get("functions", []):
            if fn["name"] == function_name or fn["qualified_name"] == function_name:
                return fn
        return None
