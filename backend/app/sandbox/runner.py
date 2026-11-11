"""
Isolated Execution Sandbox Engine for TraceFix Research.
Runs test suites and reproduction tests strictly on E: drive copies with process tree timeouts.
"""
import os
import sys
import shutil
import uuid
import time
import subprocess
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from ..config import settings

class SandboxResult:
    def __init__(
        self,
        success: bool,
        exit_code: int,
        passed_count: int,
        failed_count: int,
        error_count: int,
        total_count: int,
        duration_ms: float,
        stdout: str,
        stderr: str,
        test_details: List[Dict[str, Any]],
        timed_out: bool = False
    ):
        self.success = success
        self.exit_code = exit_code
        self.passed_count = passed_count
        self.failed_count = failed_count
        self.error_count = error_count
        self.total_count = total_count
        self.duration_ms = duration_ms
        self.stdout = stdout
        self.stderr = stderr
        self.test_details = test_details
        self.timed_out = timed_out

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "exit_code": self.exit_code,
            "passed_count": self.passed_count,
            "failed_count": self.failed_count,
            "error_count": self.error_count,
            "total_count": self.total_count,
            "duration_ms": self.duration_ms,
            "stdout": self.stdout,
            "stderr": self.stderr,
            "test_details": self.test_details,
            "timed_out": self.timed_out
        }

class TestSandbox:
    @staticmethod
    def create_sandbox_workspace(source_repo: Path) -> Path:
        """Copies source repo into an isolated directory under E:/.cache/sandbox_runs/"""
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        sandbox_path = settings.SANDBOX_DIR / run_id
        sandbox_path.mkdir(parents=True, exist_ok=True)

        if source_repo.is_dir():
            # Copy all files ignoring git and caches
            shutil.copytree(
                source_repo,
                sandbox_path,
                dirs_exist_ok=True,
                ignore=shutil.ignore_patterns(".git", "__pycache__", ".pytest_cache", "venv", "*.pyc")
            )
        return sandbox_path

    @staticmethod
    def cleanup_sandbox(sandbox_path: Path):
        """Safely removes the ephemeral sandbox directory."""
        try:
            if sandbox_path.exists():
                shutil.rmtree(sandbox_path, ignore_errors=True)
        except Exception:
            pass

    @classmethod
    def run_tests(
        cls,
        repo_path: Path,
        test_file: Optional[str] = None,
        patch_file: Optional[str] = None,
        patch_content: Optional[str] = None,
        timeout_seconds: Optional[int] = None
    ) -> SandboxResult:
        """
        Executes pytest in an isolated sandbox clone of repo_path.
        Applies patch_content to patch_file if provided.
        """
        timeout = timeout_seconds or settings.SANDBOX_TIMEOUT_SECONDS
        sandbox = cls.create_sandbox_workspace(repo_path)
        start_time = time.time()

        try:
            # Apply patch to sandbox clone if specified
            if patch_file and patch_content is not None:
                target_file_path = sandbox / patch_file
                target_file_path.parent.mkdir(parents=True, exist_ok=True)
                target_file_path.write_text(patch_content, encoding="utf-8")

            # Environment variables for execution: ensure temp paths stay on E:
            env = os.environ.copy()
            env["TEMP"] = str(settings.TEMP_DIR)
            env["TMP"] = str(settings.TEMP_DIR)
            env["PYTHONPATH"] = str(sandbox)
            env["PYTHONDONTWRITEBYTECODE"] = "1"

            # Construct pytest command
            python_bin = settings.PYTHON_EXECUTABLE
            if not Path(python_bin).exists():
                python_bin = sys.executable

            cmd = [python_bin, "-m", "pytest", "-v"]
            if test_file:
                cmd.append(test_file)

            process = subprocess.Popen(
                cmd,
                cwd=str(sandbox),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=env,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )

            timed_out = False
            try:
                stdout, stderr = process.communicate(timeout=timeout)
                exit_code = process.returncode
            except subprocess.TimeoutExpired:
                timed_out = True
                if os.name == 'nt':
                    subprocess.call(['taskkill', '/F', '/T', '/PID', str(process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    process.kill()
                stdout, stderr = process.communicate()
                exit_code = -1

            duration_ms = round((time.time() - start_time) * 1000, 2)
            parsed = cls._parse_pytest_output(stdout, stderr, exit_code)
            
            return SandboxResult(
                success=(exit_code == 0 and parsed["failed_count"] == 0 and not timed_out),
                exit_code=exit_code,
                passed_count=parsed["passed_count"],
                failed_count=parsed["failed_count"],
                error_count=parsed["error_count"],
                total_count=parsed["total_count"],
                duration_ms=duration_ms,
                stdout=stdout,
                stderr=stderr,
                test_details=parsed["details"],
                timed_out=timed_out
            )

        finally:
            cls.cleanup_sandbox(sandbox)

    @staticmethod
    def _parse_pytest_output(stdout: str, stderr: str, exit_code: int) -> Dict[str, Any]:
        """Parses standard pytest -v terminal output."""
        passed = 0
        failed = 0
        errors = 0
        details: List[Dict[str, Any]] = []

        lines = (stdout + "\n" + stderr).splitlines()
        for line in lines:
            stripped = line.strip()
            if "::" in stripped:
                parts = stripped.split()
                test_ident = parts[0]
                status = "PASSED" if "PASSED" in stripped else ("FAILED" if "FAILED" in stripped else ("ERROR" if "ERROR" in stripped else "UNKNOWN"))
                
                if status == "PASSED":
                    passed += 1
                elif status == "FAILED":
                    failed += 1
                elif status == "ERROR":
                    errors += 1

                details.append({
                    "test": test_ident,
                    "status": status,
                    "raw": stripped
                })

        total = passed + failed + errors
        # Fallback if pytest formatted summary without test names
        if total == 0 and exit_code == 0:
            passed = 1
            total = 1
        elif total == 0 and exit_code != 0:
            failed = 1
            total = 1

        return {
            "passed_count": passed,
            "failed_count": failed,
            "error_count": errors,
            "total_count": total,
            "details": details
        }
