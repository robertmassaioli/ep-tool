import { token } from '@atlaskit/tokens';
import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import Button, { ButtonGroup } from '@atlaskit/button/standard-button';
import { Checkbox } from '@atlaskit/checkbox';
import Spinner from '@atlaskit/spinner';
import Banner from '@atlaskit/banner';
import { CodeBlock } from '@atlaskit/code';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import SuccessIcon from '@atlaskit/icon/glyph/check-circle';
import InfoIcon from '@atlaskit/icon/glyph/info';
import config from './config.json';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  text-align: center;
  padding: ${token('space.500')};
`;

const CurrentUserSection = styled.div`
  margin-top: ${token('space.250')};
`;

const DefaultSettingSection = styled.div`
  margin-top: ${token('space.250')};
  margin-bottom: ${token('space.400')};
`;

const CheckboxLabel = styled.span`
  small {
    color: ${token('color.text.subtle')};
  }
`;

const SavingIndicator = styled.div`
  margin-top: ${token('space.150')};
  display: flex;
  align-items: center;
  
  span {
    margin-left: ${token('space.100')};
  }
`;

const AdvancedConfigSection = styled.div`
  margin-top: ${token('space.400')};
  margin-bottom: ${token('space.400')};
`;

const DangerCard = styled.div`
  padding: ${token('space.200')};
  background-color: ${token('color.background.danger')};
  border-radius: 4px;
  border: 1px solid ${token('color.border.danger')};
`;

const DangerTitle = styled.h4`
  margin: 0;
  margin-bottom: ${token('space.100')};
  color: ${token('color.text.danger')};
`;

const DangerText = styled.p`
  margin: 0;
  margin-bottom: ${token('space.150')};
  color: ${token('color.text')};
`;

const DefaultConfigText = styled.p`
  margin: 0;
  margin-top: ${token('space.100')};
  font-size: 12px;
  color: ${token('color.text.subtle')};
`;

const InfoCard = styled.div`
  margin-bottom: ${token('space.400')};
  padding: ${token('space.200')};
  background-color: ${token('color.background.neutral')};
  border-radius: 4px;
  border: 1px solid ${token('color.border')};
`;

const InfoTitle = styled.h4`
  margin: 0;
  margin-bottom: ${token('space.100')};
`;

const InfoList = styled.ul`
  margin: 0;
  padding-left: ${token('space.250')};
`;

const LastModifiedCard = styled.div`
  margin-bottom: ${token('space.250')};
  padding: ${token('space.150')};
  background-color: ${token('color.background.success')};
  border-radius: 4px;
  border: 1px solid ${token('color.border')};
`;

const LastModifiedTitle = styled.h4`
  margin: 0;
  margin-bottom: ${token('space.100')};
`;

const LastModifiedText = styled.p`
  margin: 0;
`;

const SystemStatusSection = styled.div`
  
`;

const SystemStatusDetails = styled.details`
  margin-top: ${token('space.250')};
`;

const SystemStatusSummary = styled.summary`
  cursor: pointer;
  font-weight: bold;
`;

const SystemStatusContent = styled.div`
  margin-top: ${token('space.150')};
`;

const StatusHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${token('space.150')};
`;

export function AdminSettings() {
  const [adminConfig, setAdminConfig] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  async function handleDeleteConfig() {
    const confirmed = window.confirm(
      'Are you sure you want to delete the admin configuration?\n\n' +
      'This will reset the system to default settings where entity property tools are visible to all users by default.\n\n' +
      'Individual user preferences will remain unchanged.'
    );
    
    if (!confirmed) {
      return;
    }
    
    setDeleting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await invoke('deleteAdminConfig');
      
      if (result.success) {
        setSuccess(result.message);
        
        // Refresh system status to get updated data
        const updatedStatus = await invoke('getSystemStatus');
        setSystemStatus(updatedStatus);
        setAdminConfig(updatedStatus.adminConfig);
      } else {
        throw new Error('Failed to delete admin configuration');
      }
    } catch (err) {
      console.error('Failed to delete admin config:', err);
      setError(`Failed to delete configuration: ${err.message}`);
    } finally {
      setDeleting(false);
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
      <LoadingContainer>
        <Spinner size="large" />
        <p>Loading admin settings...</p>
      </LoadingContainer>
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
          <CurrentUserSection>
            <h3>Current User Information</h3>
            <CodeBlock 
              language="json" 
              showLineNumbers={false} 
              text={JSON.stringify({
                displayName: systemStatus.user.displayName,
                accountId: systemStatus.user.accountId,
                isAdmin: systemStatus.user.isAdmin
              }, null, 2)} 
            />
          </CurrentUserSection>
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

      <DefaultSettingSection>
        <h3>Default Setting for All Users</h3>

        <Checkbox
          isChecked={adminConfig?.defaultEnabled ?? true}
          onChange={handleToggleChange}
          isDisabled={saving}
          label={
            <CheckboxLabel>
              <strong>Enable entity property tools by default for all users</strong>
              <br />
              <small>
                When enabled, all users will see entity property tools unless they explicitly disable them in their preferences.
                When disabled, users must explicitly enable the tools to see them.
              </small>
            </CheckboxLabel>
          }
        />

        {saving && (
          <SavingIndicator>
            <Spinner size="small" />
            <span>Updating settings...</span>
          </SavingIndicator>
        )}
      </DefaultSettingSection>
      
      {config?.enableDeleteProperties && (
        <AdvancedConfigSection>
          <h3>Advanced Configuration</h3>
          <DangerCard>
            <DangerTitle>
              <WarningIcon label="Warning" size="small" /> Reset to Default Settings
            </DangerTitle>
            <DangerText>
              Delete the admin configuration to restore default behavior. This will make entity property tools visible 
              to all users by default (unless they have individual preferences set).
            </DangerText>
            <Button 
              appearance="danger"
              onClick={handleDeleteConfig}
              isDisabled={deleting || !adminConfig || adminConfig.source === 'default'}
              spacing="compact"
            >
              {deleting && <Spinner size="small" />}
              {deleting ? 'Deleting Configuration...' : 'Delete Admin Configuration'}
            </Button>
            {(adminConfig?.source === 'default') && (
              <DefaultConfigText>
                Configuration is already at default settings.
              </DefaultConfigText>
            )}
          </DangerCard>
        </AdvancedConfigSection>
      )}
      
      <InfoCard>
        <InfoTitle>
          <InfoIcon label="Info" size="small" /> Important Notes
        </InfoTitle>
        <InfoList>
          <li>This setting controls visibility of issue panels and project pages</li>
          <li>Global pages (like this admin interface) remain visible to all users</li>
          <li>Individual users can override this setting in their personal preferences</li>
          <li>Changes take effect immediately for all users</li>
        </InfoList>
      </InfoCard>

      {adminConfig?.lastModified && (
        <LastModifiedCard>
          <LastModifiedTitle>Last Modified</LastModifiedTitle>
          <LastModifiedText>
            <strong>When:</strong> {new Date(adminConfig.lastModified).toLocaleString()}<br />
            <strong>By:</strong> {adminConfig.modifiedByDisplayName || adminConfig.modifiedBy}
          </LastModifiedText>
        </LastModifiedCard>
      )}

      {systemStatus && (
        <SystemStatusSection>
          <SystemStatusDetails>
            <SystemStatusSummary>System Status</SystemStatusSummary>
            <SystemStatusContent>
              <StatusHeader>
                <h4>Current System Information</h4>
                <Button
                  appearance="subtle"
                  onClick={refreshStatus}
                  spacing="compact"
                >
                  Refresh
                </Button>
              </StatusHeader>

              <CodeBlock 
                language="json" 
                showLineNumbers={false} 
                text={JSON.stringify(systemStatus, null, 2)} 
              />
            </SystemStatusContent>
          </SystemStatusDetails>
        </SystemStatusSection>
      )}
    </div>
  );
}
