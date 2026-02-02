import { token } from '@atlaskit/tokens';
import React, { useState } from 'react';
import { requestJira } from '@forge/bridge';
import Select, { AsyncSelect } from '@atlaskit/select';
import Spinner from '@atlaskit/spinner';
import { Label } from '@atlaskit/form';
import { isPresent } from 'ts-is-present';
import App from './App';
import styled from 'styled-components';
import { getWorkflowTransitionPropertyApi } from './apis/workflow-transition';
import { SelectZIndexFix } from './SelectZIndexFix';

const AppContainer = styled.div`
  margin-top: ${token('space.200')};
`;

const LoadingIndicator = (props) => {
  return <Spinner {...props} />;
};

async function searchForWorkflows (searchQuery) {
  const workflowSearchResponse = await requestJira(`/rest/api/3/workflow/search?expand=transitions,operations&queryString=${encodeURIComponent(searchQuery)}`);
  if (!workflowSearchResponse.ok) {
    throw new Error('Did not perform operation successfully');
  }
  const response = await workflowSearchResponse.json();
  return response.values.filter(workflow => workflow.operations.canEdit);
}

// TODO
function toLabel (workflow) {
  const description = (workflow.description || '').length > 0 ? ` - ${workflow.description}` : '';
  return `${workflow.id.name} (${workflow.id.entityId})${description}`;
}

/**
 * The purpose of this class is to offer user selection capabilites before
 * landing straight into the Entity Property modification UI.
 *
 * By default we should select the current user viewing this request.
 *
 * We should check if the current user has the permissions to modify the
 * user properties of other users (somewhere in this UI).
 *
 * We should also provide a "selector" experience to find other users and
 * attempt to view their properties.
 */
export function WorkflowSelector () {
  const [selected, setSelected] = useState(undefined);

  async function getWorkflowOptions (inputValue) {
    const workflows = await searchForWorkflows(inputValue);

    return workflows.map(workflow => ({
      label: toLabel(workflow),
      value: workflow.id,
      workflowName: workflow.id.name,
      transitions: workflow.transitions,
      transitionOptions: getTransitionOptions(workflow)
    }));
  }

  function getTransitionOptions (workflowOption) {
    return workflowOption.transitions.map(transition => ({
      label: `${transition.name} (${transition.id})`,
      value: transition.id
    }));
  }

  // TODO Find a way to debounce getDashboardOptions
  return (
    <SelectZIndexFix>
      <p>Workflow transitions can have entity properties. Use this screen to modify them.</p>
      <Label htmlFor='workflow-select'>Which workflow? (Start searching for the name of your workflow)</Label>
      <AsyncSelect
        inputId='workflow-select'
        className='select-component'
        cacheOptions
        loadOptions={e => getWorkflowOptions(e)}
        components={{ LoadingIndicator }}
        noOptionsMessage={() => 'Modify your search to find a Workflow to select.'}
        onChange={(selectedValue) => {
          console.log('selected workflow', selectedValue);
          setSelected({
            workflow: selectedValue,
            workflowTransition: selectedValue.transitionOptions[0]
          });
        }}
      />
      {isPresent(selected) && isPresent(selected.workflow) && (
        <>
          <Label htmlFor='transition-select'>Which Workflow transition?</Label>
          <Select
            inputId='transition-select'
            className='sub-select-component'
            defaultValue={selected.workflow.transitionOptions[0]}
            options={selected.workflow.transitionOptions}
            onChange={(selectedOption) => {
              setSelected({
                ...selected,
                workflowTransition: selectedOption
              });
            }}
          />
        </>
      )}
      {isPresent(selected) && isPresent(selected.workflowTransition) && (
        <AppContainer>
          <App useText propertyApi={getWorkflowTransitionPropertyApi(selected.workflow.workflowName, selected.workflowTransition.value)} />
        </AppContainer>
      )}
    </SelectZIndexFix>
  );
}
