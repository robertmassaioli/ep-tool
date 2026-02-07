import { token } from '@atlaskit/tokens';
import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import Button from '@atlaskit/button/standard-button';
import { RadioGroup } from '@atlaskit/radio';
import Spinner from '@atlaskit/spinner';
import Banner from '@atlaskit/banner';
import { Code } from '@atlaskit/code';
import SuccessIcon from '@atlaskit/icon/glyph/check-circle';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import InfoIcon from '@atlaskit/icon/glyph/info';

export function UserPreferences() {
  const [userPref, setUserPref] = useState(null);
  const [adminConfig, setAdminConfig] = useState(null);
  const [effectiveSetting, setEffectiveSetting] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);

    try {
      const [status, effective] = await Promise.all([
        invoke('getSystemStatus'),
        invoke('getEffectiveSetting')
      ]);

      setSystemStatus(status);
      setUserPref(status.userPreference);
      setAdminConfig(status.adminConfig);
      setEffectiveSetting(effective);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(`Failed to load preferences: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handlePreferenceChange(event) {
    const selectedValue = event.target.value;
    let enabledValue;

    switch (selectedValue) {
    case 'default':
      enabledValue = null; // Use admin default
      break;
    case 'enabled':
      enabledValue = true; // Always enabled
      break;
    case 'disabled':
      enabledValue = false; // Always disabled
      break;
    default:
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await invoke('setUserPreference', { enabled: enabledValue });

      if (result.success) {
        // Reload settings to get updated effective setting
        await loadSettings();

        let message;
        switch (result.action) {
        case 'deleted':
          message = 'Your preference has been cleared. You will now use the admin default setting.';
          break;
        case 'set':
          message = `Your preference has been set to ${enabledValue ? 'always enabled' : 'always disabled'}.`;
          break;
        case 'none':
          message = 'No changes were needed - you are already using the admin default.';
          break;
        default:
          message = 'Your preference has been updated successfully.';
        }
        setSuccess(message);
      } else {
        throw new Error('Failed to update user preference');
      }
    } catch (err) {
      console.error('Failed to update user preference:', err);
      setError(`Failed to update preference: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function getCurrentValue() {
    if (userPref?.enabled === null || userPref?.enabled === undefined) {
      return 'default';
    }
    return userPref.enabled ? 'enabled' : 'disabled';
  }

  function getAdminDefaultText() {
    if (!adminConfig) return 'unknown';
    return adminConfig.defaultEnabled ? 'enabled' : 'disabled';
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: token('space.500') }}>
        <Spinner size="large" />
        <p>Loading your preferences...</p>
      </div>
    );
  }

  const currentValue = getCurrentValue();
  const adminDefaultText = getAdminDefaultText();

  const options = [
    {
      value: 'default',
      label: `Use admin default (currently ${adminDefaultText})`,
      name: 'preference'
    },
    {
      value: 'enabled',
      label: 'Always show entity property tools',
      name: 'preference'
    },
    {
      value: 'disabled',
      label: 'Always hide entity property tools',
      name: 'preference'
    }
  ];

  return (
    <div>
      <h2>Your Entity Property Tool Preferences</h2>
      <p>Choose when you want to see entity property tools in Jira. Your personal preference will override the administrator's default setting.</p>

      {error && (
        <Banner
          icon={<WarningIcon label="Error" />}
          appearance="error"
        >
          {error}
        </Banner>
      )}

      {success && (
        <Banner
          icon={<SuccessIcon label="Success" />}
          appearance="confirmation"
        >
          {success}
        </Banner>
      )}

      <div style={{ marginTop: token('space.250'), marginBottom: token('space.400') }}>
        <h3>Preference Setting</h3>

        <RadioGroup
          options={options}
          value={currentValue}
          onChange={handlePreferenceChange}
          isDisabled={saving}
        />

        {saving && (
          <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center' }}>
            <Spinner size="small" />
            <span style={{ marginLeft: token('space.100') }}>Updating your preference...</span>
          </div>
        )}
      </div>

      {effectiveSetting && (
        <div style={{
          marginBottom: token('space.400'),
          padding: token('space.200'),
          backgroundColor: effectiveSetting.enabled ? token('color.background.success') : token('color.background.danger'),
          borderRadius: '4px',
          border: `2px solid ${effectiveSetting.enabled ? token('color.border.success') : token('color.border.danger')}`
        }}>
          <h4 style={{ margin: 0, marginBottom: token('space.100'), color: effectiveSetting.enabled ? token('color.text.success') : token('color.text.danger') }}>
            <SuccessIcon label="Current Setting" size="small" /> Current Effective Setting
          </h4>
          <p style={{ margin: 0, marginBottom: token('space.100') }}>
            <strong>Entity property tools are currently {effectiveSetting.enabled ? 'ENABLED' : 'DISABLED'} for you</strong>
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: token('color.text.subtle') }}>
            Source: {effectiveSetting.source === 'user' ? 'Your personal preference' :
              effectiveSetting.source === 'admin' ? 'Administrator default' :
                'System fallback'}
          </p>
        </div>
      )}

      <div style={{ marginBottom: token('space.400'), padding: token('space.200'), backgroundColor: token('color.background.neutral'), borderRadius: '4px', border: `1px solid ${token('color.border')}` }}>
        <h4 style={{ margin: 0, marginBottom: token('space.100') }}>
          <InfoIcon label="Info" size="small" /> How Preferences Work
        </h4>
        <ul style={{ margin: 0, paddingLeft: token('space.250') }}>
          <li><strong>Use admin default:</strong> Your setting will follow whatever the administrator has configured for all users</li>
          <li><strong>Always show:</strong> You'll always see the entity property tools, regardless of admin settings</li>
          <li><strong>Always hide:</strong> You'll never see the entity property tools, regardless of admin settings</li>
        </ul>
        <p style={{ margin: `${token('space.150')} 0 0 0`, fontSize: '14px', color: token('color.text.subtle') }}>
          Note: This only affects issue panels and project pages. Global pages (like this preferences page) are always accessible.
        </p>
      </div>

      {userPref?.lastModified && (
        <div style={{ marginBottom: token('space.250'), padding: token('space.150'), backgroundColor: token('color.background.success'), borderRadius: '4px', border: `1px solid ${token('color.border')}` }}>
          <h4 style={{ margin: 0, marginBottom: token('space.100') }}>Last Updated</h4>
          <p style={{ margin: 0 }}>
            {new Date(userPref.lastModified).toLocaleString()}
          </p>
        </div>
      )}

      <div>
        <details style={{ marginTop: token('space.250') }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug Information</summary>
          <div style={{ marginTop: token('space.150') }}>
            <h4>Current Status</h4>
            <Code language="json">
              {JSON.stringify({
                userPreference: userPref,
                adminDefault: adminConfig,
                effectiveSetting: effectiveSetting
              }, null, 2)}
            </Code>
          </div>
        </details>
      </div>
    </div>
  );
}
