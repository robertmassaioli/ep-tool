import React, { useState } from 'react';
import { view, requestJira } from '@forge/bridge';
import { useEffectAsync } from './useEffectAsync';
import { AsyncSelect } from '@atlaskit/select';
import Spinner from '@atlaskit/spinner';
import { Label } from '@atlaskit/form';
import { isPresent } from 'ts-is-present';
import { getUserPropertyApi } from './apis/user';
import App from './App';

const LoadingIndicator = (props) => {
  return <Spinner {...props} />;
};

async function getUser(accountId) {
  const getUserResponse = await requestJira(`/rest/api/3/user?accountId=${accountId}`);
  if (!getUserResponse.ok) {
    throw new Error('Did not perform operation successfully');
  }
  return await getUserResponse.json();
}

async function searchForUsers(searchQuery) {
  const userSearchResponse = await requestJira(`/rest/api/3/user/search?query=${encodeURIComponent(searchQuery)}`);
  if (!userSearchResponse.ok) {
    throw new Error('Did not perform operation successfully');
  }
  return await userSearchResponse.json();
}

function toLabel(user) {
  const displayName = isPresent(user.displayName) ? user.displayName : '<Name hidden>';
  const disambiguation = isPresent(user.email) ? user.email : user.accountId;

  return `${displayName} (${disambiguation})`;
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
export function UserSelector() {
  const [initialState, setInitialState] = useState(undefined);
  const [currentAaid, setCurrentAaid] = useState(undefined);

  useEffectAsync(async () => {
    const context = await view.getContext();
    const userDetails = await getUser(context.accountId);
    setInitialState({
      accountId: context.accountId,
      displayName: userDetails.displayName
    });
    setCurrentAaid({
      accountId: context.accountId,
      propertyApi: getUserPropertyApi(context.accountId)
    })
  }, initialState);

  if (!isPresent(initialState)) {
    return (
      <p>Loading...</p>
    );
  }

  function defaultOption() {
    return [{
      label: initialState.displayName,
      value: initialState.accountId
    }];
  }

  async function getUserOptions(inputValue) {
    const users = await searchForUsers(inputValue);

    return users.map(user => ({
      label: toLabel(user),
      value: user.accountId
    }));
  }

  return (
    <>
      <Label htmlFor="indicators-loading">Which users entity properties do you wish to edit?</Label>
      <AsyncSelect
        inputId="indicators-loading"
        cacheOptions
        defaultOptions={defaultOption()}
        defaultValue={[initialState.accountId]}
        loadOptions={e => getUserOptions(e)}
        components={{ LoadingIndicator }}
        onChange={(selectedOption) => {
          console.log('newAccountId', selectedOption);
          setCurrentAaid({
            currentAaid: selectedOption.value,
            propertyApi: getUserPropertyApi(selectedOption.value)
          });
        }}
      />
      {isPresent(currentAaid) && (
        <App propertyApi={currentAaid.propertyApi} />
      )}
    </>
  );
}