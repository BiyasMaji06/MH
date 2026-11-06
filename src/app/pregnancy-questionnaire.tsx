import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PregnancyQuestionnaireScreen from '../components/PregnancyQuestionnaireScreen';

export default function PregnancyQuestionnaire() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; dueDate?: string }>();
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const dueDate = Array.isArray(params.dueDate) ? params.dueDate[0] : params.dueDate;

  return (
    <PregnancyQuestionnaireScreen
      initialName={name}
      initialDueDate={dueDate}
      onBack={() => router.back()}
      onComplete={(answers) => {
        const doctorConfirmedEdd = answers.doctorEdd.trim();
        router.replace({
          pathname: '/home',
          params: {
            name: name ?? '',
            dueDate: dueDate ?? '',
            lmp: answers.lmp,
            doctorConfirmedEdd,
            pregnancyAnswers: JSON.stringify(answers),
          },
        });
      }}
    />
  );
}
