import React from 'react';
import SurveyForm from './components/SurveyForm';

const SurveyPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Survey</h1>
      <SurveyForm />
    </div>
  );
};

export default SurveyPage;
