import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Routes } from 'react-router-dom';
import App from './App';
import { AddPropertyModal } from './AddPropertyModal';
import { ThemeInitializer } from './ThemeInitializer';

import '@atlaskit/css-reset';
import './styles/theme.css';
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
    <ThemeInitializer>
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
                <Route path='/' element={<EntityPropertyGlobalHome />} />
                <Route path='/user' element={<UserSelector />} />
                <Route path='/issue-type' element={<IssueTypeSelector />} />
                <Route path='/dashboard-items' element={<DashboardSelector />} />
                <Route path='/workflow-transitions' element={<WorkflowSelector />} />
                <Route path='/user-preferences' element={<UserPreferences />} />
                {/* TODO how do I setup the add-property modal? */}
              </Routes>
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
    </ThemeInitializer>
  </React.StrictMode>,
  document.getElementById('root')
);
