"""
Stack Trace Parser for Evidence-Driven Debugging.
Extracts structured execution frames, isolates repository files, and identifies failure points.
"""
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

FRAME_PATTERN = re.compile(
    r'File\s+["\'](?P<file>.+?)["\'],\s+line\s+(?P<line>\d+)(?:,\s+in\s+(?P<func>.+))?'
)
EXCEPTION_PATTERN = re.compile(
    r'^(?P<type>[a-zA-Z0-9_.]+(?:Error|Exception|Exit|Interrupt|Warning)):\s*(?P<msg>.*)$'
)

class StackTraceParser:
    @staticmethod
    def parse_traceback(raw_trace: str, repo_root: Optional[Path] = None) -> Dict[str, Any]:
        """Parses a raw python traceback into structured frames and exception details."""
        if not raw_trace or not raw_trace.strip():
            return {
                "has_trace": False,
                "frames": [],
                "exception_type": None,
                "exception_message": None,
                "primary_suspect": None
            }

        lines = raw_trace.strip().splitlines()
        frames: List[Dict[str, Any]] = []
        exception_type: Optional[str] = None
        exception_message: Optional[str] = None

        i = 0
        while i < len(lines):
            line = lines[i].strip()
            frame_match = FRAME_PATTERN.search(line)
            if frame_match:
                file_path_str = frame_match.group("file")
                line_no = int(frame_match.group("line"))
                func_name = frame_match.group("func") or "<module>"
                
                # Check next line for source snippet if available
                snippet = ""
                if i + 1 < len(lines) and not lines[i + 1].strip().startswith("File "):
                    snippet = lines[i + 1].strip()
                    i += 1

                is_repo_file = True
                if "site-packages" in file_path_str or "lib/python" in file_path_str.replace("\\", "/"):
                    is_repo_file = False
                elif repo_root and not file_path_str.startswith(str(repo_root)):
                    is_repo_file = False

                frames.append({
                    "file_path": file_path_str,
                    "filename": Path(file_path_str).name,
                    "line": line_no,
                    "function": func_name,
                    "snippet": snippet,
                    "is_repo_file": is_repo_file
                })
            else:
                exc_match = EXCEPTION_PATTERN.match(line)
                if exc_match:
                    exception_type = exc_match.group("type")
                    exception_message = exc_match.group("msg")
            i += 1

        # Determine primary suspect frame (deepest frame inside repository)
        repo_frames = [f for f in frames if f["is_repo_file"]]
        primary_suspect = repo_frames[-1] if repo_frames else (frames[-1] if frames else None)

        return {
            "has_trace": len(frames) > 0,
            "frames": frames,
            "exception_type": exception_type,
            "exception_message": exception_message,
            "primary_suspect": primary_suspect,
            "total_frames": len(frames),
            "repo_frames_count": len(repo_frames)
        }
