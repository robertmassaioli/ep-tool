import React, { useEffect, useState } from 'react';
import AceEditor from 'react-ace';
import styled from 'styled-components';
import { debounce } from 'throttle-debounce';
import EditorRemoveIcon from '@atlaskit/icon/glyph/editor/remove';
import Lozenge from '@atlaskit/lozenge';
import Button from '@atlaskit/button';
import { token } from '@atlaskit/tokens';
import { useEffectAsync } from './useEffectAsync';
import { isPresent } from 'ts-is-present';

const PropertyHeading = styled.h2`
    margin: 0;
    padding: 16px 0 8px 0;
    color: ${token('color.text', '#172B4D')};
`;

const PropertyLoadingDiv = styled.div`
    height: 200px;
    margin: 0px;
    padding: 0px;
`;

const PropertyHeaderContainer = styled.div`
    display: flex;
    align-items: baseline;
    margin: 0 0 8px 0;
`;

const PropertyHeaderName = styled.div`
`;

const PropertyHeaderStatus = styled.div`
    flex-grow: 1;
    padding: 0 0 0 16px;
`;

const PropertyHeaderActions = styled.div`
`;

const ParseFailed = 'parse-failed';
const UpdateSucceeded = 'saved';
const UpdateFailed = 'update-failed';

export const Property = (props) => {
  const { entityId, propertyKey, propertyApi } = props;
  const [property, setProperty] = useState(undefined);
  const [validation, setValidation] = useState(undefined);

  async function loadProperty () {
    try {
      setProperty(await propertyApi.getProperty(entityId, propertyKey));
    } catch (e) {
      setProperty({
        error: e
      });
    }
  }

  useEffectAsync(async () => {
    await loadProperty();
  }, property);

  useEffect(() => {
    loadProperty();
  }, [propertyApi]);

  if (!isPresent(property)) {
    return (
      <div>
        <PropertyHeading>{propertyKey}</PropertyHeading>
        <PropertyLoadingDiv>Loading...</PropertyLoadingDiv>
      </div>
    );
  }

  if (property.error) {
    return (
      <div>
        <PropertyHeading>{propertyKey}</PropertyHeading>
        <PropertyLoadingDiv>
          <p>Error loading the property! Disabling modification of this property.</p>
          {!propertyKey.includes('/') && (
            <p>{property.error.message}</p>
          )}
          {propertyKey.includes('/') && (
            <p>Known Issue: This issue is caused by <a href='https://ecosystem.atlassian.net/browse/ACJIRA-2708'>ACJIRA-2708</a></p>
          )}
        </PropertyLoadingDiv>
      </div>
    );
  }

  const onChangeDebounced = debounce(
    500,
    (event) => {
      onChange(event);
    },
    { atBegin: false }
  );

  function updateValidationState (newState) {
    if (isPresent(validation) && validation.changeId) {
      clearTimeout(validation.changeId);
    }
    if (!isPresent(newState)) {
      setValidation(undefined);
    } else if (newState === ParseFailed) {
      setValidation({
        state: ParseFailed
      });
    } else if (newState === UpdateSucceeded) {
      setValidation({
        state: UpdateSucceeded,
        changeId: setTimeout(() => setValidation(undefined), 3000)
      });
    } else if (newState === UpdateFailed) {
      setValidation({
        state: UpdateFailed
      });
    }
  }

  async function onChange (e) {
    let parsedContent;
    try {
      parsedContent = JSON.parse(e);
      console.log(parsedContent);

      try {
        await propertyApi.setProperty(entityId, propertyKey, parsedContent);
        updateValidationState(UpdateSucceeded);
        // TODO flash success
      } catch (error) {
        console.error(error);
        updateValidationState(UpdateFailed);
      }
    } catch (error) {
      console.error(error);
      updateValidationState(ParseFailed);
    }
  }

  return (
    <div>
      <PropertyHeaderContainer>
        <PropertyHeaderName>
          <PropertyHeading>
            {props.propertyKey}
          </PropertyHeading>
        </PropertyHeaderName>
        <PropertyHeaderStatus>
          {isPresent(validation) && validation.state === ParseFailed &&
            <Lozenge appearance='removed'>Invalid - Unsaved</Lozenge>}
          {isPresent(validation) && validation.state === UpdateFailed &&
            <Lozenge appearance='removed'>Failed to save</Lozenge>}
          {isPresent(validation) && validation.state === UpdateSucceeded &&
            <Lozenge appearance='success'>Saved</Lozenge>}
        </PropertyHeaderStatus>
        <PropertyHeaderActions>
          <Button iconBefore={<EditorRemoveIcon />} onClick={() => props.onDelete(propertyKey)}>Delete</Button>
        </PropertyHeaderActions>
      </PropertyHeaderContainer>
      <AceEditor
        width='100%'
        height='200px'
        mode={!props.useText ? 'json' : 'text'}
        theme='monokai'
        name={`property-${propertyKey}`}
        editorProps={{ $blockScrolling: true }}
        defaultValue={!props.useText ? JSON.stringify(property.value, null, 2) : property.value}
        onChange={(e) => onChangeDebounced(e)}
      />
    </div>
  );
};
