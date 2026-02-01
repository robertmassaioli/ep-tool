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
  const [historyState, setHistoryState] = useState(null);
  const [navigator, setNavigator] = useState(null);
  const historyCleanupRef = React.useRef(null);
  const context = useViewContext();

  useEffect(() => {
    // Using IIFE to handle async code in useEffect (same as Forge docs)
    (async () => {
      try {
        // Use Forge's view.createHistory() as recommended
        const history = await view.createHistory();
        console.log("Setting new history", history);
        setNavigator(history);

        // Set initial values from the history object
        setHistoryState({
          action: history.action,
          location: history.location,
        });

        // Listen for changes in the history
        const unsubscribe = await history.listen((location, action) => {
          setHistoryState({
            action,
            location,
          });
        });

        // Store cleanup function reference
        historyCleanupRef.current = unsubscribe;
        console.log('created history', history);
      } catch (e) {
        console.error('view createHistory', e);

        // Fallback to static routing system
        const fallbackHistory = createMemoryHistory({
          initialEntries: [convertContextToRoute(context)]
        });
        
        setNavigator(fallbackHistory);
        setHistoryState({
          action: fallbackHistory.action,
          location: fallbackHistory.location,
        });

        // Listen for changes in fallback history
        const unsubscribe = fallbackHistory.listen((location, action) => {
          setHistoryState({
            action,
            location,
          });
        });
        
        historyCleanupRef.current = unsubscribe;
      }
    })();
  }, [context]);

  const handleUnload = () => {
    if (historyCleanupRef.current) {
      historyCleanupRef.current();
    }
  };

  // Cleanup history listener when component unmounts or iframe unloads
  useEffect(() => {
    window.addEventListener('unload', handleUnload);
    return () => {
      window.removeEventListener('unload', handleUnload);
      // Also cleanup on component unmount
      if (historyCleanupRef.current) {
        historyCleanupRef.current();
      }
    };
  }, []);

  // Wait for both navigator and historyState to be ready
  if (!navigator || !historyState) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Router
        navigator={navigator}
        navigationType={historyState.action}
        location={historyState.location}
      >
        {props.children}
      </Router>
    </div>
  );
}
