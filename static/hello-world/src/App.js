import React, { useEffect, useState } from 'react';
import { Modal } from '@forge/bridge';
import { useEffectAsync } from './useEffectAsync';
import { isPresent } from 'ts-is-present';
import { Property } from './Property';
import EditorAddIcon from '@atlaskit/icon/glyph/editor/add';
import Button from '@atlaskit/button';
import { TYPE_CREATE } from './AddPropertyModal';
import { useForgeContext } from 'forge-module-router';

function App (props) {
  const { propertyApi } = props;
  const [entityPropertyState, setEntityPropertyState] = useState(undefined);
  const context = useForgeContext();

  async function loadEntityPropertyState () {
    const entityId = propertyApi.extractEntityId(context);
    const propertyKeys = await propertyApi.getPropertyKeys(entityId);
    const keys = propertyKeys.sort((a, b) => a.localeCompare(b));
    return {
      entityId,
      keys
    };
  }

  useEffect(() => {
    loadEntityPropertyState().then(setEntityPropertyState);
  }, [propertyApi]);

  useEffectAsync(async () => {
    setEntityPropertyState(await loadEntityPropertyState());
  }, entityPropertyState);

  async function onDelete (propertyKey) {
    await propertyApi.deleteProperty(entityPropertyState.entityId, propertyKey);
    setEntityPropertyState(await loadEntityPropertyState());
  }

  const addPropertyClosed = async (payload) => {
    if (payload.type === TYPE_CREATE) {
      const { propertyKey, propertyValue } = payload.data;

      // TODO what if this fails?
      const parsedValue = props.useText ? propertyValue : JSON.parse(propertyValue);
      await propertyApi.setProperty(entityPropertyState.entityId, propertyKey, parsedValue);

      setEntityPropertyState(await loadEntityPropertyState());
    }
  };

  const addPropertyModal = new Modal({
    onClose: (payload) => addPropertyClosed(payload),
    size: 'medium',
    context: {
      type: 'add-property',
      useText: !!props.useText
    }
  });

  return (
    <div>
      <p>These are the properties against this entity, the values are {props.useText ? 'plain text' : 'JSON objects'}.</p>
      {!isPresent(entityPropertyState) && (
        <div>Loading the properties for this project...</div>
      )}
      {isPresent(entityPropertyState) && (
        <>
          <Button iconBefore={<EditorAddIcon />} onClick={() => addPropertyModal.open()}>Add property</Button>
          {entityPropertyState.keys.map(key => (
            <Property
              key={`${key}`}
              entityId={entityPropertyState.entityId}
              propertyKey={key}
              propertyApi={propertyApi}
              onDelete={() => onDelete(key)}
              useText={!!props.useText}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default App;
