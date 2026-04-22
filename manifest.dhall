let -- Define the proper Forge display conditions structure using Connect property names
    entityPropertyDisplayConditions = {
      or = {
        -- Case 1: User explicitly enabled - New Forge object format
        entityPropertyEqualTo = {
          entity = "user",
          propertyKey = "ep-tool.enabled-for-me",
          objectName = "enabled",
          value = "true"
        },
        
        -- Case 2: User explicitly enabled - Old Connect boolean format (using double negative)
        not = {
          not = {
            entityPropertyEqualTo = {
              entity = "user",
              propertyKey = "ep-tool.enabled-for-me",
              value = "true"
            }
          }
        },
        
        -- Case 3: No user preference AND admin allows  
        and = {
          not = {
            entityPropertyExists = {
              entity = "user",
              propertyKey = "ep-tool.enabled-for-me"
            }
          },
          or = {
            -- Admin explicitly enabled - New Forge object format
            entityPropertyEqualTo = {
              entity = "app",
              propertyKey = "ep-tool.disabled-for-all",
              objectName = "disabledForAll",
              value = "false"
            },
            -- Admin explicitly enabled - Old Connect boolean format (using double negative)
            not = {
              not = {
                entityPropertyEqualTo = {
                  entity = "app",
                  propertyKey = "ep-tool.disabled-for-all",
                  value = "false"
                }
              }
            },
            -- No admin config exists (default to enabled)
            not = {
              entityPropertyExists = {
                entity = "app",
                propertyKey = "ep-tool.disabled-for-all"
              }
            }
          }
        }
      }
    }

in { app =
  { id = "ari:cloud:ecosystem::app/1c0636dd-b020-48a5-b68b-0d3f2fe06134"
  , runtime.name = "nodejs22.x"
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
