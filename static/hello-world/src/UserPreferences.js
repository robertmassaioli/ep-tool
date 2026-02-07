import { token } from '@atlaskit/tokens';
import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import Button from '@atlaskit/button/standard-button';
import { RadioGroup } from '@atlaskit/radio';
import Spinner from '@atlaskit/spinner';
import Banner from '@atlaskit/banner';
import { CodeBlock } from '@atlaskit/code';
import SuccessIcon from '@atlaskit/icon/glyph/check-circle';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import InfoIcon from '@atlaskit/icon/glyph/info';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  text-align: center;
  padding: ${token('space.500')};
`;

const PreferenceSection = styled.div`
  margin-top: ${token('space.250')};
  margin-bottom: ${token('space.400')};
`;

const SavingIndicator = styled.div`
  margin-top: 15px;
  display: flex;
  align-items: center;
  
  span {
    margin-left: ${token('space.100')};
  }
`;

const EffectiveSettingCard = styled.div`
  margin-bottom: ${token('space.400')};
  padding: ${token('space.200')};
  background-color: ${props => props.enabled ? token('color.background.success') : token('color.background.danger')};
  border-radius: 4px;
  border: 2px solid ${props => props.enabled ? token('color.border.success') : token('color.border.danger')};
`;

const EffectiveSettingTitle = styled.h4`
  margin: 0;
  margin-bottom: ${token('space.100')};
  color: ${props => props.enabled ? token('color.text.success') : token('color.text.danger')};
`;

const EffectiveSettingText = styled.p`
  margin: 0;
  margin-bottom: ${token('space.100')};
`;

const EffectiveSettingSubtext = styled.p`
  margin: 0;
  font-size: 14px;
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

const InfoNote = styled.p`
  margin: ${token('space.150')} 0 0 0;
  font-size: 14px;
  color: ${token('color.text.subtle')};
`;

const LastUpdatedCard = styled.div`
  margin-bottom: ${token('space.250')};
  padding: ${token('space.150')};
  background-color: ${token('color.background.success')};
  border-radius: 4px;
  border: 1px solid ${token('color.border')};
`;

const LastUpdatedTitle = styled.h4`
  margin: 0;
  margin-bottom: ${token('space.100')};
`;

const LastUpdatedText = styled.p`
  margin: 0;
`;

const DebugSection = styled.details`
  margin-top: ${token('space.250')};
`;

const DebugSummary = styled.summary`
  cursor: pointer;
  font-weight: bold;
`;

const DebugContent = styled.div`
  margin-top: ${token('space.150')};
`;

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
      <LoadingContainer>
        <Spinner size="large" />
        <p>Loading your preferences...</p>
      </LoadingContainer>
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

      <PreferenceSection>
        <h3>Preference Setting</h3>

        <RadioGroup
          options={options}
          value={currentValue}
          onChange={handlePreferenceChange}
          isDisabled={saving}
        />

        {saving && (
          <SavingIndicator>
            <Spinner size="small" />
            <span>Updating your preference...</span>
          </SavingIndicator>
        )}
      </PreferenceSection>

      {effectiveSetting && (
        <EffectiveSettingCard enabled={effectiveSetting.enabled}>
          <EffectiveSettingTitle enabled={effectiveSetting.enabled}>
            <SuccessIcon label="Current Setting" size="small" /> Current Effective Setting
          </EffectiveSettingTitle>
          <EffectiveSettingText>
            <strong>Entity property tools are currently {effectiveSetting.enabled ? 'ENABLED' : 'DISABLED'} for you</strong>
          </EffectiveSettingText>
          <EffectiveSettingSubtext>
            Source: {effectiveSetting.source === 'user' ? 'Your personal preference' :
              effectiveSetting.source === 'admin' ? 'Administrator default' :
                'System fallback'}
          </EffectiveSettingSubtext>
        </EffectiveSettingCard>
      )}

      <InfoCard>
        <InfoTitle>
          <InfoIcon label="Info" size="small" /> How Preferences Work
        </InfoTitle>
        <InfoList>
          <li><strong>Use admin default:</strong> Your setting will follow whatever the administrator has configured for all users</li>
          <li><strong>Always show:</strong> You'll always see the entity property tools, regardless of admin settings</li>
          <li><strong>Always hide:</strong> You'll never see the entity property tools, regardless of admin settings</li>
        </InfoList>
        <InfoNote>
          Note: This only affects issue panels and project pages. Global pages (like this preferences page) are always accessible.
        </InfoNote>
      </InfoCard>

      {userPref?.lastModified && (
        <LastUpdatedCard>
          <LastUpdatedTitle>Last Updated</LastUpdatedTitle>
          <LastUpdatedText>
            {new Date(userPref.lastModified).toLocaleString()}
          </LastUpdatedText>
        </LastUpdatedCard>
      )}

      <div>
        <DebugSection>
          <DebugSummary>Debug Information</DebugSummary>
          <DebugContent>
            <h4>Current Status</h4>
            <CodeBlock
              language="json"
              showLineNumbers={false}
              text={JSON.stringify({
                userPreference: userPref,
                adminDefault: adminConfig,
                effectiveSetting: effectiveSetting
              }, null, 2)}
            />
          </DebugContent>
        </DebugSection>
      </div>
    </div>
  );
}
