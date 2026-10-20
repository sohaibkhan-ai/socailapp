import React from 'react';
import EmptyState from './EmptyState';

export default function ErrorState({ message, onRetry }) {
  return <EmptyState icon="cloud-offline-outline" title="Something went wrong" message={message} onRetry={onRetry} />;
}
