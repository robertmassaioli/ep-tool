import { token } from '@atlaskit/tokens';
import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import Button, { ButtonGroup } from '@atlaskit/button/standard-button';
import { Checkbox } from '@atlaskit/checkbox';
import Spinner from '@atlaskit/spinner';
import Banner from '@atlaskit/banner';
import { Code } from '@atlaskit/code';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import SuccessIcon from '@atlaskit/icon/glyph/check-circle';
import InfoIcon from '@atlaskit/icon/glyph/info';

export function AdminSettings() {
  const [adminConfig, setAdminConfig] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);
    setError(null);

    try {
      // Get system status which includes admin check
      const status = await invoke('getSystemStatus');
      setSystemStatus(status);
      setIsAdmin(status.user.isAdmin);
      setAdminConfig(status.adminConfig);

      if (!status.user.isAdmin) {
        setError('You need administrator permissions to access these settings.');
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError(`Failed to load settings: ${err.message}`);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleChange(event) {
    const newValue = event.target.checked;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await invoke('setAdminConfig', { defaultEnabled: newValue });

      if (result.success) {
        setAdminConfig(result.config);
        setSuccess(`Successfully ${newValue ? 'enabled' : 'disabled'} entity property tools by default for all users.`);

        // Refresh system status to get updated data
        const updatedStatus = await invoke('getSystemStatus');
        setSystemStatus(updatedStatus);
      } else {
        throw new Error('Failed to update admin configuration');
      }
    } catch (err) {
      console.error('Failed to update admin config:', err);
      setError(`Failed to update settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function refreshStatus() {
    try {
      setError(null);
      const status = await invoke('getSystemStatus');
      setSystemStatus(status);
      setSuccess('Status refreshed successfully');
    } catch (err) {
      setError(`Failed to refresh status: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: token('space.500') }}>
        <Spinner size="large" />
        <p>Loading admin settings...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div>
        <h2>Admin Settings</h2>
        <Banner
          icon={<WarningIcon label="Warning" />}
          appearance="warning"
        >
          You need administrator permissions to access these settings.
          Please contact your Jira administrator if you believe you should have access.
        </Banner>

        {systemStatus && (
          <div style={{ marginTop: token('space.250') }}>
            <h3>Current User Information</h3>
            <Code language="json">
              {JSON.stringify({
                displayName: systemStatus.user.displayName,
                accountId: systemStatus.user.accountId,
                isAdmin: systemStatus.user.isAdmin
              }, null, 2)}
            </Code>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2>Admin Settings</h2>
      <p>Control the default visibility of entity property tools for all users across this Jira instance.</p>

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

      <div style={{ marginTop: token('space.250'), marginBottom: '30px' }}>
        <h3>Default Setting for All Users</h3>

        <Checkbox
          isChecked={adminConfig?.defaultEnabled || false}
          onChange={handleToggleChange}
          isDisabled={saving}
          label={
            <span>
              <strong>Enable entity property tools by default for all users</strong>
              <br />
              <small style={{ color: 'var(--text-color-secondary)' }}>
                When enabled, all users will see entity property tools unless they explicitly disable them in their preferences.
                When disabled, users must explicitly enable the tools to see them.
              </small>
            </span>
          }
        />

        {saving && (
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
            <Spinner size="small" />
            <span style={{ marginLeft: token('space.100') }}>Updating settings...</span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: 'var(--surface-color)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
        <h4 style={{ margin: 0, marginBottom: token('space.100') }}>
          <InfoIcon label="Info" size="small" /> Important Notes
        </h4>
        <ul style={{ margin: 0, paddingLeft: token('space.250') }}>
          <li>This setting controls visibility of issue panels and project pages</li>
          <li>Global pages (like this admin interface) remain visible to all users</li>
          <li>Individual users can override this setting in their personal preferences</li>
          <li>Changes take effect immediately for all users</li>
        </ul>
      </div>

      {adminConfig?.lastModified && (
        <div style={{ marginBottom: token('space.250'), padding: '10px', backgroundColor: 'var(--success-background)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ margin: 0, marginBottom: token('space.100') }}>Last Modified</h4>
          <p style={{ margin: 0 }}>
            <strong>When:</strong> {new Date(adminConfig.lastModified).toLocaleString()}<br />
            <strong>By:</strong> {adminConfig.modifiedByDisplayName || adminConfig.modifiedBy}
          </p>
        </div>
      )}

      {systemStatus && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3>System Status</h3>
            <Button
              appearance="subtle"
              onClick={refreshStatus}
              spacing="compact"
            >
              Refresh
            </Button>
          </div>

          <Code language="json">
            {JSON.stringify(systemStatus, null, 2)}
          </Code>
        </div>
      )}
    </div>
  );
}
