data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "this" {
  name                       = substr(replace(var.name, "-", ""), 0, 24)
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = true
  tags                       = var.tags
}
