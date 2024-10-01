import React, { useState } from 'react';
import { Question } from '@/lib/types';

interface SurveyQuestionProps {
  question: Question;
  onAnswer: (answer: string | string[]) => void;
}

const SurveyQuestion: React.FC<SurveyQuestionProps> = ({ question, onAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setSelectedAnswer(value);
    onAnswer(value);
  };

  const handleMultipleChoice = (value: string) => {
    let newAnswer: string[];
    if (Array.isArray(selectedAnswer)) {
      newAnswer = selectedAnswer.includes(value)
        ? selectedAnswer.filter((a) => a !== value)
        : [...selectedAnswer, value];
    } else {
      newAnswer = [value];
    }
    setSelectedAnswer(newAnswer);
    onAnswer(newAnswer);
  };

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">{question.text}</h3>
      {question.type === 'multiple_choice' && (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                value={option}
                checked={selectedAnswer === option}
                onChange={handleChange}
                className="mr-2"
              />
              {option}
            </label>
          ))}
        </div>
      )}
      {question.type === 'checkbox' && (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                value={option}
                checked={Array.isArray(selectedAnswer) && selectedAnswer.includes(option)}
                onChange={() => handleMultipleChoice(option)}
                className="mr-2"
              />
              {option}
            </label>
          ))}
        </div>
      )}
      {question.type === 'short_answer' && (
        <textarea
          value={selectedAnswer as string}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          rows={3}
        />
      )}
    </div>
  );
};

export default SurveyQuestion;