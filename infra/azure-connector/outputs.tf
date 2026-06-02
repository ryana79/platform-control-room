output "tenant_id" {
  description = "Tenant ID used by the Azure connector."
  value       = data.azurerm_client_config.current.tenant_id
}

output "subscription_id" {
  description = "Subscription ID read by the Azure connector."
  value       = data.azurerm_subscription.current.subscription_id
}

output "subscription_display_name" {
  description = "Azure subscription display name."
  value       = data.azurerm_subscription.current.display_name
}

output "visible_resource_count" {
  description = "Number of Azure resources visible to the connector identity."
  value       = length(data.azurerm_resources.visible.resources)
}

output "connector_tags" {
  description = "Standard tags used by connector-managed Azure resources."
  value       = local.connector_tags
}
