import React, { useEffect, useState } from 'react';
import { view } from '@forge/bridge';
import { Router, useHistory } from 'react-router';
import { createMemoryHistory } from 'history';
import { isPresent } from 'ts-is-present';
import { useViewContext } from './ViewContext';

export function Link ({ to, children }) {
  const history = useHistory();
  return (
    <a
      href={to}
      onClick={(event) => {
        event.preventDefault();
        history.push(to);
      }}
    >
      {children}
    </a>
  );
}

function convertContextToRoute (context) {
  let url = `/module/${context.moduleKey}`;

  if (isPresent(context?.extension?.modal?.type)) {
    url += `/modal/${context.extension.modal.type}`;
  }

  console.log('url', url);
  return url;
}

export function SpaRouter (props) {
  const [history, setHistory] = useState(null);
  const context = useViewContext();

  useEffect(() => {
    view.createHistory().then((newHistory) => {
      setHistory(newHistory);
      console.log('created history', newHistory);
    }).catch(e => {
      console.error('view createHistory', e);

      // TODO in here we can default to our static routing sub-system
      setHistory(createMemoryHistory({
        initialEntries: [convertContextToRoute(context)]
      }));
    });
  }, []);

  const [historyState, setHistoryState] = useState(null);

  useEffect(() => {
    if (!historyState && history) {
      setHistoryState({
        action: history.action,
        location: history.location
      });
    }
  }, [history, historyState]);

  useEffect(() => {
    if (history) {
      history.listen((location, action) => {
        setHistoryState({
          action,
          location
        });
      });
    }
  }, [history]);

  return (
    <div>
      {history && historyState
        ? (
          <Router
            navigator={history}
            navigationType={historyState.action}
            location={historyState.location}
          >
            {props.children}
          </Router>
          )
        : (
            'Loading...'
          )}
    </div>
  );
}
