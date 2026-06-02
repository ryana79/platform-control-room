from __future__ import annotations

import os
from typing import Any
from urllib.parse import quote

import httpx


def gitlab_configured() -> bool:
    return bool(os.getenv("GITLAB_TOKEN") and os.getenv("GITLAB_PROJECT_ID"))


def push_generated_files(branch: str, files: dict[str, str], commit_message: str) -> dict[str, Any]:
    if not gitlab_configured():
        return {
            "ok": False,
            "configured": False,
            "branch": branch,
            "message": "GitLab is not configured. Set GITLAB_TOKEN and GITLAB_PROJECT_ID to enable live pushes.",
            "details": {},
        }

    base_url = os.getenv("GITLAB_BASE_URL", "https://gitlab.com").rstrip("/")
    project_id = os.environ["GITLAB_PROJECT_ID"]
    project_path = quote_project(project_id)
    token = os.environ["GITLAB_TOKEN"]
    headers = {"PRIVATE-TOKEN": token}

    with httpx.Client(base_url=f"{base_url}/api/v4", headers=headers, timeout=30) as client:
        project = client.get(f"/projects/{project_path}")
        project.raise_for_status()
        project_json = project.json()
        default_branch = project_json.get("default_branch") or "main"

        create_branch_if_needed(client, project_path, branch, default_branch)

        actions = [
            {
                "action": "update" if file_exists(client, project_path, branch, path) else "create",
                "file_path": path,
                "content": content,
                "encoding": "text",
            }
            for path, content in files.items()
        ]
        commit = client.post(
            f"/projects/{project_path}/repository/commits",
            json={"branch": branch, "commit_message": commit_message, "actions": actions},
        )
        commit.raise_for_status()
        commit_json = commit.json()
        return {
            "ok": True,
            "configured": True,
            "branch": branch,
            "message": "Generated Terraform pipeline pushed to GitLab.",
            "web_url": commit_json.get("web_url"),
            "details": {"project": project_json.get("web_url"), "commit": commit_json.get("id")},
        }


def create_branch_if_needed(client: httpx.Client, project_path: str, branch: str, ref: str) -> None:
    response = client.get(f"/projects/{project_path}/repository/branches/{quote(branch, safe='')}")
    if response.status_code == 200:
        return
    if response.status_code != 404:
        response.raise_for_status()

    created = client.post(f"/projects/{project_path}/repository/branches", params={"branch": branch, "ref": ref})
    created.raise_for_status()


def file_exists(client: httpx.Client, project_path: str, branch: str, path: str) -> bool:
    encoded_path = quote(path, safe="")
    response = client.get(f"/projects/{project_path}/repository/files/{encoded_path}", params={"ref": branch})
    if response.status_code == 200:
        return True
    if response.status_code == 404:
        return False
    response.raise_for_status()
    return False


def quote_project(project_id: str) -> str:
    return quote(project_id, safe="")
