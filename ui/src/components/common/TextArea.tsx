import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, ...props }) => {
  return (
    <div>
      <label htmlFor={props.id} className="form-label">{label}</label>
      <textarea className="form-control" {...props}></textarea>
    </div>
  );
};
