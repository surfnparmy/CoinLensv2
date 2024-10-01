'use client';

import React from 'react';
import { useSurveys } from '@/lib/hooks/useSurveys';

export default function SurveysPage() {
  const { surveys, loading, error } = useSurveys();

  if (loading) return <div>Loading surveys...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Available Surveys</h1>
      {surveys.length === 0 ? (
        <p>No surveys available at the moment.</p>
      ) : (
        <ul>
          {surveys.map(survey => (
            <li key={survey.id}>{survey.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}