import * as React from 'react';

import OrganizationAvatar from 'sentry/components/avatar/organizationAvatar';
import ProjectAvatar from 'sentry/components/avatar/projectAvatar';
import SentryAppAvatar from 'sentry/components/avatar/sentryAppAvatar';
import TeamAvatar from 'sentry/components/avatar/teamAvatar';
import UserAvatar from 'sentry/components/avatar/userAvatar';
import {AvatarProject, OrganizationSummary, SentryApp, Team} from 'sentry/types';

type Props = {
  team?: Team;
  organization?: OrganizationSummary;
  project?: AvatarProject;
  sentryApp?: SentryApp;
  /**
   * True if the Avatar is full color, rather than B&W (Used for SentryAppAvatar)
   */
  isColor?: boolean;
  /**
   * True if the rendered Avatar should be a static asset
   */
  isDefault?: boolean;
} & UserAvatar['props'];

const Avatar = React.forwardRef(function Avatar(
  {
    hasTooltip = false,
    user,
    team,
    project,
    organization,
    sentryApp,
    isColor = true,
    isDefault = false,
    ...props
  }: Props,
  ref: React.Ref<HTMLSpanElement>
) {
  const commonProps = {hasTooltip, forwardedRef: ref, ...props};

  if (user) {
    return <UserAvatar user={user} {...commonProps} />;
  }

  if (team) {
    return <TeamAvatar team={team} {...commonProps} />;
  }

  if (project) {
    return <ProjectAvatar project={project} {...commonProps} />;
  }

  if (sentryApp) {
    return (
      <SentryAppAvatar
        sentryApp={sentryApp}
        isColor={isColor}
        isDefault={isDefault}
        {...commonProps}
      />
    );
  }

  return <OrganizationAvatar organization={organization} {...commonProps} />;
});

export default Avatar;
