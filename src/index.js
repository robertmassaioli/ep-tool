import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// Constants for property keys
const ADMIN_CONFIG_KEY = 'entity-properties-admin-config';
const USER_PREFERENCE_KEY = 'entity-properties-user-preference';

// Helper function to check if user has admin permissions
async function checkAdminPermissions() {
  try {
    const permissionsResponse = await api.asUser().requestJira(
      route`/rest/api/3/mypermissions?permissions=ADMINISTER`
    );
    const permissions = await permissionsResponse.json();
    return permissions.permissions.ADMINISTER?.havePermission || false;
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return false;
  }
}

// Helper function to get current user info
async function getCurrentUser() {
  try {
    const response = await api.asUser().requestJira(route`/rest/api/3/myself`);
    return await response.json();
  } catch (error) {
    console.error('Error getting current user:', error);
    throw new Error('Failed to get current user information');
  }
}

// Admin Configuration Functions
resolver.define('getAdminConfig', async () => {
  try {
    // Try to get from app properties first
    const response = await api.asApp().requestJira(
      route`/rest/forge/1/app/properties/${ADMIN_CONFIG_KEY}`
    );
    
    if (response.status === 404) {
      // No admin config exists yet - return default
      return { defaultEnabled: true, source: 'default' };
    }
    
    const property = await response.json();
    return { ...property.value, source: 'admin' };
  } catch (error) {
    console.error('Error getting admin config:', error);
    // Return safe default on error
    return { defaultEnabled: true, source: 'error' };
  }
});

resolver.define('setAdminConfig', async ({ defaultEnabled }) => {
  try {
    // Check admin permissions
    const isAdmin = await checkAdminPermissions();
    if (!isAdmin) {
      throw new Error('Insufficient permissions: Admin access required');
    }
    
    const user = await getCurrentUser();
    const config = {
      defaultEnabled: Boolean(defaultEnabled),
      lastModified: new Date().toISOString(),
      modifiedBy: user.accountId,
      modifiedByDisplayName: user.displayName
    };
    
    // Store in app properties (for display conditions)
    await api.asApp().requestJira(
      route`/rest/forge/1/app/properties/${ADMIN_CONFIG_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      }
    );
    
    return { success: true, config };
  } catch (error) {
    console.error('Error setting admin config:', error);
    throw error;
  }
});

// User Preference Functions
resolver.define('getUserPreference', async ({ accountId } = {}) => {
  try {
    // Use provided accountId or get current user
    const targetAccountId = accountId || (await getCurrentUser()).accountId;
    
    const response = await api.asUser().requestJira(
      route`/rest/api/3/user/properties/${USER_PREFERENCE_KEY}?accountId=${targetAccountId}`
    );
    
    if (response.status === 404) {
      // No preference set - user will inherit admin default
      return { enabled: null, source: 'none' };
    }
    
    const property = await response.json();
    return { ...property.value, source: 'user' };
  } catch (error) {
    console.error('Error getting user preference:', error);
    return { enabled: null, source: 'error' };
  }
});

resolver.define('setUserPreference', async ({ enabled }) => {
  try {
    const user = await getCurrentUser();
    const preference = {
      enabled: enabled === null ? null : Boolean(enabled),
      lastModified: new Date().toISOString(),
      accountId: user.accountId
    };
    
    if (enabled === null) {
      // User wants to use admin default - delete the preference
      try {
        await api.asUser().requestJira(
          route`/rest/api/3/user/properties/${USER_PREFERENCE_KEY}?accountId=${user.accountId}`, {
            method: 'DELETE'
          }
        );
        return { success: true, preference: { enabled: null }, action: 'deleted' };
      } catch (deleteError) {
        if (deleteError.status === 404) {
          // Property didn't exist anyway
          return { success: true, preference: { enabled: null }, action: 'none' };
        }
        throw deleteError;
      }
    } else {
      // Set explicit preference
      await api.asUser().requestJira(
        route`/rest/api/3/user/properties/${USER_PREFERENCE_KEY}?accountId=${user.accountId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preference)
        }
      );
      return { success: true, preference, action: 'set' };
    }
  } catch (error) {
    console.error('Error setting user preference:', error);
    throw error;
  }
});

// Helper function to get effective setting for current user
resolver.define('getEffectiveSetting', async () => {
  try {
    const userPref = await resolver.invoke('getUserPreference');
    
    // If user has explicit preference, use it
    if (userPref.enabled !== null) {
      return { 
        enabled: userPref.enabled, 
        source: 'user', 
        userPreference: userPref.enabled,
        adminDefault: null
      };
    }
    
    // Otherwise, use admin setting
    const adminConfig = await resolver.invoke('getAdminConfig');
    return { 
      enabled: adminConfig.defaultEnabled, 
      source: 'admin',
      userPreference: null,
      adminDefault: adminConfig.defaultEnabled
    };
  } catch (error) {
    console.error('Error getting effective setting:', error);
    // Safe fallback
    return { 
      enabled: true, 
      source: 'fallback',
      userPreference: null,
      adminDefault: null,
      error: error.message
    };
  }
});

// Admin utility function to get system status
resolver.define('getSystemStatus', async () => {
  try {
    const isAdmin = await checkAdminPermissions();
    const user = await getCurrentUser();
    const adminConfig = await resolver.invoke('getAdminConfig');
    const userPref = await resolver.invoke('getUserPreference');
    const effective = await resolver.invoke('getEffectiveSetting');
    
    return {
      user: {
        accountId: user.accountId,
        displayName: user.displayName,
        isAdmin
      },
      adminConfig,
      userPreference: userPref,
      effective,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting system status:', error);
    throw error;
  }
});

// Debug function for development
resolver.define('debugProperties', async () => {
  try {
    const user = await getCurrentUser();
    
    // Get all app properties
    let appProperties = [];
    try {
      const appPropsResponse = await api.asApp().requestJira(route`/rest/forge/1/app/properties`);
      appProperties = await appPropsResponse.json();
    } catch (e) {
      console.log('Could not fetch app properties:', e.message);
    }
    
    // Get user properties
    let userProperties = [];
    try {
      const userPropsResponse = await api.asUser().requestJira(
        route`/rest/api/3/user/properties?accountId=${user.accountId}`
      );
      userProperties = await userPropsResponse.json();
    } catch (e) {
      console.log('Could not fetch user properties:', e.message);
    }
    
    return {
      currentUser: user,
      appProperties: appProperties.keys || [],
      userProperties: userProperties.keys || [],
      relevantAppProperty: appProperties.keys?.includes(ADMIN_CONFIG_KEY) ? ADMIN_CONFIG_KEY : null,
      relevantUserProperty: userProperties.keys?.includes(USER_PREFERENCE_KEY) ? USER_PREFERENCE_KEY : null
    };
  } catch (error) {
    console.error('Error in debug function:', error);
    return { error: error.message };
  }
});

export const handler = resolver.getDefinitions();

