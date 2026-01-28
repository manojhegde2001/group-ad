'use client';

import { Tab } from 'rizzui';
import { User, Building2, Shield, Link2 } from 'lucide-react';
import { User as UserType } from '@prisma/client';
import BasicInfoTab from './tabs/basic-info-tab';
import BusinessInfoTab from './tabs/business-info-tab';
import AccountSettingsTab from './tabs/account-settings-tab';
import SocialLinksTab from './tabs/social-links-tab';

interface ProfileTabsProps {
  user: UserType;
}

export default function ProfileTabs({ user }: ProfileTabsProps) {
  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm">
      <Tab>
        <Tab.List className="border-b border-secondary-200 dark:border-secondary-700 px-6">
          <Tab.ListItem>
            <User className="w-4 h-4 mr-2" />
            Basic Info
          </Tab.ListItem>

          {user.userType === 'BUSINESS' && (
            <Tab.ListItem>
              <Building2 className="w-4 h-4 mr-2" />
              Business Info
            </Tab.ListItem>
          )}

          <Tab.ListItem>
            <Link2 className="w-4 h-4 mr-2" />
            Social Links
          </Tab.ListItem>

          <Tab.ListItem>
            <Shield className="w-4 h-4 mr-2" />
            Settings
          </Tab.ListItem>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            <BasicInfoTab user={user} />
          </Tab.Panel>

          {user.userType === 'BUSINESS' && (
            <Tab.Panel>
              <BusinessInfoTab user={user} />
            </Tab.Panel>
          )}

          <Tab.Panel>
            <SocialLinksTab user={user} />
          </Tab.Panel>

          <Tab.Panel>
            <AccountSettingsTab user={user} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab>
    </div>
  );
}
