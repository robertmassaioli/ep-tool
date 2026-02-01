let -- Define the specific record types we need
    EntityPropertyRecord = { entity : Text, propertyKey : Text, objectName : Text, value : Text }
in let AppPropertyRecord = { propertyKey : Text, objectName : Text, value : Text }

-- Define the condition leaf types
in let EntityPropertyCondition = { entity_property : EntityPropertyRecord }
in let AppPropertyCondition = { app_property : AppPropertyRecord }

-- Define the specific nested structure we need
in let NotEntityPropertyCondition = { not : EntityPropertyCondition }

-- Define our specific AND condition structure
in let AndConditionForOurUseCase = 
    { and : List (< NotEntityProperty : NotEntityPropertyCondition | AppProperty : AppPropertyCondition >) }

-- Define our specific OR condition structure  
in let OrConditionForOurUseCase = 
    { or : List (< EntityProperty : EntityPropertyCondition | AndCondition : AndConditionForOurUseCase >) }

in let entityPropertyDisplayConditions : OrConditionForOurUseCase = {
      or = [
        -- User explicitly enabled
        (< EntityProperty : EntityPropertyCondition | AndCondition : AndConditionForOurUseCase >).EntityProperty {
          entity_property = { 
            entity = "user", 
            propertyKey = "entity-properties-user-preference", 
            objectName = "enabled", 
            value = "true" 
          }
        },
        -- No user preference AND admin enabled
        (< EntityProperty : EntityPropertyCondition | AndCondition : AndConditionForOurUseCase >).AndCondition {
          and = [
            (< NotEntityProperty : NotEntityPropertyCondition | AppProperty : AppPropertyCondition >).NotEntityProperty {
              not = {
                entity_property = { 
                  entity = "user", 
                  propertyKey = "entity-properties-user-preference", 
                  objectName = "enabled", 
                  value = "true" 
                }
              }
            },
            (< NotEntityProperty : NotEntityPropertyCondition | AppProperty : AppPropertyCondition >).NotEntityProperty {
              not = {
                entity_property = { 
                  entity = "user", 
                  propertyKey = "entity-properties-user-preference", 
                  objectName = "enabled", 
                  value = "false" 
                }
              }
            },
            (< NotEntityProperty : NotEntityPropertyCondition | AppProperty : AppPropertyCondition >).AppProperty {
              app_property = { 
                propertyKey = "entity-properties-admin-config", 
                objectName = "defaultEnabled", 
                value = "true" 
              }
            }
          ]
        }
      ]
    }

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
      , displayConditions = entityPropertyDisplayConditions
      }
    ]
  , `jira:projectPage` =
    [ { icon = "resource:main;entity-properties-icon.svg"
      , key = "project-entity-properties"
      , resolver.function = "resolver"
      , resource = "main"
      , title = "Entity properties"
      , displayConditions = entityPropertyDisplayConditions
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
