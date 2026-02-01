import React, { useEffect, useState } from 'react';
import { view } from '@forge/bridge';
import { Router } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { isPresent } from 'ts-is-present';
import { useViewContext } from './ViewContext';

export function Link ({ to, children }) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
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
      console.log("Setting new history", newHistory);
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

  return (
    <div>
      {history
        ? (
          <Router
            location={history.location}
            navigator={history}
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
