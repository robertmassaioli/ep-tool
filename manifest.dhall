let -- Shared display condition types and logic
    ConditionParams = { entity : Optional Text, propertyKey : Text, objectName : Text, value : Text }
in let LeafCondition = { condition : Text, params : ConditionParams }
in let BranchCondition = { condition : Text, conditions : List LeafCondition }
in let TopCondition = { condition : Text, conditions : List BranchCondition }
in let -- Shared display conditions for entity property modules
      entityPropertyDisplayConditions =
      [ { condition = "or"
        , conditions =
          [ { condition = "and"
            , conditions =
              [ { condition = "entity_property_equal"
                , params = { entity = Some "user", propertyKey = "entity-properties-user-preference", objectName = "enabled", value = "true" }
                } : LeafCondition
              ]
            } : BranchCondition
          , { condition = "and"
            , conditions =
              [ { condition = "entity_property_not_exists"
                , params = { entity = Some "user", propertyKey = "entity-properties-user-preference", objectName = "", value = "" }
                } : LeafCondition
              , { condition = "app_property_equal"
                , params = { entity = None Text, propertyKey = "entity-properties-admin-config", objectName = "defaultEnabled", value = "true" }
                } : LeafCondition
              ]
            } : BranchCondition
          , { condition = "and"
            , conditions =
              [ { condition = "entity_property_equal"
                , params = { entity = Some "user", propertyKey = "entity-properties-user-preference", objectName = "enabled", value = "null" }
                } : LeafCondition
              , { condition = "app_property_equal"
                , params = { entity = None Text, propertyKey = "entity-properties-admin-config", objectName = "defaultEnabled", value = "true" }
                } : LeafCondition
              ]
            } : BranchCondition
          ]
        } : TopCondition
      ]

in { app =
  { id = "ari:cloud:ecosystem::app/1c0636dd-b020-48a5-b68b-0d3f2fe06134"
  , runtime.name = "nodejs20.x"
  }
, modules =
  { function = [ { handler = "index.handler", key = "resolver" } ]
  , `jira:globalPage` =
    [ { icon = "resource:main;entity-properties-icon.svg"
      , key = "entity-properties-global"
      , pages =
        [ { route = "user", title = "User entity properties" }
        , { route = "issue-type", title = "Issue Type entity properties" }
        , { route = "dashboard-items"
          , title = "Dashboard Item entity properties"
          }
        , { route = "workflow-transitions"
          , title = "Workflow Transition entity properties"
          }
        , { route = "user-preferences", title = "User Preferences" }
        ]
      , resolver.function = "resolver"
      , resource = "main"
      , title = "Entity properties"
      }
    ]
  , `jira:issuePanel` =
    [ { icon = "resource:main;entity-properties-icon.svg"
      , key = "issue-entity-properties"
      , resolver.function = "resolver"
      , resource = "main"
      , title = "Entity properties"
      , conditions = entityPropertyDisplayConditions
      }
    ]
  , `jira:projectPage` =
    [ { icon = "resource:main;entity-properties-icon.svg"
      , key = "project-entity-properties"
      , resolver.function = "resolver"
      , resource = "main"
      , title = "Entity properties"
      , conditions = entityPropertyDisplayConditions
      }
    ]
  , `jira:adminPage` =
    [ { icon = "resource:main;entity-properties-icon.svg"
      , key = "entity-properties-admin"
      , resolver.function = "resolver"
      , resource = "main"
      , title = "Entity Property Tool Settings"
      , useAsConfig = True
      }
    ]
  }
, permissions =
  { content.styles = [ "unsafe-inline" ]
  , scopes =
    [ "read:jira-work"
    , "write:jira-work"
    , "manage:jira-project"
    , "read:jira-user"
    , "manage:jira-configuration"
    ]
  }
, resources =
  [ { key = "main", path = "static/hello-world/build", tunnel.port = 3001 } ]
}
