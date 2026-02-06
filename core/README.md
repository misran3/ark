# Core Module (in Python)

## Local Setup

1. Install Python 3.12 or higher.
2. Install uv from https://github.com/astral-sh/uv.
3. Setup Python virtual environment:
    ```bash
    cd core
    uv venv -p /path/to/python3.12
    ```
4. Activate the virtual environment:
    ```bash
    source .venv/bin/activate
    ```
5. Install dependencies:
    ```bash
    uv sync --all-packages
    ```
