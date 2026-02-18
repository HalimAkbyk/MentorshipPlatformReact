'use client';

import { MessagesPageLayout } from '../../../components/features/messaging/messages-page-layout';
import { FeatureGate } from '@/components/feature-gate';

export default function MentorMessagesPage() {
  return (
    <FeatureGate flag="chat_enabled">
      <MessagesPageLayout />
    </FeatureGate>
  );
}
