import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// Constants for property keys
const ADMIN_CONFIG_KEY = 'ep-tool.disabled-for-all';
const USER_PREFERENCE_KEY = 'ep-tool.enabled-for-me';

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

// Internal function to get admin config
async function getAdminConfigInternal() {
  try {
    // Try to get from app properties first
    const response = await api.asApp().requestJira(
      route`/rest/forge/1/app/properties/${ADMIN_CONFIG_KEY}`
    );

    if (response.status === 404) {
      // No admin config exists yet - return default
      return { defaultEnabled: true, disabledForAll: false, source: 'default' };
    }

    const property = await response.json();
    // Parse the JSON string value if it's a string
    const parsedValue = typeof property.value === 'string'
      ? JSON.parse(property.value)
      : property.value;
    
    // Convert inverted logic for UI compatibility
    return { 
      ...parsedValue, 
      defaultEnabled: !parsedValue.disabledForAll,
      source: 'admin' 
    };
  } catch (error) {
    console.error('Error getting admin config:', error);
    // Return safe default on error
    return { defaultEnabled: true, disabledForAll: false, source: 'error' };
  }
}

// Admin Configuration Functions
resolver.define('getAdminConfig', async (req) => {
  console.log('getAdminConfig called');
  return await getAdminConfigInternal();
});

resolver.define('setAdminConfig', async (req) => {
  console.log('setAdminConfig called with payload:', req.payload);

  const { disabledForAll } = req.payload;

  try {
    console.log('Checking admin permissions...');
    // Check admin permissions
    const isAdmin = await checkAdminPermissions();
    console.log('Admin permission check result:', isAdmin);

    if (!isAdmin) {
      console.log('User does not have admin permissions, throwing error');
      throw new Error('Insufficient permissions: Admin access required');
    }

    console.log('Getting current user...');
    const user = await getCurrentUser();
    console.log('Current user:', { accountId: user.accountId, displayName: user.displayName });

    const config = {
      disabledForAll: Boolean(disabledForAll),
      lastModified: new Date().toISOString(),
      modifiedBy: user.accountId,
      modifiedByDisplayName: user.displayName
    };
    console.log('Prepared config object:', config);

    console.log('Storing config in app properties...');
    // Store in app properties (for display conditions)
    const response = await api.asApp().requestJira(
      route`/rest/forge/1/app/properties/${ADMIN_CONFIG_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      }
    );
    console.log('App property storage response status:', response.status);

    console.log('setAdminConfig completed successfully');
    return { success: true, config };
  } catch (error) {
    console.error('Error setting admin config:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
});

resolver.define('deleteAdminConfig', async (req) => {
  console.log('deleteAdminConfig called');

  try {
    console.log('Checking admin permissions...');
    // Check admin permissions
    const isAdmin = await checkAdminPermissions();
    console.log('Admin permission check result:', isAdmin);

    if (!isAdmin) {
      console.log('User does not have admin permissions, throwing error');
      throw new Error('Insufficient permissions: Admin access required');
    }

    console.log('Getting current user...');
    const user = await getCurrentUser();
    console.log('Current user:', { accountId: user.accountId, displayName: user.displayName });

    console.log('Deleting admin config from app properties...');
    // Delete from app properties
    const response = await api.asApp().requestJira(
      route`/rest/forge/1/app/properties/${ADMIN_CONFIG_KEY}`, {
        method: 'DELETE'
      }
    );
    console.log('App property deletion response status:', response.status);

    // Handle 404 as success (property didn't exist anyway)
    if (response.status === 404) {
      console.log('Admin config property did not exist, treating as successful deletion');
      return {
        success: true,
        message: 'Admin configuration was already at default settings',
        wasDeleted: false
      };
    }

    console.log('deleteAdminConfig completed successfully');
    return {
      success: true,
      message: 'Admin configuration deleted successfully. All users will now see entity property tools by default.',
      wasDeleted: true,
      deletedBy: user.displayName,
      deletedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error deleting admin config:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
});

// Internal function to get user preference
async function getUserPreferenceInternal({ accountId } = {}) {
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
    // Parse the JSON string value if it's a string
    const parsedValue = typeof property.value === 'string'
      ? JSON.parse(property.value)
      : property.value;
    
    // Handle both Connect simple boolean and Forge object format  
    if (typeof parsedValue === 'boolean') {
      // Connect format - simple boolean
      return { enabled: parsedValue, source: 'user' };
    } else {
      // Forge format - object with metadata
      return { ...parsedValue, source: 'user' };
    }
  } catch (error) {
    console.error('Error getting user preference:', error);
    return { enabled: null, source: 'error' };
  }
}

// User Preference Functions
resolver.define('getUserPreference', async (req) => {
  console.log('getUserPreference called with payload:', req.payload);
  const { accountId } = req.payload || {};
  return await getUserPreferenceInternal({ accountId });
});

resolver.define('setUserPreference', async (req) => {
  console.log('setUserPreference called with payload:', req.payload);
  const { enabled } = req.payload;
  try {
    const user = await getCurrentUser();

    if (enabled === null) {
      // User wants to use admin default - delete the preference (like Connect)
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
      // Store enhanced object format with metadata (upgrade from Connect simple boolean)
      const preference = {
        enabled: Boolean(enabled),
        lastModified: new Date().toISOString(),
        accountId: user.accountId
      };
      
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

// Internal function to get effective setting
async function getEffectiveSettingInternal() {
  try {
    const userPref = await getUserPreferenceInternal();

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
    const adminConfig = await getAdminConfigInternal();
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
}

// Helper function to get effective setting for current user
resolver.define('getEffectiveSetting', async (req) => {
  console.log('getEffectiveSetting called');
  return await getEffectiveSettingInternal();
});

// Admin utility function to get system status
resolver.define('getSystemStatus', async (req) => {
  console.log('getSystemStatus called');
  try {
    const isAdmin = await checkAdminPermissions();
    const user = await getCurrentUser();
    const adminConfig = await getAdminConfigInternal();
    const userPref = await getUserPreferenceInternal();
    const effective = await getEffectiveSettingInternal();

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
resolver.define('debugProperties', async (req) => {
  console.log('debugProperties called');
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

