resource "azurerm_policy_definition" "require_tags" {
  name         = "${var.name}-require-tags"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Require AzurePlatform mandatory tags"

  policy_rule = jsonencode({
    if = {
      anyOf = [
        { field = "tags.owner", exists = "false" },
        { field = "tags.environment", exists = "false" },
        { field = "tags.cost_center", exists = "false" }
      ]
    }
    then = {
      effect = "deny"
    }
  })
}
