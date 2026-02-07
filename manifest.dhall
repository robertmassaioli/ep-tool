let -- Define the proper Forge display conditions structure using Connect property names
    entityPropertyDisplayConditions = {
      or = {
        -- User explicitly enabled (ep-tool.enabled-for-me = true)
        entityPropertyEqualTo = {
          entity = "user",
          propertyKey = "ep-tool.enabled-for-me", 
          objectName = "enabled",
          value = "true"
        },
        -- No user preference AND admin didn't disable
        and = {
          not = {
            entityPropertyExists = {
              entity = "user",
              propertyKey = "ep-tool.enabled-for-me"
            }
          },
          or = {
            -- Admin didn't disable (ep-tool.disabled-for-all = false)
            entityPropertyEqualTo = {
              entity = "app",
              propertyKey = "ep-tool.disabled-for-all",
              objectName = "disabledForAll", 
              value = "false"
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
