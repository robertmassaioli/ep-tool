import { token } from '@atlaskit/tokens';
import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import { useNavigate } from 'react-router-dom';
import Button, { ButtonGroup } from '@atlaskit/button/standard-button';
import Spinner from '@atlaskit/spinner';
import Banner from '@atlaskit/banner';
import SettingsIcon from '@atlaskit/icon/glyph/settings';
import PersonIcon from '@atlaskit/icon/glyph/person';
import InfoIcon from '@atlaskit/icon/glyph/info';
import SuccessIcon from '@atlaskit/icon/glyph/check-circle';
import WarningIcon from '@atlaskit/icon/glyph/warning';

export function EntityPropertyGlobalHome() {
  const navigate = useNavigate();
  const [effectiveSetting, setEffectiveSetting] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const [effective, status] = await Promise.all([
        invoke('getEffectiveSetting'),
        invoke('getSystemStatus')
      ]);

      setEffectiveSetting(effective);
      setSystemStatus(status);
      setError(null);
    } catch (err) {
      console.error('Error loading status:', err);
      setError('Could not load current settings status');
    } finally {
      setLoading(false);
    }
  }

  function getStatusMessage() {
    if (!effectiveSetting) return null;

    if (effectiveSetting.enabled) {
      return {
        type: 'success',
        icon: <SuccessIcon label="Enabled" />,
        message: `Entity property tools are ENABLED for you (source: ${effectiveSetting.source})`
      };
    } else {
      return {
        type: 'warning',
        icon: <WarningIcon label="Disabled" />,
        message: `Entity property tools are DISABLED for you (source: ${effectiveSetting.source})`
      };
    }
  }

  return (
    <div>
      <h1>Entity Property Tool</h1>
      <p>
        A tool for App Developers to manage Entity Properties on JIRA entities.
      </p>

      {loading && (
        <div style={{ margin: `${token('space.250')} 0`, textAlign: 'center' }}>
          <Spinner size="small" />
          <span style={{ marginLeft: token('space.100') }}>Loading status...</span>
        </div>
      )}

      {error && (
        <Banner
          icon={<InfoIcon label="Info" />}
          appearance="warning"
        >
          {error}
        </Banner>
      )}

      {effectiveSetting && !loading && (
        <div style={{ margin: `${token('space.250')} 0` }}>
          {(() => {
            const status = getStatusMessage();
            return (
              <Banner
                icon={status.icon}
                appearance={status.type === 'success' ? 'confirmation' : 'warning'}
              >
                {status.message}
                {effectiveSetting.source === 'user' && (
                  <span style={{ marginLeft: token('space.100') }}>
                    (You can change this in your preferences)
                  </span>
                )}
                {effectiveSetting.source === 'admin' && (
                  <span style={{ marginLeft: token('space.100') }}>
                    (You can override this in your preferences)
                  </span>
                )}
              </Banner>
            );
          })()}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h3>Settings & Preferences</h3>
        <p>Manage visibility and access to entity property tools:</p>

        <Button
          appearance="primary"
          iconBefore={<PersonIcon />}
          onClick={() => navigate('/user-preferences')}
        >
          My Preferences
        </Button>

        {systemStatus?.user?.isAdmin && (
          <p style={{ marginTop: '15px', fontSize: '14px', color: 'var(--text-color-secondary)' }}>
            <InfoIcon label="Info" size="small" /> <strong>Admin Settings:</strong> Configure global defaults in
            <strong> Jira Settings → Apps → Entity Property Tool Settings</strong>
          </p>
        )}

        {!systemStatus?.user?.isAdmin && systemStatus && (
          <p style={{ marginTop: '15px', fontSize: '14px', color: 'var(--text-color-secondary)' }}>
            <InfoIcon label="Info" size="small" /> Admin settings are managed by your Jira administrator.
          </p>
        )}
      </div>

      <div>
        <h3>Entity Property Management</h3>
        <p>For Issue and Project Entity Properties, visit the respective Issue or Project.</p>
        <p>For other Entity Properties, use the options below:</p>
        <ul>
          <li>
            <Button
              appearance="link"
              onClick={() => navigate('/user')}
              spacing="none"
            >
              User entity properties
            </Button>
          </li>
          <li>
            <Button
              appearance="link"
              onClick={() => navigate('/issue-type')}
              spacing="none"
            >
              Issue Type entity properties
            </Button>
          </li>
          <li>
            <Button
              appearance="link"
              onClick={() => navigate('/dashboard-items')}
              spacing="none"
            >
              Dashboard Item entity properties
            </Button>
          </li>
          <li>
            <Button
              appearance="link"
              onClick={() => navigate('/workflow-transitions')}
              spacing="none"
            >
              Workflow Transition entity properties
            </Button>
          </li>
        </ul>
      </div>

      {effectiveSetting && (
        <div style={{ marginTop: token('space.500') }}>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Technical Details
            </summary>
            <div style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-color-secondary)' }}>
              <p><strong>How it works:</strong></p>
              <ul>
                <li>Issue panels and project pages are controlled by display conditions</li>
                <li>Your personal preference takes priority over admin defaults</li>
                <li>Global pages (like this one) are always accessible for configuration</li>
                <li>Changes take effect immediately across all Jira projects</li>
              </ul>

              <p style={{ marginTop: '15px' }}>
                <strong>Current effective setting:</strong> {effectiveSetting.enabled ? 'Enabled' : 'Disabled'}
                (source: {effectiveSetting.source})
              </p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
