import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Routes } from 'react-router-dom';
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
            <Routes>
              {/* TODO use an index route here? */}
              <Route exact path='/' element={<EntityPropertyGlobalHome />} />
              <Route exact path='/user' element={<UserSelector />} />
              <Route exact path='/issue-type' element={<IssueTypeSelector />} />
              <Route exact path='/dashboard-items' element={<DashboardSelector />} />
              <Route exact path='/workflow-transitions' element={<WorkflowSelector />} />
              <Route exact path='/admin-settings' element={<AdminSettings />} />
              <Route exact path='/user-preferences' element={<UserPreferences />} />
              {/* TODO how do I setup the add-property modal? */}
            </Routes>
          </SpaRouter>
        </ContextRoute>
        <ContextRoute modalType='add-property'>
          <AddPropertyModal />
        </ContextRoute>
      </ContextRoute>
    </ViewContext>
  </React.StrictMode>,
  document.getElementById('root')
);
