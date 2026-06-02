from __future__ import annotations

import json
import os
from typing import Any

import httpx


DEFAULT_AI_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_AI_MODEL = "llama-3.3-70b-versatile"


def grok_available() -> bool:
    return bool(ai_api_key())


def enrich_deployment_spec(deployment_type: str, base_spec: dict[str, Any], answers: dict[str, Any]) -> dict[str, Any]:
    """Ask an OpenAI-compatible model to normalize intent, falling back to deterministic local behavior."""
    if not grok_available():
        return fallback_enrichment(deployment_type, base_spec, answers)

    prompt = {
        "deployment_type": deployment_type,
        "base_spec": base_spec,
        "answers": answers,
        "instruction": (
            "Return JSON only with keys summary and recommendations. "
            "Keep recommendations safe, Azure-focused, and avoid suggesting automatic apply."
        ),
    }
    try:
        with httpx.Client(timeout=30) as client:
            response = client.post(
                f"{ai_base_url()}/chat/completions",
                headers={"Authorization": f"Bearer {ai_api_key()}"},
                json={
                    "model": ai_model(),
                    "messages": [
                        {"role": "system", "content": "You are a concise Azure platform engineering assistant. Return valid JSON only."},
                        {"role": "user", "content": json.dumps(prompt)},
                    ],
                    "temperature": 0.2,
                },
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return {
                "available": True,
                "summary": parsed.get("summary", fallback_summary(deployment_type, base_spec, answers)),
                "recommendations": normalize_recommendations(parsed.get("recommendations"), deployment_type),
            }
    except Exception as exc:  # noqa: BLE001 - external AI should not break generation
        fallback = fallback_enrichment(deployment_type, base_spec, answers)
        fallback["recommendations"] = [*fallback["recommendations"], f"AI provider unavailable: {exc}"]
        return fallback


def ai_api_key() -> str | None:
    return os.getenv("AI_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("XAI_API_KEY")


def ai_base_url() -> str:
    return os.getenv("AI_BASE_URL") or ("https://api.x.ai/v1" if os.getenv("XAI_API_KEY") and not os.getenv("AI_API_KEY") and not os.getenv("GROQ_API_KEY") else DEFAULT_AI_BASE_URL)


def ai_model() -> str:
    return os.getenv("AI_MODEL") or os.getenv("GROQ_MODEL") or os.getenv("XAI_MODEL") or DEFAULT_AI_MODEL


def fallback_enrichment(deployment_type: str, base_spec: dict[str, Any], answers: dict[str, Any]) -> dict[str, Any]:
    return {
        "available": False,
        "summary": fallback_summary(deployment_type, base_spec, answers),
        "recommendations": fallback_recommendations(deployment_type),
    }


def normalize_recommendations(value: Any, deployment_type: str) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if item]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return fallback_recommendations(deployment_type)


def fallback_summary(deployment_type: str, base_spec: dict[str, Any], answers: dict[str, Any]) -> str:
    purpose = answers.get("purpose", "platform-managed Azure deployment")
    return f"Generate a {deployment_type.replace('_', ' ')} for {base_spec['name']} in {base_spec['region']} to support {purpose}."


def fallback_recommendations(deployment_type: str) -> list[str]:
    common = [
        "Use GitLab plan output as the approval checkpoint before apply.",
        "Keep Terraform state in Azure Storage with restricted access.",
        "Require owner, environment, cost center, and data classification tags.",
    ]
    if deployment_type == "linux_vm":
        return [*common, "Use the smallest acceptable VM SKU and destroy it after demos."]
    if deployment_type == "storage_account":
        return [*common, "Disable public blob access and prefer private endpoints for production."]
    return common
