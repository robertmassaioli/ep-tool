import { token } from '@atlaskit/tokens';
import { requestJira } from '@forge/bridge';
import React, { useState } from 'react';
import Select from '@atlaskit/select';
import { useEffectAsync } from './useEffectAsync';
import { Label } from '@atlaskit/form';
import { isPresent } from 'ts-is-present';
import App from './App';
import { getIssueTypeApi } from './apis/issue-type';
import styled from 'styled-components';
import { SelectZIndexFix } from './SelectZIndexFix';

const AppContainer = styled.div`
  margin-top: ${token('space.200')};
`;

async function getIssueTypes () {
  const allIssueTypesResponse = await requestJira('/rest/api/3/issuetype');
  if (!allIssueTypesResponse.ok) {
    throw new Error('Did not perform operation successfully');
  }
  return await allIssueTypesResponse.json();
}

function toIssueTypeOptions (issueTypes) {
  return issueTypes.map(issueType => ({
    label: `${issueType.name} (${issueType.id})`,
    value: issueType.id
  }));
}

export function IssueTypeSelector () {
  const [issueTypes, setIssueTypes] = useState(undefined);
  const [currentState, setCurrentState] = useState(undefined);

  useEffectAsync(async () => {
    const results = await getIssueTypes();
    setIssueTypes(results);
    setCurrentState({
      issueTypeId: results.length > 0 ? results[0].id : undefined
    });
  }, issueTypes);

  const defaultOptions = isPresent(issueTypes) ? toIssueTypeOptions(issueTypes) : [];

  return (
    <SelectZIndexFix>
      <Label htmlFor='indicators-loading'>Which Issue Types entity properties do you wish to edit?</Label>
      {!isPresent(issueTypes) && (
        <p>Loading...</p>
      )}
      {isPresent(issueTypes) && (
        <Select
          inputId='indicators-loading'
          className='select-component'
          defaultValue={defaultOptions[0]}
          options={defaultOptions}
          onChange={(selectedOption) => {
            console.log('newAccountId', selectedOption);
            setCurrentState({
              issueTypeId: selectedOption.value
            });
          }}
        />
      )}
      {isPresent(currentState) && (
        <AppContainer>
          <App propertyApi={getIssueTypeApi(currentState.issueTypeId)} />
        </AppContainer>
      )}
    </SelectZIndexFix>
  );
}
