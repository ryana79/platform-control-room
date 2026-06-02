package azureplatform.terraform

deny[msg] {
  input.resource.azurerm_kubernetes_cluster[_].default_node_pool[0].vm_size == "Standard_D16s_v5"
  msg := "Expensive VM SKU Standard_D16s_v5 requires platform approval"
}

deny[msg] {
  resource := input.resource[_][_]
  not resource.tags.owner
  msg := "Azure resources must include owner tag"
}
