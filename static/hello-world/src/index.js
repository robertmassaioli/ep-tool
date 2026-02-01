import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Switch } from 'react-router-dom';
import App from './App';
import { AddPropertyModal } from './AddPropertyModal';

import '@atlaskit/css-reset';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';
import { ProjectPropertyApi } from './apis/project';
import { IssuePropertyApi } from './apis/issue';
import { UserSelector } from './UserSelector';
import { IssueTypeSelector } from './IssueTypeSelector';
import { SpaRouter } from './SpaRouter';
import { ContextRoute } from './ContextRouter';
import { ViewContext } from './ViewContext';
import { DashboardSelector } from './DashboardSelector';
import { WorkflowSelector } from './WorkflowSelector';
import { EntityPropertyGlobalHome } from './EntityPropertyGlobalHome';
import { AdminSettings } from './AdminSettings';
import { UserPreferences } from './UserPreferences';
import { AdminPage } from './AdminPage';

ReactDOM.render(
  <React.StrictMode>
    <ViewContext>
      <ContextRoute moduleKey='project-entity-properties'>
        <ContextRoute noModal>
          <App propertyApi={ProjectPropertyApi} />
        </ContextRoute>
        <ContextRoute modalType='add-property'>
          <AddPropertyModal />
        </ContextRoute>
      </ContextRoute>
      <ContextRoute moduleKey='issue-entity-properties'>
        <ContextRoute noModal>
          <App propertyApi={IssuePropertyApi} />
        </ContextRoute>
        <ContextRoute modalType='add-property'>
          <AddPropertyModal />
        </ContextRoute>
      </ContextRoute>
      <ContextRoute moduleKey='entity-properties-global'>
        <ContextRoute noModal>
          <SpaRouter>
            <Switch>
              {/* TODO use an index route here? */}
              <Route exact path='/' component={EntityPropertyGlobalHome} />
              <Route exact path='/user' component={UserSelector} />
              <Route exact path='/issue-type' component={IssueTypeSelector} />
              <Route exact path='/dashboard-items' component={DashboardSelector} />
              <Route exact path='/workflow-transitions' component={WorkflowSelector} />
              <Route exact path='/user-preferences' component={UserPreferences} />
              {/* TODO how do I setup the add-property modal? */}
            </Switch>
          </SpaRouter>
        </ContextRoute>
        <ContextRoute modalType='add-property'>
          <AddPropertyModal />
        </ContextRoute>
      </ContextRoute>
      <ContextRoute moduleKey='entity-properties-admin'>
        <ContextRoute noModal>
          <AdminPage />
        </ContextRoute>
      </ContextRoute>
    </ViewContext>
  </React.StrictMode>,
  document.getElementById('root')
);
